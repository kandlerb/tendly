import { Stack } from 'expo-router';
export default function MessagesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
