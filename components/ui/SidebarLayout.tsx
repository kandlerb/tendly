import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Home, Building2, Wrench, MessageSquare, Bot, BarChart2 } from 'lucide-react-native';
import { colors, text, radius } from '../../lib/theme';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: Home,          route: '/(landlord)/dashboard',   segment: 'dashboard' },
  { label: 'Properties',  icon: Building2,     route: '/(landlord)/properties',  segment: 'properties' },
  { label: 'Maintenance', icon: Wrench,        route: '/(landlord)/maintenance', segment: 'maintenance' },
  { label: 'Messages',    icon: MessageSquare, route: '/(landlord)/messages',    segment: 'messages' },
  { label: 'Tend AI',     icon: Bot,           route: '/(landlord)/tend',        segment: 'tend' },
  { label: 'Financials',  icon: BarChart2,     route: '/(landlord)/financials',  segment: 'financials' },
] as const;

export function SidebarLayout() {
  const router = useRouter();
  const segments = useSegments();
  const activeSegment = segments[1];

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <Text style={styles.brandName}>Tendly</Text>
        </View>
        <ScrollView style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSegment === item.segment;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => router.push(item.route as any)}
              >
                <Icon size={18} color={isActive ? colors.brand[600] : colors.gray[500]} />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, flexDirection: 'row', backgroundColor: colors.gray[50] },
  sidebar:        { width: 220, backgroundColor: colors.white, borderRightWidth: 1, borderRightColor: colors.gray[100] },
  brand:          { padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  brandName:      { fontSize: text.xl, fontWeight: '700', color: colors.brand[600] },
  nav:            { flex: 1, paddingTop: 12 },
  navItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 8, marginBottom: 2, borderRadius: radius.lg, gap: 12 },
  navItemActive:  { backgroundColor: colors.brand[50] },
  navLabel:       { fontSize: text.sm, color: colors.gray[500], fontWeight: '500' },
  navLabelActive: { color: colors.brand[600], fontWeight: '600' },
  content:        { flex: 1 },
});
