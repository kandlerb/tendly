import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePropertiesStore } from '../../../store/properties';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { dollarsToCents } from '../../../lib/utils';

export default function AddPropertyScreen() {
  const router = useRouter();
  const { addProperty, addUnit } = usePropertiesStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [mortgage, setMortgage] = useState('');
  const [unitCount, setUnitCount] = useState('1');
  const [rentAmount, setRentAmount] = useState('');

  async function handleSave() {
    if (!address) { Alert.alert('Address required'); return; }
    setLoading(true);

    const property = await addProperty({
      address,
      nickname: nickname || null,
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
      router.back();
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Add Property</Text>
        <Input label="Street address" value={address} onChangeText={setAddress} placeholder="123 Main St, Austin TX 78701" />
        <Input label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="The duplex" />
        <Input label="Monthly mortgage ($)" value={mortgage} onChangeText={setMortgage} keyboardType="decimal-pad" placeholder="1500" />
        <Input label="Number of units" value={unitCount} onChangeText={setUnitCount} keyboardType="number-pad" placeholder="1" />
        <Input label="Monthly rent per unit ($)" value={rentAmount} onChangeText={setRentAmount} keyboardType="decimal-pad" placeholder="1200" />
        <Button title="Save Property" onPress={handleSave} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}
