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
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { requestsApi, type Request, type Offer } from '@/services/requestsApi';

const { width } = Dimensions.get('window');

type PartnerType = 'store' | 'mechanic' | 'tow' | 'rental';

export default function PartnerDashboardScreen() {
  const { partnerType } = useLocalSearchParams<{ partnerType: PartnerType }>();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const partnerId = 'demo-partner-123';

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [partnerType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allRequests = await requestsApi.getRequests();
      const relevantRequests = allRequests.filter(request => {
        switch (partnerType) {
          case 'store':
            return (request.service === 'parts') || (!!request.partName && !!request.vehicle);
          case 'mechanic':
            return request.service === 'mechanic';
          case 'tow':
            return request.service === 'tow';
          case 'rental':
            return request.service === 'rental';
          default:
            return true;
        }
      });

      const offers = await requestsApi.getOffers(undefined, undefined, partnerId);
      
      setRequests(relevantRequests);
      setMyOffers(offers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!selectedRequest || !offerPrice) {
      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ფასი');
      return;
    }

    try {
      await requestsApi.createOffer({
        reqId: selectedRequest.id,
        providerName: getPartnerTitle(),
        priceGEL: parseFloat(offerPrice),
        etaMin: 30,
        partnerId: partnerId,
        userId: selectedRequest.userId,
      });

      Alert.alert('წარმატება', 'შეთავაზება წარმატებით გაიგზავნა!');
      setShowOfferModal(false);
      setOfferPrice('');
      fetchData();
    } catch (error) {
      console.error('Error creating offer:', error);
      Alert.alert('შეცდომა', 'შეთავაზების გაგზავნისას მოხდა შეცდომა');
    }
  };

  const getPartnerTitle = () => {
    switch (partnerType) {
      case 'store':
        return 'ნაწილების მაღაზია';
      case 'mechanic':
        return 'ხელოსანი';
      case 'tow':
        return 'ევაკუატორი';
      case 'rental':
        return 'ქირაობის სერვისი';
      default:
        return 'პარტნიორი';
    }
  };

  const getServiceGradient = (service?: string): [string, string] => {
    const inferService = () => {
      if (!service) return undefined;
      return service;
    };
    const s = inferService();
    switch (service) {
      case 'mechanic':
        return ['rgba(59, 130, 246, 0.12)', 'rgba(29, 78, 216, 0.08)'];
      case 'tow':
        return ['rgba(245, 158, 11, 0.12)', 'rgba(217, 119, 6, 0.08)'];
      case 'rental':
        return ['rgba(139, 92, 246, 0.12)', 'rgba(124, 58, 237, 0.08)'];
      default:
        return ['rgba(16, 185, 129, 0.12)', 'rgba(5, 150, 105, 0.08)'];
    }
  };

  const getServiceIconAndColor = (service?: string): { name: any; color: string } => {
    const text = (service || '').toLowerCase();
    if (text === 'mechanic' || /ხელოს|repair|mechanic/i.test(text)) return { name: 'build', color: '#3B82F6' } as const;
    if (text === 'tow' || /evacu|tow|evak/i.test(text)) return { name: 'car', color: '#F59E0B' } as const;
    if (text === 'rental' || /rent|ქირ/i.test(text)) return { name: 'car-sport', color: '#8B5CF6' } as const;
    return { name: 'construct', color: '#10B981' } as const;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'ახლა';
    if (diffInMinutes < 60) return `${diffInMinutes} წთ წინ`;
    if (diffInHours < 24) return `${diffInHours} სთ წინ`;
    if (diffInDays < 7) return `${diffInDays} დღე წინ`;
    return `${Math.floor(diffInDays / 7)} კვირა წინ`;
  };

  const offeredRequestIds = new Set(myOffers.filter(o => o.partnerId === partnerId).map(o => o.reqId));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim }
          ]}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{getPartnerTitle()}</Text>
                <Text style={styles.headerSubtitle}>{requests.length} აქტიური მოთხოვნა</Text>
              </View>

              <Pressable
                style={styles.chatButton}
                onPress={() => router.push(`/partner-chats?partnerType=${partnerType}` as any)}
              >
                <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Requests List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor="#10B981"
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.sectionTitle}>აქტიური მოთხოვნები</Text>
            
            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>მოთხოვნები არ არის</Text>
              </View>
            ) : (
              requests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <LinearGradient
                    colors={getServiceGradient(request.service)}
                    style={styles.requestGradient}
                  >
                    {/* Request Header */}
                    <View style={styles.requestHeader}>
                    <View style={styles.requestTitleRow}>
                        {(() => { const ic = getServiceIconAndColor(request.service); return (
                          <Ionicons name={ic.name} size={20} color={ic.color} />
                        ); })()}
                        <Text style={styles.requestTitle}>{request.partName || 'მოთხოვნა'}</Text>
                      </View>
                      {offeredRequestIds.has(request.id) && (
                        <View style={styles.sentBadge}>
                          <Text style={styles.sentBadgeText}>გაგზავნილია</Text>
                        </View>
                      )}
                    </View>

                    {/* Vehicle Info */}
                    <View style={styles.chipsRow}>
                      <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' }]}>
                        <Ionicons name="car" size={12} color="#9CA3AF" />
                        <Text style={styles.chipText}>{request.vehicle.make} {request.vehicle.model}</Text>
                      </View>
                      {!!request.vehicle.year && (
                        <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' }]}>
                          <Ionicons name="calendar" size={12} color="#9CA3AF" />
                          <Text style={styles.chipText}>{request.vehicle.year}</Text>
                        </View>
                      )}
                      {!!request.location && (
                        <View style={[styles.chip, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.24)' }]}>
                          <Ionicons name="location" size={12} color="#6366F1" />
                          <Text style={[styles.chipText, { color: '#A5B4FC' }]} numberOfLines={1}>
                            {request.location}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    <Text style={styles.descriptionText} numberOfLines={3}>
                      {request.description?.trim() || 'დამატებითი აღწერა მითითებული არ არის'}
                    </Text>

                    {/* Footer */}
                    <View style={styles.requestFooter}>
                      <Text style={styles.timeText}>
                        <Ionicons name="time-outline" size={12} color="#9CA3AF" /> {formatTimeAgo(request.createdAt)}
                      </Text>
                      
                      <View style={styles.actionsRow}>
                        {offeredRequestIds.has(request.id) ? (
                          <Pressable
                            style={styles.chatActionButton}
                            onPress={() => router.push(`/partner-chat/${request.id}` as any)}
                          >
                            <Ionicons name="chatbubbles" size={16} color="#6366F1" />
                            <Text style={styles.chatActionText}>ჩატი</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            style={styles.offerButton}
                            onPress={() => {
                              setSelectedRequest(request);
                              setShowOfferModal(true);
                            }}
                          >
                            <LinearGradient
                              colors={['#10B981', '#059669']}
                              style={styles.offerButtonGradient}
                            >
                              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                              <Text style={styles.offerButtonText}>შეთავაზება</Text>
                            </LinearGradient>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>

        {/* Offer Modal */}
        <Modal
          visible={showOfferModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowOfferModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>შეთავაზების შექმნა</Text>
              <Pressable onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedRequest && (
                <>
                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>მოთხოვნა</Text>
                    <Text style={styles.modalValue}>{selectedRequest.partName}</Text>
                    <Text style={styles.modalValue}>
                      {selectedRequest.vehicle.make} {selectedRequest.vehicle.model} ({selectedRequest.vehicle.year})
                    </Text>
                  </View>

                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>ფასი (₾) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={offerPrice}
                      onChangeText={setOfferPrice}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <Pressable
                    style={styles.submitButton}
                    onPress={handleCreateOffer}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>შეთავაზების გაგზავნა</Text>
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  },
  content: {
    padding: 20,
    gap: 16,
  },

  // Header
  header: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  sectionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Request Card
  requestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  requestGradient: {
    padding: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '80%',
  },
  chipText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#9CA3AF',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  requestTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  sentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  sentBadgeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
    color: '#10B981',
  },
  vehicleText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  descriptionText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  chatActionText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#6366F1',
  },
  offerButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  offerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offerButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  modalValue: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

