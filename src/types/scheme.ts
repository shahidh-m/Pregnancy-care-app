// Scheme types & interfaces for Government Scheme Knowledge Base & Eligibility Engine

export type SchemeScope = 'national' | 'tamil_nadu';

export type EligibilityStatus = 'eligible' | 'conditional' | 'ineligible';

export interface SchemeEligibilityRules {
  maxPregnancyOrder?: number; // e.g. 1 or 2 living children
  requiresSecondChildGirl?: boolean; // PMMVY 2nd child bonus rule
  requiresBPLOrEligibleCategory?: boolean; // e.g., BPL, SC/ST, MGNREGA, PM-JAY, NFSA cardholders
  excludesGovtEmployees?: boolean;
  requiresGovtHospitalDelivery?: boolean; // e.g. Dr. Muthulakshmi Reddy / JSY full benefit
}

export interface SchemeMilestone {
  id: string;
  schemeId: string;
  weekTrigger: number; // Pregnancy week at which milestone applies (e.g., 8, 12, 16, 20, 36, 40)
  title: string;
  titleTa: string;
  description: string;
  descriptionTa: string;
  benefitAmount?: number;
  benefitItems?: string[]; // e.g., ["Amma Magaperu Sanjeevi Kit (1st Trimester)"]
  requiredActions: string[];
  requiredActionsTa: string[];
  deadlineDaysOffset: number; // Days after LMP / week start before milestone expires or delays
}

export interface RequiredDocument {
  id: string;
  name: string;
  nameTa: string;
  description: string;
  descriptionTa: string;
  isRequired: boolean;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  nativeName: string;
  scope: SchemeScope;
  totalBenefit: number;
  benefitsSummary: string;
  benefitsSummaryTa: string;
  overview: string;
  overviewTa: string;
  targetAudience: string;
  targetAudienceTa: string;
  eligibilityRules: SchemeEligibilityRules;
  requiredDocuments: RequiredDocument[];
  applyInstructions: string[];
  applyInstructionsTa: string[];
  helplineNumber?: string;
  officialPortalUrl?: string;
  milestones: SchemeMilestone[];
}

export interface UserSchemeProfile {
  pregnancyOrder: number; // 1, 2, or 3+
  isSecondChildGirl?: boolean;
  category: 'general' | 'sc_st' | 'bpl_nfsa' | 'mgnrega' | 'pmjay';
  isGovtEmployee: boolean;
  deliveryHospitalType: 'govt' | 'private' | 'undecided';
  locationState: string; // e.g. 'Tamil Nadu'
  picmeRchId?: string;
  vhnName?: string;
  vhnPhone?: string;
  phcCenter?: string;
  completedMilestoneIds: string[];
  checkedDocumentIds: string[];
}

export interface SchemeEvaluationResult {
  scheme: GovernmentScheme;
  status: EligibilityStatus;
  estimatedBenefit: number;
  matchReasons: string[];
  missingRequirements: string[];
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  nextMilestone: SchemeMilestone | null;
  nextMilestoneDueDate: string | null; // ISO Date String
}

export interface TimelineActionItem {
  milestone: SchemeMilestone;
  schemeName: string;
  schemeId: string;
  dueDate: string;
  isOverdue: boolean;
  isCurrentWeek: boolean;
  isCompleted: boolean;
  benefitAmount?: number;
}
