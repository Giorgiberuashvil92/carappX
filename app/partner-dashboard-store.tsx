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
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { aiApi } from '@/services/aiApi';
import { specialOffersApi, type SpecialOffer } from '@/services/specialOffersApi';
import { addItemApi } from '@/services/addItemApi';
import { photoService } from '@/services/photoService';
import { bogApi } from '@/services/bogApi';
import BOGPaymentModal from '@/components/ui/BOGPaymentModal';
import { API_BASE_URL } from '@/config/api';

const { width } = Dimensions.get('window');

export default function PartnerDashboardStoreScreen() {
  const { user } = useUser();
  const { success, error } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Owned Stores state
  const [ownedStores, setOwnedStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeForm, setStoreForm] = useState({
    title: '',
    description: '',
    phone: '',
    address: '',
    location: '',
    email: '',
    website: '',
    workingHours: '',
    images: [] as string[],
  });
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // Special Offers state
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [specialOfferForm, setSpecialOfferForm] = useState({
    selectedStoreId: '',
    offerType: '',
    category: '',
    discount: '',
    oldPrice: '',
    newPrice: '',
    buyAmount: '',
    giftDescription: '',
    title: '',
    description: '',
    image: '',
    isActive: true,
  });
  const [isSubmittingSpecialOffer, setIsSubmittingSpecialOffer] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  // BOG Payment state
  const [showBOGPaymentModal, setShowBOGPaymentModal] = useState(false);
  const [bogPaymentUrl, setBogPaymentUrl] = useState<string>('');
  const [selectedStoreForPayment, setSelectedStoreForPayment] = useState<any | null>(null);
  
  // Offer types
  const offerTypes = [
    { value: 'discount', label: 'ფასდაკლება' },
    { value: 'gift', label: 'საჩუქარი' },
    { value: 'buy_get', label: 'იყიდე X, მიიღე Y' },
  ];
  
  // Categories for special offers
  const offerCategories = [
    'ნაწილები',
    'მომსახურება',
    'ზეთები',
    'ფილტრები',
    'საბურავები',
    'აქსესუარები',
    'რემონტი',
    'სხვა',
  ];

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
      setPartnerName(prev => prev || user.name);
    }
  }, [user?.name]);

  // Auto-select store if only one exists
  useEffect(() => {
    if (ownedStores.length === 1 && !specialOfferForm.selectedStoreId) {
      setSpecialOfferForm(prev => ({
        ...prev,
        selectedStoreId: ownedStores[0].id,
      }));
    }
  }, [ownedStores]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get store name and ID
      if (user?.id) {
        const seller = await aiApi.getSellerStatus({ userId: user.id });
        
        const derivedName =
          seller.data?.ownedStores?.find((store: any) => store?.title)?.title?.trim() ||
          (seller.data as any)?.profile?.storeName?.trim() ||
          seller.data?.ownedParts?.find((part: any) => part?.title)?.title?.trim();
        if (derivedName) {
          setPartnerName(derivedName);
        }

        // Load owned stores
        const ownedStores = seller.data?.ownedStores || [];
        setOwnedStores(ownedStores);
        
        if (ownedStores.length > 0) {
          // Use first store ID for creating new offers
          const firstStore = ownedStores[0];
          if (firstStore?.id) {
            setStoreId(firstStore.id);
          }

          // Load special offers for all owned stores
          try {
            const allOffersPromises = ownedStores.map((store: any) =>
              store?.id ? specialOffersApi.getSpecialOffersByStore(store.id, false) : Promise.resolve([])
            );
            const allOffersArrays = await Promise.all(allOffersPromises);
            // Flatten and combine all offers from all owned stores
            const combinedOffers = allOffersArrays.flat();
            setSpecialOffers(combinedOffers);
          } catch (err) {
            console.error('Error fetching special offers:', err);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPartnerDisplayName = () => {
    return partnerName || user?.name || 'მაღაზია';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleEditStore = (store: any) => {
    setSelectedStore(store);
    setStoreForm({
      title: store.title || '',
      description: store.description || '',
      phone: store.phone || '',
      address: store.address || '',
      location: store.location || '',
      email: store.email || '',
      website: store.website || '',
      workingHours: store.workingHours || '',
      images: store.images || [],
    });
    setShowStoreModal(true);
  };

  const handleUpdateStore = async () => {
    if (!selectedStore?.id) return;
    
    if (!storeForm.title.trim() || !storeForm.phone.trim() || !storeForm.address.trim()) {
      error('შეცდომა', 'სათაური, ტელეფონი და მისამართი აუცილებელია');
      return;
    }

    setIsSubmittingStore(true);
    try {
      const result = await addItemApi.updateStore(selectedStore.id, storeForm);
      if (result.success) {
        success('წარმატება', 'მაღაზია განახლებულია');
        setShowStoreModal(false);
        await fetchData();
      } else {
        error('შეცდომა', result.message || 'მაღაზიის განახლება ვერ მოხერხდა');
      }
    } catch (err) {
      console.error('Error updating store:', err);
      error('შეცდომა', 'მაღაზიის განახლება ვერ მოხერხდა');
    } finally {
      setIsSubmittingStore(false);
    }
  };

  const handleAddStoreImage = () => {
    photoService.showPhotoPickerOptions(async (result) => {
      if (result.success && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        try {
          const uploadResult = await photoService.uploadPhoto(imageUri, 'stores');
          if (uploadResult.success && uploadResult.url) {
            setStoreForm(prev => ({
              ...prev,
              images: [...prev.images, uploadResult.url!],
            }));
            success('წარმატება', 'სურათი დაემატა');
          } else {
            error('შეცდომა', uploadResult.error || 'სურათის ატვირთვა ვერ მოხერხდა');
          }
        } catch (err) {
          console.error('Image upload error:', err);
          error('შეცდომა', 'სურათის ატვირთვისას მოხდა შეცდომა');
        }
      }
    });
  };

  const handleRemoveStoreImage = (index: number) => {
    setStoreForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handlePayment = async (store: any) => {
    if (!store?.id) {
      error('შეცდომა', 'მაღაზია ვერ მოიძებნა');
      return;
    }

    const paymentAmount = store.paymentAmount || 9.99;

    try {
      setSelectedStoreForPayment(store);
      
      // BOG OAuth სტატუსის შემოწმება
      const oauthStatus = await bogApi.getOAuthStatus();
      if (!oauthStatus.isTokenValid) {
        error('შეცდომა', 'BOG გადახდის სერვისი დროებით მიუწვდომელია');
        return;
      }

      // BOG შეკვეთის შექმნა
      // external_order_id format: store_payment_storeId_timestamp_userId
      const externalOrderId = `store_payment_${store.id}_${Date.now()}_${user?.id || 'unknown'}`;
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://marte-backend-production.up.railway.app';
      
      const orderData = {
        callback_url: `${API_BASE_URL}/bog/callback`,
        external_order_id: externalOrderId,
        total_amount: paymentAmount,
        currency: 'GEL',
        product_id: `store_${store.id}`,
        description: `მაღაზიის გადახდა - ${store.title || store.name || 'მაღაზია'}`,
        success_url: `${API_BASE_URL}/payment/success?type=store&storeId=${store.id}`,
        fail_url: `${API_BASE_URL}/payment/fail`,
        save_card: false,
      };

      const result = await bogApi.createOrder(orderData);
      setBogPaymentUrl(result.redirect_url);
      setShowBOGPaymentModal(true);
    } catch (err) {
      console.error('Error initiating BOG payment:', err);
      error('შეცდომა', 'გადახდის ინიციალიზაცია ვერ მოხერხდა');
    }
  };

  const handleBOGPaymentSuccess = async () => {
    if (!selectedStoreForPayment?.id) return;

    try {
      const now = new Date();
      // შემდეგი გადახდის თარიღი = ახლანდელი თარიღი + 1 თვე
      const nextPaymentDate = new Date(now);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      const paymentAmount = selectedStoreForPayment.paymentAmount || 9.99;
      const currentTotalPaid = selectedStoreForPayment.totalPaid || 0;

      const updateData: any = {
        lastPaymentDate: now.toISOString(),
        nextPaymentDate: nextPaymentDate.toISOString(), // 1 თვით გადავიდა
        paymentStatus: 'paid',
        totalPaid: currentTotalPaid + paymentAmount,
      };

      const result = await addItemApi.updateStore(selectedStoreForPayment.id, updateData);
      if (result.success) {
        success('წარმატება', 'გადახდა წარმატებით დაფიქსირდა');
        await fetchData();
      } else {
        error('შეცდომა', result.message || 'გადახდის დაფიქსირება ვერ მოხერხდა');
      }
    } catch (err) {
      console.error('Error updating store after payment:', err);
      error('შეცდომა', 'გადახდის დაფიქსირება ვერ მოხერხდა');
    } finally {
      setSelectedStoreForPayment(null);
    }
  };

  const handleBOGPaymentError = (errorMessage: string) => {
    error('შეცდომა', errorMessage || 'გადახდა წარუმატებელია');
    setSelectedStoreForPayment(null);
  };

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
              <Text style={styles.headerTitle}>{getPartnerDisplayName()}</Text>
              <Text style={styles.headerSubtitle}>მაღაზიის მართვის პანელი</Text>
            </View>

            <View style={{ width: 44 }} />
          </View>

          {storeId && (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <View style={styles.statIconBg}>
                    <Ionicons name="pricetag" size={24} color="#111827" />
                  </View>
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{specialOffers.length}</Text>
                  <Text style={styles.statLabel}>შეთავაზება</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Special Offers List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#111827"
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Owned Stores Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ჩემი მაღაზიები</Text>
            </View>

            {ownedStores.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>მაღაზიები არ არის</Text>
              </View>
            ) : (
              ownedStores.map((store) => (
                <View key={store.id} style={styles.storeCard}>
                  <View style={styles.storeGradient}>
                    <View style={styles.storeHeader}>
                      <View style={styles.storeHeaderLeft}>
                        {store.images && store.images.length > 0 ? (
                          <Image
                            source={{ uri: store.images[0] }}
                            style={styles.storeImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.storeImagePlaceholder}>
                            <Ionicons name="storefront" size={24} color="#111827" />
                          </View>
                        )}
                        <View style={styles.storeInfo}>
                          <Text style={styles.storeTitle}>{store.title}</Text>
                          <Text style={styles.storeType}>{store.type}</Text>
                          <Text style={styles.storeLocation}>{store.location} • {store.address}</Text>
                          <Text style={styles.storePhone}>{store.phone}</Text>
                        </View>
                      </View>
                      <Pressable
                        style={styles.editStoreButton}
                        onPress={() => handleEditStore(store)}
                      >
                        <Ionicons name="create-outline" size={20} color="#111827" />
                      </Pressable>
                    </View>
                    
                    {/* Payment Information */}
                    <View style={styles.paymentInfoContainer}>
                      <View style={styles.paymentInfoHeader}>
                        <Ionicons name="card-outline" size={16} color="#6B7280" />
                        <Text style={styles.paymentInfoTitle}>გადახდის ინფორმაცია</Text>
                      </View>
                      
                      {(() => {
                        // გამოვთვალოთ შემდეგი გადახდის თარიღი
                        let nextDate: Date | null = null;
                        try {
                          if (store.nextPaymentDate) {
                            nextDate = new Date(store.nextPaymentDate);
                            if (isNaN(nextDate.getTime())) {
                              nextDate = null;
                            }
                          }
                          if (!nextDate && store.createdAt) {
                            const created = new Date(store.createdAt);
                            if (!isNaN(created.getTime())) {
                              created.setMonth(created.getMonth() + 1);
                              nextDate = created;
                            }
                          }
                        } catch (e) {
                          console.error('Error calculating next payment date:', e);
                        }
                        
                        const isOverdue = nextDate && nextDate < new Date();
                        const isDueSoon = nextDate && nextDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && nextDate >= new Date();
                        const paymentStatus = store.paymentStatus || 'pending';
                        const isPaymentDue = paymentStatus === 'overdue' || isOverdue;
                        
                        return (
                          <>
                            <View style={styles.paymentRow}>
                              <Text style={styles.paymentLabel}>შემდეგი გადახდა:</Text>
                              <Text style={[
                                styles.paymentValue,
                                isOverdue && styles.paymentValueOverdue,
                                isDueSoon && !isOverdue && styles.paymentValueDueSoon,
                              ]}>
                                {nextDate 
                                  ? nextDate.toLocaleDateString('ka-GE')
                                  : "არ არის მითითებული"}
                              </Text>
                            </View>
                            
                            {isPaymentDue && (
                              <View style={styles.paymentAlert}>
                                <Ionicons name="warning" size={16} color="#DC2626" />
                                <Text style={styles.paymentAlertText}>გადასახდელია</Text>
                              </View>
                            )}
                            {isDueSoon && !isOverdue && (
                              <View style={styles.paymentWarning}>
                                <Ionicons name="time-outline" size={16} color="#D97706" />
                                <Text style={styles.paymentWarningText}>მალე ვადა გავა</Text>
                              </View>
                            )}
                            
                            <View style={styles.paymentRow}>
                              <Text style={styles.paymentLabel}>გადახდის თანხა:</Text>
                              <Text style={styles.paymentValue}>
                                {store.paymentAmount || 9.99} ₾ {store.paymentPeriod === 'monthly' ? '/თვე' : store.paymentPeriod === 'yearly' ? '/წელი' : ''}
                              </Text>
                            </View>
                            
                            <View style={styles.paymentRow}>
                              <Text style={styles.paymentLabel}>გადახდის სტატუსი:</Text>
                              <View style={[
                                styles.paymentStatusBadge,
                                paymentStatus === 'paid' && styles.paymentStatusPaid,
                                paymentStatus === 'overdue' && styles.paymentStatusOverdue,
                                paymentStatus === 'pending' && styles.paymentStatusPending,
                              ]}>
                                <Text style={[
                                  styles.paymentStatusText,
                                  paymentStatus === 'paid' && styles.paymentStatusTextPaid,
                                  paymentStatus === 'overdue' && styles.paymentStatusTextOverdue,
                                  paymentStatus === 'pending' && styles.paymentStatusTextPending,
                                ]}>
                                  {paymentStatus === 'paid' ? 'გადახდილი' : paymentStatus === 'overdue' ? 'გადასახდელია' : 'მოლოდინში'}
                                </Text>
                              </View>
                            </View>
                            
                            {/* Payment Button */}
                            {(isPaymentDue || paymentStatus === 'overdue' || paymentStatus === 'pending') && (
                              <Pressable
                                style={styles.paymentButton}
                                onPress={() => handlePayment(store)}
                              >
                                <View style={styles.paymentButtonGradient}>
                                  <Ionicons name="card" size={18} color="#FFFFFF" />
                                  <Text style={styles.paymentButtonText}>გადახდა</Text>
                                </View>
                              </Pressable>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* Special Offers Section */}
            {storeId && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>შეთავაზებები</Text>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => {
                      setEditingOffer(null);
                      setSpecialOfferForm({
                        selectedStoreId: ownedStores.length > 0 ? ownedStores[0].id : '',
                        offerType: '',
                        category: '',
                        discount: '',
                        oldPrice: '',
                        newPrice: '',
                        buyAmount: '',
                        giftDescription: '',
                        title: '',
                        description: '',
                        image: '',
                        isActive: true,
                      });
                      setShowSpecialOfferModal(true);
                    }}
                  >
                    <View style={styles.addButtonGradient}>
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                      <Text style={styles.addButtonText}>დამატება</Text>
                    </View>
                  </Pressable>
                </View>

                {specialOffers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>სპეციალური შეთავაზებები არ არის</Text>
                  </View>
                ) : (
                  specialOffers.map((offer) => (
                    <View key={offer.id} style={styles.offerCard}>
                      <View style={styles.offerGradient}>
                        <View style={styles.offerHeader}>
                          <View style={styles.offerTitleRow}>
                            <Ionicons name="pricetag" size={20} color="#111827" />
                            <Text style={styles.offerTitle}>{offer.title || 'სპეციალური შეთავაზება'}</Text>
                          </View>
                          <View style={styles.offerBadges}>
                            {offer.isActive ? (
                              <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>აქტიური</Text>
                              </View>
                            ) : (
                              <View style={styles.inactiveBadge}>
                                <Text style={styles.inactiveBadgeText}>არააქტიური</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {offer.description && (
                          <Text style={styles.offerDescription} numberOfLines={2}>
                            {offer.description}
                          </Text>
                        )}

                        <View style={styles.offerPrices}>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>ძველი ფასი:</Text>
                            <Text style={styles.oldPrice}>{offer.oldPrice} ₾</Text>
                          </View>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>ახალი ფასი:</Text>
                            <Text style={styles.newPrice}>{offer.newPrice} ₾</Text>
                          </View>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>ფასდაკლება:</Text>
                            <Text style={styles.discountPrice}>{offer.discount}%</Text>
                          </View>
                        </View>

                        <View style={styles.offerActions}>
                          <Pressable
                            style={styles.editButton}
                            onPress={() => {
                              setEditingOffer(offer);
                              // Parse offer type from title
                              let parsedOfferType = '';
                              let parsedCategory = '';
                              if (offer.title) {
                                if (offer.title.includes('ფასდაკლება')) {
                                  parsedOfferType = 'discount';
                                } else if (offer.title.includes('საჩუქარი')) {
                                  parsedOfferType = 'gift';
                                } else if (offer.title.includes('იყიდე')) {
                                  parsedOfferType = 'buy_get';
                                }
                                // Extract category
                                const categoryMatch = offerCategories.find(cat => offer.title?.includes(cat));
                                parsedCategory = categoryMatch || '';
                              }
                              
                              // Parse buy_get info from description
                              let parsedBuyAmount = '';
                              let parsedGiftDescription = '';
                              if (parsedOfferType === 'buy_get' && offer.description) {
                                const buyMatch = offer.description.match(/იყიდე\s+(\d+)/);
                                if (buyMatch) parsedBuyAmount = buyMatch[1];
                                const giftMatch = offer.description.match(/მიიღე\s+(.+?)(?:\n|$)/);
                                if (giftMatch) parsedGiftDescription = giftMatch[1].trim();
                              } else if (parsedOfferType === 'gift' && offer.description) {
                                parsedGiftDescription = offer.description.split('\n\n')[0];
                              }
                              
                              setSpecialOfferForm({
                                selectedStoreId: offer.storeId,
                                offerType: parsedOfferType,
                                category: parsedCategory,
                                discount: offer.discount || '',
                                oldPrice: offer.oldPrice || '',
                                newPrice: offer.newPrice || '',
                                buyAmount: parsedBuyAmount,
                                giftDescription: parsedGiftDescription,
                                title: '',
                                description: parsedOfferType === 'gift' ? (offer.description?.split('\n\n').slice(1).join('\n\n') || '') : (parsedOfferType === 'buy_get' ? (offer.description?.split('\n\n').slice(1).join('\n\n') || '') : (offer.description || '')),
                                image: offer.image || '',
                                isActive: offer.isActive,
                              });
                              setShowSpecialOfferModal(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color="#111827" />
                            <Text style={styles.editButtonText}>რედაქტირება</Text>
                          </Pressable>
                          <Pressable
                            style={styles.toggleButton}
                            onPress={async () => {
                              try {
                                const updated = await specialOffersApi.toggleActive(offer.id);
                                if (updated) {
                                  setSpecialOffers(prev =>
                                    prev.map(o => o.id === offer.id ? updated : o)
                                  );
                                }
                              } catch (err) {
                                console.error('Error toggling offer:', err);
                                Alert.alert('შეცდომა', 'შეთავაზების განახლება ვერ მოხერხდა');
                              }
                            }}
                          >
                            <Ionicons
                              name={offer.isActive ? 'eye-off-outline' : 'eye-outline'}
                              size={16}
                              color="#111827"
                            />
                            <Text
                              style={[
                                styles.toggleButtonText,
                                { color: '#111827' },
                              ]}
                            >
                              {offer.isActive ? 'დამალვა' : 'გამოჩენა'}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={styles.deleteOfferButton}
                            onPress={() => {
                              Alert.alert(
                                'შეთავაზების წაშლა',
                                'დარწმუნებული ხართ რომ გსურთ ამ შეთავაზების წაშლა?',
                                [
                                  { text: 'გაუქმება', style: 'cancel' },
                                  {
                                    text: 'წაშლა',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        const success = await specialOffersApi.deleteSpecialOffer(offer.id);
                                        if (success) {
                                          setSpecialOffers(prev => prev.filter(o => o.id !== offer.id));
                                          Alert.alert('წარმატება', 'შეთავაზება წაიშალა');
                                        }
                                      } catch (err) {
                                        console.error('Error deleting offer:', err);
                                        Alert.alert('შეცდომა', 'შეთავაზების წაშლა ვერ მოხერხდა');
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#111827" />
                            <Text style={styles.deleteOfferButtonText}>წაშლა</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>

        {/* Special Offer Modal */}
        <Modal
          visible={showSpecialOfferModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSpecialOfferModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOffer ? 'შეთავაზების რედაქტირება' : 'ახალი შეთავაზება'}
              </Text>
              <Pressable onPress={() => setShowSpecialOfferModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Store Selection */}
              {ownedStores.length > 1 ? (
                <View style={styles.modalCard}>
                  <Text style={styles.modalLabel}>მაღაზია *</Text>
                  <View style={styles.dropdownContainer}>
                    {ownedStores.map((store) => (
                      <Pressable
                        key={store.id}
                        style={[
                          styles.dropdownOption,
                          specialOfferForm.selectedStoreId === store.id && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => setSpecialOfferForm(prev => ({ ...prev, selectedStoreId: store.id }))}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          specialOfferForm.selectedStoreId === store.id && styles.dropdownOptionTextSelected,
                        ]}>
                          {store.title}
                        </Text>
                        {specialOfferForm.selectedStoreId === store.id && (
                          <Ionicons name="checkmark" size={20} color="#111827" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : ownedStores.length === 1 && (
                <View style={styles.modalCard}>
                  <Text style={styles.modalLabel}>მაღაზია</Text>
                  <Text style={styles.modalInput}>{ownedStores[0].title}</Text>
                </View>
              )}

              {/* Offer Type Selection */}
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>შეთავაზების ტიპი *</Text>
                <View style={styles.dropdownContainer}>
                  {offerTypes.map((type) => (
                    <Pressable
                      key={type.value}
                      style={[
                        styles.dropdownOption,
                        specialOfferForm.offerType === type.value && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => setSpecialOfferForm(prev => ({ ...prev, offerType: type.value }))}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        specialOfferForm.offerType === type.value && styles.dropdownOptionTextSelected,
                      ]}>
                        {type.label}
                      </Text>
                      {specialOfferForm.offerType === type.value && (
                        <Ionicons name="checkmark" size={20} color="#111827" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>კატეგორია *</Text>
                <View style={styles.dropdownContainer}>
                  {offerCategories.map((category) => (
                    <Pressable
                      key={category}
                      style={[
                        styles.dropdownOption,
                        specialOfferForm.category === category && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => setSpecialOfferForm(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        specialOfferForm.category === category && styles.dropdownOptionTextSelected,
                      ]}>
                        {category}
                      </Text>
                      {specialOfferForm.category === category && (
                        <Ionicons name="checkmark" size={20} color="#111827" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>სათაური (არასავალდებულო)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={specialOfferForm.title}
                  onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, title: text }))}
                  placeholder="მაგ: ზამთრის ფასდაკლება"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Conditional Fields Based on Offer Type */}
              {specialOfferForm.offerType === 'discount' && (
                <>
                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>ძველი ფასი (₾) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={specialOfferForm.oldPrice}
                      onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, oldPrice: text }))}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>ახალი ფასი (₾) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={specialOfferForm.newPrice}
                      onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, newPrice: text }))}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>ფასდაკლება (%) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={specialOfferForm.discount}
                      onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, discount: text }))}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              {specialOfferForm.offerType === 'gift' && (
                <View style={styles.modalCard}>
                  <Text style={styles.modalLabel}>საჩუქრის აღწერა *</Text>
                  <TextInput
                    style={[styles.modalInput, { minHeight: 100, textAlignVertical: 'top' }]}
                    value={specialOfferForm.giftDescription}
                    onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, giftDescription: text }))}
                    placeholder="მაგ: იყიდე 100 ლარის ზეთი და მიიღე ფილტრი საჩუქრად"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                </View>
              )}

              {specialOfferForm.offerType === 'buy_get' && (
                <>
                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>იყიდე (₾) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={specialOfferForm.buyAmount}
                      onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, buyAmount: text }))}
                      placeholder="მაგ: 100"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalCard}>
                    <Text style={styles.modalLabel}>მიიღე საჩუქრად *</Text>
                    <TextInput
                      style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                      value={specialOfferForm.giftDescription}
                      onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, giftDescription: text }))}
                      placeholder="მაგ: მეორე ზეთი, ფილტრი, ან სხვა"
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                  </View>
                </>
              )}

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>აღწერა (არასავალდებულო)</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={specialOfferForm.description}
                  onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, description: text }))}
                  placeholder="დამატებითი ინფორმაცია შეთავაზების შესახებ"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>სურათის URL (არასავალდებულო)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={specialOfferForm.image}
                  onChangeText={(text) => setSpecialOfferForm(prev => ({ ...prev, image: text }))}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  isSubmittingSpecialOffer ? { opacity: 0.7 } : null,
                ]}
                onPress={async () => {
                  const targetStoreId = specialOfferForm.selectedStoreId || (ownedStores.length === 1 ? ownedStores[0].id : storeId);
                  if (isSubmittingSpecialOffer || !targetStoreId) {
                    Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ მაღაზია');
                    return;
                  }
                  if (!specialOfferForm.offerType) {
                    Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ შეთავაზების ტიპი');
                    return;
                  }
                  if (!specialOfferForm.category) {
                    Alert.alert('შეცდომა', 'გთხოვთ აირჩიოთ კატეგორია');
                    return;
                  }
                  
                  // Validate based on offer type
                  if (specialOfferForm.offerType === 'discount') {
                    if (!specialOfferForm.oldPrice || !specialOfferForm.newPrice || !specialOfferForm.discount) {
                      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი (ძველი ფასი, ახალი ფასი, ფასდაკლება)');
                      return;
                    }
                  } else if (specialOfferForm.offerType === 'gift') {
                    if (!specialOfferForm.giftDescription) {
                      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ საჩუქრის აღწერა');
                      return;
                    }
                  } else if (specialOfferForm.offerType === 'buy_get') {
                    if (!specialOfferForm.buyAmount || !specialOfferForm.giftDescription) {
                      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ "იყიდე" და "მიიღე საჩუქრად" ველები');
                      return;
                    }
                  }

                  setIsSubmittingSpecialOffer(true);
                  try {
                    // Build description based on offer type
                    let finalDescription = '';
                    if (specialOfferForm.offerType === 'discount') {
                      finalDescription = specialOfferForm.description || '';
                    } else if (specialOfferForm.offerType === 'gift') {
                      finalDescription = specialOfferForm.giftDescription;
                      if (specialOfferForm.description) {
                        finalDescription += `\n\n${specialOfferForm.description}`;
                      }
                    } else if (specialOfferForm.offerType === 'buy_get') {
                      finalDescription = `იყიდე ${specialOfferForm.buyAmount}₾ და მიიღე ${specialOfferForm.giftDescription}`;
                      if (specialOfferForm.description) {
                        finalDescription += `\n\n${specialOfferForm.description}`;
                      }
                    }

                    // Build title
                    const offerTypeLabel = offerTypes.find(t => t.value === specialOfferForm.offerType)?.label || '';
                    const finalTitle = `${offerTypeLabel} - ${specialOfferForm.category}`;

                    if (editingOffer) {
                      const updated = await specialOffersApi.updateSpecialOffer(editingOffer.id, {
                        discount: specialOfferForm.offerType === 'discount' ? specialOfferForm.discount : '0',
                        oldPrice: specialOfferForm.offerType === 'discount' ? specialOfferForm.oldPrice : '0',
                        newPrice: specialOfferForm.offerType === 'discount' ? specialOfferForm.newPrice : '0',
                        title: finalTitle,
                        description: finalDescription,
                        image: specialOfferForm.image || undefined,
                        isActive: specialOfferForm.isActive,
                      });
                      if (updated) {
                        setSpecialOffers(prev =>
                          prev.map(o => o.id === editingOffer.id ? updated : o)
                        );
                        Alert.alert('წარმატება', 'შეთავაზება განახლდა');
                        setShowSpecialOfferModal(false);
                      }
                    } else {
                      const created = await specialOffersApi.createSpecialOffer({
                        storeId: targetStoreId,
                        discount: specialOfferForm.offerType === 'discount' ? specialOfferForm.discount : '0',
                        oldPrice: specialOfferForm.offerType === 'discount' ? specialOfferForm.oldPrice : '0',
                        newPrice: specialOfferForm.offerType === 'discount' ? specialOfferForm.newPrice : '0',
                        title: finalTitle,
                        description: finalDescription,
                        image: specialOfferForm.image || undefined,
                        isActive: specialOfferForm.isActive,
                      });
                      if (created) {
                        setSpecialOffers(prev => [created, ...prev]);
                        Alert.alert('წარმატება', 'შეთავაზება შეიქმნა');
                        setShowSpecialOfferModal(false);
                        setSpecialOfferForm({
                          selectedStoreId: ownedStores.length > 0 ? ownedStores[0].id : '',
                          offerType: '',
                          category: '',
                          discount: '',
                          oldPrice: '',
                          newPrice: '',
                          buyAmount: '',
                          giftDescription: '',
                          title: '',
                          description: '',
                          image: '',
                          isActive: true,
                        });
                      }
                    }
                  } catch (err) {
                    console.error('Error saving special offer:', err);
                    Alert.alert('შეცდომა', 'შეთავაზების შენახვა ვერ მოხერხდა');
                  } finally {
                    setIsSubmittingSpecialOffer(false);
                  }
                }}
                disabled={isSubmittingSpecialOffer}
              >
                <View style={styles.submitButtonGradient}>
                  {isSubmittingSpecialOffer ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.submitButtonText}>იგზავნება...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {editingOffer ? 'განახლება' : 'შექმნა'}
                      </Text>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </>
                  )}
                </View>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Store Edit Modal */}
        <Modal
          visible={showStoreModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowStoreModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>მაღაზიის რედაქტირება</Text>
              <Pressable onPress={() => setShowStoreModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>სათაური *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.title}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, title: text }))}
                  placeholder="მაღაზიის სახელი"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>აღწერა</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 100, textAlignVertical: 'top' }]}
                  value={storeForm.description}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, description: text }))}
                  placeholder="მაღაზიის აღწერა"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>ტელეფონი *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.phone}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, phone: text }))}
                  placeholder="+995XXXXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>მდებარეობა *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.location}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, location: text }))}
                  placeholder="მაგ: თბილისი"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>მისამართი *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.address}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, address: text }))}
                  placeholder="სრული მისამართი"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.email}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, email: text }))}
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>ვებ-საიტი</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.website}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, website: text }))}
                  placeholder="https://example.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>სამუშაო საათები</Text>
                <TextInput
                  style={styles.modalInput}
                  value={storeForm.workingHours}
                  onChangeText={(text) => setStoreForm(prev => ({ ...prev, workingHours: text }))}
                  placeholder="მაგ: 09:00 - 18:00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Store Images */}
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>სურათები</Text>
                <Pressable
                  style={styles.addImageButton}
                  onPress={handleAddStoreImage}
                >
                  <Ionicons name="image-outline" size={20} color="#111827" />
                  <Text style={styles.addImageText}>სურათის დამატება</Text>
                </Pressable>
                
                {storeForm.images.length > 0 && (
                  <View style={styles.imagesGrid}>
                    {storeForm.images.map((image, index) => (
                      <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri: image }} style={styles.imagePreview} />
                        <Pressable
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveStoreImage(index)}
                        >
                          <Ionicons name="close-circle" size={24} color="#111827" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Pressable
                style={[styles.submitButton, isSubmittingStore ? { opacity: 0.7 } : null]}
                onPress={handleUpdateStore}
                disabled={isSubmittingStore}
              >
                <View style={styles.submitButtonGradient}>
                  {isSubmittingStore ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.submitButtonText}>იგზავნება...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>განახლება</Text>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </>
                  )}
                </View>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* BOG Payment Modal */}
        <BOGPaymentModal
          visible={showBOGPaymentModal}
          paymentUrl={bogPaymentUrl}
          onClose={() => {
            setShowBOGPaymentModal(false);
            setBogPaymentUrl('');
            setSelectedStoreForPayment(null);
          }}
          onSuccess={handleBOGPaymentSuccess}
          onError={handleBOGPaymentError}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleSection: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  statIconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 24,
    color: '#111827',
  },
  statLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  // Section
  sectionTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#111827',
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
  emptySubtext: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 20,
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalLabel: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
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
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  submitButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  // Special Offers Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  addButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  offerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  offerGradient: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  offerTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  offerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  activeBadge: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#111827',
  },
  activeBadgeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  inactiveBadgeText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
    color: '#9CA3AF',
  },
  offerDescription: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  offerPrices: {
    gap: 8,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  oldPrice: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
  },
  discountPrice: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#111827',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  toggleButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
  },
  deleteOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  deleteOfferButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#111827',
  },

  // Store Card Styles
  storeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  storeGradient: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  storeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
    gap: 4,
  },
  storeTitle: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    color: '#111827',
  },
  storeType: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  storeLocation: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  storePhone: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    color: '#111827',
    marginTop: 4,
  },
  editStoreButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  // Payment Info Styles
  paymentInfoContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  paymentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentInfoTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    color: '#6B7280',
  },
  paymentValue: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 13,
    color: '#111827',
  },
  paymentValueOverdue: {
    color: '#DC2626',
  },
  paymentValueDueSoon: {
    color: '#D97706',
  },
  paymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  paymentAlertText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: '#DC2626',
  },
  paymentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentWarningText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 12,
    color: '#D97706',
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusPaid: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paymentStatusOverdue: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  paymentStatusPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  paymentStatusText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 11,
  },
  paymentStatusTextPaid: {
    color: '#065F46',
  },
  paymentStatusTextOverdue: {
    color: '#DC2626',
  },
  paymentStatusTextPending: {
    color: '#D97706',
  },
  paymentButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  paymentButtonText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  addImageText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: '#111827',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: (width - 80) / 2,
    height: (width - 80) / 2,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  
  // Dropdown Styles
  dropdownContainer: {
    gap: 8,
    marginTop: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#111827',
  },
  dropdownOptionText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownOptionTextSelected: {
    color: '#111827',
    fontFamily: 'NotoSans_600SemiBold',
  },
});

