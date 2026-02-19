import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Building2, Trash2 } from 'lucide-react-native';
import { usePropertiesStore } from '../../../../store/properties';
import { formatCents } from '../../../../lib/utils';
import { showAlert, showConfirm } from '../../../../lib/alert';
import { colors, text, radius, shadow } from '../../../../lib/theme';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { properties, checkDeleteProperty, deleteProperty } = usePropertiesStore();
  const property = properties.find((p) => p.id === id);
  const [deleting, setDeleting] = useState(false);

  if (!property) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Property not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalRent = property.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0;
  const monthlyExpenses =
    (property.mortgage ?? 0) +
    Math.round((property.insurance ?? 0) / 12) +
    Math.round((property.tax_annual ?? 0) / 12);
  const noi = totalRent - monthlyExpenses;

  async function handleDeletePress() {
    setDeleting(true);
    const blockingError = await checkDeleteProperty(property!.id);
    setDeleting(false);

    if (blockingError) {
      showAlert('Cannot delete property', blockingError);
      return;
    }

    const name = property!.nickname ?? property!.address;
    showConfirm(
      `Delete "${name}"?`,
      'This permanently removes all units, maintenance history, and past lease records. This cannot be undone.',
      async () => {
        setDeleting(true);
        const err = await deleteProperty(property!.id);
        setDeleting(false);
        if (err) {
          showAlert('Delete failed', err);
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
          {property.nickname ?? property.address}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Address card */}
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <View style={styles.iconBox}>
              <Building2 size={22} color={colors.brand[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{property.nickname ?? property.address}</Text>
              {property.nickname ? (
                <Text style={styles.cardSub}>{property.address}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Financials */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Monthly financials</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gross rent</Text>
            <Text style={styles.rowValue}>{formatCents(totalRent)}</Text>
          </View>
          {property.mortgage ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Mortgage</Text>
              <Text style={[styles.rowValue, { color: colors.red[500] }]}>
                -{formatCents(property.mortgage)}
              </Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { fontWeight: '600', color: colors.gray[900] }]}>NOI</Text>
            <Text style={[styles.rowValue, { fontWeight: '700', color: noi >= 0 ? colors.brand[600] : colors.red[600] }]}>
              {formatCents(noi)}
            </Text>
          </View>
        </View>

        {/* Units */}
        <Text style={styles.sectionHeader}>Units ({property.units?.length ?? 0})</Text>
        {(property.units ?? []).map((unit) => (
          <View key={unit.id} style={styles.unitCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.unitNumber}>Unit {unit.unit_number}</Text>
              <Text style={styles.unitDetail}>
                {unit.bedrooms} bd · {unit.bathrooms} ba
              </Text>
            </View>
            <Text style={styles.unitRent}>{formatCents(unit.rent_amount)}/mo</Text>
          </View>
        ))}

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && { opacity: 0.5 }]}
          onPress={deleting ? undefined : handleDeletePress}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.red[600]} />
          ) : (
            <Trash2 size={16} color={colors.red[600]} />
          )}
          <Text style={styles.deleteBtnText}>
            {deleting ? 'Checking…' : 'Delete Property'}
          </Text>
        </TouchableOpacity>
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
  headerTitle:   { flex: 1, fontSize: text.xl, fontWeight: '700', color: colors.gray[900] },
  scroll:        { padding: 20, paddingBottom: 40 },
  card:          { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  iconRow:       { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox:       { width: 48, height: 48, backgroundColor: colors.brand[50], borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  cardTitle:     { fontWeight: '600', color: colors.gray[900], fontSize: text.base },
  cardSub:       { color: colors.gray[500], fontSize: text.sm, marginTop: 2 },
  sectionLabel:  { fontWeight: '600', color: colors.gray[700], fontSize: text.sm, marginBottom: 14 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel:      { color: colors.gray[500], fontSize: text.base },
  rowValue:      { fontWeight: '500', color: colors.gray[900], fontSize: text.base },
  divider:       { height: 1, backgroundColor: colors.gray[100], marginVertical: 10 },
  sectionHeader: { fontSize: text.base, fontWeight: '600', color: colors.gray[700], marginBottom: 12 },
  unitCard:      { backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  unitNumber:    { fontWeight: '600', color: colors.gray[900], fontSize: text.base },
  unitDetail:    { color: colors.gray[500], fontSize: text.sm, marginTop: 2 },
  unitRent:      { fontWeight: '600', color: colors.brand[600], fontSize: text.base },
  deleteBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 14, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.red[100], backgroundColor: colors.red[50] },
  deleteBtnText: { color: colors.red[600], fontWeight: '600', fontSize: text.base },
});
