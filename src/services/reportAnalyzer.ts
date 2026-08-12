// Lab Report Analyzer Service — On-device OCR text parsing
import termsDict from '../data/reportTermsDictionary.json';
import { StatusLevel } from '../components/StatusBadge';

export interface MatchedTermResult {
  id: string;
  termName: string;
  extractedValue: number | string;
  unit: string;
  signal: StatusLevel;
  explanation: string;
  explanationTamil: string;
}

export interface ReportAnalysisResult {
  overallSignal: StatusLevel;
  matchedTerms: MatchedTermResult[];
  rawText: string;
  isReadable: boolean;
}

export const analyzeReportText = (text: string, language: string = 'en'): ReportAnalysisResult => {
  const lowerText = text.toLowerCase();
  const matchedTerms: MatchedTermResult[] = [];
  let worstSignal: StatusLevel = 'healthy';

  const signalWeight: Record<StatusLevel, number> = {
    healthy: 1,
    good: 2,
    concerned: 3,
    critical: 4,
  };

  for (const term of termsDict.terms) {
    // Check if any keyword exists in raw text
    const foundKeyword = term.keywords.find(kw => lowerText.includes(kw));
    if (foundKeyword) {
      // Extract numeric value near the keyword
      const regex = new RegExp(`${foundKeyword}[^\\d]*([0-9]+(?:\\.[0-9]+)?)`, 'i');
      const match = lowerText.match(regex);

      if (match && match[1]) {
        const val = parseFloat(match[1]);
        let signal: StatusLevel = 'healthy';
        let explanation = term.explanationNormal;
        let explanationTamil = term.explanationNormalTamil;

        if (val < term.ranges.low) {
          signal = term.signalLow as StatusLevel;
          explanation = term.explanationLow;
          explanationTamil = term.explanationLowTamil;
        } else if (val > term.ranges.high && term.ranges.high > 0) {
          signal = term.signalHigh as StatusLevel;
          explanation = term.explanationHigh;
          explanationTamil = term.explanationHighTamil;
        }

        if (signalWeight[signal] > signalWeight[worstSignal]) {
          worstSignal = signal;
        }

        matchedTerms.push({
          id: term.id,
          termName: term.id.replace('_', ' ').toUpperCase(),
          extractedValue: val,
          unit: term.unit,
          signal,
          explanation,
          explanationTamil,
        });
      }
    }
  }

  return {
    overallSignal: matchedTerms.length > 0 ? worstSignal : 'healthy',
    matchedTerms,
    rawText: text,
    isReadable: matchedTerms.length > 0,
  };
};
