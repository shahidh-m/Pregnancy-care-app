// Client-Side PDF Document & Image OCR Reader Service
// Converts document URIs to sanitized text and Base64 payloads for Groq Vision AI.

export interface ExtractedDocumentData {
  rawText: string;
  cleanText: string;
  documentName: string;
  charCount: number;
  wordCount: number;
  extractionMethod: 'pdf_stream_parser' | 'text_reader' | 'vision_ocr';
  base64Data?: string;
}

/**
 * Clean and sanitize extracted document text to save Groq API tokens.
 */
export const sanitizeExtractedText = (text: string): string => {
  if (!text) return '';

  return text
    // Remove binary/null characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    // Replace multiple spaces with a single space
    .replace(/[ \t]+/g, ' ')
    // Replace 3+ consecutive newlines with a double newline
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Trim leading/trailing whitespace
    .trim()
    // Cap total length to ~4000 characters to stay within free tier limits
    .slice(0, 4000);
};

/**
 * Convert any file URI (local camera photo, blob, or cached file) to base64 Data URL.
 */
export const convertUriToBase64 = async (uri: string): Promise<string | null> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('URI to base64 conversion notice:', err);
    return null;
  }
};

/**
 * Extract printable text elements from raw PDF data stream or base64.
 */
export const parsePdfTextFromStream = (pdfRawString: string): string => {
  const extractedLines: string[] = [];

  // Match PDF text object blocks (BT ... ET)
  const textBlockRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = textBlockRegex.exec(pdfRawString)) !== null) {
    const block = match[0];
    const stringLiteralRegex = /\(([^()]*)\)/g;
    let strMatch: RegExpExecArray | null;
    let lineStr = '';

    while ((strMatch = stringLiteralRegex.exec(block)) !== null) {
      const parsedText = strMatch[1];
      if (parsedText && parsedText.trim().length > 0) {
        lineStr += parsedText + ' ';
      }
    }

    if (lineStr.trim().length > 0) {
      extractedLines.push(lineStr.trim());
    }
  }

  if (extractedLines.length === 0) {
    const printableRegex = /[A-Za-z0-9\s:.,/%/()-]{4,}/g;
    const matches = pdfRawString.match(printableRegex) || [];
    const filtered = matches.filter(s => {
      const lower = s.toLowerCase();
      return (
        lower.includes('patient') ||
        lower.includes('report') ||
        lower.includes('blood') ||
        lower.includes('hcg') ||
        lower.includes('g/dl') ||
        lower.includes('mg/dl') ||
        lower.includes('miu/ml') ||
        lower.includes('tsh') ||
        lower.includes('urine') ||
        lower.includes('hemoglobin') ||
        lower.includes('thyrocare') ||
        lower.includes('result') ||
        lower.includes('test') ||
        /\d+/.test(s)
      );
    });
    return filtered.join('\n');
  }

  return extractedLines.join('\n');
};

/**
 * Main entry point: Process a document URI (PDF or Image) into sanitized text and Base64 Data for LLM prompt.
 */
export const extractTextFromDocumentUri = async (
  uri: string,
  fileName: string = 'medical_report.pdf',
  fileType: string = 'application/pdf'
): Promise<ExtractedDocumentData> => {
  try {
    let rawText = '';
    let extractionMethod: ExtractedDocumentData['extractionMethod'] = 'vision_ocr';
    let base64Data: string | undefined = undefined;

    const isImage = fileType.includes('image') || /\.(jpg|jpeg|png|webp|heic)$/i.test(fileName) || uri.startsWith('data:image');
    const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

    if (isImage) {
      extractionMethod = 'vision_ocr';
      const b64 = await convertUriToBase64(uri);
      if (b64) {
        base64Data = b64;
      }
      rawText = `[Scanned Lab Report Image: ${fileName}]`;
    } else if (isPdf) {
      extractionMethod = 'pdf_stream_parser';
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const textContent = await blob.text();
        rawText = parsePdfTextFromStream(textContent);
      } catch (e) {
        console.warn('PDF stream reading notice:', e);
      }

      if (!rawText || rawText.trim().length < 15) {
        const b64 = await convertUriToBase64(uri);
        if (b64) {
          base64Data = b64;
          extractionMethod = 'vision_ocr';
        }
        rawText = `[PDF Lab Report Document: ${fileName}]`;
      }
    } else {
      extractionMethod = 'text_reader';
      try {
        const response = await fetch(uri);
        rawText = await response.text();
      } catch (e) {
        rawText = `[Medical Report Document: ${fileName}]`;
      }
    }

    const cleanText = sanitizeExtractedText(rawText);

    return {
      rawText: rawText || cleanText,
      cleanText,
      documentName: fileName,
      charCount: cleanText.length,
      wordCount: cleanText.split(/\s+/).filter(Boolean).length,
      extractionMethod,
      base64Data,
    };
  } catch (error) {
    console.warn('Document extraction error:', error);
    const fallbackText = `[Scanned Medical Report: ${fileName}]`;
    const b64 = await convertUriToBase64(uri);

    return {
      rawText: fallbackText,
      cleanText: sanitizeExtractedText(fallbackText),
      documentName: fileName,
      charCount: fallbackText.length,
      wordCount: fallbackText.split(/\s+/).length,
      extractionMethod: 'vision_ocr',
      base64Data: b64 || undefined,
    };
  }
};

