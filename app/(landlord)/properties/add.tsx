import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePropertiesStore } from '../../../store/properties';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { dollarsToCents } from '../../../lib/utils';
import { showAlert } from '../../../lib/alert';
import { colors, text, radius } from '../../../lib/theme';

async function verifyAddress(street: string, city: string, state: string, zip: string): Promise<boolean> {
  try {
    const query = encodeURIComponent(`${street}, ${city}, ${state} ${zip}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
      { headers: { 'User-Agent': 'Tendly/1.0' } },
    );
    const results = await res.json();
    return Array.isArray(results) && results.length > 0;
  } catch {
    return true; // network failure — allow submission rather than block
  }
}

export default function AddPropertyScreen() {
  const router = useRouter();
  const { addProperty, addUnit, error } = usePropertiesStore();

  useEffect(() => {
    if (error) showAlert('Save failed', error);
  }, [error]);

  const [street, setStreet]       = useState('');
  const [city, setCity]           = useState('');
  const [state, setState]         = useState('');
  const [zip, setZip]             = useState('');
  const [nickname, setNickname]   = useState('');
  const [mortgage, setMortgage]   = useState('');
  const [unitCount, setUnitCount] = useState('1');
  const [rentAmount, setRentAmount] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving]       = useState(false);

  async function handleSave() {
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      showAlert('Address required', 'Please fill in all address fields.');
      return;
    }

    setValidating(true);
    const valid = await verifyAddress(street.trim(), city.trim(), state.trim(), zip.trim());
    setValidating(false);

    if (!valid) {
      showAlert('Address not found', 'We could not verify this address. Please check the details and try again.');
      return;
    }

    const fullAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}`;

    setSaving(true);
    const property = await addProperty({
      address: fullAddress,
      nickname: nickname.trim() || null,
      mortgage: mortgage ? dollarsToCents(mortgage) : null,
      insurance: null,
      tax_annual: null,
      landlord_id: '',
    });

    if (property) {
      const count = parseInt(unitCount) || 1;
      for (let i = 0; i < count; i++) {
        await addUnit(property.id, {
          property_id: property.id,
          unit_number: count === 1 ? '1' : String(i + 1),
          bedrooms: 1,
          bathrooms: 1,
          rent_amount: rentAmount ? dollarsToCents(rentAmount) : 0,
        });
      }
      router.replace('/(landlord)/properties' as any);
    }
    setSaving(false);
  }

  const busy = validating || saving;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add Property</Text>

        <Text style={styles.sectionLabel}>Address</Text>
        <Input label="Street address" value={street} onChangeText={setStreet} placeholder="123 Main St" />
        <View style={styles.row}>
          <View style={styles.cityField}>
            <Input label="City" value={city} onChangeText={setCity} placeholder="Austin" />
          </View>
          <View style={styles.stateField}>
            <Input label="State" value={state} onChangeText={setState} placeholder="TX" autoCapitalize="characters" />
          </View>
          <View style={styles.zipField}>
            <Input label="ZIP" value={zip} onChangeText={setZip} placeholder="78701" keyboardType="number-pad" />
          </View>
        </View>

        {validating && (
          <View style={styles.validatingRow}>
            <ActivityIndicator size="small" color={colors.brand[600]} />
            <Text style={styles.validatingText}>Verifying address…</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Details</Text>
        <Input label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="The duplex" />
        <Input label="Monthly mortgage ($)" value={mortgage} onChangeText={setMortgage} keyboardType="decimal-pad" placeholder="1500" />
        <Input label="Number of units" value={unitCount} onChangeText={setUnitCount} keyboardType="number-pad" placeholder="1" />
        <Input label="Monthly rent per unit ($)" value={rentAmount} onChangeText={setRentAmount} keyboardType="decimal-pad" placeholder="1200" />

        <Button title={validating ? 'Verifying…' : 'Save Property'} onPress={handleSave} loading={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.white },
  scroll:         { flex: 1, paddingHorizontal: 20 },
  content:        { paddingTop: 16, paddingBottom: 40 },
  title:          { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 24 },
  sectionLabel:   { fontSize: text.secondary, fontWeight: '600', color: colors.gray[500], marginBottom: 4, marginTop: 8 },
  row:            { flexDirection: 'row', gap: 8 },
  cityField:      { flex: 3 },
  stateField:     { flex: 1 },
  zipField:       { flex: 2 },
  validatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
  validatingText: { fontSize: text.secondary, color: colors.brand[600] },
});
