import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: Props) {
  const base = 'rounded-xl py-4 px-6 items-center justify-center';
  const variants = {
    primary: 'bg-brand-600',
    secondary: 'bg-gray-100 border border-gray-200',
  };
  const textColor = variant === 'primary' ? 'text-white font-semibold' : 'text-gray-800 font-medium';

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#374151'} />
      ) : (
        <Text className={textColor}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
