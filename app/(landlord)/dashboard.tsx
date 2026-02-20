import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { usePropertiesStore } from '../../store/properties';
import { useMaintenanceStore } from '../../store/maintenance';
import { formatCents } from '../../lib/utils';
import { colors, text, radius, shadow, spacing, cardBase, headerBase, breakpoints } from '../../lib/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { properties, loading: propsLoading, fetchProperties } = usePropertiesStore();
  const { requests, loading: maintLoading, fetchRequests } = useMaintenanceStore();
  const { width } = useWindowDimensions();

  useEffect(() => { fetchProperties(); fetchRequests(); }, []);

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const monthlyRent = properties.reduce((sum, p) => sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0);
  const openRequests = requests.filter((r) => r.status !== 'resolved').length;
  const emergencies = requests.filter((r) => r.urgency === 'emergency' && r.status !== 'resolved').length;
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const isWide = width >= breakpoints.md;
  const hPad = isWide ? spacing.pagePadWide : spacing.pagePad;
  const gap = spacing.cardGap;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;
  const isLoading = propsLoading || maintLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.pageHeader, { paddingHorizontal: hPad }]}>
        <Text style={styles.greeting}>Hi, {firstName}</Text>
        <Text style={styles.sub}>Here's your portfolio today</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: hPad, gap: 8 }}>
          <View style={[styles.row, { gap, marginBottom: 0 }]}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/(landlord)/properties' as any)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Total units: ${totalUnits}. Go to properties.`}
            >
              <Text style={styles.statNum}>{totalUnits}</Text>
              <Text style={styles.statLabel}>Total units</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/(landlord)/financials' as any)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Monthly rent: ${formatCents(monthlyRent)}. Go to financials.`}
            >
              <Text style={[styles.statNum, { color: colors.brand[600] }]}>{formatCents(monthlyRent)}</Text>
              <Text style={styles.statLabel}>Monthly rent</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.row, { gap }]}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/(landlord)/maintenance' as any)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Open maintenance requests: ${openRequests}. Go to maintenance.`}
            >
              <Text style={styles.statNum}>{openRequests}</Text>
              <Text style={styles.statLabel}>Open requests</Text>
            </TouchableOpacity>
            {emergencies > 0 && (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.red[50], borderColor: colors.red[100] }]}
                onPress={() => router.push('/(landlord)/maintenance' as any)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${emergencies} emergency maintenance requests. Go to maintenance.`}
              >
                <Text style={[styles.statNum, { color: colors.red[600] }]}>{emergencies}</Text>
                <Text style={[styles.statLabel, { color: colors.red[500] }]}>Emergencies</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Your properties</Text>

          <View style={isWide ? [styles.grid, { gap }] : undefined}>
            {properties.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.propCard, isWide && { width: colW }]}
                onPress={() => router.push(`/(landlord)/properties/${p.id}` as any)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Property: ${p.nickname ?? p.address}, ${p.units?.length ?? 0} units`}
              >
                <Text style={styles.propName}>{p.nickname ?? p.address}</Text>
                <Text style={styles.propSub}>{p.units?.length ?? 0} units</Text>
              </TouchableOpacity>
            ))}
          </View>

          {properties.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Add your first property to get started</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.gray[50] },
  pageHeader:   { ...headerBase },
  greeting:     { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  sub:          { fontSize: text.body, color: colors.gray[500] },
  loadingCenter:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  row:          { flexDirection: 'row' },
  card:         { ...cardBase, ...shadow.sm, flex: 1, padding: spacing.cardPad },
  statNum:      { fontSize: text.statNum, fontWeight: '700', color: colors.gray[900] },
  statLabel:    { fontSize: text.secondary, color: colors.gray[500], marginTop: 4 },
  sectionTitle: { fontSize: text.subheading, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  propCard:     { ...cardBase, ...shadow.sm, padding: spacing.cardPad },
  propName:     { fontWeight: '600', color: colors.gray[900] },
  propSub:      { color: colors.gray[500], fontSize: text.secondary, marginTop: 2 },
  empty:        { alignItems: 'center', paddingVertical: 32 },
  emptyText:    { color: colors.gray[400] },
});
