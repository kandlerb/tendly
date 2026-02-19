import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useMessagesStore } from '../../../store/messages';
import { colors, text, radius, shadow } from '../../../lib/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const { threads, loadingThreads, fetchThreads } = useMessagesStore();

  useEffect(() => { fetchThreads(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(landlord)/messages/${item.id}` as any)}
          >
            <View style={styles.avatar}>
              <MessageSquare size={20} color={colors.brand[600]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{(item as any).tenant?.full_name}</Text>
              <Text style={styles.sub}>
                {(item as any).unit?.property?.nickname ?? (item as any).unit?.property?.address} · Unit {(item as any).unit?.unit_number}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loadingThreads ? (
          <View style={styles.empty}>
            <Text style={styles.emptyMain}>No active leases</Text>
            <Text style={styles.emptySub}>Messages appear when tenants have active leases</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: text['2xl'], fontWeight: '700', color: colors.gray[900] },
  card: { backgroundColor: colors.white, borderRadius: radius['2xl'], padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.gray[100], ...shadow.sm },
  avatar: { width: 44, height: 44, backgroundColor: colors.brand[50], borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  name: { fontWeight: '600', color: colors.gray[900], fontSize: text.base },
  sub: { color: colors.gray[500], fontSize: text.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyMain: { color: colors.gray[400], fontSize: text.base },
  emptySub: { color: colors.gray[300], fontSize: text.sm, marginTop: 4 },
});
