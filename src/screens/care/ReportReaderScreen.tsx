// ReportReaderScreen — Standardized Medical Report Reader with Groq AI Metrics Grid
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { extractTextFromDocumentUri, ExtractedDocumentData } from '../../services/pdfOcrExtractor';
import { analyzeDocumentWithGroq, GroqReportAnalysisResult, StandardizedHealthMetrics, SingleMetricDetail } from '../../services/groqService';
import { saveLocalMedicalReport } from '../../services/storage';
import { syncReportsToFirestore } from '../../services/firestoreSync';

type ExtractionStage = 'idle' | 'extracting_ocr' | 'analyzing_groq' | 'complete';

export const ReportReaderScreen: React.FC = () => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [documentName, setDocumentName] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractionStage, setExtractionStage] = useState<ExtractionStage>('idle');
  const [extractedDocData, setExtractedDocData] = useState<ExtractedDocumentData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GroqReportAnalysisResult | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  // Handle PDF Document Pick
  const pickPdfDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setImageUri(null);
        setDocumentName(file.name || 'lab_report.pdf');
        await processDocument(file.uri, file.name || 'lab_report.pdf', file.mimeType || 'application/pdf');
      }
    } catch (err) {
      console.error('Error picking PDF document:', err);
      alert('Could not select PDF document. Please try again.');
    }
  };

  // Handle Image Library Pick
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setDocumentName('Lab Report Scan.jpg');
      await processDocument(uri, 'Lab Report Scan.jpg', 'image/jpeg');
    }
  };

  // Handle Camera Capture
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setDocumentName('Camera Photo Scan.jpg');
      await processDocument(uri, 'Camera Photo Scan.jpg', 'image/jpeg');
    }
  };

  // Orchestrate PDF Text Extraction + Groq LLM Execution
  const processDocument = async (uri: string, name: string, mimeType: string) => {
    setExtractionStage('extracting_ocr');
    setAnalysisResult(null);
    setExtractedDocData(null);
    setShowRawText(false);

    try {
      const docData = await extractTextFromDocumentUri(uri, name, mimeType);
      setExtractedDocData(docData);

      setExtractionStage('analyzing_groq');
      const groqResult = await analyzeDocumentWithGroq(docData.cleanText, docData.rawText, language, docData.base64Data);

      setAnalysisResult(groqResult);
      if (groqResult.extractedFullText) {
        setExtractedDocData({
          rawText: groqResult.extractedFullText,
          cleanText: groqResult.extractedFullText,
          documentName: name,
          charCount: groqResult.extractedFullText.length,
          wordCount: groqResult.extractedFullText.split(/\s+/).filter(Boolean).length,
          extractionMethod: 'vision_ocr',
        });
      }
      setExtractionStage('complete');

      await saveLocalMedicalReport({
        title: name.replace(/\.[^/.]+$/, ''),
        category: 'Blood Test',
        date: new Date().toISOString().split('T')[0],
        overallSignal: groqResult.overallSignal,
        summary: groqResult.aiSummary,
        matchedTerms: groqResult.matchedTerms,
      }, user?.uid);

      if (user?.uid) {
        syncReportsToFirestore(user.uid);
      }
    } catch (error) {
      console.error('Failed to process medical document:', error);
      setExtractionStage('idle');
      alert('Error processing document. Please check the file and try again.');
    }
  };

  const renderMetricCard = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    item?: SingleMetricDetail
  ) => {
    if (!item) return null;

    return (
      <Card key={title} variant="default" style={styles.standardMetricCard}>
        <View style={styles.metricCardHeader}>
          <View style={styles.metricTitleRow}>
            <Ionicons name={icon} size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.metricTitle, { color: colors.text }]}>{title}</Text>
          </View>
          <StatusBadge status={item.signal} size="small" />
        </View>

        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValueText, { color: colors.primary }]}>
            {item.value} {item.unit !== '-' ? item.unit : ''}
          </Text>
          {item.referenceRange && (
            <Text style={[styles.metricRangeText, { color: colors.textSecondary }]}>
              Ref: {item.referenceRange}
            </Text>
          )}
        </View>

        {item.explanation && (
          <Text style={[styles.metricExplanationText, { color: colors.textSecondary }]}>
            {language === 'ta' && item.explanationTamil ? item.explanationTamil : item.explanation}
          </Text>
        )}
      </Card>
    );
  };

  const metrics: StandardizedHealthMetrics = analysisResult?.metrics || {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t('reportReader.title')}</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>Groq AI Standardized</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upload PDF lab reports or scan printed results for standardized maternal health metrics.
        </Text>

        {/* Upload Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            onPress={pickPdfDocument}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: colors.white }]}>Upload PDF Document</Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t('reportReader.takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={20} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t('reportReader.uploadImage')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Uploaded File / Image Preview */}
        {documentName && (
          <View style={[styles.fileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={imageUri ? "image" : "document-attach"} size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                {documentName}
              </Text>
              {extractedDocData && (
                <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>
                  Extracted {extractedDocData.wordCount} words ({extractedDocData.charCount} chars) via {extractedDocData.extractionMethod}
                </Text>
              )}
            </View>
          </View>
        )}

        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          </View>
        )}

        {/* Stage 1 & 2 Loading State */}
        {extractionStage !== 'idle' && extractionStage !== 'complete' && (
          <Card variant="elevated" style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingTitle, { color: colors.text }]}>
              {extractionStage === 'extracting_ocr'
                ? '📄 Extracting text from PDF Document...'
                : '🤖 Groq AI Standardizing Metrics...'}
            </Text>
            <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
              {extractionStage === 'extracting_ocr'
                ? 'Parsing PDF text streams and formatting tokens'
                : 'Extracting hemoglobin, glucose, TSH & preeclampsia indicators into standardized schema'}
            </Text>
          </Card>
        )}

        {/* Groq AI Analysis Results */}
        {analysisResult && extractionStage === 'complete' && (
          <View style={styles.resultsContainer}>
            {/* AI Summary Banner */}
            <Card variant="elevated" style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('reportReader.results')}</Text>
                  <Text style={[styles.modelTag, { color: colors.primary }]}>
                    {analysisResult.aiModelUsed}
                    {analysisResult.tokensUsed ? ` • ${analysisResult.tokensUsed} tokens` : ''}
                  </Text>
                </View>
                <StatusBadge status={analysisResult.overallSignal} size="large" />
              </View>

              <Text style={[styles.aiSummaryText, { color: colors.text }]}>
                {analysisResult.aiSummary}
              </Text>

              <View style={[styles.disclaimerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                  {t('reportReader.disclaimer')}
                </Text>
              </View>
            </Card>

            {/* Standardized Maternal Health Metrics Grid */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Standardized Maternal Health Metrics</Text>
            <View style={styles.metricsGrid}>
              {renderMetricCard('Beta HCG (Pregnancy Hormone)', 'git-network-outline', metrics.betaHcg)}
              {renderMetricCard('Hemoglobin (Hb)', 'water-outline', metrics.hemoglobin)}
              {renderMetricCard('Fasting Blood Glucose', 'nutrition-outline', metrics.fastingGlucose)}
              {renderMetricCard('Post-Prandial Glucose', 'restaurant-outline', metrics.postPrandialGlucose)}
              {renderMetricCard('Platelet Count', 'fitness-outline', metrics.plateletCount)}
              {renderMetricCard('TSH Thyroid', 'pulse-outline', metrics.tshThyroid)}
              {renderMetricCard('Urine Protein', 'flask-outline', metrics.urineProtein)}
              {renderMetricCard('Serum Ferritin', 'medkit-outline', metrics.serumFerritin)}
            </View>

            {/* Fallback rendering for any additional terms */}
            {analysisResult.matchedTerms.length > 0 && Object.keys(metrics).length === 0 && (
              <View>
                {analysisResult.matchedTerms.map(term => (
                  <Card key={term.id} variant="default" style={styles.termCard}>
                    <View style={styles.termHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.termName, { color: colors.text }]}>{term.termName}</Text>
                        <Text style={[styles.termValue, { color: colors.primary }]}>
                          {term.extractedValue} {term.unit}
                        </Text>
                      </View>
                      <StatusBadge status={term.signal} size="small" />
                    </View>
                    <Text style={[styles.termExplanation, { color: colors.textSecondary }]}>
                      {language === 'ta' ? term.explanationTamil : term.explanation}
                    </Text>
                  </Card>
                ))}
              </View>
            )}

            {/* Doctor Advice Card */}
            {analysisResult.doctorAdvice && analysisResult.doctorAdvice.length > 0 && (
              <Card variant="elevated" style={[styles.adviceCard, { borderColor: colors.primary + '30' }]}>
                <View style={styles.adviceHeader}>
                  <Ionicons name="medical-outline" size={20} color={colors.primary} />
                  <Text style={[styles.adviceTitle, { color: colors.text }]}>Doctor Consultation Questions</Text>
                </View>
                {analysisResult.doctorAdvice.map((advice, i) => (
                  <View key={i} style={styles.adviceItem}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.adviceText, { color: colors.textSecondary }]}>{advice}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Toggle Raw PDF Text Button */}
            {extractedDocData && (
              <View style={styles.rawTextContainer}>
                <TouchableOpacity
                  style={[styles.toggleRawBtn, { borderColor: colors.border }]}
                  onPress={() => setShowRawText(!showRawText)}
                >
                  <Ionicons name={showRawText ? "chevron-up" : "code-slash"} size={16} color={colors.textSecondary} />
                  <Text style={[styles.toggleRawBtnText, { color: colors.textSecondary }]}>
                    {showRawText ? "Hide Extracted PDF Text" : "View Extracted PDF Text (OCR Debug)"}
                  </Text>
                </TouchableOpacity>

                {showRawText && (
                  <View style={[styles.rawTextBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.rawTextContent, { color: colors.textSecondary }]}>
                      {extractedDocData.cleanText}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    ...Typography.h2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  aiBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    ...Typography.button,
    fontSize: 16,
  },
  secondaryBtnText: {
    ...Typography.button,
    fontSize: 13,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  fileName: {
    ...Typography.labelLarge,
    fontWeight: '700',
  },
  fileMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
  },
  loadingBox: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingTitle: {
    ...Typography.h4,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  loadingSubtitle: {
    ...Typography.caption,
    textAlign: 'center',
  },
  resultsContainer: {
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    ...Typography.h3,
  },
  modelTag: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  aiSummaryText: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 24,
    marginVertical: Spacing.sm,
    letterSpacing: 0.2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  disclaimerText: {
    ...Typography.caption,
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h4,
    marginTop: Spacing.sm,
  },
  metricsGrid: {
    gap: Spacing.sm,
  },
  standardMetricCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    ...Typography.labelLarge,
    fontWeight: '700',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  metricValueText: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricRangeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  metricExplanationText: {
    ...Typography.bodySmall,
    lineHeight: 18,
    marginTop: 2,
  },
  termCard: {
    marginBottom: Spacing.xs,
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  termName: {
    ...Typography.labelLarge,
    fontWeight: '700',
  },
  termValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  termExplanation: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  adviceCard: {
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  adviceTitle: {
    ...Typography.labelLarge,
    fontWeight: '700',
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: Spacing.sm,
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  adviceText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  rawTextContainer: {
    marginTop: Spacing.md,
  },
  toggleRawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  toggleRawBtnText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  rawTextBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
    maxHeight: 180,
  },
  rawTextContent: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
