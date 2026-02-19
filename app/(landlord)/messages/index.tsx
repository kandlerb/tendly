import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useMessagesStore } from '../../../store/messages';

export default function MessagesScreen() {
  const router = useRouter();
  const { threads, loadingThreads, fetchThreads } = useMessagesStore();

  useEffect(() => { fetchThreads(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
      </View>

      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 shadow-sm"
            onPress={() => router.push(`/(landlord)/messages/${item.id}` as any)}
          >
            <View className="w-11 h-11 bg-brand-50 rounded-xl items-center justify-center mr-3">
              <MessageSquare size={20} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{(item as any).tenant?.full_name}</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                {(item as any).unit?.property?.nickname ?? (item as any).unit?.property?.address} · Unit {(item as any).unit?.unit_number}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loadingThreads ? (
            <View className="items-center py-16">
              <Text className="text-gray-400 text-base">No active leases</Text>
              <Text className="text-gray-300 text-sm mt-1">Messages appear when tenants have active leases</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
