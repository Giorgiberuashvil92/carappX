import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { requestsApi, type Request, type Offer } from '@/services/requestsApi';
import { useUser } from '@/contexts/UserContext';
import { aiApi } from '@/services/aiApi';

export default function DismantlerDashboardScreen() {
  const { user } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'offers'>('requests');

  const partnerId = user?.id || '';

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setStoreName(prev => prev || user.name);
    }
  }, [user?.name]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let relevantRequests: Request[] = [];
      
      if (user?.id) {
        const seller = await aiApi.getSellerStatus({ userId: user.id });
        const backendMatches = (seller.data?.matchingRequests || []) as any as Request[];
        
        const derivedName =
          seller.data?.ownedStores?.find((store: any) => store?.title)?.title?.trim() ||
          (seller.data as any)?.profile?.storeName?.trim() ||
          user?.name?.trim();
        
        if (derivedName) {
          setStoreName(derivedName);
        }

        // უზრუნველვყოფთ, რომ ყოველი მოთხოვნას ჰქონდეს `id` (fallback `_id`-ზე).
        relevantRequests = backendMatches
          .map(req => ({
            ...req,
            id: (req as any)?.id || (req as any)?._id || '',
          }))
          .filter(req => !!req.id);
      }

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

  const closeOfferModal = () => {
    setShowOfferModal(false);
    setOfferPrice('');
    setSelectedRequest(null);
    setIsSubmittingOffer(false);
  };

  const handleCreateOffer = async () => {
    if (isSubmittingOffer) return;
    const reqId = selectedRequest?.id || (selectedRequest as any)?._id;

    if (!reqId || !selectedRequest || !offerPrice) {
      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ფასი');
      return;
    }

    setIsSubmittingOffer(true);

    try {
      await requestsApi.createOffer({
        reqId,
        providerName: (storeName && storeName.trim()) || 'დაშლილების მაღაზია',
        priceGEL: parseFloat(offerPrice),
        etaMin: 30,
        partnerId: partnerId,
        userId: selectedRequest.userId,
      });

      Alert.alert('წარმატება', 'შეთავაზება წარმატებით გაიგზავნა!');
      fetchData();
      closeOfferModal();
    } catch (error) {
      console.error('Error creating offer:', error);
      Alert.alert('შეცდომა', 'შეთავაზების გაგზავნისას მოხდა შეცდომა');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const getServiceGradient = (service?: string): [string, string] => {
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

  const formatTimeAgo = (createdAt: any): string => {
    let ts: number = 0;
    if (typeof createdAt === 'number') {
      ts = createdAt < 1e12 ? createdAt * 1000 : createdAt; 
    } else if (typeof createdAt === 'string') {
      const n = Number(createdAt);
      ts = Number.isFinite(n)
        ? (n < 1e12 ? n * 1000 : n)
        : Date.parse(createdAt);
    } else if (createdAt instanceof Date) {
      ts = createdAt.getTime();
    }

    if (!Number.isFinite(ts) || ts <= 0) return 'ახლა';

    const now = Date.now();
    const diff = now - ts;
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
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.headerTop}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            
            <View style={styles.headerTitleSection}>
              <Text style={styles.headerTitle}>{storeName || 'დაშლილების მაღაზია'}</Text>
              <Text style={styles.headerSubtitle}>ნაწილების მართვის პანელი</Text>
            </View>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconWrapper}>
                <LinearGradient
                  colors={['#EFF6FF', '#DBEAFE']}
                  style={styles.statIconBg}
                >
                  <Ionicons name="document-text" size={24} color="#3B82F6" />
                </LinearGradient>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{requests.length}</Text>
                <Text style={styles.statLabel}>მოთხოვნა</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconWrapper}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.statIconBg}
                >
                  <Ionicons name="checkmark-done" size={24} color="#10B981" />
                </LinearGradient>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{myOffers.length}</Text>
                <Text style={styles.statLabel}>შეთავაზება</Text>
              </View>
            </View>
          </View>

          {/* Chat Banner */}
          <Pressable
            style={styles.chatBanner}
            onPress={() => router.push(`/partner-chats?partnerType=store` as any)}
          >
            <LinearGradient
              colors={['#4F46E5', '#4338CA']}
              style={styles.chatBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.chatBannerLeft}>
                <View style={styles.chatBannerIcon}>
                  <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.chatBannerText}>
                  <Text style={styles.chatBannerTitle}>შეტყობინებები</Text>
                  <Text style={styles.chatBannerSubtitle}>
                    ნახე ჩატები და უპასუხე კლიენტებს
                  </Text>
                </View>
              </View>
              <View style={styles.chatBannerRight}>
                {myOffers.length > 0 && (
                  <View style={styles.chatBannerBadge}>
                    <Text style={styles.chatBannerBadgeText}>{myOffers.length}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </Pressable>
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
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Ionicons 
                name="document-text" 
                size={20} 
                color={activeTab === 'requests' ? '#10B981' : '#6B7280'} 
              />
              <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
                აქტიური მოთხოვნები
              </Text>
              {requests.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'requests' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === 'requests' && styles.tabBadgeTextActive]}>
                    {requests.length}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === 'offers' && styles.tabActive]}
              onPress={() => setActiveTab('offers')}
            >
              <Ionicons 
                name="checkmark-done" 
                size={20} 
                color={activeTab === 'offers' ? '#10B981' : '#6B7280'} 
              />
              <Text style={[styles.tabText, activeTab === 'offers' && styles.tabTextActive]}>
                გაგზავნილი
              </Text>
              {myOffers.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'offers' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === 'offers' && styles.tabBadgeTextActive]}>
                    {myOffers.length}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {activeTab === 'requests' ? (
              // Active Requests
              requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="file-tray-outline" size={64} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyTitle}>მოთხოვნები არ არის</Text>
                  <Text style={styles.emptyText}>
                    როდესაც კლიენტები მოითხოვენ ნაწილებს, ისინი გამოჩნდება აქ
                  </Text>
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
                          {(() => { 
                            const ic = getServiceIconAndColor(request.service); 
                            return (
                              <Ionicons name={ic.name} size={20} color={ic.color} />
                            ); 
                          })()}
                          <Text style={styles.requestTitle}>{request.partName || 'ნაწილის მოთხოვნა'}</Text>
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
              )
            ) : (
              // Sent Offers
              myOffers.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="paper-plane-outline" size={64} color="#6B7280" />
                  </View>
                  <Text style={styles.emptyTitle}>შეთავაზებები არ არის</Text>
                  <Text style={styles.emptyText}>
                    შენი გაგზავნილი შეთავაზებები გამოჩნდება აქ
                  </Text>
                </View>
              ) : (
                myOffers.map((offer) => {
                  const request = requests.find(r => r.id === offer.reqId);
                  return (
                    <Pressable
                      key={offer.id}
                      style={styles.requestCard}
                      onPress={() => router.push(`/partner-chat/${offer.reqId}` as any)}
                    >
                      <LinearGradient
                        colors={['rgba(59, 130, 246, 0.12)', 'rgba(29, 78, 216, 0.08)']}
                        style={styles.requestGradient}
                      >
                        {/* Offer Header */}
                        <View style={styles.requestHeader}>
                          <View style={styles.requestTitleRow}>
                            <Ionicons name="paper-plane" size={20} color="#3B82F6" />
                            <Text style={styles.requestTitle}>{request?.partName || 'შეთავაზება'}</Text>
                          </View>
                          <View style={[styles.sentBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
                            <Text style={[styles.sentBadgeText, { color: '#3B82F6' }]}>
                              {offer.priceGEL} ₾
                            </Text>
                          </View>
                        </View>

                        {/* Vehicle Info */}
                        {request && (
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
                          </View>
                        )}

                        {/* Offer Info */}
                        <View style={styles.offerInfoRow}>
                          <View style={styles.offerInfoItem}>
                            <Ionicons name="storefront" size={14} color="#9CA3AF" />
                            <Text style={styles.offerInfoText}>{offer.providerName}</Text>
                          </View>
                          <View style={styles.offerInfoItem}>
                            <Ionicons name="time" size={14} color="#9CA3AF" />
                            <Text style={styles.offerInfoText}>{offer.etaMin} წთ</Text>
                          </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.requestFooter}>
                          <Text style={styles.timeText}>
                            <Ionicons name="time-outline" size={12} color="#9CA3AF" /> {formatTimeAgo(offer.createdAt || Date.now())}
                          </Text>
                          
                          <View style={styles.actionsRow}>
                            <Pressable
                              style={[styles.chatActionButton, { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}
                              onPress={() => router.push(`/partner-chat/${offer.reqId}` as any)}
                            >
                              <Ionicons name="chatbubbles" size={16} color="#3B82F6" />
                              <Text style={[styles.chatActionText, { color: '#3B82F6' }]}>ჩატი</Text>
                            </Pressable>
                          </View>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })
              )
            )}
          </Animated.View>
        </ScrollView>

        {/* Offer Modal */}
        <Modal
          visible={showOfferModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeOfferModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="add-circle" size={28} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>შეთავაზების შექმნა</Text>
              </View>
              <Pressable onPress={closeOfferModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedRequest && (
                <>
                  {/* Request Info Card */}
                  <View style={styles.modalInfoCard}>
                    <View style={styles.modalInfoHeader}>
                      <Ionicons name="information-circle" size={24} color="#10B981" />
                      <Text style={styles.modalInfoHeaderText}>მოთხოვნის დეტალები</Text>
                    </View>
                    <View style={styles.modalInfoBody}>
                      <Text style={styles.modalInfoTitle}>{selectedRequest.partName}</Text>
                      <View style={styles.modalInfoVehicle}>
                        <Ionicons name="car-sport" size={18} color="#6B7280" />
                        <Text style={styles.modalInfoText}>
                          {selectedRequest.vehicle.make} {selectedRequest.vehicle.model}
                          {selectedRequest.vehicle.year && ` • ${selectedRequest.vehicle.year}`}
                        </Text>
                      </View>
                      {selectedRequest.description && (
                        <Text style={styles.modalInfoDescription}>{selectedRequest.description}</Text>
                      )}
                    </View>
                  </View>

                  {/* Store Name Input */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>
                      <Ionicons name="storefront" size={16} color="#374151" /> მაღაზიის სახელი
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      value={storeName}
                      onChangeText={setStoreName}
                      placeholder="მაგ: ავტონაწილების მაღაზია"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  {/* Price Input */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>
                      <Ionicons name="cash" size={16} color="#374151" /> ფასი
                    </Text>
                    <View style={styles.priceInputWrapper}>
                      <Ionicons name="logo-laravel" size={24} color="#10B981" style={{ marginLeft: 18 }} />
                      <TextInput
                        style={styles.priceInput}
                        value={offerPrice}
                        onChangeText={setOfferPrice}
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                      <Text style={styles.currencySymbol}>₾</Text>
                    </View>
                    <Text style={styles.modalHint}>შეიყვანე შეთავაზების ფასი ლარებში</Text>
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    style={[styles.submitButton, isSubmittingOffer && styles.submitButtonDisabled]}
                    onPress={handleCreateOffer}
                    disabled={isSubmittingOffer}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.submitButtonGradient}
                    >
                      {isSubmittingOffer ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="send" size={22} color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>შეთავაზების გაგზავნა</Text>
                        </>
                      )}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chatBanner: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chatBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  chatBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  chatBannerText: {
    flex: 1,
  },
  chatBannerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chatBannerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  chatBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatBannerBadge: {
    backgroundColor: '#FFFFFF',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chatBannerBadgeText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 14,
    color: '#4F46E5',
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 22,
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconWrapper: {
    marginRight: 12,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#ECFDF5',
  },
  tabText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#10B981',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: '#10B981',
  },
  tabBadgeText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 11,
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 22,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  requestCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestGradient: {
    padding: 16,
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
  offerInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  offerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerInfoText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: '#9CA3AF',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 22,
    color: '#111827',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  modalInfoHeaderText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 15,
    color: '#059669',
  },
  modalInfoBody: {
    padding: 20,
  },
  modalInfoTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#111827',
    marginBottom: 12,
  },
  modalInfoVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalInfoText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 15,
    color: '#374151',
  },
  modalInfoDescription: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 15,
    color: '#374151',
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#111827',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 24,
    color: '#111827',
  },
  currencySymbol: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#10B981',
    marginRight: 18,
  },
  modalHint: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitButtonText: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});

