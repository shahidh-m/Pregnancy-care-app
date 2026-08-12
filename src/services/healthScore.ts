// Pregnancy Health Score calculator (0 - 100)
import { HealthLogEntry } from './storage';
import { StatusLevel } from '../components/StatusBadge';

export interface HealthScoreResult {
  score: number; // 0-100
  status: StatusLevel;
  factors: string[];
}

export const calculateHealthScore = (logs: HealthLogEntry[]): HealthScoreResult => {
  if (!logs || logs.length === 0) {
    return {
      score: 85, // default baseline
      status: 'good',
      factors: ['Baseline score (log daily entries for personalized score)'],
    };
  }

  // Look at latest log or logs from the past 7 days
  const latestLog = logs[0];
  let score = 100;
  const factors: string[] = [];

  // Blood pressure check
  if (latestLog.bpSystolic && latestLog.bpDiastolic) {
    if (latestLog.bpSystolic > 140 || latestLog.bpDiastolic > 90) {
      score -= 25;
      factors.push('Elevated blood pressure detected');
    } else if (latestLog.bpSystolic < 90 || latestLog.bpDiastolic < 60) {
      score -= 15;
      factors.push('Low blood pressure detected');
    } else {
      factors.push('Blood pressure in normal range');
    }
  }

  // Blood sugar check
  if (latestLog.bloodSugar) {
    if (latestLog.bloodSugar > 140) {
      score -= 20;
      factors.push('High blood sugar detected');
    } else if (latestLog.bloodSugar < 70) {
      score -= 15;
      factors.push('Low blood sugar detected');
    } else {
      factors.push('Blood sugar in normal range');
    }
  }

  // Mood factor
  if (latestLog.mood === 'unwell') {
    score -= 15;
    factors.push('Feeling unwell');
  } else if (latestLog.mood === 'tired') {
    score -= 5;
    factors.push('Slight fatigue reported');
  }

  // Symptoms check
  const criticalSymptoms = ['swelling', 'dizziness', 'cramps', 'headache'];
  const countCritical = latestLog.symptoms.filter(s => criticalSymptoms.includes(s)).length;
  if (countCritical > 0) {
    score -= countCritical * 10;
    factors.push(`${countCritical} symptom(s) require monitoring`);
  }

  score = Math.max(30, Math.min(100, score));

  let status: StatusLevel = 'healthy';
  if (score < 60) status = 'critical';
  else if (score < 75) status = 'concerned';
  else if (score < 90) status = 'good';

  return { score, status, factors };
};
