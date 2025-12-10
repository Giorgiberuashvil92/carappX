import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useCarFAXAccess } from '../hooks/useSubscriptionModal';
import SubscriptionModal from '../components/ui/SubscriptionModal';
import CarFAXSuccess from '../components/CarFAXSuccess';
import { carfaxApi, CarFAXReport } from '../services/carfaxApi';

const { width } = Dimensions.get('window');

export default function CarFAXScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [vinNumber, setVinNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // CarFAX Success Modal
  const [showCarFAXSuccess, setShowCarFAXSuccess] = useState(false);
  const [carfaxResult, setCarfaxResult] = useState<any>(null);
  
  // Subscription modal
  const { canAccessCarFAX, checkCarFAXAccess } = useCarFAXAccess();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // User's CarFAX credits/packages
  const [userCredits, setUserCredits] = useState({
    singleReports: 0,
    tripleReports: 0,
    fiveReports: 0
  });
  
  // CarFAX reports history
  const [carfaxReports, setCarfaxReports] = useState<CarFAXReport[]>([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Load user's CarFAX reports
    loadCarFAXReports();
  }, []);

  const loadCarFAXReports = async () => {
    try {
      const reports = await carfaxApi.getUserCarFAXReports();
      setCarfaxReports(reports);
    } catch (error) {
      console.error('CarFAX მოხსენებების ჩატვირთვის შეცდომა:', error);
    }
  };

  const handleCheckVIN = async () => {
    if (!vinNumber.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ VIN ნომერი');
      return;
    }

    if (vinNumber.length !== 17) {
      Alert.alert('შეცდომა', 'VIN ნომერი უნდა შედგებოდეს 17 სიმბოლოსგან');
      return;
    }

    const trimmedVin = vinNumber.trim().toUpperCase();
    setLoading(true);

    try {
      console.log('🔍 CarFAX API-სთან დაკავშირება VIN:', trimmedVin);
      
      // Call API directly
      const response = await carfaxApi.getCarFAXReport(trimmedVin);
      
      console.log('📥 CarFAX API Response:', {
        success: response?.success,
        hasHtmlContent: !!response?.htmlContent,
        htmlContentLength: response?.htmlContent?.length || 0,
        hasData: !!response?.data,
      });
      
      // Check if API returned HTML content
      if (response && response.htmlContent && response.htmlContent.length > 0) {
        console.log('✅ HTML content received, showing CarFAXSuccess screen');
        
        // API returned HTML - show success screen with download button
        const carData = {
          vin: trimmedVin,
          make: response.data?.make || 'უცნობი',
          model: response.data?.model || 'უცნობი',
          year: response.data?.year || new Date().getFullYear(),
          mileage: response.data?.mileage,
          accidents: response.data?.accidents || 0,
          owners: response.data?.owners || 1,
          serviceRecords: response.data?.serviceRecords || 0,
          titleStatus: response.data?.titleStatus || 'უცნობი',
          lastServiceDate: response.data?.lastServiceDate,
          reportId: response.data?.reportId || 'CF' + Date.now(),
          htmlContent: response.htmlContent, // Store HTML for PDF generation
        };
        
        console.log('📋 Setting carfaxResult and showing success screen');
        setCarfaxResult(carData);
        setShowCarFAXSuccess(true);
      } else {
        // API returned error or no HTML
        const errorMsg = response?.error || response?.message || 'CarFAX მოხსენება ვერ მოიძებნა';
        console.warn('⚠️ CarFAX API error or no HTML:', errorMsg);
        Alert.alert('შეცდომა', errorMsg);
      }
    } catch (error) {
      console.error('❌ CarFAX API შეცდომა:', error);
      Alert.alert('შეცდომა', 'CarFAX მოხსენების მიღებისას მოხდა შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    const carfaxMetadata = {
      packageType: 'single',
      vinNumber: vinNumber,
      reportType: 'carfax',
      credits: 1
    };

    router.push({
      pathname: '/payment-card',
      params: {
        amount: '1499',
        description: 'CarFAX 1 მოხსენების პაკეტი',
        context: 'carfax',
        orderId: `carfax_subscription_${user?.id || 'guest'}_${Date.now()}`,
        successUrl: '/carfax-simulation',
        vinCode: vinNumber,
        metadata: JSON.stringify(carfaxMetadata)
      }
    });
  };

  const handlePlanPurchase = (planType: 'single' | 'triple' | 'five') => {
    // Simulate package purchase
    if (planType === 'single') {
      setUserCredits(prev => ({ ...prev, singleReports: prev.singleReports + 1 }));
    } else if (planType === 'triple') {
      setUserCredits(prev => ({ ...prev, tripleReports: prev.tripleReports + 3 }));
    } else if (planType === 'five') {
      setUserCredits(prev => ({ ...prev, fiveReports: prev.fiveReports + 5 }));
    }
    
    Alert.alert(
      'წარმატება!',
      `CarFAX ${planType === 'single' ? '1' : planType === 'triple' ? '3' : '5'} მოხსენების პაკეტი წარმატებით შეიძინეთ!`,
      [{ text: 'კარგი' }]
    );
  };

  const CarFAXPlans = [
    {
      id: 'single',
      title: '1 CarFAX მოხსენება',
      price: '14.99₾',
      description: 'ერთი ავტომობილის სრული ისტორია',
      gradient: ['#10B981', '#059669'],
      icon: 'document-text'
    },
    {
      id: 'triple',
      title: '3 CarFAX მოხსენება',
      price: '33₾',
      description: '3 ავტომობილის მოხსენება (11₾ თითო)',
      savings: '11.97₾ დაზოგვა',
      popular: true,
      gradient: ['#8B5CF6', '#7C3AED'],
      icon: 'documents'
    },
    {
      id: 'five',
      title: '5 CarFAX მოხსენება',
      price: '49.99₾',
      description: '5 ავტომობილის მოხსენება (9.99₾ თითო)',
      savings: '24.96₾ დაზოგვა',
      gradient: ['#F59E0B', '#D97706'],
      icon: 'library'
    }
  ];

  // Convert CarFAX reports to history format
  const historyReports = carfaxReports.map(report => ({
    id: report._id,
    title: `${report.year} ${report.make} ${report.model}`,
    vin: report.vin,
    date: new Date(report.createdAt).toLocaleString('ka-GE'),
    accidents: report.accidents,
    serviceRecords: report.serviceRecords,
    mileage: report.mileage ? `${report.mileage.toLocaleString()} კმ` : 'უცნობი',
    owners: report.owners,
    reportId: report.reportId
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CarFAX მოხსენებები</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Hero Section */}
        

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsWrapper}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                onPress={() => setActiveTab('search')}
              >
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={activeTab === 'search' ? '#FFFFFF' : '#9CA3AF'} 
                />
                <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                  CarFAX ძებნა
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                onPress={() => setActiveTab('history')}
              >
                <Ionicons 
                  name="time" 
                  size={20} 
                  color={activeTab === 'history' ? '#FFFFFF' : '#9CA3AF'} 
                />
                <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                  ისტორია
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'search' ? (
            <>
              {/* Credits Info */}
              <View style={styles.creditsSection}>
                <Text style={styles.sectionTitle}>CarFAX კრედიტები</Text>
                <View style={styles.creditsContainer}>
                  <View style={styles.creditItem}>
                    <Text style={styles.creditLabel}>1 მოხსენება</Text>
                    <Text style={styles.creditValue}>{userCredits.singleReports}</Text>
                  </View>
                  <View style={styles.creditItem}>
                    <Text style={styles.creditLabel}>3 მოხსენება</Text>
                    <Text style={styles.creditValue}>{userCredits.tripleReports}</Text>
                  </View>
                  <View style={styles.creditItem}>
                    <Text style={styles.creditLabel}>5 მოხსენება</Text>
                    <Text style={styles.creditValue}>{userCredits.fiveReports}</Text>
                  </View>
                </View>
              </View>

              {/* VIN Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>VIN ნომრის შეყვანა</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.vinInput}
                    placeholder="შეიყვანეთ VIN ნომერი (17 სიმბოლო)"
                    value={vinNumber}
                    onChangeText={setVinNumber}
                    maxLength={17}
                    autoCapitalize="characters"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity 
                    style={[styles.checkButton, loading && styles.checkButtonDisabled]}
                    onPress={handleCheckVIN}
                    disabled={loading}
                  >
                    <Ionicons 
                      name={loading ? "hourglass" : "search"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  VIN ნომერი ჩვეულებრივ მდებარეობს ავტომობილის ქვედა ნაწილში
                </Text>
              </View>

              {/* Plans Section */}
              <View style={styles.plansSection}>
                <Text style={styles.sectionTitle}>CarFAX პაკეტები</Text>
                <View style={styles.plansGrid}>
                  {CarFAXPlans.map((plan, index) => (
                    <View
                      key={plan.id}
                      style={styles.planCard}
                    >
                      <TouchableOpacity
                        style={styles.planPressable}
                        onPress={() => {
                          Alert.alert(
                            `${plan.title} პაკეტი`,
                            `ფასი: ${plan.price}\n\nგსურთ ამ პაკეტის შეძენა?`,
                            [
                              { text: 'არა', style: 'cancel' },
                              { text: 'კი', onPress: () => handlePlanPurchase(plan.id as 'single' | 'triple' | 'five') }
                            ]
                          );
                        }}
                      >
                        <LinearGradient
                          colors={plan.gradient as [string, string]}
                          style={styles.planGradient}
                        >
                          {plan.popular && (
                            <View style={styles.popularBadge}>
                              <Text style={styles.popularBadgeText}>პოპულარული</Text>
                            </View>
                          )}
                          <View style={styles.planContent}>
                            <View style={styles.planIconContainer}>
                              <Ionicons name={plan.icon as any} size={32} color="#FFFFFF" />
                            </View>
                            <Text style={styles.planTitle}>{plan.title}</Text>
                            <Text style={styles.planDescription}>{plan.description}</Text>
                            <Text style={styles.planPrice}>{plan.price}</Text>
                            {plan.savings && (
                              <View style={styles.savingsBadge}>
                                <Text style={styles.savingsText}>{plan.savings}</Text>
                              </View>
                            )}
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            /* History Tab */
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>CarFAX მოხსენებების ისტორია</Text>
              
              <View style={styles.historyList}>
                {historyReports.map((report) => (
                  <View key={report.id} style={styles.historyItem}>
                    <LinearGradient
                      colors={['rgba(55, 65, 81, 0.3)', 'rgba(75, 85, 99, 0.3)']}
                      style={styles.historyGradient}
                    >
                      <View style={styles.historyIcon}>
                        <Ionicons name="document-text" size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyTitle}>{report.title}</Text>
                        <Text style={styles.historyVin}>VIN: {report.vin}</Text>
                        <Text style={styles.historyDate}>{report.date}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.historyButton}
                        onPress={() => {
                          setSelectedReport(report);
                          setShowReportModal(true);
                        }}
                      >
                        <Ionicons name="eye" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* CarFAX Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: fadeAnim }],
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>CarFAX მოხსენება</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowReportModal(false)}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Report Content */}
            {selectedReport && (
              <View style={styles.modalBody}>
                <Text style={styles.reportTitle}>{selectedReport.title}</Text>
                <Text style={styles.reportVin}>VIN: {selectedReport.vin}</Text>
                <Text style={styles.reportDate}>თარიღი: {selectedReport.date}</Text>

                <View style={styles.reportStats}>
                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Ionicons name="car" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>ავარიების ისტორია</Text>
                      <Text style={styles.statValue}>
                        {selectedReport.accidents === 0 ? '0 ავარია' : `${selectedReport.accidents} ავარია`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Ionicons name="settings" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>მომსახურების ისტორია</Text>
                      <Text style={styles.statValue}>{selectedReport.serviceRecords} ჩანაწერი</Text>
                    </View>
                  </View>

                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Ionicons name="speedometer" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>ოდომეტრი</Text>
                      <Text style={styles.statValue}>{selectedReport.mileage}</Text>
                    </View>
                  </View>

                  <View style={styles.statItem}>
                    <View style={styles.statIcon}>
                      <Ionicons name="people" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>საკუთრების ისტორია</Text>
                      <Text style={styles.statValue}>{selectedReport.owners} მფლობელი</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>დახურვა</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setShowReportModal(false);
                  // Find the full report data
                  const fullReport = carfaxReports.find(r => r._id === selectedReport?.id);
                  if (fullReport) {
                    router.push({
                      pathname: '/carfax-simulation',
                      params: { 
                        vinCode: selectedReport?.vin,
                        carData: JSON.stringify(fullReport)
                      }
                    });
                  }
                }}
              >
                <Text style={styles.modalPrimaryButtonText}>სრული მოხსენება</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          // After successful subscription, allow VIN check
          handleCheckVIN();
        }}
      />

      {/* CarFAX Success Modal */}
      {showCarFAXSuccess && carfaxResult && (
        <CarFAXSuccess
          vinCode={vinNumber.trim().toUpperCase()}
          carData={carfaxResult}
          onClose={() => {
            setShowCarFAXSuccess(false);
            setCarfaxResult(null);
          }}
        />
      )}
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
    gap: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
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
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Hero Section
  heroSection: {
    marginTop: 8,
  },
  heroGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    gap: 4,
  },
  heroTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },

  // Tabs
  tabsContainer: {
    marginTop: 8,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Credits Section
  creditsSection: {
    marginTop: 8,
  },
  creditsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  creditItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  creditLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  creditValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },

  // Input Section
  inputSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  vinInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  checkButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  checkButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginTop: 2,
  },

  // Plans Section
  plansSection: {
    gap: 12,
    marginTop: 8,
  },
  plansGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  planCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  planPressable: {
    flex: 1,
  },
  planGradient: {
    padding: 20,
    height: 180,
    justifyContent: 'center',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  planContent: {
    alignItems: 'center',
    gap: 6,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  planDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
  planPrice: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  savingsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },

  // History Section
  historySection: {
    gap: 12,
    marginTop: 8,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  historyGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  historyVin: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  historyButton: {
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  reportVin: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  reportDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  reportStats: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  modalPrimaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
});