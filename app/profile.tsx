import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KeyboardView } from '../components/ui/KeyboardView';
import { colors, text, radius, shadow, spacing, cardBase } from '../lib/theme';
import { showAlert } from '../lib/alert';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const { user, setUser, setActiveView, signOut, activeView } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Responsive measurements
  const isWide = width >= 640;
  const hPad = isWide ? 40 : 16;
  const gap = 24;
  const maxContentW = 1000;
  const innerW = Math.min(width - hPad * 2, maxContentW);
  const colW = isWide ? (innerW - gap) / 2 : undefined;

  async function handleSaveName() {
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
      if (error) {
        showAlert('Error', error.message);
      } else {
        setUser({ ...user, full_name: fullName.trim() });
        showAlert('Saved', 'Display name updated.');
      }
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    if (!user) return;
    if (newPassword.length < 8) {
      showAlert('Too short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        showAlert('Wrong password', 'Current password is incorrect.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showAlert('Error', error.message);
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showAlert('Done', 'Password updated successfully.');
      }
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSwitchView(view: 'landlord' | 'tenant') {
    setActiveView(view);
    router.replace(view === 'tenant' ? '/(tenant)/pay' : '/(landlord)/dashboard');
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  if (!user) return null;

  const initials = getInitials(user.full_name || user.email);
  const cardStyle = [styles.card, isWide && { width: colW }];

  return (
    <KeyboardView style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: hPad,
          paddingTop: isWide ? 36 : 20,
          paddingBottom: 48,
          alignItems: 'center',
        }}
      >
        <View style={{ width: isWide ? innerW : '100%', gap: gap }}>

          {/* ── Header ── */}
          <View style={isWide ? styles.headerWide : styles.headerNarrow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.headerName}>{user.full_name || 'No name set'}</Text>
                <Text style={styles.headerEmail}>{user.email}</Text>
              </View>
            </View>
            {user.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* ── Row 1: Profile + Change Password ── */}
          <View style={isWide ? styles.row : styles.stack}>
            {/* Profile card */}
            <View style={cardStyle}>
              <Text style={styles.cardTitle}>Profile</Text>
              <Text style={styles.cardDesc}>Update your display name</Text>
              <Input
                label="Display Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                autoCapitalize="words"
              />
              <Button title="Save Name" onPress={handleSaveName} loading={savingName} />
            </View>

            {/* Change Password card */}
            <View style={cardStyle}>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardDesc}>Verify your current password first</Text>
              <Input
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
              />
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={savingPassword}
              />
            </View>
          </View>

          {/* ── Row 2: Admin Controls + Sign Out (or just Sign Out) ── */}
          {user.is_admin ? (
            <View style={isWide ? styles.row : styles.stack}>
              {/* Admin Controls card */}
              <View style={cardStyle}>
                <Text style={styles.cardTitle}>Admin — View Switching</Text>
                <Text style={styles.cardDesc}>
                  Currently showing:{' '}
                  <Text style={styles.bold}>
                    {activeView === 'tenant' ? 'Tenant View' : 'Landlord View'}
                  </Text>
                </Text>
                <View style={styles.viewToggleRow}>
                  <TouchableOpacity
                    style={[styles.viewToggleBtn, activeView === 'landlord' && styles.viewToggleBtnActive]}
                    onPress={() => handleSwitchView('landlord')}
                  >
                    <Text style={[styles.viewToggleBtnText, activeView === 'landlord' && styles.viewToggleBtnTextActive]}>
                      Landlord View
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewToggleBtn, activeView === 'tenant' && styles.viewToggleBtnActive]}
                    onPress={() => handleSwitchView('tenant')}
                  >
                    <Text style={[styles.viewToggleBtnText, activeView === 'tenant' && styles.viewToggleBtnTextActive]}>
                      Tenant View
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Out card — paired with admin */}
              <View style={[cardStyle, styles.signOutCard]}>
                <Text style={styles.cardTitle}>Session</Text>
                <Text style={styles.cardDesc}>Sign out of your account on this device</Text>
                <Button title="Sign Out" onPress={handleSignOut} variant="secondary" />
              </View>
            </View>
          ) : (
            // No admin — slim sign-out footer row
            <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut}>
              <LogOut size={16} color={colors.gray[400]} />
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { flex: 1, backgroundColor: colors.gray[50] },

  // Header
  headerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadow.sm,
  },
  headerNarrow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: text.heading,
    fontWeight: '700',
    color: colors.white,
  },
  headerName: {
    fontSize: text.subheading,
    fontWeight: '700',
    color: colors.gray[900],
  },
  headerEmail: {
    fontSize: text.secondary,
    color: colors.gray[500],
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: colors.purple[100],
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  adminBadgeText: {
    fontSize: text.caption,
    fontWeight: '600',
    color: colors.purple[700],
    letterSpacing: 0.5,
  },

  // Card grid
  row:   { flexDirection: 'row', gap: 24, alignItems: 'stretch' },
  stack: { gap: 16 },
  card: {
    ...cardBase,
    ...shadow.sm,
    padding: spacing.cardPad,
    gap: spacing.cardInnerGap,
  },
  cardTitle: {
    fontSize: text.body,
    fontWeight: '700',
    color: colors.gray[900],
  },
  cardDesc: {
    fontSize: text.secondary,
    color: colors.gray[400],
    marginTop: -4,
    marginBottom: 4,
  },
  signOutCard: {
    justifyContent: 'flex-start',
  },

  // View toggle
  viewToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  viewToggleBtnText: {
    fontSize: text.secondary,
    fontWeight: '500',
    color: colors.gray[700],
  },
  viewToggleBtnTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  bold: {
    fontWeight: '600',
    color: colors.gray[800],
  },

  // Slim sign-out footer (non-admin)
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: text.secondary,
    color: colors.gray[400],
  },
});
