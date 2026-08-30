// Scheme Engine — Eligibility evaluation, dynamic deadline calculation & timeline generator
import schemesDataRaw from '../data/governmentSchemes.json';
import {
  GovernmentScheme,
  UserSchemeProfile,
  SchemeEvaluationResult,
  TimelineActionItem,
  EligibilityStatus,
  SchemeMilestone,
} from '../types/scheme';

export const ALL_GOVERNMENT_SCHEMES = schemesDataRaw as GovernmentScheme[];

export const DEFAULT_USER_SCHEME_PROFILE: UserSchemeProfile = {
  pregnancyOrder: 1,
  isSecondChildGirl: false,
  category: 'bpl_nfsa',
  isGovtEmployee: false,
  deliveryHospitalType: 'govt',
  locationState: 'Tamil Nadu',
  completedMilestoneIds: [],
  checkedDocumentIds: [],
};

/**
 * Evaluate eligibility for a given scheme against user profile
 */
export const evaluateSchemeEligibility = (
  scheme: GovernmentScheme,
  profile: UserSchemeProfile,
  currentWeek: number,
  eddDateStr?: string
): SchemeEvaluationResult => {
  const matchReasons: string[] = [];
  const missingRequirements: string[] = [];
  let isDisqualified = false;
  let isConditional = false;

  const rules = scheme.eligibilityRules;

  // 1. Pregnancy Order Check
  if (rules.maxPregnancyOrder && profile.pregnancyOrder > rules.maxPregnancyOrder) {
    isDisqualified = true;
    missingRequirements.push(
      `Scheme applies to 1st & 2nd pregnancy only (Your profile: ${profile.pregnancyOrder}nd/rd pregnancy)`
    );
  } else if (rules.maxPregnancyOrder) {
    matchReasons.push(`Pregnancy order ${profile.pregnancyOrder} meets eligibility criteria (Max ${rules.maxPregnancyOrder})`);
  }

  // 2. Second Child Girl Requirement for PMMVY Bonus
  if (rules.requiresSecondChildGirl && profile.pregnancyOrder === 2 && !profile.isSecondChildGirl) {
    // Note: For 2nd child PMMVY bonus, if child is not confirmed girl yet, mark conditional
    isConditional = true;
    missingRequirements.push('PMMVY 2nd child bonus applies when 2nd child is a girl');
  } else if (rules.requiresSecondChildGirl && profile.pregnancyOrder === 2 && profile.isSecondChildGirl) {
    matchReasons.push('Eligible for PMMVY ₹6,000 2nd child girl child bonus');
  }

  // 3. Government Employee Exclusions
  if (rules.excludesGovtEmployees && profile.isGovtEmployee) {
    isDisqualified = true;
    missingRequirements.push('Excluded for Central / State Government employees receiving paid maternity leave');
  } else if (rules.excludesGovtEmployees) {
    matchReasons.push('Non-government employee / eligible category verified');
  }

  // 4. BPL / Social Category Check
  if (rules.requiresBPLOrEligibleCategory) {
    if (profile.category === 'general') {
      isConditional = true;
      missingRequirements.push('Requires BPL / Smart Ration Card / MGNREGA / SC-ST / PM-JAY eligibility proof');
    } else {
      matchReasons.push(`Eligible under category: ${profile.category.toUpperCase()}`);
    }
  }

  // 5. Government Hospital Delivery Requirement
  if (rules.requiresGovtHospitalDelivery) {
    if (profile.deliveryHospitalType === 'private') {
      isConditional = true;
      missingRequirements.push('Cash incentive requires delivery at Government Hospital or PHC');
    } else {
      matchReasons.push('Planned delivery at Government Hospital / PHC');
    }
  }

  // 6. State Scope Check
  if (scheme.scope === 'tamil_nadu' && profile.locationState !== 'Tamil Nadu') {
    isDisqualified = true;
    missingRequirements.push('Scheme exclusive to residents of Tamil Nadu');
  } else if (scheme.scope === 'tamil_nadu') {
    matchReasons.push('Tamil Nadu state residence matched');
  }

  // Determine overall status
  let status: EligibilityStatus = 'eligible';
  if (isDisqualified) {
    status = 'ineligible';
  } else if (isConditional) {
    status = 'conditional';
  }

  // Calculate milestone progress
  const completedIds = profile.completedMilestoneIds || [];
  const completedMilestones = scheme.milestones.filter(m => completedIds.includes(m.id));

  // Find next milestone
  const nextMilestone = scheme.milestones.find(m => !completedIds.includes(m.id)) || null;

  // Calculate next milestone due date
  let nextMilestoneDueDate: string | null = null;
  if (nextMilestone && eddDateStr) {
    nextMilestoneDueDate = calculateMilestoneTargetDate(nextMilestone.weekTrigger, eddDateStr);
  }

  // Calculate estimated monetary benefit
  let estimatedBenefit = scheme.totalBenefit;
  if (scheme.id === 'pmmvy') {
    if (profile.pregnancyOrder === 1) {
      estimatedBenefit = 5000;
    } else if (profile.pregnancyOrder === 2 && profile.isSecondChildGirl) {
      estimatedBenefit = 6000;
    } else if (profile.pregnancyOrder === 2) {
      estimatedBenefit = 0;
    }
  }

  return {
    scheme,
    status,
    estimatedBenefit,
    matchReasons,
    missingRequirements,
    completedMilestonesCount: completedMilestones.length,
    totalMilestonesCount: scheme.milestones.length,
    nextMilestone,
    nextMilestoneDueDate,
  };
};

