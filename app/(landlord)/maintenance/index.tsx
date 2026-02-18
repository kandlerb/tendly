import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMaintenanceStore } from '../../../store/maintenance';
import { UrgencyBadge, StatusBadge } from '../../../components/domain/MaintenanceBadge';
import { formatDate } from '../../../lib/utils';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests } = useMaintenanceStore();

  useEffect(() => { fetchRequests(); }, []);

  const open = requests.filter((r) => r.status !== 'resolved');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Maintenance</Text>
        <Text className="text-gray-500 text-sm mt-1">{open.length} open {open.length === 1 ? 'request' : 'requests'}</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
            onPress={() => router.push(`/(landlord)/maintenance/${item.id}` as any)}
          >
            <View className="flex-row items-start justify-between mb-2">
              <Text className="font-semibold text-gray-900 flex-1 mr-2">{item.title}</Text>
              <UrgencyBadge urgency={item.urgency} />
            </View>
            <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{item.description}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">{item.tenant?.full_name} · Unit {item.unit?.unit_number}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text className="text-gray-300 text-xs mt-2">{formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-gray-400 text-base">No maintenance requests</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
