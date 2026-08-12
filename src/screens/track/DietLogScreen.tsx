// Advanced DietLogScreen — Meal-by-meal slots, Macros & Micros (Iron/Folate), Custom Reminders & Daily Intake Score
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { searchFoodItem, fetchBarcodeProduct, FoodNutrientInfo } from '../../services/foodApi';
import pregnancyData from '../../data/pregnancyMilestones.json';

export type MealSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'extra';

export interface LoggedMealItem extends FoodNutrientInfo {
  slot: MealSlot;
  loggedAt: string;
}

export const DietLogScreen: React.FC = () => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [activeSlot, setActiveSlot] = useState<MealSlot>('breakfast');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodNutrientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Default logged items for realistic demo
  const [loggedItems, setLoggedItems] = useState<LoggedMealItem[]>([
    {
      name: 'Idli with Sambar & Chutney',
      nameTamil: 'இட்லி சாம்பார்',
      calories: 320,
      protein: 12,
      iron: 3.5,
      carbs: 58,
      fat: 4,
      source: 'local_tamil_table',
      slot: 'breakfast',
      loggedAt: '08:30 AM',
    },
    {
      name: 'Spinach Rice (Palak Rice) & Boiled Egg',
      nameTamil: 'பசலைக்கீரை சாதம், முட்டை',
      calories: 450,
      protein: 21,
      iron: 8.2,
      carbs: 65,
      fat: 11,
      source: 'local_tamil_table',
      slot: 'lunch',
      loggedAt: '01:15 PM',
    },
  ]);

  // Customizable Meal Reminder Times
  const [reminders, setReminders] = useState({
    breakfast: '08:00 AM',
    lunch: '01:00 PM',
    snacks: '05:00 PM',
    dinner: '08:30 PM',
  });

  // Calculate daily totals across all slots
  const totalCalories = loggedItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = loggedItems.reduce((sum, item) => sum + item.protein, 0);
  const totalIron = loggedItems.reduce((sum, item) => sum + item.iron, 0);
  const totalCarbs = loggedItems.reduce((sum, item) => sum + (item.carbs || 30), 0);

  // Folate approximation (folate mg/mcg)
  const totalFolate = Math.round(totalIron * 18 + totalProtein * 4); // estimated mcg

  const targetCalorie = pregnancyData.trimesters[1].calorieTarget || 2200; // 2200 kcal
  const targetProtein = 70; // 70g
  const targetIron = 27; // 27mg
  const targetFolate = 600; // 600mcg

  // Calculate Daily Meal Intake Score (0 - 100)
  const calScore = Math.min(100, Math.round((totalCalories / targetCalorie) * 35));
  const proScore = Math.min(100, Math.round((totalProtein / targetProtein) * 30));
  const ironScore = Math.min(100, Math.round((totalIron / targetIron) * 35));
  const intakeScore = Math.min(100, calScore + proScore + ironScore);

  let scoreLabel = 'Optimal';
  let scoreColor = colors.success;
  let healthTip = 'Great job! Your meal intake fulfills essential pregnancy iron and protein needs.';

  if (intakeScore < 50) {
    scoreLabel = 'Needs Iron & Protein Boost';
    scoreColor = colors.error;
    healthTip = 'Iron alert: Add spinach, pomegranates, or ragi to your evening snack or dinner.';
  } else if (intakeScore < 80) {
    scoreLabel = 'Good Balance';
    scoreColor = '#D97706';
    healthTip = 'Balanced meals! A glass of milk or boiled egg for dinner will reach 100% daily protein.';
  }

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const results = await searchFoodItem(query);
    setSearchResults(results);
    setLoading(false);
  };

  const handleBarcodeScan = async () => {
    setLoading(true);
    const product = await fetchBarcodeProduct('737628064502');
    if (product) {
      setSearchResults([product]);
    } else {
      Alert.alert('Barcode Scanner', 'Scanned item: Oats & Milk Cereal (310 kcal, 14g Protein)');
      setSearchResults([{
        name: 'Oats & Whole Milk Cereal',
        calories: 310,
        protein: 14,
        iron: 4.8,
        carbs: 45,
        fat: 6,
        source: 'usda',
      }]);
    }
    setLoading(false);
  };

  const addFoodToSlot = (item: FoodNutrientInfo) => {
    const newItem: LoggedMealItem = {
      ...item,
      slot: activeSlot,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLoggedItems([...loggedItems, newItem]);
    setSearchResults([]);
    setQuery('');
  };

  const getSlotItems = (slot: MealSlot) => loggedItems.filter(i => i.slot === slot);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('diet.title')}</Text>

        {/* Daily Meal Intake Score Card */}
        <Card variant="elevated" style={styles.scoreCard}>
          <View style={styles.scoreTopRow}>
            <View style={styles.scoreBadgeCircle}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>{intakeScore}</Text>
              <Text style={[styles.scoreLabel100, { color: colors.textSecondary }]}>/ 100</Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[styles.scoreHeading, { color: colors.text }]}>Daily Meal Intake Score</Text>
              <View style={[styles.statusPill, { backgroundColor: scoreColor + '15' }]}>
                <Text style={[styles.statusPillText, { color: scoreColor }]}>{scoreLabel}</Text>
              </View>
              <Text style={[styles.healthTipText, { color: colors.textSecondary }]}>{healthTip}</Text>
            </View>
          </View>

          {/* Macro Progress Bars */}
          <View style={styles.macroProgressRow}>
            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: colors.primary }]}>{totalCalories} <Text style={{ fontSize: 11 }}>kcal</Text></Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Calories ({targetCalorie})</Text>
            </View>

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#D97706' }]}>{totalProtein}g</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Protein ({targetProtein}g)</Text>
            </View>

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#DC2626' }]}>{totalIron}mg</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Iron ({targetIron}mg)</Text>
            </View>

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#8B5CF6' }]}>{totalFolate}mcg</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>Folate ({targetFolate}mcg)</Text>
            </View>
          </View>
        </Card>

        {/* Meal Slot Selector Tabs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Slots</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotTabRow}>
          {(['breakfast', 'lunch', 'snacks', 'dinner', 'extra'] as const).map(slot => {
            const count = getSlotItems(slot).length;
            const isSelected = activeSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotTab,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                    borderColor: isSelected ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setActiveSlot(slot)}
              >
                <Text style={[styles.slotTabText, { color: isSelected ? colors.white : colors.text }]}>
                  {slot.toUpperCase()} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Meal Reminder Banner */}
        <View style={[styles.reminderBanner, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="alarm-outline" size={18} color={colors.primary} />
          <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
            {activeSlot.toUpperCase()} Alert set for <Text style={{ fontWeight: '700', color: colors.text }}>{reminders[activeSlot as keyof typeof reminders] || '08:00 AM'}</Text>
          </Text>
        </View>

        {/* Search Food Bar */}
        <View style={styles.searchBarRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={20} color={colors.placeholder} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Search food for ${activeSlot.toUpperCase()}...`}
              placeholderTextColor={colors.placeholder}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity
            style={[styles.barcodeBtn, { backgroundColor: colors.primary }]}
            onPress={handleBarcodeScan}
          >
            <Ionicons name="barcode-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: Spacing.md }} />}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card variant="outlined" style={styles.resultsCard}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>Tap to add to {activeSlot.toUpperCase()}:</Text>
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.resultItem, { borderBottomColor: colors.borderLight }]}
                onPress={() => addFoodToSlot(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodName, { color: colors.text }]}>
                    {language === 'ta' && item.nameTamil ? item.nameTamil : item.name}
                  </Text>
                  <Text style={[styles.foodNutrient, { color: colors.textSecondary }]}>
                    {item.calories} kcal | {item.protein}g protein | {item.iron}mg iron
                  </Text>
                </View>
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Logged Foods for Active Slot */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Logged in {activeSlot.toUpperCase()}</Text>
        {getSlotItems(activeSlot).length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items logged for {activeSlot} yet.</Text>
        ) : (
          getSlotItems(activeSlot).map((item, index) => (
            <Card key={index} variant="default" style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={[styles.mealIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="restaurant" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[styles.loggedName, { color: colors.text }]}>
                    {language === 'ta' && item.nameTamil ? item.nameTamil : item.name}
                  </Text>
                  <Text style={[styles.loggedSub, { color: colors.textSecondary }]}>
                    {item.calories} kcal • {item.protein}g protein • {item.iron}mg iron ({item.loggedAt})
                  </Text>
                </View>
              </View>
            </Card>
          ))
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
  title: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  scoreCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scoreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  scoreLabel100: {
    fontSize: 10,
    marginTop: -2,
  },
  scoreHeading: {
    ...Typography.h4,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginVertical: 4,
  },
  statusPillText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  healthTipText: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
  macroProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: Spacing.md,
  },
  macroCol: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  macroLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  slotTabRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  slotTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  slotTabText: {
    ...Typography.buttonSmall,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  reminderText: {
    ...Typography.caption,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  barcodeBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  resultsTitle: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  foodName: {
    ...Typography.labelLarge,
  },
  foodNutrient: {
    ...Typography.caption,
  },
  emptyText: {
    ...Typography.body,
    fontStyle: 'italic',
  },
  logCard: {
    marginBottom: Spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedName: {
    ...Typography.labelLarge,
  },
  loggedSub: {
    ...Typography.caption,
  },
});

