import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, text, spacing } from '../../lib/theme';

interface Props {
  children: React.ReactNode;
  feature: string;
  onUpgrade: () => void;
  locked: boolean;
}

export function PaywallGate({ children, feature, onUpgrade, locked }: Props) {
  if (!locked) return <>{children}</>;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.heading}>Upgrade to unlock</Text>
      <Text style={styles.body}>{feature} is included in the Standard plan — $9/unit/month</Text>
      <Button title="View Plans" onPress={onUpgrade} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'] },
  icon:      { fontSize: text.display, marginBottom: spacing.md },
  heading:   { fontSize: text.subheading, fontWeight: '700', color: colors.gray[900], textAlign: 'center', marginBottom: spacing.sm },
  body:      { fontSize: text.body, color: colors.gray[500], textAlign: 'center', marginBottom: spacing.xl },
});
