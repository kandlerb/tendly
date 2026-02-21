import { Stack } from 'expo-router';
export default function MaintenanceLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
