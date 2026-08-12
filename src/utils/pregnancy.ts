// Pregnancy utility functions
import pregnancyData from '../data/pregnancyMilestones.json';

export interface PregnancyInfo {
  currentWeek: number;
  currentDay: number;
  trimester: number;
  daysRemaining: number;
  progressPercent: number;
  weekData: typeof pregnancyData.weeks[0] | null;
  trimesterData: typeof pregnancyData.trimesters[0] | null;
}

/**
 * Calculate current pregnancy week from due date.
 * week = 40 - ceil((dueDate - today) / 7)
 */
export const calculatePregnancyInfo = (dueDateStr: string): PregnancyInfo => {
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const totalDaysPregnant = 280 - diffDays; // 40 weeks = 280 days

  const currentWeek = Math.max(1, Math.min(40, Math.floor(totalDaysPregnant / 7) + 1));
  const currentDay = Math.max(1, Math.min(7, (totalDaysPregnant % 7) + 1));
  const daysRemaining = Math.max(0, diffDays);
  const progressPercent = Math.min(100, Math.max(0, (totalDaysPregnant / 280) * 100));

  let trimester = 1;
  if (currentWeek >= 27) trimester = 3;
  else if (currentWeek >= 13) trimester = 2;

  const weekData = pregnancyData.weeks.find(w => w.week === currentWeek) || null;
  const trimesterData = pregnancyData.trimesters.find(t => t.number === trimester) || null;

  return {
    currentWeek,
    currentDay,
    trimester,
    daysRemaining,
    progressPercent,
    weekData,
    trimesterData,
  };
};

/**
 * Format date to display string
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export const getTodayISO = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
