import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, GestureResponderEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';

type ButtonVariant = 'black' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type AppButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  rightIcon?: React.ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: any;
  textStyle?: any;
};

const sizeConfig: Record<ButtonSize, { paddingVertical: number; fontSize: number; radius: number; icon: number }>
  = {
    sm: { paddingVertical: 10, fontSize: 13, radius: 12, icon: 16 },
    md: { paddingVertical: 14, fontSize: 15, radius: 16, icon: 18 },
    lg: { paddingVertical: 18, fontSize: 16, radius: 18, icon: 20 },
  };

export default function Button({
  title,
  onPress,
  icon,
  rightIcon,
  disabled = false,
  loading = false,
  variant = 'black',
  size = 'md',
  style,
  textStyle,
}: AppButtonProps) {
  const sz = sizeConfig[size];

  const baseStyles = [
    styles.base,
    { paddingVertical: sz.paddingVertical, borderRadius: sz.radius },
  ];

  const variantStyles = (() => {
    switch (variant) {
      case 'black':
        return styles.black;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
    }
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[baseStyles, variantStyles, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'black' ? '#FFFFFF' : '#111827'} />
      ) : (
        <>
          {icon && (
            <View style={{ marginRight: 8 }}>
              <Feather name={icon} size={sz.icon} color={variant === 'black' ? '#FFFFFF' : '#111827'} />
            </View>
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize: sz.fontSize,
                color: variant === 'black' ? '#FFFFFF' : '#111827',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && (
            <View style={{ marginLeft: 8 }}>
              <Feather name={rightIcon} size={sz.icon} color={variant === 'black' ? '#FFFFFF' : '#111827'} />
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  black: {
    backgroundColor: '#0B0B0E',
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.6,
  },
});


