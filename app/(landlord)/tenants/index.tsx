import { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useWindowDimensions, Modal, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, X, Clock } from 'lucide-react-native';
import { useTenantsStore } from '../../../store/tenants';
import { usePropertiesStore } from '../../../store/properties';
import { inviteTenant } from '../../../lib/claude';
import { formatCents, formatDate } from '../../../lib/utils';
import { showAlert } from '../../../lib/alert';
import { colors, text, radius, shadow, spacing, cardBase, headerBase, breakpoints } from '../../../lib/theme';
import { ScreenFade } from '../../../components/ui/ScreenFade';
import type { TenantWithLease, TenantInvitation } from '../../../types';

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function leaseEndColor(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d > 60) return colors.green[700];
  if (d > 30) return colors.yellow[700];
  return colors.red[600];
}

function leaseEndBg(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d > 60) return colors.green[100];
  if (d > 30) return colors.yellow[100];
  return colors.red[100];
}

function initialsFor(name: string) {
  return name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}

function paymentBadgeStyle(status?: string) {
  if (status === 'paid') return { bg: colors.green[100], fg: colors.green[700] };
  if (status === 'late') return { bg: colors.red[100], fg: colors.red[700] };
  return { bg: colors.yellow[100], fg: colors.yellow[700] };
}

