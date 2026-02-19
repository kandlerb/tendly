import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardView } from '../../components/ui/KeyboardView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMessagesStore } from '../../store/messages';
import { useAuthStore } from '../../store/auth';

export default function TenantMessagesScreen() {
  const { user } = useAuthStore();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useMessagesStore();
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    async function loadLease() {
      const { data } = await supabase
        .from('leases')
        .select('id')
        .eq('tenant_id', user!.id)
        .eq('status', 'active')
        .single();
      if (data) {
        setLeaseId(data.id);
        fetchMessages(data.id);
        return subscribeToMessages(data.id);
      }
    }
    if (user) {
      const cleanup = loadLease();
      return () => { cleanup.then((fn) => fn?.()); };
    }
  }, [user]);

  const threadMessages = leaseId ? (messages[leaseId] ?? []) : [];

  useEffect(() => {
    if (threadMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [threadMessages.length]);

  async function handleSend() {
    if (!body.trim() || !leaseId) return;
    setSending(true);
    const text = body;
    setBody('');
    await sendMessage(leaseId, text);
    setSending(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Messages</Text>
      </View>

      <KeyboardView style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={threadMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-gray-400">No messages yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View className={`mb-3 max-w-xs ${isMe ? 'self-end' : 'self-start'}`}>
                <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-brand-600' : 'bg-white border border-gray-100'}`}>
                  <Text className={isMe ? 'text-white' : 'text-gray-900'}>{item.body}</Text>
                </View>
              </View>
            );
          }}
        />

        <View className="px-4 pb-4 flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-base max-h-32"
            placeholder="Message your landlord..."
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity
            className="bg-brand-600 w-11 h-11 rounded-xl items-center justify-center"
            onPress={handleSend}
            disabled={sending || !body.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}
