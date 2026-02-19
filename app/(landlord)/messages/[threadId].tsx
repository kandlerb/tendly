import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { KeyboardView } from '../../../components/ui/KeyboardView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Send, Sparkles } from 'lucide-react-native';
import { useMessagesStore } from '../../../store/messages';
import { useAuthStore } from '../../../store/auth';
import { colors, text, radius } from '../../../lib/theme';

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
    if (threadMessages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [threadMessages.length]);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    const text = body;
    setBody('');
    await sendMessage(threadId, text);
    setSending(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardView style={styles.flex}>
        <FlatList
          ref={listRef}
          data={threadMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                {item.ai_drafted && (
                  <View style={styles.aiTag}>
                    <Sparkles size={10} color={colors.brand[600]} />
                    <Text style={styles.aiTagText}>AI drafted</Text>
                  </View>
                )}
                <View style={[styles.bubbleInner, isMe ? styles.bubbleInnerMe : styles.bubbleInnerThem]}>
                  <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.body}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Message..." value={body} onChangeText={setBody} multiline />
          <TouchableOpacity style={[styles.sendBtn, (sending || !body.trim()) && { opacity: 0.5 }]} onPress={handleSend}>
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  flex: { flex: 1 },
  bubble: { marginBottom: 12, maxWidth: 280 },
  bubbleMe: { alignSelf: 'flex-end' },
  bubbleThem: { alignSelf: 'flex-start' },
  aiTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aiTagText: { color: colors.brand[600], fontSize: text.caption, marginLeft: 4 },
  bubbleInner: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius['2xl'] },
  bubbleInnerMe: { backgroundColor: colors.brand[600] },
  bubbleInnerThem: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[100] },
  bubbleTextMe: { color: colors.white, fontSize: text.body },
  bubbleTextThem: { color: colors.gray[900], fontSize: text.body },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  input: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius['2xl'], paddingHorizontal: 16, paddingVertical: 12, fontSize: text.body, maxHeight: 128 },
  sendBtn: { backgroundColor: colors.brand[600], width: 44, height: 44, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
});
