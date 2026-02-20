import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, text } from '../../lib/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : styles.inputNormal]}
        placeholderTextColor={colors.gray[400]}
        accessibilityLabel={label}
        {...props}
      />
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: text.secondary, fontWeight: '500', color: colors.gray[700], marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 12, fontSize: text.body, color: colors.gray[900], backgroundColor: colors.white, minHeight: 48 },
  inputNormal: { borderColor: colors.gray[200] },
  inputError: { borderColor: colors.red[400] },
  error: { color: colors.red[500], fontSize: text.caption, marginTop: 4 },
});
