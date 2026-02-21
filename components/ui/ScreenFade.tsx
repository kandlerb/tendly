import { useRef, useCallback } from 'react';
import { Animated, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function ScreenFade({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start();
      return () => opacity.setValue(0);
    }, [])
  );
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}
