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

  async function handleForgotPassword() {
    if (!email) { showAlert('Enter your email above first'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showAlert('Error', error.message);
    else showAlert('Check your email', 'A password reset link has been sent.');
  }

  if (isWide) {
    return (
      <KeyboardView style={[styles.flex, styles.flexWide]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWide}>
          <Text style={styles.wordmarkWide}>Tendly</Text>
          <View style={[styles.card, shadow.sm]}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to manage your properties</Text>

            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={handleForgotPassword}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleLogin} loading={loading} />

            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardView>
    );
  }

  return (
    <KeyboardView style={styles.flex}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentNarrow}>
        <View style={styles.brandBlock}>
          <Text style={styles.wordmark}>Tendly</Text>
          <Text style={styles.tagline}>Property management, simplified</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your properties</Text>

          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={handleForgotPassword}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

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
  flex:         { flex: 1, backgroundColor: colors.brand[600] },
  flexWide:     { backgroundColor: colors.gray[50] },
  scroll:       { flex: 1 },
  contentNarrow:{ flexGrow: 1 },
  contentWide:  { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },

  // Narrow: branded top block
  brandBlock:  { backgroundColor: colors.brand[600], paddingTop: 80, paddingBottom: 40, paddingHorizontal: 24 },
  wordmark:    { fontSize: text.display, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  tagline:     { fontSize: text.body, color: colors.brand[100], marginTop: 6 },

  // Narrow: white form area with rounded top corners
  formCard:    { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40 },

  // Wide: wordmark above card
  wordmarkWide: { fontSize: text['2xl'], fontWeight: '800', color: colors.brand[600], marginBottom: 20, letterSpacing: -0.5 },
  card:         { ...cardBase, width: 440, padding: 48 },

  title:      { fontSize: text.heroTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  subtitle:   { fontSize: text.body, color: colors.gray[500], marginBottom: 32 },
  forgotRow:  { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -4, marginBottom: 16 },
  forgotText: { fontSize: text.secondary, color: colors.brand[600], fontWeight: '500' },
  linkRow:    { alignItems: 'center', marginTop: 24 },
  link:       { fontSize: text.secondary, color: colors.gray[500] },
  linkBold:   { color: colors.brand[600], fontWeight: '600' },
});
