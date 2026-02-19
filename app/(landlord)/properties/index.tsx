import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { usePropertiesStore } from '../../../store/properties';
import { PropertyCard } from '../../../components/domain/PropertyCard';

export default function PropertiesScreen() {
  const router = useRouter();
  const { properties, loading, fetchProperties } = usePropertiesStore();

  useEffect(() => { fetchProperties(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Properties</Text>
        <TouchableOpacity
          className="bg-brand-600 rounded-xl w-9 h-9 items-center justify-center"
          onPress={() => router.push('/(landlord)/properties/add' as any)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-gray-400 text-base">No properties yet</Text>
              <Text className="text-gray-300 text-sm mt-1">Tap + to add your first property</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
