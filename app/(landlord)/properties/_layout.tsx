import { Stack } from 'expo-router';
export default function PropertiesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
