import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, FileCheck, Eye, CheckSquare, Upload } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { getSignedUrl, acknowledgeDocument } from '../../lib/claude';
import { showAlert } from '../../lib/alert';
import { formatDate } from '../../lib/utils';
import { colors, text, radius, shadow, spacing, cardBase, headerBase, breakpoints } from '../../lib/theme';
import type { Document, DocumentType } from '../../types';

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  lease:              'Lease',
  lease_addendum:     'Lease Addendum',
  move_in_checklist:  'Move-in Checklist',
  move_out_checklist: 'Move-out Checklist',
  renters_insurance:  'Renters Insurance',
  notice:             'Notice',
  receipt:            'Receipt',
  photo:              'Photo',
  other:              'Document',
};

const SECTION_GROUPS: { label: string; types: DocumentType[] }[] = [
  { label: 'Lease & Addendums', types: ['lease', 'lease_addendum', 'move_in_checklist', 'move_out_checklist'] },
  { label: 'Notices',           types: ['notice'] },
  { label: 'Receipts',          types: ['receipt'] },
  { label: 'My Uploads',        types: ['renters_insurance'] },
];

function DocCard({
  doc,
  onView,
  onAcknowledge,
  viewing,
  acknowledging,
}: {
  doc: Document;
  onView: () => void;
  onAcknowledge: () => void;
  viewing: boolean;
  acknowledging: boolean;
}) {
  return (
    <View style={styles.docCard}>
      <View style={styles.docRow}>
        <View style={styles.docIconBox}>
          <FileText size={20} color={colors.brand[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docName} numberOfLines={2}>{doc.name}</Text>
          <Text style={styles.docMeta}>
            {DOC_TYPE_LABELS[doc.type] ?? doc.type} · {formatDate(doc.created_at)}
          </Text>
          {doc.signed_by_tenant_at && (
            <View style={styles.ackRow}>
              <FileCheck size={12} color={colors.green[700]} />
              <Text style={styles.ackText}>Acknowledged {formatDate(doc.signed_by_tenant_at)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.docActions}>
        <TouchableOpacity
          style={[styles.docBtn, viewing && { opacity: 0.6 }]}
          onPress={viewing ? undefined : onView}
          accessibilityRole="button"
          accessibilityLabel={`View document: ${doc.name}`}
          accessibilityState={{ disabled: viewing }}
        >
          {viewing
            ? <ActivityIndicator size="small" color={colors.brand[600]} />
            : <Eye size={14} color={colors.brand[600]} />
          }
          <Text style={styles.docBtnText}>View</Text>
        </TouchableOpacity>

        {!doc.signed_by_tenant_at && (
          <TouchableOpacity
            style={[styles.docBtn, styles.docBtnOutline, acknowledging && { opacity: 0.6 }]}
            onPress={acknowledging ? undefined : onAcknowledge}
            accessibilityRole="button"
            accessibilityLabel={`Acknowledge document: ${doc.name}`}
            accessibilityState={{ disabled: acknowledging }}
          >
            {acknowledging
              ? <ActivityIndicator size="small" color={colors.gray[700]} />
              : <CheckSquare size={14} color={colors.gray[700]} />
            }
            <Text style={[styles.docBtnText, { color: colors.gray[700] }]}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TenantDocumentsScreen() {
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isWide = width >= breakpoints.md;
  const hPad = isWide ? spacing.pagePadWide : spacing.pagePad;

  useEffect(() => {
    if (user) loadDocuments();
  }, [user]);

  async function loadDocuments() {
    setLoading(true);
    const { data: lease } = await supabase
      .from('leases')
      .select('id')
      .eq('tenant_id', user!.id)
      .eq('status', 'active')
      .single();

    if (!lease) { setLoading(false); return; }
    setLeaseId(lease.id);

    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('lease_id', lease.id)
      .order('created_at', { ascending: false });

    setDocuments((data ?? []) as Document[]);
    setLoading(false);
  }

  async function handleView(doc: Document) {
    setViewingId(doc.id);
    try {
      const { signedUrl } = await getSignedUrl(doc.id);
      if (Platform.OS === 'web') {
        window.open(signedUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(signedUrl);
      }
    } catch (e: any) {
      showAlert('Could not open document', e?.message ?? 'Unknown error');
    } finally {
      setViewingId(null);
    }
  }

  async function handleAcknowledge(doc: Document) {
    setAcknowledgingId(doc.id);
    try {
      await acknowledgeDocument(doc.id);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, signed_by_tenant_at: new Date().toISOString() } : d
        )
      );
    } catch (e: any) {
      showAlert('Could not acknowledge', e?.message ?? 'Unknown error');
    } finally {
      setAcknowledgingId(null);
    }
  }

  async function handleUpload() {
    if (!leaseId) return;
    setUploading(true);
    try {
      let fileData: { name: string; uri: string; type: string } | null = null;

      if (Platform.OS === 'web') {
        // Web: use file input
        await new Promise<void>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/pdf,image/*';
          input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) { resolve(); return; }
            const path = `landlord/${user!.id}/leases/${leaseId}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('documents').upload(path, file);
            if (error || !data) { showAlert('Upload failed', error?.message); resolve(); return; }
            await supabase.from('documents').insert({
              lease_id: leaseId,
              uploaded_by: user!.id,
              name: file.name,
              type: 'renters_insurance' as DocumentType,
              storage_url: data.path,
            });
            await loadDocuments();
            resolve();
          };
          input.click();
        });
      } else {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        const path = `landlord/${user!.id}/leases/${leaseId}/${Date.now()}-${asset.name}`;
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage.from('documents').upload(path, blob);
        if (error || !data) { showAlert('Upload failed', error?.message); return; }
        await supabase.from('documents').insert({
          lease_id: leaseId,
          uploaded_by: user!.id,
          name: asset.name,
          type: 'renters_insurance' as DocumentType,
          storage_url: data.path,
        });
        await loadDocuments();
      }
    } catch (e: any) {
      showAlert('Upload failed', e?.message ?? 'Unknown error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.pageHeader, { paddingHorizontal: hPad }]}>
        <Text style={styles.pageTitle}>Documents</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 16, paddingBottom: 40 }}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand[600]} />
          </View>
        )}

        {!loading && documents.length === 0 && (
          <View style={styles.empty}>
            <FileText size={40} color={colors.gray[300]} />
            <Text style={styles.emptyMain}>No documents yet</Text>
            <Text style={styles.emptySub}>Your landlord will upload documents here</Text>
          </View>
        )}

        {!loading && SECTION_GROUPS.map(({ label, types }) => {
          const sectionDocs = documents.filter((d) => types.includes(d.type));

          // Always show "My Uploads" even if empty (so tenant can upload)
          const isMyUploads = label === 'My Uploads';
          if (sectionDocs.length === 0 && !isMyUploads) return null;

          return (
            <View key={label} style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{label}</Text>
                {isMyUploads && (
                  <TouchableOpacity
                    style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
                    onPress={uploading ? undefined : handleUpload}
                    accessibilityRole="button"
                    accessibilityLabel={uploading ? 'Uploading document' : 'Upload renters insurance document'}
                    accessibilityState={{ disabled: uploading }}
                  >
                    {uploading
                      ? <ActivityIndicator size="small" color={colors.brand[600]} />
                      : <Upload size={14} color={colors.brand[600]} />
                    }
                    <Text style={styles.uploadBtnText}>
                      {uploading ? 'Uploading…' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {sectionDocs.length === 0 && isMyUploads && (
                <Text style={styles.emptySectionText}>
                  Upload your renters insurance certificate here
                </Text>
              )}

              {sectionDocs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onView={() => handleView(doc)}
                  onAcknowledge={() => handleAcknowledge(doc)}
                  viewing={viewingId === doc.id}
                  acknowledging={acknowledgingId === doc.id}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.gray[50] },
  pageHeader:       { ...headerBase },
  pageTitle:        { fontSize: text.pageTitle, fontWeight: '700', color: colors.gray[900] },
  center:           { alignItems: 'center', paddingVertical: 48 },
  empty:            { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyMain:        { color: colors.gray[400], fontSize: text.body },
  emptySub:         { color: colors.gray[300], fontSize: text.secondary },
  emptySectionText: { color: colors.gray[400], fontSize: text.secondary, paddingVertical: 8 },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle:     { fontSize: text.subheading, fontWeight: '600', color: colors.gray[800] },
  uploadBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.brand[100], backgroundColor: colors.brand[50] },
  uploadBtnText:    { fontSize: text.caption, fontWeight: '600', color: colors.brand[600] },

  docCard:          { ...cardBase, ...shadow.sm, padding: spacing.cardPad, marginBottom: spacing.cardGap },
  docRow:           { flexDirection: 'row', gap: 12, marginBottom: 12 },
  docIconBox:       { width: 40, height: 40, borderRadius: radius.xl, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  docName:          { fontWeight: '600', color: colors.gray[900], fontSize: text.body },
  docMeta:          { color: colors.gray[400], fontSize: text.caption, marginTop: 2 },
  ackRow:           { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ackText:          { color: colors.green[700], fontSize: text.caption },
  docActions:       { flexDirection: 'row', gap: 8 },
  docBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.xl, backgroundColor: colors.brand[50], borderWidth: 1, borderColor: colors.brand[100] },
  docBtnOutline:    { backgroundColor: colors.gray[50], borderColor: colors.gray[200] },
  docBtnText:       { fontSize: text.secondary, fontWeight: '600', color: colors.brand[600] },
});
