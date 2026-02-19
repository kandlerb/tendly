import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePropertiesStore } from '../../../store/properties';
import { formatCents } from '../../../lib/utils';
import { colors, text, radius, shadow } from '../../../lib/theme';

export default function FinancialsScreen() {
  const { properties, fetchProperties } = usePropertiesStore();

  useEffect(() => { fetchProperties(); }, []);

  const totalMonthlyRent = properties.reduce((sum, p) => sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0);
  const totalMonthlyExpenses = properties.reduce((sum, p) =>
    sum + (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12), 0
  );
  const monthlyNOI = totalMonthlyRent - totalMonthlyExpenses;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Financials</Text>

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

        {properties.map((p) => {
          const rent = p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0;
          const expenses = (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12);
          const noi = rent - expenses;

          return (
            <View key={p.id} style={styles.card}>
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
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: 20 },
  pageTitle: { fontSize: text['2xl'], fontWeight: '700', color: colors.gray[900], marginBottom: 24 },
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  cardTitle: { fontWeight: '600', color: colors.gray[700], fontSize: text.base, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: colors.gray[500], fontSize: text.base },
  rowLabelBold: { fontWeight: '600', color: colors.gray[900], fontSize: text.base },
  rowValue: { fontWeight: '500', color: colors.gray[900], fontSize: text.base },
  noiValue: { fontWeight: '700', fontSize: text.lg },
  divider: { height: 1, backgroundColor: colors.gray[100], marginVertical: 12 },
  hint: { color: colors.gray[400], fontSize: text.xs, marginTop: 2 },
});
