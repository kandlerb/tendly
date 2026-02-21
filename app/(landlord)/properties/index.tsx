import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { usePropertiesStore } from '../../../store/properties';
import { PropertyCard } from '../../../components/domain/PropertyCard';
import { colors, text, radius, headerBase, breakpoints, spacing } from '../../../lib/theme';
import { ScreenFade } from '../../../components/ui/ScreenFade';

export default function PropertiesScreen() {
  const router = useRouter();
  const { properties, loading, fetchProperties } = usePropertiesStore();
  const { width } = useWindowDimensions();

  useEffect(() => { fetchProperties(); }, []);

  const isWide = width >= breakpoints.md;
  const hPad = isWide ? spacing.pagePadWide : spacing.pagePad;
  const gap = spacing.cardGap;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;

  return (
    <ScreenFade>
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={styles.title}>Properties</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(landlord)/properties/add' as any)}
          accessibilityRole="button"
          accessibilityLabel="Add property"
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      ) : (
        <FlatList
          key={isWide ? '2col' : '1col'}
          data={properties}
          keyExtractor={(p) => p.id}
          numColumns={isWide ? 2 : 1}
          columnWrapperStyle={isWide ? { gap } : undefined}
          contentContainerStyle={{
            paddingHorizontal: hPad,
            paddingTop: 8,
            paddingBottom: hPad,
            gap,
          }}
          renderItem={({ item }) => (
            <View style={isWide ? { width: colW } : undefined}>
              <PropertyCard property={item} />
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <Text style={styles.emptyMain}>No properties yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first property</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.gray[50] },
  header:       { ...headerBase, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:        { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  addBtn:       { backgroundColor: colors.brand[600], borderRadius: radius.xl, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  loadingCenter:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingVertical: 64 },
  emptyMain:    { color: colors.gray[400], fontSize: text.body },
  emptySub:     { color: colors.gray[300], fontSize: text.secondary, marginTop: 4 },
});
