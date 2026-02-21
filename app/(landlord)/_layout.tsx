import { Home, Building2, Users, Wrench, MessageSquare, Bot } from 'lucide-react-native';
import { SidebarLayout } from '../../components/ui/SidebarLayout';

const LANDLORD_NAV_ITEMS = [
  { label: 'Dashboard',   icon: Home,          route: '/(landlord)/dashboard',   segment: 'dashboard' },
  { label: 'Properties',  icon: Building2,     route: '/(landlord)/properties',  segment: 'properties' },
  { label: 'Tenants',     icon: Users,         route: '/(landlord)/tenants',     segment: 'tenants' },
  { label: 'Maintenance', icon: Wrench,        route: '/(landlord)/maintenance', segment: 'maintenance' },
  { label: 'Messages',    icon: MessageSquare, route: '/(landlord)/messages',    segment: 'messages' },
  { label: 'Help',        icon: Bot,           route: '/(landlord)/tend',        segment: 'tend', hideInMobileNav: true },
] as const;

export default function LandlordLayout() {
  return <SidebarLayout navItems={LANDLORD_NAV_ITEMS} />;
}
