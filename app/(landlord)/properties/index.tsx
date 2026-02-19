import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { usePropertiesStore } from '../../../store/properties';
import { PropertyCard } from '../../../components/domain/PropertyCard';
import { colors, text, radius } from '../../../lib/theme';

export default function PropertiesScreen() {
  const router = useRouter();
  const { properties, loading, fetchProperties } = usePropertiesStore();

  useEffect(() => { fetchProperties(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Properties</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(landlord)/properties/add' as any)}>
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={properties}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyMain}>No properties yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first property</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: text['2xl'], fontWeight: '700', color: colors.gray[900] },
  addBtn: { backgroundColor: colors.brand[600], borderRadius: radius.xl, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyMain: { color: colors.gray[400], fontSize: text.base },
  emptySub: { color: colors.gray[300], fontSize: text.sm, marginTop: 4 },
});
