import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, text } from '../../lib/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: Props) {
  const isPrimary = variant === 'primary';
  const isInactive = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, isInactive && styles.disabled]}
      onPress={isInactive ? undefined : onPress}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.gray[800]} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:          { borderRadius: radius.xl, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  primary:       { backgroundColor: colors.brand[600] },
  secondary:     { backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[200] },
  disabled:      { opacity: 0.5 },
  label:         { fontSize: text.body },
  labelPrimary:  { color: colors.white, fontWeight: '600' },
  labelSecondary:{ color: colors.gray[800], fontWeight: '500' },
});
