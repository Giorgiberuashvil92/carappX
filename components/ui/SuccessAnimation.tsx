import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SuccessAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function SuccessAnimation({
  visible,
  onComplete,
}: SuccessAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiParticles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Main icon animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();

    // Confetti particles animation
    confettiParticles.forEach((particle, index) => {
      const delay = index * 50;
      const duration = 2000 + Math.random() * 1000;
      const endX = Math.random() * width;
      const endY = height + 100;

      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: endX,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: endY,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 720,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(delay + duration * 0.3),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Call onComplete after animation
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti Particles */}
      {confettiParticles.map((particle, index) => {
        const color = colors[index % colors.length];
        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.confetti,
              {
                backgroundColor: color,
                left: particle.x,
                top: particle.y,
                transform: [
                  {
                    rotate: particle.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        );
      })}

      {/* Success Icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={120} color="#10B981" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});


