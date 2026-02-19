import { Tabs } from 'expo-router';
import { Home, Building2, Wrench, MessageSquare, Bot } from 'lucide-react-native';

export default function LandlordLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="properties"
        options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{ title: 'Maintenance', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="tend"
        options={{ title: 'Tend AI', tabBarIcon: ({ color }) => <Bot size={22} color={color} /> }}
      />
    </Tabs>
  );
}
