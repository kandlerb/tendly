import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KeyboardView } from '../../components/ui/KeyboardView';
import { showAlert } from '../../lib/alert';
import { colors, text, radius, shadow, cardBase } from '../../lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) showAlert('Login failed', error.message);
  }

  return (
    <KeyboardView style={[styles.flex, isWide && styles.flexWide]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={isWide ? styles.contentWide : styles.contentNarrow}
      >
        <View style={isWide ? styles.card : styles.cardNarrow}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your properties</Text>

          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

          <Button title="Sign In" onPress={handleLogin} loading={loading} />

          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: colors.white },
  flexWide:      { backgroundColor: colors.gray[50] },
  scroll:        { flex: 1 },
  contentNarrow: { paddingTop: 120, paddingHorizontal: 24 },
  contentWide:   { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  cardNarrow:    {},
  card:          { ...cardBase, ...shadow.sm, width: 440, padding: 48 },
  title:         { fontSize: text.heroTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  subtitle:      { fontSize: text.body, color: colors.gray[500], marginBottom: 40 },
  linkRow:       { alignItems: 'center', marginTop: 24 },
  link:          { fontSize: text.secondary, color: colors.gray[500] },
  linkBold:      { color: colors.brand[600], fontWeight: '600' },
});
