// HospitalLocatorScreen — Find nearby PHCs, Maternity Hubs & Emergency Hospitals via OpenStreetMap
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { fetchNearbyHospitalsRealtime, HospitalLocationInfo } from '../../services/hospitalApi';

export const HospitalLocatorScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [allHospitals, setAllHospitals] = useState<HospitalLocationInfo[]>([]);
  const [displayedHospitals, setDisplayedHospitals] = useState<HospitalLocationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'MATERNITY' | 'GOVT' | 'CEmONC'>('ALL');

  useEffect(() => {
    loadRealtimeHospitals();
  }, []);

  const loadRealtimeHospitals = async () => {
    setLoading(true);
    const { hospitals } = await fetchNearbyHospitalsRealtime();
    setAllHospitals(hospitals);
    setDisplayedHospitals(hospitals);
    setLoading(false);
  };

  const applyFilters = (query: string, type: 'ALL' | 'MATERNITY' | 'GOVT' | 'CEmONC') => {
    let filtered = allHospitals;
    if (query.trim()) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(query.toLowerCase()) ||
        h.address.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (type === 'MATERNITY') {
      filtered = filtered.filter(h => h.type === 'Maternity Center');
    } else if (type === 'GOVT') {
      filtered = filtered.filter(h => h.type === 'Government Hospital' || h.type === 'PHC');
    } else if (type === 'CEmONC') {
      filtered = filtered.filter(h => h.hasCEmONC);
    }
    setDisplayedHospitals(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(text, filterType);
  };

  const handleFilterSelect = (type: 'ALL' | 'MATERNITY' | 'GOVT' | 'CEmONC') => {
    setFilterType(type);
    applyFilters(searchQuery, type);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const handleDirections = (hospital: HospitalLocationInfo) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{t('hospital.title')}</Text>
          <TouchableOpacity onPress={loadRealtimeHospitals} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Free API Banner Badge */}
        <View style={[styles.freeBadge, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="earth" size={14} color={colors.success} />
          <Text style={[styles.freeBadgeText, { color: colors.success }]}>
            Realtime OpenStreetMap Hospital Data • 100% Free
          </Text>
        </View>
        
        {/* Search Box */}
        <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Ionicons name="search" size={20} color={colors.placeholder} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search hospitals, PHCs, maternity centers..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'MATERNITY', 'GOVT', 'CEmONC'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filterType === type ? colors.primary : colors.inputBackground,
                  borderColor: filterType === type ? colors.primary : colors.inputBorder,
                },
              ]}
              onPress={() => handleFilterSelect(type)}
            >
              <Text style={[styles.filterText, { color: filterType === type ? colors.white : colors.text }]}>
                {type === 'ALL' ? 'All Nearby' : type === 'MATERNITY' ? 'Maternity' : type === 'GOVT' ? 'Govt/PHC' : 'CEmONC 24/7'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Discovering nearby emergency hospitals...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedHospitals}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card variant="default" style={styles.hospitalCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.hasCEmONC ? colors.error + '15' : colors.primaryLight }]}>
                  <Text style={[styles.typeText, { color: item.hasCEmONC ? colors.error : colors.primary }]}>
                    {item.hasCEmONC ? 'CEmONC Emergency Hub' : item.type}
                  </Text>
                </View>
                <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                  {item.distanceKm} km away
                </Text>
              </View>

              <Text style={[styles.hospName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.hospAddress, { color: colors.textSecondary }]}>{item.address}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleCall(item.phone)}
                >
                  <Ionicons name="call" size={16} color={colors.white} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: colors.white }]}>Call Emergency</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => handleDirections(item)}
                >
                  <Ionicons name="navigate" size={16} color={colors.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Navigate</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
  },
  refreshBtn: {
    padding: Spacing.xs,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginVertical: Spacing.sm,
  },
  freeBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  searchBox: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.md,
  },
  hospitalCard: {
    marginBottom: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  distanceText: {
    ...Typography.caption,
  },
  hospName: {
    ...Typography.labelLarge,
    marginBottom: 2,
  },
  hospAddress: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    ...Typography.buttonSmall,
  },
});

