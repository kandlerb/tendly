import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { formatCents, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { colors, text, radius, shadow, spacing, cardBase, headerBase } from '../../lib/theme';
import { ScreenFade } from '../../components/ui/ScreenFade';
import type { RentPayment } from '../../types';

export default function TenantPayScreen() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    async function load() {
      const { data: lease } = await supabase
        .from('leases')
        .select('id')
        .eq('tenant_id', user!.id)
        .eq('status', 'active')
        .single();

      if (lease) {
        const { data } = await supabase
          .from('rent_payments')
          .select('*')
          .eq('lease_id', lease.id)
          .order('due_date', { ascending: false });
        setPayments((data ?? []) as RentPayment[]);
      }
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'late');
  const isWide = width >= 768;
  const hPad = isWide ? 24 : 20;
  const gap = 16;
  // Tenant has no sidebar, so full viewport width
  const colW = isWide ? (width - hPad * 2 - gap) / 2 : undefined;

  return (
    <ScreenFade>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.pageHeader, { paddingHorizontal: hPad }]}>
          <Text style={styles.pageTitle}>Pay Rent</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: hPad, gap }}>
          {pending.length > 0 && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingDue}>Due {formatDate(pending[0].due_date)}</Text>
              <Text style={styles.pendingAmount}>{formatCents(pending[0].amount)}</Text>
              <Button title="Pay Now" onPress={() => {}} />
            </View>
          )}

          <Text style={styles.sectionTitle}>Payment history</Text>

          <View style={isWide ? [styles.grid, { gap }] : undefined}>
            {payments.map((p) => (
              <View key={p.id} style={[styles.payRow, isWide && { width: colW }]}>
                <View>
                  <Text style={styles.payAmount}>{formatCents(p.amount)}</Text>
                  <Text style={styles.payDate}>{formatDate(p.due_date)}</Text>
                </View>
                <View style={[
                  styles.badge,
                  p.status === 'paid' ? styles.badgePaid :
                  p.status === 'late' ? styles.badgeLate : styles.badgePending,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    p.status === 'paid' ? styles.badgeTextPaid :
                    p.status === 'late' ? styles.badgeTextLate : styles.badgeTextPending,
                  ]}>{p.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {!loading && payments.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No payment records yet</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.gray[50] },
  pageHeader:      { ...headerBase },
  pageTitle:       { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  pendingCard:     { backgroundColor: colors.brand[50], borderRadius: radius['2xl'], padding: 20, borderWidth: 1, borderColor: colors.brand[100], gap: 12 },
  pendingDue:      { fontSize: text.secondary, color: colors.brand[700], fontWeight: '500' },
  pendingAmount:   { fontSize: text.display, fontWeight: '700', color: colors.brand[600] },
  sectionTitle:    { fontSize: text.subheading, fontWeight: '600', color: colors.gray[900] },
  grid:            { flexDirection: 'row', flexWrap: 'wrap' },
  payRow:          { ...cardBase, ...shadow.sm, padding: spacing.cardPad, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payAmount:       { fontWeight: '500', color: colors.gray[900], fontSize: text.body },
  payDate:         { color: colors.gray[500], fontSize: text.secondary, marginTop: 2 },
  badge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgePaid:       { backgroundColor: colors.green[100] },
  badgeLate:       { backgroundColor: colors.red[100] },
  badgePending:    { backgroundColor: colors.yellow[100] },
  badgeText:       { fontSize: text.caption, fontWeight: '500', textTransform: 'capitalize' },
  badgeTextPaid:   { color: colors.green[700] },
  badgeTextLate:   { color: colors.red[700] },
  badgeTextPending:{ color: colors.yellow[700] },
  empty:           { alignItems: 'center', paddingVertical: 32 },
  emptyText:       { color: colors.gray[400] },
});
