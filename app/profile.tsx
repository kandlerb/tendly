import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Plus, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KeyboardView } from '../components/ui/KeyboardView';
import { colors, text, radius, shadow, spacing, cardBase } from '../lib/theme';
import { showAlert } from '../lib/alert';
import type { VehicleInfo, PetInfo } from '../types';

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

  // Tenant profile fields
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [pets, setPets] = useState<PetInfo[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.role !== 'tenant') return;
    supabase
      .from('tenant_profiles')
      .select('phone, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, vehicles, pets')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setPhone(data.phone ?? '');
        setEmergencyName(data.emergency_contact_name ?? '');
        setEmergencyPhone(data.emergency_contact_phone ?? '');
        setEmergencyRelation(data.emergency_contact_relation ?? '');
        setVehicles((data.vehicles as VehicleInfo[]) ?? []);
        setPets((data.pets as PetInfo[]) ?? []);
      });
  }, [user?.id, user?.role]);

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

  async function handleSaveTenantProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('tenant_profiles').upsert({
        id: user.id,
        phone: phone.trim() || null,
        emergency_contact_name: emergencyName.trim() || null,
        emergency_contact_phone: emergencyPhone.trim() || null,
        emergency_contact_relation: emergencyRelation.trim() || null,
        vehicles,
        pets,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        showAlert('Error', error.message);
      } else {
        showAlert('Saved', 'Your profile has been updated.');
      }
    } finally {
      setSavingProfile(false);
    }
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, { make: '', model: '', year: new Date().getFullYear(), plate: '', color: '' }]);
  }
  function removeVehicle(i: number) {
    setVehicles((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateVehicle(i: number, field: keyof VehicleInfo, value: string | number) {
    setVehicles((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  }

  function addPet() {
    setPets((prev) => [...prev, { type: '', breed: '', name: '', weight_lbs: 0 }]);
  }
  function removePet(i: number) {
    setPets((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updatePet(i: number, field: keyof PetInfo, value: string | number) {
    setPets((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
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

          {/* ── Tenant Profile Section ── */}
          {user.role === 'tenant' && (
            <View style={styles.stack}>
              {/* Contact info */}
              <View style={[styles.card, isWide && { flex: 1 }]}>
                <Text style={styles.cardTitle}>Contact Info</Text>
                <Text style={styles.cardDesc}>Visible to your landlord</Text>
                <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
                <Text style={[styles.cardTitle, { marginTop: 4 }]}>Emergency Contact</Text>
                <Input label="Name" value={emergencyName} onChangeText={setEmergencyName} placeholder="Jane Doe" />
                <Input label="Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
                <Input label="Relationship" value={emergencyRelation} onChangeText={setEmergencyRelation} placeholder="Parent, Spouse, Friend…" />
              </View>

              {/* Vehicles */}
              <View style={styles.card}>
                <View style={styles.sectionRow}>
                  <Text style={styles.cardTitle}>Vehicles</Text>
                  <TouchableOpacity style={styles.addRowBtn} onPress={addVehicle}>
                    <Plus size={14} color={colors.brand[600]} />
                    <Text style={styles.addRowBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {vehicles.length === 0 && (
                  <Text style={styles.cardDesc}>No vehicles added</Text>
                )}
                {vehicles.map((v, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemLabel}>Vehicle {i + 1}</Text>
                      <TouchableOpacity onPress={() => removeVehicle(i)}>
                        <Trash2 size={14} color={colors.red[500]} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.twoCol}>
                      <View style={styles.halfInput}>
                        <Input label="Make" value={v.make} onChangeText={(val) => updateVehicle(i, 'make', val)} placeholder="Toyota" />
                      </View>
                      <View style={styles.halfInput}>
                        <Input label="Model" value={v.model} onChangeText={(val) => updateVehicle(i, 'model', val)} placeholder="Camry" />
                      </View>
                    </View>
                    <View style={styles.twoCol}>
                      <View style={styles.halfInput}>
                        <Input label="Year" value={String(v.year)} onChangeText={(val) => updateVehicle(i, 'year', parseInt(val) || 0)} placeholder="2020" keyboardType="number-pad" />
                      </View>
                      <View style={styles.halfInput}>
                        <Input label="Color" value={v.color} onChangeText={(val) => updateVehicle(i, 'color', val)} placeholder="Silver" />
                      </View>
                    </View>
                    <Input label="License Plate" value={v.plate} onChangeText={(val) => updateVehicle(i, 'plate', val)} placeholder="ABC-1234" autoCapitalize="characters" />
                  </View>
                ))}
              </View>

              {/* Pets */}
              <View style={styles.card}>
                <View style={styles.sectionRow}>
                  <Text style={styles.cardTitle}>Pets</Text>
                  <TouchableOpacity style={styles.addRowBtn} onPress={addPet}>
                    <Plus size={14} color={colors.brand[600]} />
                    <Text style={styles.addRowBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {pets.length === 0 && (
                  <Text style={styles.cardDesc}>No pets added</Text>
                )}
                {pets.map((p, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemLabel}>Pet {i + 1}</Text>
                      <TouchableOpacity onPress={() => removePet(i)}>
                        <Trash2 size={14} color={colors.red[500]} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.twoCol}>
                      <View style={styles.halfInput}>
                        <Input label="Type" value={p.type} onChangeText={(val) => updatePet(i, 'type', val)} placeholder="Dog, Cat…" />
                      </View>
                      <View style={styles.halfInput}>
                        <Input label="Name" value={p.name} onChangeText={(val) => updatePet(i, 'name', val)} placeholder="Buddy" />
                      </View>
                    </View>
                    <View style={styles.twoCol}>
                      <View style={styles.halfInput}>
                        <Input label="Breed" value={p.breed} onChangeText={(val) => updatePet(i, 'breed', val)} placeholder="Labrador" />
                      </View>
                      <View style={styles.halfInput}>
                        <Input label="Weight (lbs)" value={p.weight_lbs > 0 ? String(p.weight_lbs) : ''} onChangeText={(val) => updatePet(i, 'weight_lbs', parseFloat(val) || 0)} placeholder="65" keyboardType="decimal-pad" />
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <Button title="Save Profile" onPress={handleSaveTenantProfile} loading={savingProfile} />
            </View>
          )}

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

  // Tenant profile section
  sectionRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  addRowBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.brand[100], backgroundColor: colors.brand[50] },
  addRowBtnText:   { fontSize: text.caption, fontWeight: '600', color: colors.brand[600] },
  listItem:        { borderTopWidth: 1, borderTopColor: colors.gray[100], paddingTop: 12, marginTop: 8, gap: 0 },
  listItemHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  listItemLabel:   { fontSize: text.secondary, fontWeight: '600', color: colors.gray[700] },
  twoCol:          { flexDirection: 'row', gap: 8 },
  halfInput:       { flex: 1 },
});
