import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface CarFAXSuccessProps {
  vinCode: string;
  carData: any;
  onClose: () => void;
}

export default function CarFAXSuccess({ vinCode, carData, onClose }: CarFAXSuccessProps) {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDownload = () => {
    // სიმულაცია - ფაილის ჩამოტვირთვა
    console.log('📄 CarFAX მოხსენების ჩამოტვირთვა:', carData.reportId);
  };

  const handleShare = () => {
    // სიმულაცია - მოხსენების გაზიარება
    console.log('📤 CarFAX მოხსენების გაზიარება:', carData.reportId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" translucent />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CarFAX მოხსენება</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <Animated.View 
            style={[
              styles.successSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
              },
            ]}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>მოხსენება მოიძებნა!</Text>
            <Text style={styles.successSubtitle}>
              VIN კოდისთვის სრული ინფორმაცია მოიძებნა CarFAX ბაზაში
            </Text>
          </Animated.View>

          {/* Car Information */}
          <Animated.View 
            style={[
              styles.carInfoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>მანქანის ინფორმაცია</Text>
            <View style={styles.carInfoCard}>
              <View style={styles.carInfoRow}>
                <Text style={styles.carInfoLabel}>მარკა/მოდელი:</Text>
                <Text style={styles.carInfoValue}>{carData.year} {carData.make} {carData.model}</Text>
              </View>
              <View style={styles.carInfoRow}>
                <Text style={styles.carInfoLabel}>VIN კოდი:</Text>
                <Text style={styles.carInfoValue}>{vinCode}</Text>
              </View>
              <View style={styles.carInfoRow}>
                <Text style={styles.carInfoLabel}>გარბენი:</Text>
                <Text style={styles.carInfoValue}>{carData.mileage.toLocaleString()} კმ</Text>
              </View>
              <View style={styles.carInfoRow}>
                <Text style={styles.carInfoLabel}>მფლობელები:</Text>
                <Text style={styles.carInfoValue}>{carData.owners}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Report Details */}
          <Animated.View 
            style={[
              styles.reportSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>მოხსენების დეტალები</Text>
            <View style={styles.reportCard}>
              <View style={styles.reportItem}>
                <View style={styles.reportIcon}>
                  <Ionicons name="car" size={20} color="#10B981" />
                </View>
                <View style={styles.reportContent}>
                  <Text style={styles.reportTitle}>ავარიები</Text>
                  <Text style={styles.reportValue}>
                    {carData.accidents === 0 ? 'ავარიები არ არის' : `${carData.accidents} ავარია`}
                  </Text>
                </View>
              </View>

              <View style={styles.reportItem}>
                <View style={styles.reportIcon}>
                  <Ionicons name="document-text" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.reportContent}>
                  <Text style={styles.reportTitle}>სერვისის ჩანაწერები</Text>
                  <Text style={styles.reportValue}>{carData.serviceRecords} ჩანაწერი</Text>
                </View>
              </View>

              <View style={styles.reportItem}>
                <View style={styles.reportIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                </View>
                <View style={styles.reportContent}>
                  <Text style={styles.reportTitle}>სტატუსი</Text>
                  <Text style={styles.reportValue}>{carData.titleStatus}</Text>
                </View>
              </View>

              <View style={styles.reportItem}>
                <View style={styles.reportIcon}>
                  <Ionicons name="calendar" size={20} color="#F59E0B" />
                </View>
                <View style={styles.reportContent}>
                  <Text style={styles.reportTitle}>ბოლო სერვისი</Text>
                  <Text style={styles.reportValue}>{carData.lastServiceDate}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Report ID */}
          <Animated.View 
            style={[
              styles.reportIdSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.reportIdCard}>
              <Text style={styles.reportIdLabel}>მოხსენების ID</Text>
              <Text style={styles.reportIdValue}>{carData.reportId}</Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.actionsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={handleDownload}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.downloadButtonGradient}
              >
                <Ionicons name="download" size={20} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>PDF ჩამოტვირთვა</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <View style={styles.shareButtonContent}>
                <Ionicons name="share" size={20} color="#8B5CF6" />
                <Text style={styles.shareButtonText}>გაზიარება</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 30 }} />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F0F0F',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  carInfoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  carInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  carInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.1)',
  },
  carInfoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  carInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  reportSection: {
    marginBottom: 30,
  },
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  reportValue: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  reportIdSection: {
    marginBottom: 30,
  },
  reportIdCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
  },
  reportIdLabel: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  reportIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  actionsSection: {
    gap: 12,
  },
  downloadButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    fontFamily: 'Inter',
  },
});
