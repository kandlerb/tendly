import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { Property } from '../../types';
import { colors, text, radius, shadow, spacing, cardBase } from '../../lib/theme';

interface Props { property: Property; }

export function PropertyCard({ property }: Props) {
  const router = useRouter();
  const unitCount = property.units?.length ?? 0;
  const label = property.nickname ?? property.address;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(landlord)/properties/${property.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${unitCount} ${unitCount === 1 ? 'unit' : 'units'}`}
    >
      <View style={styles.icon}>
        <Building2 size={22} color={colors.brand[600]} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{property.nickname ?? property.address}</Text>
        <Text style={styles.sub}>
          {property.nickname ? property.address + ' · ' : ''}{unitCount} {unitCount === 1 ? 'unit' : 'units'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.gray[300]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { ...cardBase, ...shadow.sm, padding: spacing.cardPad, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 48, height: 48, backgroundColor: colors.brand[50], borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  info: { flex: 1 },
  name: { fontWeight: '600', color: colors.gray[900], fontSize: text.body },
  sub: { color: colors.gray[500], fontSize: text.secondary, marginTop: 2 },
});
