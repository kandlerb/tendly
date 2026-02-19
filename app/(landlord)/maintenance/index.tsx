import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMaintenanceStore } from '../../../store/maintenance';
import { UrgencyBadge, StatusBadge } from '../../../components/domain/MaintenanceBadge';
import { formatDate } from '../../../lib/utils';
import { colors, text, radius, shadow } from '../../../lib/theme';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests } = useMaintenanceStore();

  useEffect(() => { fetchRequests(); }, []);

  const open = requests.filter((r) => r.status !== 'resolved');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Maintenance</Text>
        <Text style={styles.sub}>{open.length} open {open.length === 1 ? 'request' : 'requests'}</Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(landlord)/maintenance/${item.id}` as any)}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <UrgencyBadge urgency={item.urgency} />
            </View>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.cardMeta}>{item.tenant?.full_name} · Unit {item.unit?.unit_number}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}><Text style={styles.emptyText}>No maintenance requests</Text></View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: text['2xl'], fontWeight: '700', color: colors.gray[900] },
  sub: { fontSize: text.sm, color: colors.gray[500], marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontWeight: '600', color: colors.gray[900], flex: 1, marginRight: 8, fontSize: text.base },
  cardDesc: { color: colors.gray[500], fontSize: text.sm, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta: { color: colors.gray[400], fontSize: text.xs },
  cardDate: { color: colors.gray[300], fontSize: text.xs, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: colors.gray[400], fontSize: text.base },
});
