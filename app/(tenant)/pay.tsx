import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { formatCents, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import type { RentPayment } from '../../types';

export default function TenantPayScreen() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: lease } = await supabase
        .from('leases')
        .select('id')
        .eq('tenant_id', user!.id)
        .eq('status', 'active')
        .single();

      if (lease) {
        const { data } = await supabase
          .from('rent_payments')
          .select('*')
          .eq('lease_id', lease.id)
          .order('due_date', { ascending: false });
        setPayments((data ?? []) as RentPayment[]);
      }
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  const pending = payments.filter((p) => p.status === 'pending' || p.status === 'late');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">Pay Rent</Text>

        {pending.length > 0 && (
          <View className="bg-brand-50 rounded-2xl p-5 mb-6 border border-brand-500/20">
            <Text className="text-sm text-brand-700 font-medium mb-1">Due {formatDate(pending[0].due_date)}</Text>
            <Text className="text-4xl font-bold text-brand-600 mb-4">{formatCents(pending[0].amount)}</Text>
            <Button title="Pay Now" onPress={() => {}} />
          </View>
        )}

        <Text className="text-lg font-semibold text-gray-900 mb-3">Payment history</Text>
        {payments.map((p) => (
          <View key={p.id} className="bg-white rounded-xl p-4 mb-2 flex-row justify-between border border-gray-100">
            <View>
              <Text className="font-medium text-gray-900">{formatCents(p.amount)}</Text>
              <Text className="text-gray-500 text-sm">{formatDate(p.due_date)}</Text>
            </View>
            <View className={`px-2.5 py-1 rounded-full self-center ${
              p.status === 'paid' ? 'bg-green-100' :
              p.status === 'late' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <Text className={`text-xs font-medium capitalize ${
                p.status === 'paid' ? 'text-green-700' :
                p.status === 'late' ? 'text-red-700' : 'text-yellow-700'
              }`}>{p.status}</Text>
            </View>
          </View>
        ))}

        {!loading && payments.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-gray-400">No payment records yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
