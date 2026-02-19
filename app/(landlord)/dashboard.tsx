import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { usePropertiesStore } from '../../store/properties';
import { useMaintenanceStore } from '../../store/maintenance';
import { formatCents } from '../../lib/utils';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { properties, fetchProperties } = usePropertiesStore();
  const { requests, fetchRequests } = useMaintenanceStore();

  useEffect(() => {
    fetchProperties();
    fetchRequests();
  }, []);

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const monthlyRent = properties.reduce((sum, p) =>
    sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0
  );
  const openRequests = requests.filter((r) => r.status !== 'resolved').length;
  const emergencies = requests.filter((r) => r.urgency === 'emergency' && r.status !== 'resolved').length;

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Hi, {firstName}</Text>
        <Text className="text-gray-500 mb-6">Here's your portfolio today</Text>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-3xl font-bold text-gray-900">{totalUnits}</Text>
            <Text className="text-gray-500 text-sm mt-1">Total units</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-3xl font-bold text-brand-600">{formatCents(monthlyRent)}</Text>
            <Text className="text-gray-500 text-sm mt-1">Monthly rent</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-3xl font-bold text-gray-900">{openRequests}</Text>
            <Text className="text-gray-500 text-sm mt-1">Open requests</Text>
          </View>
          {emergencies > 0 && (
            <View className="flex-1 bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm">
              <Text className="text-3xl font-bold text-red-600">{emergencies}</Text>
              <Text className="text-red-500 text-sm mt-1">Emergencies</Text>
            </View>
          )}
        </View>

        {/* Properties summary */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">Your properties</Text>
        {properties.map((p) => (
          <View key={p.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm">
            <Text className="font-semibold text-gray-900">{p.nickname ?? p.address}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{p.units?.length ?? 0} units</Text>
          </View>
        ))}

        {properties.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-gray-400">Add your first property to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
