import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { showAlert } from '../../lib/alert';
import { useAuthStore } from '../../store/auth';
import { colors, text, radius, headerBase, breakpoints, spacing } from '../../lib/theme';
import { ScreenFade } from '../../components/ui/ScreenFade';

function triageLocally(title: string, description: string): { urgency: string; trade: string } {
  const text = (title + ' ' + description).toLowerCase();
  const emergencyKw = ['flood', 'fire', 'gas leak', 'no heat', 'sewage', 'burst pipe', 'sparks', 'no hot water'];
  const urgentKw = ['leak', 'mold', 'pest', 'roach', 'rodent', 'broken lock', 'no water'];
  const urgency = emergencyKw.some(k => text.includes(k)) ? 'emergency'
                : urgentKw.some(k => text.includes(k)) ? 'urgent'
                : 'routine';
  const tradeMap: [RegExp, string][] = [
    [/plumb|pipe|faucet|toilet|drain/i, 'plumbing'],
    [/electric|outlet|breaker|wiring/i, 'electrical'],
    [/hvac|heat|cool|ac|furnace/i, 'hvac'],
    [/roof|gutter/i, 'roofing'],
    [/pest|roach|rodent|bug|mice/i, 'pest_control'],
    [/lock|door(?!bell)|window|key/i, 'locksmith'],
  ];
  const trade = tradeMap.find(([re]) => re.test(text))?.[1] ?? 'general';
  return { urgency, trade };
}

export default function TenantMaintenanceScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { width } = useWindowDimensions();

  const isWide = width >= breakpoints.md;
  const hPad = isWide ? spacing.pagePadWide : spacing.pagePad;

  async function pickPhoto() {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          setPhotos((prev) => [...prev, URL.createObjectURL(file)]);
          setPhotoFiles((prev) => [...prev, file]);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled) setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function handleSubmit() {
    if (!title || !description) { showAlert('Please fill in title and description'); return; }
    setSubmitting(true);

    const { data: lease } = await supabase
      .from('leases')
      .select('unit_id')
      .eq('tenant_id', user!.id)
      .eq('status', 'active')
      .single();

    if (!lease) { showAlert('No active lease found'); setSubmitting(false); return; }

    const { urgency, trade } = triageLocally(title, description);

    const photoUrls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      if (Platform.OS === 'web' && photoFiles[i]) {
        const { data } = await supabase.storage.from('maintenance-photos').upload(fileName, photoFiles[i]);
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('maintenance-photos').getPublicUrl(data.path);
          photoUrls.push(publicUrl);
        }
      } else {
        const { data } = await supabase.storage.from('maintenance-photos').upload(fileName, { uri: photos[i], type: 'image/jpeg' } as any);
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('maintenance-photos').getPublicUrl(data.path);
          photoUrls.push(publicUrl);
        }
      }
    }

    await supabase.from('maintenance_requests').insert({
      unit_id: lease.unit_id,
      tenant_id: user!.id,
      title,
      description,
      photo_urls: photoUrls,
      urgency,
      trade,
    });

    showAlert('Submitted', `Your ${urgency} request has been sent to your landlord.`);
    setTitle(''); setDescription(''); setPhotos([]); setPhotoFiles([]);
    setSubmitting(false);
  }

  return (
    <ScreenFade>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.pageHeader, { paddingHorizontal: hPad }]}>
          <Text style={styles.pageTitle}>Submit Request</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: hPad, paddingTop: hPad },
            isWide && styles.contentWide,
          ]}
        >
          <View style={isWide ? styles.formWide : undefined}>
            <Input label="What's the issue?" value={title} onChangeText={setTitle} placeholder="Leaking faucet" />
            <Input label="Describe the problem" value={description} onChangeText={setDescription} multiline placeholder="The kitchen faucet has been dripping constantly for 2 days..." />

            <TouchableOpacity
              style={styles.photoBtn}
              onPress={pickPhoto}
              accessibilityRole="button"
              accessibilityLabel="Add photos"
            >
              <Camera size={24} color={colors.gray[400]} />
              <Text style={styles.photoBtnText}>Add photos</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <View style={styles.photoRow}>
                {photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.photoThumb} />
                ))}
              </View>
            )}

            <Button title="Submit Request" onPress={handleSubmit} loading={submitting} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.white },
  pageHeader:  { ...headerBase },
  pageTitle:   { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  scroll:      { flex: 1 },
  content:     { paddingBottom: 40, gap: 16 },
  contentWide: { alignItems: 'center' },
  formWide:    { width: '100%', maxWidth: 600 },
  photoBtn:    { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.gray[200], borderRadius: radius['2xl'], padding: 16, alignItems: 'center', gap: 8, minHeight: 48 },
  photoBtnText:{ color: colors.gray[400] },
  photoRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb:  { width: 80, height: 80, borderRadius: radius.xl },
});
