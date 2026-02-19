import { Platform, View, KeyboardAvoidingView, type ViewProps } from 'react-native';

interface Props extends ViewProps { children: React.ReactNode; }

export function KeyboardView({ style, children, ...props }: Props) {
  if (Platform.OS === 'web') {
    return <View style={style} {...props}>{children}</View>;
  }
  return (
    <KeyboardAvoidingView style={style} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} {...props}>
      {children}
    </KeyboardAvoidingView>
  );
}
