import { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { usePropertiesStore } from '../../store/properties';
import { useAuthStore } from '../../store/auth';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

export default function TendScreen() {
  const { user } = useAuthStore();
  const { properties } = usePropertiesStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm Tend, your property management assistant. Ask me about rent, maintenance, tenant law, or anything landlord-related." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const portfolioContext = `Landlord: ${user?.full_name}. Properties: ${
    properties.map((p) => `${p.nickname ?? p.address} (${p.units?.length ?? 0} units)`).join(', ')
  }`;

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('tend', {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          portfolioContext,
        },
      });
      if (!error && data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }]);
    }
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3 border-b border-gray-100 bg-white">
        <Text className="text-xl font-bold text-gray-900">Tend AI</Text>
        <Text className="text-gray-400 text-xs mt-0.5">Not legal advice · Always verify with a local attorney</Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className={`mb-4 max-w-sm ${item.role === 'user' ? 'self-end' : 'self-start'}`}>
              <View className={`px-4 py-3 rounded-2xl ${item.role === 'user' ? 'bg-brand-600' : 'bg-white border border-gray-100'}`}>
                <Text className={item.role === 'user' ? 'text-white' : 'text-gray-800'}>{item.content}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={loading ? <ActivityIndicator color="#16a34a" className="mt-2" /> : null}
        />

        <View className="px-4 pb-4 flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-base max-h-32"
            placeholder="Ask Tend anything..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            className="bg-brand-600 w-11 h-11 rounded-xl items-center justify-center"
            onPress={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
