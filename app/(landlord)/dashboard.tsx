import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { usePropertiesStore } from '../../store/properties';
import { useMaintenanceStore } from '../../store/maintenance';
import { formatCents } from '../../lib/utils';
import { colors, text, radius, shadow } from '../../lib/theme';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { properties, fetchProperties } = usePropertiesStore();
  const { requests, fetchRequests } = useMaintenanceStore();

  useEffect(() => { fetchProperties(); fetchRequests(); }, []);

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const monthlyRent = properties.reduce((sum, p) => sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0);
  const openRequests = requests.filter((r) => r.status !== 'resolved').length;
  const emergencies = requests.filter((r) => r.urgency === 'emergency' && r.status !== 'resolved').length;
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Hi, {firstName}</Text>
        <Text style={styles.sub}>Here's your portfolio today</Text>

        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.statNum}>{totalUnits}</Text>
            <Text style={styles.statLabel}>Total units</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.statNum, { color: colors.brand[600] }]}>{formatCents(monthlyRent)}</Text>
            <Text style={styles.statLabel}>Monthly rent</Text>
          </View>
        </View>

        <View style={[styles.row, { marginBottom: 24 }]}>
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

        <Text style={styles.sectionTitle}>Your properties</Text>
        {properties.map((p) => (
          <View key={p.id} style={styles.propCard}>
            <Text style={styles.propName}>{p.nickname ?? p.address}</Text>
            <Text style={styles.propSub}>{p.units?.length ?? 0} units</Text>
          </View>
        ))}
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
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: 20 },
  greeting: { fontSize: text['2xl'], fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  sub: { fontSize: text.base, color: colors.gray[500], marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  statNum: { fontSize: text['3xl'], fontWeight: '700', color: colors.gray[900] },
  statLabel: { fontSize: text.sm, color: colors.gray[500], marginTop: 4 },
  sectionTitle: { fontSize: text.lg, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  propCard: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  propName: { fontWeight: '600', color: colors.gray[900] },
  propSub: { color: colors.gray[500], fontSize: text.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: colors.gray[400] },
});
