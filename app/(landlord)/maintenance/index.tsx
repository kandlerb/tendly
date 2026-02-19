import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMaintenanceStore } from '../../../store/maintenance';
import { UrgencyBadge, StatusBadge } from '../../../components/domain/MaintenanceBadge';
import { formatDate } from '../../../lib/utils';
import { colors, text, radius, shadow, spacing, cardBase, headerBase } from '../../../lib/theme';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests } = useMaintenanceStore();
  const { width } = useWindowDimensions();

  useEffect(() => { fetchRequests(); }, []);

  const open = requests.filter((r) => r.status !== 'resolved');
  const isWide = width >= 768;
  const hPad = isWide ? 24 : 20;
  const gap = 16;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={styles.title}>Maintenance</Text>
        <Text style={styles.sub}>{open.length} open {open.length === 1 ? 'request' : 'requests'}</Text>
      </View>
      <FlatList
        key={isWide ? '2col' : '1col'}
        data={requests}
        keyExtractor={(r) => r.id}
        numColumns={isWide ? 2 : 1}
        columnWrapperStyle={isWide ? { gap, alignItems: 'stretch' } : undefined}
        contentContainerStyle={{
          paddingHorizontal: hPad,
          paddingTop: 8,
          paddingBottom: hPad,
          gap,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, isWide && { width: colW }]}
            onPress={() => router.push(`/(landlord)/maintenance/${item.id}` as any)}
          >
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
  safe:       { flex: 1, backgroundColor: colors.gray[50] },
  header:     { ...headerBase },
  title:      { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  sub:        { fontSize: text.secondary, color: colors.gray[500], marginTop: 4 },
  card:       { ...cardBase, ...shadow.sm, padding: spacing.cardPad },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle:  { fontWeight: '600', color: colors.gray[900], flex: 1, marginRight: 8, fontSize: text.body },
  cardDesc:   { color: colors.gray[500], fontSize: text.secondary, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta:   { color: colors.gray[400], fontSize: text.caption },
  cardDate:   { color: colors.gray[300], fontSize: text.caption, marginTop: 8 },
  empty:      { alignItems: 'center', paddingVertical: 64 },
  emptyText:  { color: colors.gray[400], fontSize: text.body },
});
