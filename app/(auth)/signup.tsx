import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { KeyboardView } from '../../components/ui/KeyboardView';
import { showAlert } from '../../lib/alert';
import { colors, text, radius, shadow, cardBase } from '../../lib/theme';

const BENEFITS = [
  'Free forever for 2 units',
  'Maintenance tracking',
  'Secure rent payments',
];

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

  if (isWide) {
    return (
      <KeyboardView style={[styles.flex, styles.flexWide]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.contentWide}>
          <Text style={styles.wordmarkWide}>Tendly</Text>
          <View style={[styles.card, shadow.sm]}>
            <Text style={styles.title}>Get started</Text>
            <Text style={styles.subtitle}>Create your landlord account — free forever for 2 units</Text>

            <View style={styles.benefits}>
              {BENEFITS.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <Text style={styles.benefitCheck}>✓</Text>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>

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

  return (
    <KeyboardView style={styles.flex}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentNarrow}>
        <View style={styles.brandBlock}>
          <Text style={styles.wordmark}>Tendly</Text>
          <Text style={styles.tagline}>Property management, simplified</Text>
        </View>
        <View style={styles.formCard}>
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

  // Benefits (wide only)
  benefits:     { backgroundColor: colors.brand[50], borderRadius: radius.lg, padding: 16, marginBottom: 28, gap: 8 },
  benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitCheck: { fontSize: text.body, color: colors.brand[700], fontWeight: '700' },
  benefitText:  { fontSize: text.secondary, color: colors.brand[700], fontWeight: '500' },

  title:    { fontSize: text.heroTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  subtitle: { fontSize: text.body, color: colors.gray[500], marginBottom: 32 },
  linkRow:  { alignItems: 'center', marginTop: 24 },
  link:     { fontSize: text.secondary, color: colors.gray[500] },
  linkBold: { color: colors.brand[600], fontWeight: '600' },
});
