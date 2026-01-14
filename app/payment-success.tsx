import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    description?: string;
    orderId?: string;
    vinCode?: string;
    rememberCard?: string;
  }>();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Success animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    // Navigate back or to specific screen based on context
    if (params.vinCode) {
      // If VIN code exists, probably from CarFAX
      router.replace('/(tabs)/garage' as any);
    } else {
      // Default navigation
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleViewOrders = () => {
    router.replace('/(tabs)/carwash' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" translucent />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']}
          style={styles.backgroundGradient}
        />

        {/* Success Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Success Title */}
          <Text style={styles.title}>გადახდა წარმატებულია! 🎉</Text>

          {/* Success Message */}
          <Text style={styles.message}>
            თქვენი გადახდა წარმატებით განხორციელდა
          </Text>

          {/* Payment Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>თანხა:</Text>
              <Text style={styles.detailValue}>{params.amount || '0'}₾</Text>
            </View>
            
            {params.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>აღწერა:</Text>
                <Text style={styles.detailValue}>{params.description}</Text>
              </View>
            )}
            
            {params.orderId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>შეკვეთის ID:</Text>
                <Text style={styles.detailValue}>{params.orderId}</Text>
              </View>
            )}

            {params.rememberCard === 'true' && (
              <View style={styles.rememberCardInfo}>
                <Ionicons name="card" size={16} color="#22C55E" />
                <Text style={styles.rememberCardText}>
                  ბარათი დამახსოვრებულია მომავალი გადახდებისთვის
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="home" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>მთავარ გვერდზე</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewOrders}
              activeOpacity={0.7}
            >
              <Ionicons name="list" size={20} color="#22C55E" />
              <Text style={styles.secondaryButtonText}>ჩემს შეკვეთებზე</Text>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.securityText}>
              ყველა გადახდა დაცულია SSL ენკრიფციით
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  safeArea: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Outfit',
  },
  message: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Outfit',
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Outfit',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  rememberCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
  },
  rememberCardText: {
    fontSize: 12,
    color: '#22C55E',
    marginLeft: 8,
    fontFamily: 'Outfit',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Outfit',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    fontFamily: 'Outfit',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'Outfit',
  },
});
