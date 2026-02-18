import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMaintenanceStore } from '../../../store/maintenance';
import { UrgencyBadge, StatusBadge } from '../../../components/domain/MaintenanceBadge';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import type { MaintenanceStatus } from '../../../types';

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { requests, updateRequest } = useMaintenanceStore();
  const [updating, setUpdating] = useState(false);

  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-400">Request not found</Text>
      </SafeAreaView>
    );
  }

  async function handleStatusChange(newStatus: MaintenanceStatus) {
    setUpdating(true);
    await updateRequest(id, { status: newStatus });
    setUpdating(false);
    Alert.alert('Updated', `Request marked as ${newStatus}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1" numberOfLines={1}>{request.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
          <View className="flex-row gap-2 mb-4">
            <UrgencyBadge urgency={request.urgency} />
            <StatusBadge status={request.status} />
          </View>

          <Text className="text-gray-700 mb-4">{request.description}</Text>

          <View className="border-t border-gray-100 pt-4">
            <Text className="text-xs text-gray-400 mb-1">Tenant</Text>
            <Text className="text-gray-800 font-medium">{request.tenant?.full_name}</Text>
            <Text className="text-gray-500 text-sm">{request.tenant?.email}</Text>
          </View>

          <View className="mt-3">
            <Text className="text-xs text-gray-400 mb-1">Property</Text>
            <Text className="text-gray-800">{request.unit?.property?.nickname ?? request.unit?.property?.address} · Unit {request.unit?.unit_number}</Text>
          </View>

          <View className="mt-3">
            <Text className="text-xs text-gray-400 mb-1">Submitted</Text>
            <Text className="text-gray-800">{formatDate(request.created_at)}</Text>
          </View>
        </View>

        {request.status === 'open' && (
          <Button title="Mark as Assigned" onPress={() => handleStatusChange('assigned')} loading={updating} variant="secondary" />
        )}
        {request.status !== 'resolved' && (
          <View className="mt-3">
            <Button title="Mark as Resolved" onPress={() => handleStatusChange('resolved')} loading={updating} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
