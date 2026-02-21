import { useState, useEffect } from 'react';
import { useWindowDimensions, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, Building2, Users, Wrench, MessageSquare, Bot, User } from 'lucide-react-native';
import { SidebarLayout } from '../../components/ui/SidebarLayout';
import { breakpoints, colors } from '../../lib/theme';

const LANDLORD_NAV_ITEMS = [
  { label: 'Dashboard',   icon: Home,          route: '/(landlord)/dashboard',   segment: 'dashboard' },
  { label: 'Properties',  icon: Building2,     route: '/(landlord)/properties',  segment: 'properties' },
  { label: 'Tenants',     icon: Users,         route: '/(landlord)/tenants',     segment: 'tenants' },
  { label: 'Maintenance', icon: Wrench,        route: '/(landlord)/maintenance', segment: 'maintenance' },
  { label: 'Messages',    icon: MessageSquare, route: '/(landlord)/messages',    segment: 'messages' },
  { label: 'Help',        icon: Bot,           route: '/(landlord)/tend',        segment: 'tend' },
] as const;

export default function LandlordLayout() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (mounted && width >= breakpoints.md) return <SidebarLayout navItems={LANDLORD_NAV_ITEMS} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: { borderTopColor: colors.gray[100] },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={22} color={color} /> }} />
      <Tabs.Screen name="tenants" options={{ title: 'Tenants', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Maintenance', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />

      {/* Tend AI hidden from mobile tab bar — accessible via sidebar on desktop */}
      <Tabs.Screen name="tend" options={{ href: null }} />
      <Tabs.Screen name="financials/index" options={{ href: null }} />

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
