// Groq LLM Service — Standardized AI Medical Document & Lab Report Analysis
import { GROQ_CONFIG, IS_GROQ_CONFIGURED } from '../config/groqConfig';
import { analyzeReportText, ReportAnalysisResult } from './reportAnalyzer';
import { StatusLevel } from '../components/StatusBadge';

export interface SingleMetricDetail {
  value: number | string;
  unit: string;
  signal: StatusLevel;
  isNormal: boolean;
  referenceRange?: string;
  explanation?: string;
  explanationTamil?: string;
}

export interface StandardizedHealthMetrics {
  // Key Pregnancy Specific Metrics
  betaHcg?: SingleMetricDetail;
  hemoglobin?: SingleMetricDetail;
  fastingGlucose?: SingleMetricDetail;
  postPrandialGlucose?: SingleMetricDetail;
  bloodPressureSystolic?: SingleMetricDetail;
  bloodPressureDiastolic?: SingleMetricDetail;
  plateletCount?: SingleMetricDetail;
  tshThyroid?: SingleMetricDetail;
  urineProtein?: SingleMetricDetail;
  serumFerritin?: SingleMetricDetail;

  // General Healthcare Metrics
  wbcCount?: SingleMetricDetail;
  pulseRate?: SingleMetricDetail;
}

export interface GroqLabTermResult {
  id: string;
  termName: string;
  extractedValue: number | string;
  unit: string;
  signal: StatusLevel;
  explanation: string;
  explanationTamil: string;
}

export interface GroqReportAnalysisResult {
  overallSignal: StatusLevel;
  metrics: StandardizedHealthMetrics;
  matchedTerms: GroqLabTermResult[];
  rawText: string;
  cleanText: string;
  extractedFullText?: string;
  isReadable: boolean;
  aiSummary: string;
  doctorAdvice: string[];
  aiModelUsed: string;
  tokensUsed?: number;
  isAiGenerated: boolean;
}

/**
 * Send sanitized document text to Groq API using a standardized, compact JSON schema.
 */
