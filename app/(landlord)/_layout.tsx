import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Building2, Wrench, MessageSquare, Bot } from 'lucide-react-native';
import { SidebarLayout } from '../../components/ui/SidebarLayout';

const DESKTOP_BREAKPOINT = 768;

export default function LandlordLayout() {
  const { width } = useWindowDimensions();

  if (width >= DESKTOP_BREAKPOINT) return <SidebarLayout />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="properties/index" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={22} color={color} /> }} />
      <Tabs.Screen name="maintenance/index" options={{ title: 'Maintenance', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
      <Tabs.Screen name="messages/index" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />
      <Tabs.Screen name="tend" options={{ title: 'Tend AI', tabBarIcon: ({ color }) => <Bot size={22} color={color} /> }} />
      <Tabs.Screen name="financials/index" options={{ href: null }} />

      {/* Hide sub-routes from tab bar */}
      <Tabs.Screen name="properties/add" options={{ href: null }} />
      <Tabs.Screen name="properties/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="maintenance/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[threadId]" options={{ href: null }} />
    </Tabs>
  );
}
