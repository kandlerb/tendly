import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KeyboardView } from '../../components/ui/KeyboardView';
import { showAlert } from '../../lib/alert';
import { colors, text, radius, shadow } from '../../lib/theme';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  async function handleSignup() {
    if (!fullName || !email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'landlord', full_name: fullName } },
    });
    setLoading(false);
    if (error) showAlert('Signup failed', error.message);
    else showAlert('Check your email', 'Click the confirmation link to activate your account.');
  }

  return (
    <KeyboardView style={[styles.flex, isWide && styles.flexWide]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={isWide ? styles.contentWide : styles.contentNarrow}
      >
        <View style={isWide ? styles.card : styles.cardNarrow}>
          <Text style={styles.title}>Get started</Text>
          <Text style={styles.subtitle}>Create your landlord account — free forever for 2 units</Text>

          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Smith" />
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="8+ characters" />

          <Button title="Create Account" onPress={handleSignup} loading={loading} />

          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
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
  contentNarrow: { paddingTop: 100, paddingHorizontal: 24 },
  contentWide:   { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  cardNarrow:    {},
  card:          { width: 440, backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 48, borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  title:         { fontSize: text['3xl'], fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  subtitle:      { fontSize: text.base, color: colors.gray[500], marginBottom: 40 },
  linkRow:       { alignItems: 'center', marginTop: 24 },
  link:          { fontSize: text.sm, color: colors.gray[500] },
  linkBold:      { color: colors.brand[600], fontWeight: '600' },
});
