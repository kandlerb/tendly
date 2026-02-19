import { useWindowDimensions, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { CreditCard, Wrench, MessageSquare, User } from 'lucide-react-native';
import { SidebarLayout } from '../../components/ui/SidebarLayout';

const DESKTOP_BREAKPOINT = 768;

const TENANT_NAV_ITEMS = [
  { label: 'Pay Rent',  icon: CreditCard,    route: '/(tenant)/pay',          segment: 'pay' },
  { label: 'Requests',  icon: Wrench,        route: '/(tenant)/maintenance',  segment: 'maintenance' },
  { label: 'Messages',  icon: MessageSquare, route: '/(tenant)/messages',     segment: 'messages' },
] as const;

export default function TenantLayout() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  if (width >= DESKTOP_BREAKPOINT) return <SidebarLayout navItems={TENANT_NAV_ITEMS} />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#16a34a' }}>
      <Tabs.Screen name="pay" options={{ title: 'Pay Rent', tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Requests', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />

      {/* Profile tab — intercepts tap and opens the /profile modal */}
      <Tabs.Screen
        name="profile-redirect"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
          tabBarButton: (props) => (
            <TouchableOpacity
              style={props.style as any}
              onPress={() => router.push('/profile')}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
