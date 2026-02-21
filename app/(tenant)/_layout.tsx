import { CreditCard, Wrench, MessageSquare, FileText, HelpCircle } from 'lucide-react-native';
import { SidebarLayout } from '../../components/ui/SidebarLayout';

const TENANT_NAV_ITEMS = [
  { label: 'Pay Rent',   icon: CreditCard,    route: '/(tenant)/pay',         segment: 'pay' },
  { label: 'Requests',   icon: Wrench,        route: '/(tenant)/maintenance', segment: 'maintenance' },
  { label: 'Messages',   icon: MessageSquare, route: '/(tenant)/messages',    segment: 'messages' },
  { label: 'Documents',  icon: FileText,      route: '/(tenant)/documents',   segment: 'documents' },
  { label: 'Help',       icon: HelpCircle,    route: '/(tenant)/help',        segment: 'help' },
] as const;

export default function TenantLayout() {
  return <SidebarLayout navItems={TENANT_NAV_ITEMS} />;
}
