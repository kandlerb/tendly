import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useMessagesStore } from '../../../store/messages';
import { colors, text, radius, shadow, spacing, cardBase, headerBase } from '../../../lib/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const { threads, unreadCounts, loadingThreads, fetchThreads } = useMessagesStore();
  const { width } = useWindowDimensions();

  useEffect(() => { fetchThreads(); }, []);

  const isWide = width >= 768;
  const hPad = isWide ? 24 : 20;
  const gap = 16;
  const colW = isWide ? (width - 220 - hPad * 2 - gap) / 2 : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        key={isWide ? '2col' : '1col'}
        data={threads}
        keyExtractor={(t) => t.id}
        numColumns={isWide ? 2 : 1}
        columnWrapperStyle={isWide ? { gap, alignItems: 'stretch' } : undefined}
        contentContainerStyle={{
          paddingHorizontal: hPad,
          paddingTop: 8,
          paddingBottom: hPad,
          gap,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, isWide && { width: colW }]}
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
            {(unreadCounts[item.id] ?? 0) > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCounts[item.id]}</Text>
              </View>
            )}
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
  safe:     { flex: 1, backgroundColor: colors.gray[50] },
  header:   { ...headerBase },
  title:    { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  card:     { ...cardBase, ...shadow.sm, padding: spacing.cardPad, flexDirection: 'row', alignItems: 'center' },
  avatar:   { width: 44, height: 44, backgroundColor: colors.brand[50], borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  info:     { flex: 1, minWidth: 0 },
  name:     { fontWeight: '600', color: colors.gray[900], fontSize: text.body },
  sub:      { color: colors.gray[500], fontSize: text.secondary, marginTop: 2 },
  empty:       { alignItems: 'center', paddingVertical: 64 },
  emptyMain:   { color: colors.gray[400], fontSize: text.body },
  emptySub:    { color: colors.gray[300], fontSize: text.secondary, marginTop: 4 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.brand[600], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText:  { color: colors.white, fontSize: text.caption, fontWeight: '700' },
});
