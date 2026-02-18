import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Send, Sparkles } from 'lucide-react-native';
import { useMessagesStore } from '../../../store/messages';
import { useAuthStore } from '../../../store/auth';

export default function MessageThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user } = useAuthStore();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useMessagesStore();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const threadMessages = messages[threadId] ?? [];

  useEffect(() => {
    fetchMessages(threadId);
    const unsubscribe = subscribeToMessages(threadId);
    return unsubscribe;
  }, [threadId]);

  useEffect(() => {
    if (threadMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [threadMessages.length]);

  async function handleSend(text: string, aiDrafted = false) {
    if (!text.trim()) return;
    setSending(true);
    setBody('');
    await sendMessage(threadId, text, aiDrafted);
    setSending(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={listRef}
          data={threadMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View className={`mb-3 max-w-xs ${isMe ? 'self-end' : 'self-start'}`}>
                {item.ai_drafted && (
                  <View className="flex-row items-center mb-1">
                    <Sparkles size={10} color="#16a34a" />
                    <Text className="text-brand-600 text-xs ml-1">AI drafted</Text>
                  </View>
                )}
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
            placeholder="Message..."
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity
            className="bg-brand-600 w-11 h-11 rounded-xl items-center justify-center"
            onPress={() => handleSend(body)}
            disabled={sending || !body.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
