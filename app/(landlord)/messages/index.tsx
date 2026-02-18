import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function MessagesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
      </View>
    </SafeAreaView>
  );
}
