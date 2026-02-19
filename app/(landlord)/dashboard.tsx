import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { usePropertiesStore } from '../../store/properties';
import { useMaintenanceStore } from '../../store/maintenance';
import { formatCents } from '../../lib/utils';
import { colors, text, radius, shadow, spacing, cardBase, headerBase } from '../../lib/theme';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { properties, fetchProperties } = usePropertiesStore();
  const { requests, fetchRequests } = useMaintenanceStore();
  const { width } = useWindowDimensions();

  useEffect(() => { fetchProperties(); fetchRequests(); }, []);

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const monthlyRent = properties.reduce((sum, p) => sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0);
  const openRequests = requests.filter((r) => r.status !== 'resolved').length;
  const emergencies = requests.filter((r) => r.urgency === 'emergency' && r.status !== 'resolved').length;
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const isWide = width >= 768;
  const hPad = isWide ? 24 : 20;
  const gap = 16;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.pageHeader, { paddingHorizontal: hPad }]}>
        <Text style={styles.greeting}>Hi, {firstName}</Text>
        <Text style={styles.sub}>Here's your portfolio today</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: hPad, gap: 8 }}>
        <View style={[styles.row, { gap, marginBottom: 0 }]}>
          <View style={styles.card}>
            <Text style={styles.statNum}>{totalUnits}</Text>
            <Text style={styles.statLabel}>Total units</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.statNum, { color: colors.brand[600] }]}>{formatCents(monthlyRent)}</Text>
            <Text style={styles.statLabel}>Monthly rent</Text>
          </View>
        </View>

        <View style={[styles.row, { gap }]}>
          <View style={styles.card}>
            <Text style={styles.statNum}>{openRequests}</Text>
            <Text style={styles.statLabel}>Open requests</Text>
          </View>
          {emergencies > 0 && (
            <View style={[styles.card, { backgroundColor: colors.red[50], borderColor: colors.red[100] }]}>
              <Text style={[styles.statNum, { color: colors.red[600] }]}>{emergencies}</Text>
              <Text style={[styles.statLabel, { color: colors.red[500] }]}>Emergencies</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Your properties</Text>

        <View style={isWide ? [styles.grid, { gap }] : undefined}>
          {properties.map((p) => (
            <View key={p.id} style={[styles.propCard, isWide && { width: colW }]}>
              <Text style={styles.propName}>{p.nickname ?? p.address}</Text>
              <Text style={styles.propSub}>{p.units?.length ?? 0} units</Text>
            </View>
          ))}
        </View>

        {properties.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Add your first property to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.gray[50] },
  pageHeader:   { ...headerBase },
  greeting:     { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  sub:          { fontSize: text.body, color: colors.gray[500] },
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
