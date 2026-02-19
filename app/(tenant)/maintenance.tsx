import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { callTriage } from '../../lib/claude';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { showAlert } from '../../lib/alert';
import { useAuthStore } from '../../store/auth';

export default function TenantMaintenanceScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

    let urgency = 'routine', trade = 'general';
    try {
      const triage = await callTriage(title, description);
      urgency = triage.urgency;
      trade = triage.trade;
    } catch { /* use defaults */ }

    const photoUrls: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      if (Platform.OS === 'web' && photoFiles[i]) {
        const { data } = await supabase.storage.from('documents').upload(fileName, photoFiles[i]);
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
          photoUrls.push(publicUrl);
        }
      } else {
        const { data } = await supabase.storage.from('documents').upload(fileName, { uri: photos[i], type: 'image/jpeg' } as any);
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Submit Request</Text>
        <Input label="What's the issue?" value={title} onChangeText={setTitle} placeholder="Leaking faucet" />
        <Input label="Describe the problem" value={description} onChangeText={setDescription} multiline placeholder="The kitchen faucet has been dripping constantly for 2 days..." />

        <TouchableOpacity className="border-2 border-dashed border-gray-200 rounded-2xl p-4 items-center mb-6" onPress={pickPhoto}>
          <Camera size={24} color="#9ca3af" />
          <Text className="text-gray-400 mt-2">Add photos</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} className="w-20 h-20 rounded-xl" />
            ))}
          </View>
        )}

        <Button title="Submit Request" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}
