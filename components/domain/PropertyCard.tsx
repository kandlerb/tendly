import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { Property } from '../../types';

interface Props { property: Property; }

export function PropertyCard({ property }: Props) {
  const router = useRouter();
  const unitCount = property.units?.length ?? 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100"
      onPress={() => router.push(`/(landlord)/properties/${property.id}` as any)}
    >
      <View className="w-12 h-12 bg-brand-50 rounded-xl items-center justify-center mr-4">
        <Building2 size={22} color="#16a34a" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base">
          {property.nickname ?? property.address}
        </Text>
        <Text className="text-gray-500 text-sm mt-0.5">
          {property.nickname ? property.address : ''} · {unitCount} {unitCount === 1 ? 'unit' : 'units'}
        </Text>
      </View>
      <ChevronRight size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}
