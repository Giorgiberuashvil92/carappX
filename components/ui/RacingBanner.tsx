import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const RacingBanner: React.FC = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push('/racing');
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#1F2937', '#111827', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Racing Stripes */}
        <View style={styles.racingStripes}>
          <View style={[styles.stripe, { backgroundColor: '#EF4444' }]} />
          <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.stripe, { backgroundColor: '#EF4444' }]} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="car-sport" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>🏁 RACING ZONE</Text>
              <Text style={styles.subtitle}>მომავალი რბოლები • ჯილდოები • ტურნირები</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.actionButton}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>შესვლა</Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Racing Pattern */}
        <View style={styles.racingPattern}>
          <View style={styles.checkeredFlag}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={[
                styles.checkeredSquare,
                { backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent' }
              ]} />
            ))}
          </View>
        </View>

        {/* Speed Lines */}
        <View style={styles.speedLines}>
          {[...Array(5)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.speedLine,
                { 
                  top: 20 + (i * 15),
                  width: 40 - (i * 5),
                  opacity: 0.3 - (i * 0.05)
                }
              ]} 
            />
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 100,
  },
  racingStripes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 4,
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Outfit',
    lineHeight: 16,
  },
  rightSection: {
    marginLeft: 16,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  racingPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    opacity: 0.1,
    zIndex: 1,
  },
  checkeredFlag: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
  },
  checkeredSquare: {
    width: '25%',
    height: '25%',
  },
  speedLines: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 1,
  },
  speedLine: {
    position: 'absolute',
    right: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});

export default RacingBanner;
