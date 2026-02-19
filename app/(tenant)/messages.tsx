import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { KeyboardView } from '../../components/ui/KeyboardView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useMessagesStore } from '../../store/messages';
import { useAuthStore } from '../../store/auth';
import { colors, text, radius, shadow, headerBase } from '../../lib/theme';

export default function TenantMessagesScreen() {
  const { user } = useAuthStore();
  const { messages, fetchMessages, sendMessage, subscribeToMessages, markAsRead } = useMessagesStore();
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

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
        markAsRead(data.id);
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
      if (leaseId) markAsRead(leaseId);
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <KeyboardView style={styles.flex}>
        <View style={isWide ? styles.chatContainerWide : styles.flex}>
          <FlatList
            ref={listRef}
            data={threadMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.sender_id === user?.id;
              return (
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <View style={[styles.bubbleInner, isMe ? styles.bubbleInnerMe : styles.bubbleInnerThem]}>
                    <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message your landlord..."
              value={body}
              onChangeText={setBody}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.gray[50] },
  flex:               { flex: 1 },
  header:             { ...headerBase, paddingHorizontal: 20 },
  headerTitle:        { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  chatContainerWide:  { flex: 1, maxWidth: 800, alignSelf: 'center', width: '100%' },
  messageList:        { padding: 16, gap: 8 },
  empty:              { alignItems: 'center', paddingVertical: 64 },
  emptyText:          { color: colors.gray[400] },
  bubble:             { maxWidth: '75%' },
  bubbleMe:           { alignSelf: 'flex-end' },
  bubbleThem:         { alignSelf: 'flex-start' },
  bubbleInner:        { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius['2xl'] },
  bubbleInnerMe:      { backgroundColor: colors.brand[600] },
  bubbleInnerThem:    { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  bubbleTextMe:       { color: colors.white, fontSize: text.body },
  bubbleTextThem:     { color: colors.gray[900], fontSize: text.body },
  inputRow:           { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  input:              { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius['2xl'], paddingHorizontal: 16, paddingVertical: 12, fontSize: text.body, maxHeight: 128 },
  sendBtn:            { backgroundColor: colors.brand[600], width: 44, height: 44, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled:    { opacity: 0.5 },
});
