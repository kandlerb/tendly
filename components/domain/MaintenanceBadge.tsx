import { View, Text, StyleSheet } from 'react-native';
import type { MaintenanceUrgency, MaintenanceStatus } from '../../types';
import { colors, text, radius } from '../../lib/theme';

export function UrgencyBadge({ urgency }: { urgency: MaintenanceUrgency }) {
  const s = urgencyStyles[urgency];
  return <View style={[styles.badge, s.bg]}><Text style={[styles.label, s.text]}>{s.label}</Text></View>;
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const s = statusStyles[status];
  return <View style={[styles.badge, s.bg]}><Text style={[styles.label, s.text]}>{s.label}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  label: { fontSize: text.xs, fontWeight: '500' },
});

const urgencyStyles = {
  emergency: { bg: { backgroundColor: colors.red[100] }, text: { color: colors.red[700] }, label: 'Emergency' },
  urgent:    { bg: { backgroundColor: colors.orange[100] }, text: { color: colors.orange[700] }, label: 'Urgent' },
  routine:   { bg: { backgroundColor: colors.blue[100] }, text: { color: colors.blue[700] }, label: 'Routine' },
};

const statusStyles = {
  open:     { bg: { backgroundColor: colors.yellow[100] }, text: { color: colors.yellow[700] }, label: 'Open' },
  assigned: { bg: { backgroundColor: colors.purple[100] }, text: { color: colors.purple[700] }, label: 'Assigned' },
  resolved: { bg: { backgroundColor: colors.green[100] }, text: { color: colors.green[700] }, label: 'Resolved' },
};
