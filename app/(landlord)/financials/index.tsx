import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePropertiesStore } from '../../../store/properties';
import { formatCents } from '../../../lib/utils';

export default function FinancialsScreen() {
  const { properties, fetchProperties } = usePropertiesStore();

  useEffect(() => { fetchProperties(); }, []);

  const totalMonthlyRent = properties.reduce((sum, p) =>
    sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0
  );
  const totalMonthlyExpenses = properties.reduce((sum, p) =>
    sum + (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12), 0
  );
  const monthlyNOI = totalMonthlyRent - totalMonthlyExpenses;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">Financials</Text>

        {/* Portfolio summary */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
          <Text className="font-semibold text-gray-700 mb-4">Portfolio Monthly</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Gross rent</Text>
            <Text className="font-medium text-gray-900">{formatCents(totalMonthlyRent)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Expenses (est.)</Text>
            <Text className="font-medium text-red-500">-{formatCents(totalMonthlyExpenses)}</Text>
          </View>
          <View className="h-px bg-gray-100 my-3" />
          <View className="flex-row justify-between">
            <Text className="font-semibold text-gray-900">Net operating income</Text>
            <Text className={`font-bold text-lg ${monthlyNOI >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
              {formatCents(monthlyNOI)}
            </Text>
          </View>
        </View>

        {/* Per-property breakdown */}
        {properties.map((p) => {
          const rent = p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0;
          const expenses = (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12);
          const noi = rent - expenses;
          const annualNOI = noi * 12;

          return (
            <View key={p.id} className="bg-white rounded-2xl p-5 mb-3 border border-gray-100 shadow-sm">
              <Text className="font-semibold text-gray-900 mb-4">{p.nickname ?? p.address}</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Monthly rent</Text>
                <Text className="font-medium">{formatCents(rent)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Monthly expenses</Text>
                <Text className="font-medium text-red-500">-{formatCents(expenses)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Monthly NOI</Text>
                <Text className={`font-semibold ${noi >= 0 ? 'text-brand-600' : 'text-red-600'}`}>{formatCents(noi)}</Text>
              </View>
              <View className="h-px bg-gray-100 my-2" />
              <Text className="text-gray-400 text-xs">Annual NOI: {formatCents(annualNOI)}</Text>
              {p.mortgage && (
                <Text className="text-gray-400 text-xs mt-1">
                  Cap rate requires property value — ask Tend AI to calculate
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