/**
 * Calculate estimated milestone target date from EDD & milestone week trigger
 * LMP = EDD - 280 days
 * Milestone Date = LMP + (weekTrigger * 7) days
 */
export const calculateMilestoneTargetDate = (weekTrigger: number, eddDateStr: string): string => {
  try {
    const edd = new Date(eddDateStr);
    if (isNaN(edd.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 14);
      return fallback.toISOString().split('T')[0];
    }
    const lmpTime = edd.getTime() - 280 * 24 * 60 * 60 * 1000;
    const milestoneTime = lmpTime + weekTrigger * 7 * 24 * 60 * 60 * 1000;
    return new Date(milestoneTime).toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Generate full dynamic timeline of action items sorted by week trigger & due date
 */
export const getTimelineActionItems = (
  schemes: GovernmentScheme[],
  profile: UserSchemeProfile,
  currentWeek: number,
  eddDateStr: string
): TimelineActionItem[] => {
  const items: TimelineActionItem[] = [];
  const completedIds = profile.completedMilestoneIds || [];
  const todayISO = new Date().toISOString().split('T')[0];

  schemes.forEach(scheme => {
    // Only evaluate milestones for eligible or conditional schemes
    const evalRes = evaluateSchemeEligibility(scheme, profile, currentWeek, eddDateStr);
    if (evalRes.status === 'ineligible') return;

    scheme.milestones.forEach(m => {
      const isCompleted = completedIds.includes(m.id);
      const dueDate = calculateMilestoneTargetDate(m.weekTrigger, eddDateStr);
      const isOverdue = !isCompleted && dueDate < todayISO;
      const isCurrentWeek = Math.abs(m.weekTrigger - currentWeek) <= 1;

      items.push({
        milestone: m,
        schemeName: scheme.name,
        schemeId: scheme.id,
        dueDate,
        isOverdue,
        isCurrentWeek,
        isCompleted,
        benefitAmount: m.benefitAmount,
      });
    });
  });

  // Sort items: Overdue first, then by week trigger / due date
  return items.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
};

/**
 * Calculate total potential financial benefits across all eligible schemes
 */
export const calculateTotalPotentialBenefits = (
  schemes: GovernmentScheme[],
  profile: UserSchemeProfile,
  currentWeek: number
): { totalCash: number; totalInKindCount: number } => {
  let totalCash = 0;
  let totalInKindCount = 0;

  schemes.forEach(scheme => {
    const evalRes = evaluateSchemeEligibility(scheme, profile, currentWeek);
    if (evalRes.status !== 'ineligible') {
      if (scheme.id !== 'jssk' && scheme.id !== 'cmchis') {
        totalCash += evalRes.estimatedBenefit;
      }
      if (scheme.id === 'mrmbs_picme') {
        totalInKindCount += 2; // 2 Amma Sanjeevi Kits
      }
    }
  });

  return { totalCash, totalInKindCount };
};
