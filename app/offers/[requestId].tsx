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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number | null>(null);


  useEffect(() => {
    // Load last viewed timestamp
    const loadLastViewed = async () => {
      try {
        const stored = await AsyncStorage.getItem(`offers_lastViewed_${requestId}`);
        if (stored) {
          setLastViewedTimestamp(parseInt(stored, 10));
        } else {
          // First time viewing - set current time
          const now = Date.now();
          setLastViewedTimestamp(now);
          await AsyncStorage.setItem(`offers_lastViewed_${requestId}`, String(now));
        }
      } catch (error) {
        console.error('Failed to load last viewed timestamp:', error);
      }
    };
    
    loadLastViewed();
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

  // Update last viewed timestamp when component unmounts
  useEffect(() => {
    return () => {
      // Save current time as last viewed when leaving the page
      AsyncStorage.setItem(`offers_lastViewed_${requestId}`, String(Date.now())).catch(() => {});
    };
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
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
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
            {/* Header / Summary */}
            <View style={styles.headerCard}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color="#111827" />
              </Pressable>
              <View style={styles.headerTexts}>
                <Text style={styles.heroTitle}>შეთავაზებები</Text>
                <Text style={styles.heroSubtitle}>
                  {request.partName} • {request.vehicle.make} {request.vehicle.model} ({request.vehicle.year})
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{offers.length}</Text>
                <Text style={styles.countBadgeSub}>შეთავაზება</Text>
              </View>
            </View>

            {/* Request Info */}
            <View style={styles.requestInfoSection}>
              <View style={styles.requestCard}>
                <View style={styles.requestRow}>
                  <View style={[styles.requestIconContainer, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name={getServiceIcon(request.service || 'parts') as any} size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.requestDetails}>
                    <Text style={styles.requestTitle}>{request.partName}</Text>
                    <Text style={styles.vehicleInfo}>
                      {request.vehicle.make} {request.vehicle.model} ({request.vehicle.year})
                    </Text>
                    {request.location && (
                      <View style={styles.locationPill}>
                        <Ionicons name="location-outline" size={14} color="#4F46E5" />
                        <Text style={styles.locationPillText}>{request.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {request.description && (
                  <Text style={styles.requestDescriptionLight} numberOfLines={3}>
                    {request.description}
                  </Text>
                )}
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
                {offers.map((offer, index) => {
                  const service = (offer as any)?.service || request.service || 'parts';
                  const price = (offer as any)?.price ?? (offer as any)?.priceGEL;
                  const currency = (offer as any)?.currency ?? '₾';
                  const isOnline = Boolean((offer as any)?.isOnline);
                  const availability = (offer as any)?.availability ?? 'available';
                  const rating = (offer as any)?.rating ?? '5.0';
                  const reviewCount = (offer as any)?.reviewCount ?? 0;
                  const responseTime = (offer as any)?.responseTime ?? `${offer.etaMin || 30} წთ`;
                  const description = (offer as any)?.description ?? 'აღწერა არ არის მოცემული';
                  const estimatedTime = (offer as any)?.estimatedTime ?? (offer.etaMin ? `${offer.etaMin} წთ` : undefined);
                  const location = (offer as any)?.location ?? request.location;
                  const warranty = (offer as any)?.warranty;
                  
                  // Check if offer is new (created after last viewed timestamp)
                  // TODO: დროებით - ყველა შეთავაზება გამოჩნდება როგორც ახალი
                  const isNewOffer = true; // lastViewedTimestamp !== null && offer.createdAt > lastViewedTimestamp;

                  return (
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
                        colors={['#FFFFFF', '#F8FAFF']}
                        style={[
                          styles.offerGradient,
                          isNewOffer && {
                            borderColor: '#3B82F6',
                            borderWidth: 2,
                          }
                        ]}
                      >
                        <View style={styles.offerContent}>
                          {/* Header with provider + price */}
                          <View style={styles.offerHeaderRow}>
                            <View style={styles.providerInfo}>
                              <View style={styles.providerAvatarContainer}>
                                <View style={[styles.providerAvatar, { backgroundColor: `${getServiceColor(service)}20` }]}>
                                  <Ionicons 
                                    name={getServiceIcon(service) as any} 
                                    size={24} 
                                    color={getServiceColor(service)} 
                                  />
                                </View>
                                {isOnline && <View style={styles.onlineIndicator} />}
                              </View>
                              
                              <View style={styles.providerDetails}>
                                <View style={styles.providerHeader}>
                                  <Text style={styles.providerName}>{offer.providerName}</Text>
                                  <View>
                                   {isNewOffer && (
                          <View style={styles.newOfferBadge}>
                            <Ionicons name="sparkles" size={14} color="#3B82F6" />
                            <Text style={styles.newOfferBadgeText}>ახალი</Text>
                          </View>
                        )}

                                  </View>
                                </View>
                                
                               
                                
                                <Text style={styles.responseTime}>პასუხი: {responseTime}</Text>
                              </View>
                            </View>

                          </View>

                          {/* Offer Details */}
                          <View style={styles.offerDetails}>
                            <Text style={styles.offerDescription} numberOfLines={2}>
                              {description}
                            </Text>
                            
                            <View style={styles.offerMetaRow}>
                              {estimatedTime && (
                                <View style={styles.metaPill}>
                                  <Ionicons name="time-outline" size={12} color="#E5E7EB" />
                                  <Text style={styles.metaText}>{estimatedTime}</Text>
                                </View>
                              )}
                              {location && (
                                <View style={styles.metaPill}>
                                  <Ionicons name="location-outline" size={12} color="#E5E7EB" />
                                  <Text style={styles.metaText}>{location}</Text>
                                </View>
                              )}
                              {warranty && (
                                <View style={styles.metaPill}>
                                  <Ionicons name="shield-checkmark-outline" size={12} color="#E5E7EB" />
                                  <Text style={styles.metaText}>{warranty} გარანტია</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Action */}
                          <View style={styles.offerFooter}>
                            <View style={[styles.priceBadge, { borderColor: `${getServiceColor(service)}50` }]}>
                              <Text style={styles.priceBadgeAmount}>{price ?? '—'} {currency}</Text>
                              <Text style={styles.priceBadgeLabel}>ფასი</Text>
                            </View>
                            <Text style={styles.actionHint}>გახსენი ჩატი დეტალებისთვის</Text>
                            <View style={styles.chatButtonContainer}>
                             
                              <Pressable
                                style={styles.chatButton}
                                onPress={() => handleOfferPress(offer)}
                              >
                                <LinearGradient
                                  colors={['#6366F1', '#4F46E5']}
                                  style={styles.chatButtonGradient}
                                >
                                  <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
                                  <Text style={styles.chatButtonText}>ჩატი</Text>
                                </LinearGradient>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                  );
                })}
                
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
    backgroundColor: '#F6F7FB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
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
    backgroundColor: '#F6F7FB',
  },
  loadingText: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '600',
  },

  // Hero Section
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '600',
  },
  heroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  countBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4338CA',
    lineHeight: 18,
  },
  countBadgeSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    opacity: 0.9,
  },

  // Request Info
  requestInfoSection: {
    gap: 12,
  },
  requestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    padding: 14,
  },
  requestRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  requestIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDetails: {
    gap: 4,
    flex: 1,
    alignItems: 'flex-start',
  },
  requestTitle: {
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'left',
    fontWeight: '800',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'left',
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
  },
  requestDescriptionLight: {
    marginTop: 10,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
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
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginTop: 6,
  },
  locationPillText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '700',
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
    color: '#0F172A',
    fontWeight: '700',
  },
  offersContainer: {
    // allow full height; outer ScrollView handles scrolling
  },
  offersContent: {
    gap: 10,
    paddingBottom: 14,
  },
  offerWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  offerCard: {
    flex: 1,
  },
  offerGradient: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  chatButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  newOfferBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  offerContent: {
    gap: 8,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },

  // Provider Info
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  providerAvatarContainer: {
    position: 'relative',
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    gap: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 14.5,
    color: '#111827',
    fontWeight: '700',
    flex: 1,
  },
  availabilityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  responseTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Offer Details
  offerDetails: {
    gap: 8,
  },
  offerDescription: {
    fontSize: 12.5,
    color: '#1F2937',
    fontWeight: '400',
    lineHeight: 17,
  },
  offerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaText: {
    fontSize: 10.5,
    color: '#334155',
    fontWeight: '600',
  },

  // Offer Footer
  offerFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionHint: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  chatButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    backgroundColor: '#EEF2FF',
    alignItems: 'flex-end',
    minWidth: 78,
  },
  priceBadgeAmount: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '800',
  },
  priceBadgeLabel: {
    fontSize: 10.5,
    color: '#475569',
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
    backgroundColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
