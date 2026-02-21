import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { LogOut, User } from 'lucide-react-native';
import { colors, text, radius, breakpoints } from '../../lib/theme';
import { useAuthStore } from '../../store/auth';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
  segment: string;
  hideInMobileNav?: boolean;
}

interface SidebarLayoutProps {
  navItems: readonly NavItem[];
}

export function SidebarLayout({ navItems }: SidebarLayoutProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const segments = useSegments() as string[];
  const activeSegment = segments[1];
  const { user, activeView, signOut } = useAuthStore();

  // Default true (sidebar visible) so the static-export pre-render (width=0)
  // and the desktop client initial render both show the sidebar — no hydration
  // mismatch on the primary target. Narrow screens will update after mount.
  const [showSidebar, setShowSidebar] = useState(true);
  useEffect(() => {
    setShowSidebar(width >= breakpoints.md);
  }, [width]);

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  const mobileNavItems = navItems.filter((item) => !item.hideInMobileNav);

  return (
    <View style={showSidebar ? styles.containerWide : styles.containerNarrow}>

      {/* ── Sidebar (wide screens) ── */}
      {showSidebar && (
        <View style={styles.sidebar}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>Tendly</Text>
          </View>

          <ScrollView style={styles.nav}>
            {navItems.map((item) => {
              const isActive = activeSegment === item.segment;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => router.push(item.route as any)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <Icon size={18} color={isActive ? colors.brand[600] : colors.gray[500]} />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.profileFooter}>
            {user?.is_admin && (
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>
                  {activeView === 'tenant' ? 'Tenant View' : 'Landlord View'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.profileRow}
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Go to profile"
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {getInitials(user?.full_name ?? user?.email ?? '')}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.full_name || 'Profile'}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signOutRow}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={16} color={colors.gray[500]} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Main content (always Slot — never switches navigator type) ── */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* ── Bottom tab bar (narrow screens) ── */}
      {!showSidebar && (
        <View style={styles.bottomBar}>
          {mobileNavItems.map((item) => {
            const isActive = activeSegment === item.segment;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.route}
                style={styles.bottomTab}
                onPress={() => router.push(item.route as any)}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: isActive }}
              >
                <Icon size={22} color={isActive ? colors.brand[600] : colors.gray[400]} />
                <Text style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.bottomTab}
            onPress={() => router.push('/profile')}
            accessibilityRole="tab"
            accessibilityLabel="Profile"
          >
            <User size={22} color={colors.gray[400]} />
            <Text style={styles.bottomTabLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerWide:   { flex: 1, flexDirection: 'row',    backgroundColor: colors.gray[50] },
  containerNarrow: { flex: 1, flexDirection: 'column', backgroundColor: colors.gray[50] },

  // Sidebar
  sidebar:         { width: 220, backgroundColor: colors.white, borderRightWidth: 1, borderRightColor: colors.gray[100], flexDirection: 'column' },
  brand:           { padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  brandName:       { fontSize: text.heading, fontWeight: '700', color: colors.brand[600] },
  nav:             { flex: 1, paddingTop: 12 },
  navItem:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 8, marginBottom: 2, borderRadius: radius.lg, gap: 12, minHeight: 48 },
  navItemActive:   { backgroundColor: colors.brand[50] },
  navLabel:        { fontSize: text.secondary, color: colors.gray[500], fontWeight: '500' },
  navLabelActive:  { color: colors.brand[600], fontWeight: '600' },
  content:         { flex: 1 },

  profileFooter: { borderTopWidth: 1, borderTopColor: colors.gray[100], padding: 12, gap: 8 },
  viewBadge:     { backgroundColor: colors.brand[50], borderRadius: radius.lg, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  viewBadgeText: { fontSize: text.caption, fontWeight: '600', color: colors.brand[600] },
  profileRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 4, borderRadius: radius.lg },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand[600], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileAvatarText: { fontSize: text.caption, fontWeight: '700', color: colors.white },
  profileInfo:   { flex: 1, minWidth: 0 },
  profileName:   { fontSize: text.secondary, fontWeight: '600', color: colors.gray[800] },
  profileEmail:  { fontSize: text.caption, color: colors.gray[400] },
  signOutRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  signOutText:   { fontSize: text.secondary, color: colors.gray[500] },

  // Bottom tab bar
  bottomBar:         { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  bottomTab:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 2, minHeight: 52 },
  bottomTabLabel:    { fontSize: 10, color: colors.gray[400], fontWeight: '500' },
  bottomTabLabelActive: { color: colors.brand[600], fontWeight: '600' },
});