function TenantCard({ tenant, onPress }: { tenant: TenantWithLease; onPress: () => void }) {
  const address = tenant.unit?.property?.nickname ?? tenant.unit?.property?.address ?? '';
  const unitNum = tenant.unit?.unit_number ?? '';
  const endDate = tenant.end_date;
  const pmtStyle = paymentBadgeStyle(tenant.recentPayment?.status);
  const endColor = leaseEndColor(endDate);
  const endBg = leaseEndBg(endDate);
  const days = daysUntil(endDate);
  const name = tenant.tenant?.full_name ?? 'Tenant';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${address}${unitNum ? ` Unit ${unitNum}` : ''}, lease ${days > 0 ? `${days} days left` : 'expired'}`}
    >
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFor(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tenantName}>{name}</Text>
          <Text style={styles.tenantSub}>{address}{unitNum ? ` · Unit ${unitNum}` : ''}</Text>
        </View>
        {tenant.recentPayment && (
          <View style={[styles.badge, { backgroundColor: pmtStyle.bg }]}>
            <Text style={[styles.badgeText, { color: pmtStyle.fg }]}>
              {tenant.recentPayment.status}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.leaseRow}>
        <View style={[styles.leaseBadge, { backgroundColor: endBg }]}>
          <Text style={[styles.leaseText, { color: endColor }]}>
            {days > 0 ? `${days}d left` : 'Expired'}
          </Text>
        </View>
        <Text style={styles.leaseDates}>
          {formatDate(tenant.start_date)} – {formatDate(endDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function InvitationRow({ inv }: { inv: TenantInvitation }) {
  const daysLeft = daysUntil(inv.expires_at);
  return (
    <View style={styles.invRow}>
      <Clock size={14} color={colors.gray[400]} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.invEmail}>{inv.email}</Text>
        <Text style={styles.invSub}>Pending invite · expires in {daysLeft}d</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.yellow[100] }]}>
        <Text style={[styles.badgeText, { color: colors.yellow[700] }]}>Pending</Text>
      </View>
    </View>
  );
}

export default function TenantsScreen() {
  const router = useRouter();
  const { tenants, invitations, loading, fetchTenants, fetchInvitations } = useTenantsStore();
  const { properties, fetchProperties } = usePropertiesStore();
  const { width } = useWindowDimensions();

  const [modalVisible, setModalVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    unitId: '', email: '', rentAmount: '', depositAmount: '', startDate: '', endDate: '',
  });

  // Ref for the email input to allow autoFocus when modal opens
  const emailInputRef = useRef<TextInput>(null);

  const isWide = width >= breakpoints.md;
  const hPad = isWide ? spacing.pagePadWide : spacing.pagePad;
  const gap = spacing.cardGap;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;

  useEffect(() => {
    fetchTenants();
    fetchInvitations();
    fetchProperties();
  }, []);

  function openModal() {
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setForm({ unitId: '', email: '', rentAmount: '', depositAmount: '', startDate: '', endDate: '' });
  }

  async function handleInvite() {
    const { unitId, email, rentAmount, depositAmount, startDate, endDate } = form;
    if (!unitId) { showAlert('Select a unit', 'Tap one of the unit chips above the email field.'); return; }
    if (!email) { showAlert('Enter tenant email'); return; }
    if (!rentAmount) { showAlert('Enter monthly rent'); return; }
    if (!startDate) { showAlert('Enter lease start date (YYYY-MM-DD)'); return; }
    if (!endDate) { showAlert('Enter lease end date (YYYY-MM-DD)'); return; }
    setSending(true);
    try {
      await inviteTenant({
        unitId,
        email,
        rentAmount: Math.round(parseFloat(rentAmount) * 100),
        depositAmount: depositAmount ? Math.round(parseFloat(depositAmount) * 100) : 0,
        startDate,
        endDate,
      });
      showAlert('Invite sent', `An invitation email has been sent to ${email}.`);
      closeModal();
      fetchInvitations();
    } catch (e: any) {
      showAlert('Failed to send invite', e?.message ?? 'Unknown error');
    } finally {
      setSending(false);
    }
  }

  // All units from all properties
  const allUnits = properties.flatMap((p) =>
    (p.units ?? []).map((u) => ({ ...u, property: p }))
  );

  return (
    <ScreenFade>
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={styles.title}>Tenants</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openModal}
          accessibilityRole="button"
          accessibilityLabel="Invite tenant"
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        key={isWide ? '2col' : '1col'}
        data={tenants}
        keyExtractor={(t) => t.id}
        numColumns={isWide ? 2 : 1}
        columnWrapperStyle={isWide ? { gap } : undefined}
        contentContainerStyle={{ paddingHorizontal: hPad, paddingTop: 8, paddingBottom: hPad, gap }}
        ListHeaderComponent={
          invitations.length > 0 ? (
            <View style={styles.invSection}>
              <Text style={styles.invHeader}>Pending Invitations</Text>
              {invitations.map((inv) => (
                <InvitationRow key={inv.id} inv={inv} />
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={isWide ? { width: colW } : undefined}>
            <TenantCard
              tenant={item}
              onPress={() => router.push(`/(landlord)/tenants/${item.tenant.id}` as any)}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyMain}>No active tenants</Text>
              <Text style={styles.emptySub}>Invite a tenant using the + button above</Text>
            </View>
          ) : null
        }
      />

      {/* Invite Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onShow={() => emailInputRef.current?.focus()}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Tenant</Text>
            <TouchableOpacity
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close invite modal"
            >
              <X size={22} color={colors.gray[700]} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.fieldLabel}>Unit *</Text>
            {allUnits.length === 0 ? (
              <Text style={[styles.fieldLabel, { color: colors.red[500], marginBottom: 16 }]}>
                No units found — add a property with units first.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {allUnits.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.unitChip, form.unitId === u.id && styles.unitChipSelected]}
                      onPress={() => setForm((f) => ({ ...f, unitId: u.id }))}
                      accessibilityRole="button"
                      accessibilityLabel={`Select unit: ${(u.property as any).nickname ?? (u.property as any).address} ${u.unit_number}`}
                      accessibilityState={{ selected: form.unitId === u.id }}
                    >
                      <Text style={[styles.unitChipText, form.unitId === u.id && { color: colors.brand[600] }]}>
                        {(u.property as any).nickname ?? (u.property as any).address} · {u.unit_number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {allUnits.length > 0 && !form.unitId && (
              <Text style={[styles.fieldLabel, { color: colors.gray[400], marginTop: -10, marginBottom: 12 }]}>
                ↑ Tap a unit to select it
              </Text>
            )}

            <Text style={styles.fieldLabel}>Tenant Email *</Text>
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="tenant@example.com"
              placeholderTextColor={colors.gray[300]}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Tenant email address"
            />

            <Text style={styles.fieldLabel}>Monthly Rent ($) *</Text>
            <TextInput
              style={styles.input}
              value={form.rentAmount}
              onChangeText={(v) => setForm((f) => ({ ...f, rentAmount: v }))}
              placeholder="1500"
              placeholderTextColor={colors.gray[300]}
              keyboardType="decimal-pad"
              accessibilityLabel="Monthly rent amount in dollars"
            />

            <Text style={styles.fieldLabel}>Security Deposit ($)</Text>
            <TextInput
              style={styles.input}
              value={form.depositAmount}
              onChangeText={(v) => setForm((f) => ({ ...f, depositAmount: v }))}
              placeholder="1500"
              placeholderTextColor={colors.gray[300]}
              keyboardType="decimal-pad"
              accessibilityLabel="Security deposit amount in dollars"
            />

            <Text style={styles.fieldLabel}>Lease Start Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.startDate}
              onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
              placeholder="2026-03-01"
              placeholderTextColor={colors.gray[300]}
              accessibilityLabel="Lease start date in YYYY-MM-DD format"
            />

            <Text style={styles.fieldLabel}>Lease End Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.endDate}
              onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
              placeholder="2027-02-28"
              placeholderTextColor={colors.gray[300]}
              accessibilityLabel="Lease end date in YYYY-MM-DD format"
            />

            <TouchableOpacity
              style={[styles.sendBtn, sending && { opacity: 0.6 }]}
              onPress={sending ? undefined : handleInvite}
              accessibilityRole="button"
              accessibilityLabel="Send invitation"
              accessibilityState={{ disabled: sending }}
            >
              {sending
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Text style={styles.sendBtnText}>Send Invitation</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.gray[50] },
  header:           { ...headerBase, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:            { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  addBtn:           { backgroundColor: colors.brand[600], borderRadius: radius.xl, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty:            { alignItems: 'center', paddingVertical: 64 },
  emptyMain:        { color: colors.gray[400], fontSize: text.body },
  emptySub:         { color: colors.gray[300], fontSize: text.secondary, marginTop: 4 },

  // Tenant card
  card:             { ...cardBase, ...shadow.sm, padding: spacing.cardPad, marginBottom: 0 },
  cardRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar:           { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand[100], alignItems: 'center', justifyContent: 'center' },
  avatarText:       { color: colors.brand[700], fontWeight: '700', fontSize: text.body },
  tenantName:       { fontWeight: '600', color: colors.gray[900], fontSize: text.body },
  tenantSub:        { color: colors.gray[500], fontSize: text.secondary, marginTop: 2 },
  leaseRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaseBadge:       { borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 3 },
  leaseText:        { fontSize: text.caption, fontWeight: '600' },
  leaseDates:       { fontSize: text.caption, color: colors.gray[400] },
  badge:            { borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:        { fontSize: text.caption, fontWeight: '600' },

  // Pending invitations
  invSection:       { ...cardBase, ...shadow.sm, padding: spacing.cardPad, marginBottom: spacing.cardGap },
  invHeader:        { fontSize: text.secondary, fontWeight: '600', color: colors.gray[700], marginBottom: 10 },
  invRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  invEmail:         { fontWeight: '500', color: colors.gray[800], fontSize: text.secondary },
  invSub:           { color: colors.gray[400], fontSize: text.caption, marginTop: 2 },

  // Modal
  modalSafe:        { flex: 1, backgroundColor: colors.white },
  modalHeader:      { ...headerBase, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  modalTitle:       { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  modalBody:        { padding: 20, paddingBottom: 60 },
  fieldLabel:       { fontSize: text.secondary, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input:            { ...cardBase, borderColor: colors.gray[200], padding: 14, fontSize: text.body, color: colors.gray[900], marginBottom: 16, minHeight: 48 },
  unitChip:         { borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.gray[50], minHeight: 48, justifyContent: 'center' },
  unitChipSelected: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  unitChipText:     { fontSize: text.secondary, color: colors.gray[700] },
  sendBtn:          { backgroundColor: colors.brand[600], borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center', marginTop: 8, minHeight: 48 },
  sendBtnText:      { color: colors.white, fontWeight: '700', fontSize: text.body },
});
