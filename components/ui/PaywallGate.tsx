import { View, Text } from 'react-native';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  feature: string;
  onUpgrade: () => void;
  locked: boolean;
}

export function PaywallGate({ children, feature, onUpgrade, locked }: Props) {
  if (!locked) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-4">🔒</Text>
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">Upgrade to unlock</Text>
      <Text className="text-gray-500 text-center mb-8">{feature} is included in the Standard plan — $9/unit/month</Text>
      <Button title="View Plans" onPress={onUpgrade} />
    </View>
  );
}