export const analyzeDocumentWithGroq = async (
  cleanedText: string,
  rawText: string = '',
  userLanguage: string = 'en',
  base64Image?: string
): Promise<GroqReportAnalysisResult> => {
  if (!IS_GROQ_CONFIGURED()) {
    console.warn('Groq API Key not configured. Using rule-based analyzer fallback.');
    return fallbackToLocalAnalyzer(cleanedText, rawText, userLanguage, 'Groq Key Missing');
  }

  const systemPrompt = `You are an expert maternal health lab report parser.
Analyze the report document/image and return ONLY a valid JSON object matching this standardized compact schema:

{
  "overallSignal": "healthy" | "good" | "concerned" | "critical",
  "extractedFullText": "Exact transcription of ALL visible text from the lab report image or document, including patient details, lab name (e.g. Thyrocare), test names, numerical values, units, reference intervals, gestational week tables, technology/methods, and notes.",
  "aiSummary": "Write a comprehensive, personalized 5-sentence paragraph summary based STRICTLY on the extracted report data. DO NOT be generic. You MUST specifically cite every exact test name, numerical figure, unit (e.g., Beta HCG 4634.16 mIU/mL or 60.50 mIU/mL), reference interval, lab name (e.g., Thyrocare), and gestational week context found in the report. Explain clearly what these exact figures mean for the patient's pregnancy progress.",
  "doctorAdvice": [
    "Advice item 1 tailored specifically to the extracted numbers in this report",
    "Advice item 2 for upcoming prenatal checkup"
  ],
  "metrics": {
    "betaHcg": { "value": 4634.16, "unit": "mIU/mL", "signal": "healthy", "isNormal": true, "referenceRange": "< 10 mIU/ml", "explanation": "Positive Beta HCG level indicating early pregnancy.", "explanationTamil": "கர்ப்ப ஹார்மோன் HCG அளவு உயர்ந்துள்ளது." },
    "hemoglobin": { "value": 11.2, "unit": "g/dL", "signal": "healthy", "isNormal": true, "referenceRange": "11.0-14.0", "explanation": "Normal maternal hemoglobin level.", "explanationTamil": "சாதாரண ஹீமோகுளோபின் அளவு." },
    "fastingGlucose": { "value": 92, "unit": "mg/dL", "signal": "healthy", "isNormal": true, "referenceRange": "70-95", "explanation": "Fasting sugar is optimal for pregnancy.", "explanationTamil": "இரத்த சர்க்கரை அளவு இயல்பாக உள்ளது." },
    "postPrandialGlucose": { "value": 110, "unit": "mg/dL", "signal": "healthy", "isNormal": true, "referenceRange": "<120", "explanation": "Post-meal glucose level is normal.", "explanationTamil": "உணவுக்கு பின் சர்க்கரை அளவு இயல்பாக உள்ளது." },
    "plateletCount": { "value": 210, "unit": "x10^3/µL", "signal": "healthy", "isNormal": true, "referenceRange": "150-450", "explanation": "Healthy platelet count.", "explanationTamil": "பிளேட்லெட் அளவு இயல்பானது." },
    "tshThyroid": { "value": 2.1, "unit": "mIU/L", "signal": "healthy", "isNormal": true, "referenceRange": "0.2-2.5", "explanation": "Optimal thyroid level for pregnancy.", "explanationTamil": "தைராய்டு அளவு இயல்பானது." },
    "urineProtein": { "value": "NIL", "unit": "-", "signal": "healthy", "isNormal": true, "referenceRange": "NIL", "explanation": "No protein in urine.", "explanationTamil": "சிறுநீரில் புரதம் இல்லை." }
  }
}

Evaluation Reference for Pregnancy:
- Beta HCG (HCG / Beta Total): > 5.0 mIU/mL indicates pregnancy (healthy). 1st-2nd wks: 10-94, 2nd-3rd wks: 61-2922, 3rd-4th wks: 666-18900, 4th-5th wks: 1536-49380 mIU/mL.
- Hemoglobin: Normal 11.0-14.0 g/dL (concerned < 10.5, critical < 8.5)
- Fasting Glucose: Normal 70-95 mg/dL (concerned > 95 mg/dL for gestational diabetes)
- Platelets: Normal 150-450 x10^3/µL (concerned < 150)
- TSH Thyroid: Normal 0.2-2.5 mIU/L
- Urine Protein: Normal NIL/NEGATIVE (concerned TRACE, critical 1+ or 2+)`;

  const executeGroqCall = async (modelName: string) => {
    const userContent = base64Image
      ? [
          {
            type: 'text',
            text: `Extract ALL text from this medical lab report image, including patient info, lab provider name, test names, numerical values, units, reference intervals, week ranges, and notes. Return JSON matching the system schema.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ]
      : `Extracted Document Text:\n\n${cleanedText}`;

    return fetch(GROQ_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: GROQ_CONFIG.temperature,
        max_tokens: GROQ_CONFIG.maxTokens,
        response_format: { type: 'json_object' },
      }),
    });
  };

  try {
    const candidates = [GROQ_CONFIG.model, ...(GROQ_CONFIG.fallbackModels || [])];
    let usedModel = GROQ_CONFIG.model;
    let response: any = null;

    for (const modelName of candidates) {
      try {
        usedModel = modelName;
        console.log(`Sending report analysis request to Groq model: ${usedModel}`);
        const res = await executeGroqCall(usedModel);
        if (res.ok) {
          response = res;
          break;
        } else {
          const errText = await res.text();
          console.warn(`Groq model (${usedModel}) HTTP ${res.status}:`, errText);
        }
      } catch (err) {
        console.warn(`Execution failed for model ${modelName}:`, err);
      }
    }

    if (!response || !response.ok) {
      console.warn('All Groq API models exhausted. Falling back to local rule analyzer.');
      return fallbackToLocalAnalyzer(cleanedText, rawText, userLanguage, 'All Groq Models Exhausted');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    let parsedData: any = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      parsedData = JSON.parse(jsonString);
    } catch (parseErr) {
      console.warn('Groq response JSON parse issue, using local analyzer:', parseErr);
      return fallbackToLocalAnalyzer(cleanedText, rawText, userLanguage, 'JSON Format Parse Failure');
    }

    const validSignals: StatusLevel[] = ['healthy', 'good', 'concerned', 'critical'];
    const overallSignal: StatusLevel = validSignals.includes(parsedData.overallSignal)
      ? parsedData.overallSignal
      : 'healthy';

    const metrics: StandardizedHealthMetrics = parsedData.metrics || {};

    // Transform standardized metrics into matchedTerms array for full backward compatibility
    const matchedTerms: GroqLabTermResult[] = [];
    const metricKeys: (keyof StandardizedHealthMetrics)[] = [
      'betaHcg',
      'hemoglobin',
      'fastingGlucose',
      'postPrandialGlucose',
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'plateletCount',
      'tshThyroid',
      'urineProtein',
      'serumFerritin',
      'wbcCount',
      'pulseRate',
    ];

    for (const key of metricKeys) {
      const item = metrics[key];
      if (item && item.value !== undefined) {
        const formattedName = key
          .replace(/([A-Z])/g, ' $1')
          .toUpperCase()
          .trim();

        matchedTerms.push({
          id: key,
          termName: formattedName,
          extractedValue: item.value,
          unit: item.unit || '',
          signal: validSignals.includes(item.signal) ? item.signal : 'healthy',
          explanation: item.explanation || `${formattedName} level extracted from report.`,
          explanationTamil: item.explanationTamil || item.explanation || 'பரிசோதனை முடிவுகள்.',
        });
      }
    }

    return {
      overallSignal,
      metrics,
      matchedTerms,
      rawText: parsedData.extractedFullText || rawText,
      cleanText: parsedData.extractedFullText || cleanedText,
      extractedFullText: parsedData.extractedFullText,
      isReadable: matchedTerms.length > 0 || !!parsedData.extractedFullText,
      aiSummary: parsedData.aiSummary || 'Laboratory report analyzed using standardized maternal metrics.',
      doctorAdvice: Array.isArray(parsedData.doctorAdvice)
        ? parsedData.doctorAdvice
        : ['Discuss these findings with your obstetrician at your next appointment.'],
      aiModelUsed: `Groq AI (${usedModel})`,
      tokensUsed,
      isAiGenerated: true,
    };
  } catch (err) {
    console.error('Groq LLM standardized analysis failed:', err);
    return fallbackToLocalAnalyzer(cleanedText, rawText, userLanguage, 'Network/Execution Exception');
  }
};

/**
 * Fallback mechanism: Local rule-based extraction into standardized JSON structure.
 */
const fallbackToLocalAnalyzer = (
  cleanText: string,
  rawText: string,
  language: string,
  reason: string
): GroqReportAnalysisResult => {
  const localResult = analyzeReportText(cleanText || rawText, language);

  const metrics: StandardizedHealthMetrics = {};
  localResult.matchedTerms.forEach(term => {
    const key = term.id as keyof StandardizedHealthMetrics;
    metrics[key] = {
      value: term.extractedValue,
      unit: term.unit,
      signal: term.signal,
      isNormal: term.signal === 'healthy' || term.signal === 'good',
      explanation: term.explanation,
      explanationTamil: term.explanationTamil,
    };
  });

  // Build detailed, non-generic 5-line data summary citing exact numbers
  let summaryText = '';
  if (localResult.matchedTerms && localResult.matchedTerms.length > 0) {
    const termDetails = localResult.matchedTerms.map(t =>
      `${t.termName} was recorded at ${t.extractedValue} ${t.unit} (${t.explanation})`
    ).join('. ');

    summaryText = `Your lab document was parsed and evaluated for maternal health indicators. ${termDetails}. Overall, your reported values reflect a ${localResult.overallSignal.toUpperCase()} status for your pregnancy stage. We recommend keeping this digital record saved and sharing these specific lab figures with your doctor during your next visit.`;
  } else {
    summaryText = `Your scanned medical document has been parsed and reviewed. No critical abnormal markers were detected in the visible text. We recommend keeping this digital report saved for your obstetric records and discussing any specific symptoms with your healthcare provider.`;
  }

  return {
    overallSignal: localResult.overallSignal,
    metrics,
    matchedTerms: localResult.matchedTerms,
    rawText: rawText || cleanText,
    cleanText,
    isReadable: localResult.isReadable,
    aiSummary: summaryText,
    doctorAdvice: [
      'Bring a copy of this lab report to your next antenatal checkup.',
      'Consult your doctor if you experience dizziness, unusual fatigue, or blurred vision.',
    ],
    aiModelUsed: 'On-Device Rule Engine (Fallback)',
    isAiGenerated: false,
  };
};
