import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { requestsApi, type Request, type Offer } from '@/services/requestsApi';
import { useUser } from '@/contexts/UserContext';

const { width } = Dimensions.get('window');

// Types are now imported from requestsApi

export default function OffersScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [request, setRequest] = useState<Request | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));


  useEffect(() => {
    fetchData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [requestId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestData, offersData] = await Promise.all([
        requestsApi.getRequestById(requestId || '1'),
        requestsApi.getOffers(requestId || '1')
      ]);
      setRequest(requestData);
      setOffers(offersData);
    } catch (error) {
      console.error('Failed to fetch from API:', error);
      setRequest(null);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'parts':
        return 'construct-outline';
      case 'mechanic':
        return 'build-outline';
      case 'tow':
        return 'car-outline';
      case 'rental':
        return 'car-sport-outline';
      default:
        return 'help-outline';
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'parts':
        return '#10B981';
      case 'mechanic':
        return '#3B82F6';
      case 'tow':
        return '#F59E0B';
      case 'rental':
        return '#8B5CF6';
      default:
        return '#6366F1';
    }
  };

  const getServiceGradient = (service: string) => {
    switch (service) {
      case 'parts':
        return ['#10B981', '#059669'];
      case 'mechanic':
        return ['#3B82F6', '#1D4ED8'];
      case 'tow':
        return ['#F59E0B', '#D97706'];
      case 'rental':
        return ['#8B5CF6', '#7C3AED'];
      default:
        return ['#6366F1', '#4F46E5'];
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return '#10B981';
      case 'busy':
        return '#F59E0B';
      case 'offline':
        return '#6B7280';
      default:
        return '#6366F1';
    }
  };

  const handleOfferPress = (offer: Offer) => {
    // Navigate to specific chat using requestId
    router.push(`/chat/chat-${requestId}` as any);
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 3600000) return 'ახლახანს';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} საათის წინ`;
    return `${Math.floor(diff / 86400000)} დღის წინ`;
  };

  if (!request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>იტვირთება...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </Pressable>
                  
                  <Text style={styles.heroTitle}>შეთავაზებები</Text>
                  <Text style={styles.heroSubtitle}>
                    {request.partName} • {offers.length} შეთავაზება
                  </Text>
                  <View style={styles.heroIconContainer}>
                    <Ionicons name="chatbubbles" size={24} color="#6366F1" />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Request Info */}
            <View style={styles.requestInfoSection}>
              <Text style={styles.sectionTitle}>მოთხოვნის დეტალები</Text>
              <View style={styles.requestCard}>
                <LinearGradient
                  colors={getServiceGradient(request.service) as [string, string]}
                  style={styles.requestGradient}
                >
                  <View style={styles.requestContent}>
                    <View style={styles.requestIconContainer}>
                      <Ionicons name={getServiceIcon(request.service) as any} size={28} color="#FFFFFF" />
                    </View>
                    <View style={styles.requestDetails}>
                      <Text style={styles.requestTitle}>{request.partName}</Text>
                      <Text style={styles.vehicleInfo}>
                        {request.vehicle.make} {request.vehicle.model} ({request.vehicle.year})
                      </Text>
                      {request.description && (
                        <Text style={styles.requestDescription} numberOfLines={3}>
                          {request.description}
                        </Text>
                      )}
                      {request.location && (
                        <View style={styles.locationContainer}>
                          <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.locationText}>{request.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Offers List */}
            <View style={styles.offersSection}>
              <Text style={styles.sectionTitle}>შეთავაზებები ({offers.length})</Text>
              <ScrollView 
                style={styles.offersContainer}
                contentContainerStyle={styles.offersContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#6366F1"
                    colors={['#6366F1']}
                  />
                }
              >
                {offers.map((offer, index) => (
                  <Animated.View
                    key={offer.id}
                    style={[
                      styles.offerWrapper,
                      {
                        transform: [
                          { 
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 50],
                              outputRange: [0, 50 + (index * 20)],
                              extrapolate: 'clamp',
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    <Pressable
                      style={styles.offerCard}
                      onPress={() => handleOfferPress(offer)}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.offerGradient}
                      >
                        <View style={styles.offerContent}>
                          {/* Provider Info */}
                          <View style={styles.providerInfo}>
                            <View style={styles.providerAvatarContainer}>
                              <View style={[styles.providerAvatar, { backgroundColor: `${getServiceColor(offer.service)}20` }]}>
                                <Ionicons 
                                  name={getServiceIcon(offer.service) as any} 
                                  size={24} 
                                  color={getServiceColor(offer.service)} 
                                />
                              </View>
                              {offer.isOnline && <View style={styles.onlineIndicator} />}
                            </View>
                            
                            <View style={styles.providerDetails}>
                              <View style={styles.providerHeader}>
                                <Text style={styles.providerName}>{offer.providerName}</Text>
                                <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(offer.availability) + '20' }]}>
                                  <Text style={[styles.availabilityText, { color: getAvailabilityColor(offer.availability) }]}>
                                    {offer.availability === 'available' ? 'ონლაინ' : 
                                     offer.availability === 'busy' ? 'დაკავებული' : 'ოფლაინ'}
                                  </Text>
                                </View>
                              </View>
                              
                              <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={14} color="#F59E0B" />
                                <Text style={styles.ratingText}>{offer.rating}</Text>
                                <Text style={styles.reviewText}>({offer.reviewCount} შეფასება)</Text>
                              </View>
                              
                              <Text style={styles.responseTime}>პასუხი: {offer.responseTime}</Text>
                            </View>
                          </View>

                          {/* Offer Details */}
                          <View style={styles.offerDetails}>
                            <Text style={styles.offerDescription} numberOfLines={3}>
                              {offer.description}
                            </Text>
                            
                            {offer.estimatedTime && (
                              <View style={styles.timeContainer}>
                                <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.timeText}>{offer.estimatedTime}</Text>
                              </View>
                            )}
                            
                            {offer.location && (
                              <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.locationText}>{offer.location}</Text>
                              </View>
                            )}
                            
                            {offer.warranty && (
                              <View style={styles.warrantyContainer}>
                                <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
                                <Text style={styles.warrantyText}>{offer.warranty} გარანტია</Text>
                              </View>
                            )}
                          </View>

                          {/* Price and Action */}
                          <View style={styles.offerFooter}>
                            <View style={styles.priceContainer}>
                              <Text style={styles.priceAmount}>{offer.price} {offer.currency}</Text>
                              <Text style={styles.priceLabel}>ღირებულება</Text>
                            </View>
                            
                            <Pressable
                              style={styles.chatButton}
                              onPress={() => handleOfferPress(offer)}
                            >
                              <LinearGradient
                                colors={[getServiceColor(offer.service), getServiceColor(offer.service) + 'CC']}
                                style={styles.chatButtonGradient}
                              >
                                <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.chatButtonText}>ჩატი</Text>
                              </LinearGradient>
                            </Pressable>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                ))}
                
                {offers.length === 0 && (
                  <Animated.View 
                    style={[
                      styles.emptyState,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                      }
                    ]}
                  >
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="chatbubbles-outline" size={48} color="#6366F1" />
                    </View>
                    <Text style={styles.emptyTitle}>შეთავაზებები ჯერ არ არის</Text>
                    <Text style={styles.emptySubtitle}>
                      მაღაზიები გამოგიგზავნიან შეთავაზებებს მალე
                    </Text>
                  </Animated.View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    gap: 32,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    marginTop: 20,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    fontWeight: '800',
    marginTop: 40,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Request Info
  requestInfoSection: {
    gap: 20,
  },
  requestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  requestGradient: {
    padding: 16,
    minHeight: 120,
  },
  requestContent: {
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  requestIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDetails: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  vehicleInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Offers Section
  offersSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  offersContainer: {
    maxHeight: 500,
  },
  offersContent: {
    gap: 16,
  },
  offerWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  offerCard: {
    flex: 1,
  },
  offerGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  offerContent: {
    gap: 16,
  },

  // Provider Info
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  providerAvatarContainer: {
    position: 'relative',
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  providerDetails: {
    flex: 1,
    gap: 6,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  availabilityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  responseTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },

  // Offer Details
  offerDetails: {
    gap: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  warrantyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warrantyText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },

  // Offer Footer
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceAmount: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  priceLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  chatButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
