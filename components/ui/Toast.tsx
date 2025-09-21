import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: (id: string) => void;
  position?: 'top' | 'bottom';
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
  position = 'top',
}) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // შემოსვლის ანიმაცია
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // ავტომატური გაქრობა
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.(id);
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          color: Colors.light.success,
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
        };
      case 'error':
        return {
          icon: 'x-circle' as const,
          color: Colors.light.error,
          backgroundColor: '#FEF2F2',
          borderColor: '#FECACA',
        };
      case 'warning':
        return {
          icon: 'alert-triangle' as const,
          color: Colors.light.warning,
          backgroundColor: '#FFFBEB',
          borderColor: '#FED7AA',
        };
      case 'info':
        return {
          icon: 'info' as const,
          color: Colors.light.primary,
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE',
        };
      default:
        return {
          icon: 'info' as const,
          color: Colors.light.primary,
          backgroundColor: '#EFF6FF',
          borderColor: '#BFDBFE',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
          top: position === 'top' ? 60 : undefined,
          bottom: position === 'bottom' ? 100 : undefined,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
          },
        ]}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
            <Feather name={config.icon} size={20} color="#FFFFFF" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: config.color }]}>
              {title}
            </Text>
            {message && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={16} color={Colors.light.secondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.light.secondary,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});

export default Toast;
