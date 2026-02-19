import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { completeInvitation } from '../../lib/claude';
import { Button } from '../../components/ui/Button';
import { formatCents, formatDate } from '../../lib/utils';
import { colors, text, radius, shadow, spacing, cardBase } from '../../lib/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ lease: any; unit: any; property: any } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token found. Please use the link from your invitation email.');
      setLoading(false);
      return;
    }
    completeInvitation(token)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to complete invitation. Please contact your landlord.');
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={styles.loadingText}>Setting up your account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.contactText}>Contact your landlord for assistance.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { lease, unit, property } = result;
  const address = property?.nickname ?? property?.address ?? 'your property';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.scroll}>
        {/* Welcome header */}
        <View style={styles.welcomeSection}>
          <View style={styles.checkIcon}>
            <CheckCircle size={40} color={colors.brand[600]} />
          </View>
          <Text style={styles.welcomeTitle}>Welcome to Tendly!</Text>
          <Text style={styles.welcomeSub}>Your lease has been set up successfully.</Text>
        </View>

        {/* Lease summary card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {unit?.unit_number ? `Unit ${unit.unit_number} at ` : ''}{address}
          </Text>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Move-in date</Text>
            <Text style={styles.rowValue}>{formatDate(lease?.start_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Lease end</Text>
            <Text style={styles.rowValue}>{formatDate(lease?.end_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Monthly rent</Text>
            <Text style={[styles.rowValue, { color: colors.brand[600], fontWeight: '700' }]}>
              {formatCents(lease?.rent_amount)}
            </Text>
          </View>
          {lease?.deposit_amount ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Security deposit</Text>
              <Text style={styles.rowValue}>{formatCents(lease.deposit_amount)}</Text>
            </View>
          ) : null}
        </View>

        <Button
          title="Get Started"
          onPress={() => router.replace('/(tenant)/pay' as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.gray[50] },
  scroll:        { flex: 1, padding: 24, justifyContent: 'center' },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText:   { marginTop: 16, color: colors.gray[500], fontSize: text.body },
  errorTitle:    { fontSize: text.heading, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  errorText:     { color: colors.gray[500], fontSize: text.body, textAlign: 'center', marginBottom: 8 },
  contactText:   { color: colors.gray[400], fontSize: text.secondary, textAlign: 'center' },
  welcomeSection:{ alignItems: 'center', marginBottom: 32 },
  checkIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle:  { fontSize: text.heroTitle, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  welcomeSub:    { color: colors.gray[500], fontSize: text.body, textAlign: 'center' },
  card:          { ...cardBase, ...shadow.sm, padding: spacing.cardPad, marginBottom: 24 },
  cardTitle:     { fontWeight: '700', color: colors.gray[900], fontSize: text.subheading, marginBottom: 4 },
  divider:       { height: 1, backgroundColor: colors.gray[100], marginVertical: 12 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel:      { color: colors.gray[500], fontSize: text.body },
  rowValue:      { fontWeight: '500', color: colors.gray[900], fontSize: text.body },
});
