import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePropertiesStore } from '../../../store/properties';
import { formatCents } from '../../../lib/utils';
import { colors, text, radius, shadow, spacing, cardBase, headerBase } from '../../../lib/theme';

export default function FinancialsScreen() {
  const router = useRouter();
  const { properties, fetchProperties } = usePropertiesStore();
  const { width } = useWindowDimensions();

  useEffect(() => { fetchProperties(); }, []);

  const totalMonthlyRent = properties.reduce((sum, p) => sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0);
  const totalMonthlyExpenses = properties.reduce((sum, p) =>
    sum + (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12), 0
  );
  const monthlyNOI = totalMonthlyRent - totalMonthlyExpenses;

  const isWide = width >= 768;
  const hPad = isWide ? 24 : 20;
  const gap = 16;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.pageHeader, { paddingHorizontal: hPad }]}>
        <Text style={styles.pageTitle}>Financials</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: hPad, gap: gap }}>
        {/* Portfolio summary — always full width */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portfolio Monthly</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gross rent</Text>
            <Text style={styles.rowValue}>{formatCents(totalMonthlyRent)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Expenses (est.)</Text>
            <Text style={[styles.rowValue, { color: colors.red[500] }]}>-{formatCents(totalMonthlyExpenses)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabelBold}>Net operating income</Text>
            <Text style={[styles.noiValue, { color: monthlyNOI >= 0 ? colors.brand[600] : colors.red[600] }]}>
              {formatCents(monthlyNOI)}
            </Text>
          </View>
        </View>

        {/* Per-property cards — 2-column grid on wide */}
        <View style={isWide ? [styles.grid, { gap }] : undefined}>
          {properties.map((p) => {
            const rent = p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0;
            const expenses = (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12);
            const noi = rent - expenses;

            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.card, isWide && { width: colW }]}
                onPress={() => router.push(`/(landlord)/properties/${p.id}` as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardTitle}>{p.nickname ?? p.address}</Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Monthly rent</Text>
                  <Text style={styles.rowValue}>{formatCents(rent)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Monthly expenses</Text>
                  <Text style={[styles.rowValue, { color: colors.red[500] }]}>-{formatCents(expenses)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Monthly NOI</Text>
                  <Text style={[styles.rowValue, { fontWeight: '600', color: noi >= 0 ? colors.brand[600] : colors.red[600] }]}>{formatCents(noi)}</Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.hint}>Annual NOI: {formatCents(noi * 12)}</Text>
                {p.mortgage ? <Text style={styles.hint}>Cap rate requires property value — ask Tend AI</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.gray[50] },
  pageHeader:   { ...headerBase },
  pageTitle:    { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  card:         { ...cardBase, ...shadow.sm, padding: spacing.cardPad },
  cardTitle:    { fontWeight: '600', color: colors.gray[700], fontSize: text.body, marginBottom: 16 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel:     { color: colors.gray[500], fontSize: text.body },
  rowLabelBold: { fontWeight: '600', color: colors.gray[900], fontSize: text.body },
  rowValue:     { fontWeight: '500', color: colors.gray[900], fontSize: text.body },
  noiValue:     { fontWeight: '700', fontSize: text.subheading },
  divider:      { height: 1, backgroundColor: colors.gray[100], marginVertical: 12 },
  hint:         { color: colors.gray[400], fontSize: text.caption, marginTop: 2 },
});
