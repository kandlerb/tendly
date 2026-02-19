import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName || !email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'landlord', full_name: fullName },
      },
    });
    setLoading(false);
    if (error) Alert.alert('Signup failed', error.message);
    else Alert.alert('Check your email', 'Click the confirmation link to activate your account.');
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 100 }}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">Get started</Text>
        <Text className="text-gray-500 mb-10">Create your landlord account — free forever for 2 units</Text>

        <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Smith" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8+ characters"
        />

        <Button title="Create Account" onPress={handleSignup} loading={loading} />

        <Link href="/(auth)/login" className="text-center mt-6">
          <Text className="text-brand-600 text-sm">Already have an account? Sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
