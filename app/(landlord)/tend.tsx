import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function TendAIScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Tend AI</Text>
      </View>
    </SafeAreaView>
  );
}
