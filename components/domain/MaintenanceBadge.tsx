import { View, Text } from 'react-native';
import type { MaintenanceUrgency, MaintenanceStatus } from '../../types';

const urgencyConfig = {
  emergency: { bg: 'bg-red-100', text: 'text-red-700', label: 'Emergency' },
  urgent: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Urgent' },
  routine: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Routine' },
};

const statusConfig = {
  open: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Open' },
  assigned: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Assigned' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
};

export function UrgencyBadge({ urgency }: { urgency: MaintenanceUrgency }) {
  const c = urgencyConfig[urgency];
  return (
    <View className={`${c.bg} px-2.5 py-0.5 rounded-full`}>
      <Text className={`${c.text} text-xs font-medium`}>{c.label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const c = statusConfig[status];
  return (
    <View className={`${c.bg} px-2.5 py-0.5 rounded-full`}>
      <Text className={`${c.text} text-xs font-medium`}>{c.label}</Text>
    </View>
  );
}
