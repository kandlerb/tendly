import { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { KeyboardView } from '../../components/ui/KeyboardView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { usePropertiesStore } from '../../store/properties';
import { useAuthStore } from '../../store/auth';
import { colors, text, radius, headerBase } from '../../lib/theme';

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

  const portfolioContext = `Landlord: ${user?.full_name}. Properties: ${properties.map((p) => `${p.nickname ?? p.address} (${p.units?.length ?? 0} units)`).join(', ')}`;

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tend', {
        body: { messages: newMessages.map((m) => ({ role: m.role, content: m.content })), portfolioContext },
      });
      if (!error && data) setMessages((prev) => [...prev, { role: 'assistant', content: data }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }]);
    }
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tend AI</Text>
        <Text style={styles.headerSub}>Not legal advice · Always verify with a local attorney</Text>
      </View>
      <KeyboardView style={styles.flex}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleMe : styles.bubbleThem]}>
              <View style={[styles.bubbleInner, item.role === 'user' ? styles.bubbleInnerMe : styles.bubbleInnerThem]}>
                <Text style={item.role === 'user' ? styles.textMe : styles.textThem}>{item.content}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={loading ? <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 8 }} /> : null}
        />
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Ask Tend anything..." value={input} onChangeText={setInput} multiline />
          <TouchableOpacity style={[styles.sendBtn, (loading || !input.trim()) && { opacity: 0.5 }]} onPress={handleSend}>
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  header: { ...headerBase, paddingHorizontal: 20 },
  headerTitle: { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  headerSub: { fontSize: text.caption, color: colors.gray[400], marginTop: 2 },
  flex: { flex: 1 },
  bubble: { marginBottom: 16, maxWidth: 300 },
  bubbleMe: { alignSelf: 'flex-end' },
  bubbleThem: { alignSelf: 'flex-start' },
  bubbleInner: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius['2xl'] },
  bubbleInnerMe: { backgroundColor: colors.brand[600] },
  bubbleInnerThem: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[100] },
  textMe: { color: colors.white, fontSize: text.body },
  textThem: { color: colors.gray[800], fontSize: text.body },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  input: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius['2xl'], paddingHorizontal: 16, paddingVertical: 12, fontSize: text.body, maxHeight: 128 },
  sendBtn: { backgroundColor: colors.brand[600], width: 44, height: 44, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
});
