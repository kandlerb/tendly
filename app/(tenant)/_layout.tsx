import { Tabs } from 'expo-router';
import { CreditCard, Wrench, MessageSquare } from 'lucide-react-native';

export default function TenantLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#16a34a' }}>
      <Tabs.Screen name="pay" options={{ title: 'Pay Rent', tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Requests', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />
    </Tabs>
  );
}
