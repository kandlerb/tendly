import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, AlertCircle, Car, PawPrint, FileText, MessageSquare, XCircle } from 'lucide-react-native';
import { useTenantsStore } from '../../../store/tenants';
import { useMaintenanceStore } from '../../../store/maintenance';
import { getSignedUrl } from '../../../lib/claude';
import { formatCents, formatDate } from '../../../lib/utils';
import { showAlert, showConfirm } from '../../../lib/alert';
import { colors, text, radius, shadow, spacing, cardBase } from '../../../lib/theme';
import type { TenantWithLease } from '../../../types';
import * as WebBrowser from 'expo-web-browser';

function paymentBadgeStyle(status?: string) {
  if (status === 'paid')   return { bg: colors.green[100],  fg: colors.green[700] };
  if (status === 'late')   return { bg: colors.red[100],    fg: colors.red[700] };
  return                          { bg: colors.yellow[100], fg: colors.yellow[700] };
}

export default function TenantDetailScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const router = useRouter();
  const { tenants, terminateLease } = useTenantsStore();
  const { requests, fetchRequests } = useMaintenanceStore();
  const [terminating, setTerminating] = useState(false);
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  // Find all leases for this tenant (there should be one active)
  const tenantLease: TenantWithLease | undefined = tenants.find(
    (t) => t.tenant.id === tenantId
  );

  useEffect(() => { fetchRequests(); }, []);

  if (!tenantLease) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Tenant not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile = tenantLease.tenant.profile;
  const openRequests = requests.filter(
    (r) => r.unit_id === tenantLease.unit_id && r.status !== 'resolved'
  );

  async function handleViewDoc(docId: string) {
    setOpeningDoc(docId);
    try {
      const { signedUrl } = await getSignedUrl(docId);
      await WebBrowser.openBrowserAsync(signedUrl);
    } catch (e: any) {
      showAlert('Could not open document', e?.message ?? 'Unknown error');
    } finally {
      setOpeningDoc(null);
    }
  }

  function handleEndLease() {
    showConfirm(
      `End lease for ${tenantLease!.tenant.full_name}?`,
      'This will mark the lease as terminated. This action cannot be undone.',
      async () => {
        setTerminating(true);
        const err = await terminateLease(tenantLease!.id);
        setTerminating(false);
        if (err) {
          showAlert('Failed to end lease', err);
        } else {
          router.back();
        }
      },
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tenantLease.tenant.full_name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Contact card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Contact</Text>
          <Text style={styles.rowValue}>{tenantLease.tenant.full_name}</Text>
          <Text style={styles.rowSub}>{tenantLease.tenant.email}</Text>
          {profile?.phone ? (
            <View style={[styles.metaRow, { marginTop: 8 }]}>
              <Phone size={14} color={colors.gray[400]} />
              <Text style={styles.rowSub}>{profile.phone}</Text>
            </View>
          ) : null}
          {profile?.emergency_contact_name ? (
            <View style={{ marginTop: 12 }}>
              <View style={styles.metaRow}>
                <AlertCircle size={14} color={colors.gray[400]} />
                <Text style={styles.metaLabel}>Emergency Contact</Text>
              </View>
              <Text style={styles.rowValue}>{profile.emergency_contact_name}</Text>
              {profile.emergency_contact_relation ? (
                <Text style={styles.rowSub}>{profile.emergency_contact_relation}</Text>
              ) : null}
              {profile.emergency_contact_phone ? (
                <Text style={styles.rowSub}>{profile.emergency_contact_phone}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Lease card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Lease</Text>
          <Text style={styles.rowValue}>
            {tenantLease.unit?.property?.nickname ?? tenantLease.unit?.property?.address}
            {tenantLease.unit?.unit_number ? ` · Unit ${tenantLease.unit.unit_number}` : ''}
          </Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Start</Text>
            <Text style={styles.rowValue}>{formatDate(tenantLease.start_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>End</Text>
            <Text style={styles.rowValue}>{formatDate(tenantLease.end_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Rent</Text>
            <Text style={styles.rowValue}>{formatCents(tenantLease.rent_amount)}/mo</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Deposit</Text>
            <Text style={styles.rowValue}>{formatCents(tenantLease.deposit_amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <View style={[styles.badge, { backgroundColor: colors.green[100] }]}>
              <Text style={[styles.badgeText, { color: colors.green[700] }]}>{tenantLease.status}</Text>
            </View>
          </View>
        </View>

        {/* Vehicles & Pets */}
        {((profile?.vehicles?.length ?? 0) > 0 || (profile?.pets?.length ?? 0) > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Vehicles & Pets</Text>
            {(profile?.vehicles ?? []).map((v, i) => (
              <View key={i} style={styles.metaRow}>
                <Car size={14} color={colors.gray[400]} />
                <Text style={styles.rowSub}>
                  {v.year} {v.color} {v.make} {v.model} · {v.plate}
                </Text>
              </View>
            ))}
            {(profile?.pets ?? []).map((p, i) => (
              <View key={i} style={styles.metaRow}>
                <PawPrint size={14} color={colors.gray[400]} />
                <Text style={styles.rowSub}>
                  {p.name} ({p.breed}) · {p.weight_lbs} lbs
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent payments */}
        {tenantLease.recentPayment && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Recent Payment</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{formatDate(tenantLease.recentPayment.due_date)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.rowValue}>{formatCents(tenantLease.recentPayment.amount)}</Text>
                <View style={[styles.badge, { backgroundColor: paymentBadgeStyle(tenantLease.recentPayment.status).bg }]}>
                  <Text style={[styles.badgeText, { color: paymentBadgeStyle(tenantLease.recentPayment.status).fg }]}>
                    {tenantLease.recentPayment.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Open maintenance */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(landlord)/maintenance' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Open Maintenance</Text>
            <View style={[styles.badge, { backgroundColor: openRequests.length > 0 ? colors.orange[100] : colors.gray[100] }]}>
              <Text style={[styles.badgeText, { color: openRequests.length > 0 ? colors.orange[700] : colors.gray[500] }]}>
                {openRequests.length}
              </Text>
            </View>
          </View>
          <Text style={styles.rowSub}>
            {openRequests.length > 0
              ? `${openRequests.length} open request${openRequests.length > 1 ? 's' : ''} — tap to view`
              : 'No open requests'}
          </Text>
        </TouchableOpacity>

        {/* Documents */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Documents</Text>
          </View>
          <Text style={styles.rowSub}>
            Upload documents for this tenant from the Supabase dashboard. Documents will appear in their tenant Documents tab.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(landlord)/messages/${tenantLease.id}` as any)}
          >
            <MessageSquare size={18} color={colors.brand[600]} />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger, terminating && { opacity: 0.5 }]}
            onPress={terminating ? undefined : handleEndLease}
          >
            {terminating
              ? <ActivityIndicator size="small" color={colors.red[600]} />
              : <XCircle size={18} color={colors.red[600]} />
            }
            <Text style={[styles.actionBtnText, { color: colors.red[600] }]}>
              {terminating ? 'Ending…' : 'End Lease'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.gray[50] },
  notFound:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText:  { color: colors.gray[400] },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  backBtn:       { padding: 4 },
  headerTitle:   { flex: 1, fontSize: text.heading, fontWeight: '700', color: colors.gray[900] },
  scroll:        { padding: 20, paddingBottom: 48 },
  card:          { ...cardBase, ...shadow.sm, padding: spacing.cardPad, marginBottom: spacing.cardGap },
  sectionLabel:  { fontWeight: '600', color: colors.gray[700], fontSize: text.secondary, marginBottom: 10 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowLabel:      { color: colors.gray[500], fontSize: text.body },
  rowValue:      { fontWeight: '500', color: colors.gray[900], fontSize: text.body },
  rowSub:        { color: colors.gray[500], fontSize: text.secondary },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaLabel:     { fontSize: text.caption, color: colors.gray[400] },
  divider:       { height: 1, backgroundColor: colors.gray[100], marginVertical: 10 },
  badge:         { borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:     { fontSize: text.caption, fontWeight: '600' },
  actionsRow:    { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.brand[100], backgroundColor: colors.brand[50] },
  actionBtnDanger: { borderColor: colors.red[100], backgroundColor: colors.red[50] },
  actionBtnText: { color: colors.brand[600], fontWeight: '600', fontSize: text.body },
});
