import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { showAlert } from '../../../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMaintenanceStore } from '../../../store/maintenance';
import { UrgencyBadge, StatusBadge } from '../../../components/domain/MaintenanceBadge';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import type { MaintenanceStatus } from '../../../types';
import { colors, text, radius, shadow } from '../../../lib/theme';

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requests, updateRequest } = useMaintenanceStore();
  const [updating, setUpdating] = useState(false);

  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Request not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleStatusChange(newStatus: MaintenanceStatus) {
    setUpdating(true);
    await updateRequest(id, { status: newStatus });
    setUpdating(false);
    showAlert('Updated', `Request marked as ${newStatus}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{request.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.badges}>
            <UrgencyBadge urgency={request.urgency} />
            <View style={{ width: 8 }} />
            <StatusBadge status={request.status} />
          </View>

          <Text style={styles.description}>{request.description}</Text>

          <View style={styles.divider} />
          <Text style={styles.metaLabel}>Tenant</Text>
          <Text style={styles.metaValue}>{request.tenant?.full_name}</Text>
          <Text style={styles.metaSub}>{request.tenant?.email}</Text>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.metaLabel}>Property</Text>
            <Text style={styles.metaValue}>
              {request.unit?.property?.nickname ?? request.unit?.property?.address} · Unit {request.unit?.unit_number}
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.metaLabel}>Submitted</Text>
            <Text style={styles.metaValue}>{formatDate(request.created_at)}</Text>
          </View>
        </View>

        {request.status === 'open' && (
          <Button title="Mark as Assigned" onPress={() => handleStatusChange('assigned')} loading={updating} variant="secondary" />
        )}
        {request.status !== 'resolved' && (
          <View style={{ marginTop: 12 }}>
            <Button title="Mark as Resolved" onPress={() => handleStatusChange('resolved')} loading={updating} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: colors.gray[400] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: text.xl, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  badges: { flexDirection: 'row', marginBottom: 16 },
  description: { color: colors.gray[700], fontSize: text.base, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.gray[100], marginVertical: 16 },
  metaLabel: { fontSize: text.xs, color: colors.gray[400], marginBottom: 4 },
  metaValue: { color: colors.gray[800], fontWeight: '500', fontSize: text.base },
  metaSub: { color: colors.gray[500], fontSize: text.sm, marginTop: 2 },
});
