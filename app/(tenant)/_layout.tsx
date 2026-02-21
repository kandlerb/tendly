import { useState, useEffect } from 'react';
import { useWindowDimensions, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { CreditCard, Wrench, MessageSquare, FileText, HelpCircle, User } from 'lucide-react-native';
import { SidebarLayout } from '../../components/ui/SidebarLayout';
import { breakpoints, colors } from '../../lib/theme';

const TENANT_NAV_ITEMS = [
  { label: 'Pay Rent',   icon: CreditCard,    route: '/(tenant)/pay',         segment: 'pay' },
  { label: 'Requests',   icon: Wrench,        route: '/(tenant)/maintenance', segment: 'maintenance' },
  { label: 'Messages',   icon: MessageSquare, route: '/(tenant)/messages',    segment: 'messages' },
  { label: 'Documents',  icon: FileText,      route: '/(tenant)/documents',   segment: 'documents' },
  { label: 'Help',       icon: HelpCircle,    route: '/(tenant)/help',        segment: 'help' },
] as const;

export default function TenantLayout() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (mounted && width >= breakpoints.md) return <SidebarLayout navItems={TENANT_NAV_ITEMS} />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.brand[600] }}>
      <Tabs.Screen name="pay" options={{ title: 'Pay Rent', tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Requests', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />
      <Tabs.Screen name="documents" options={{ title: 'Documents', tabBarIcon: ({ color }) => <FileText size={22} color={color} /> }} />
      <Tabs.Screen name="help" options={{ title: 'Help', tabBarIcon: ({ color }) => <HelpCircle size={22} color={color} /> }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />

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
              accessibilityRole="button"
              accessibilityLabel="Go to profile"
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
