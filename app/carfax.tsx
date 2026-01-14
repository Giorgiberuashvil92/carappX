import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../contexts/UserContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionModal from '../components/ui/SubscriptionModal';
import { carfaxApi, CarFAXReport } from '../services/carfaxApi';

const PRIMARY = '#2563EB';
const DARK = '#0F172A';
const MUTED = '#475569';
const BORDER = '#E2E8F0';
const SOFT = '#F8FAFC';
const FONT = 'Outfit';
const FONT_BOLD = 'Outfit_700Bold';

export default function CarFAXScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paid?: string; vinCode?: string; packagePaid?: string }>();
  const { user } = useUser();
  const { subscription, isPremiumUser } = useSubscription();

  const [vinNumber, setVinNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [carfaxReports, setCarfaxReports] = useState<CarFAXReport[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [carfaxUsage, setCarfaxUsage] = useState<{
    totalLimit: number;
    used: number;
    remaining: number;
    lastResetAt: Date;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const paidFetchRef = useRef(false);

  // Load CarFAX usage for premium users
  useEffect(() => {
    const loadCarFAXUsage = async () => {
      if (isPremiumUser && user?.id) {
        try {
          const usage = await carfaxApi.getCarFAXUsage(user.id);
          setCarfaxUsage(usage);
        } catch (error) {
          console.error('CarFAX usage ჩატვირთვის შეცდომა:', error);
          // Network error-ის შემთხვევაში, ვცდილობთ retry-ს 2 წამის შემდეგ
          if (error instanceof Error && error.message.includes('Network request failed')) {
            setTimeout(() => {
              loadCarFAXUsage();
            }, 2000);
          }
        }
      }
    };

    loadCarFAXUsage();
  }, [isPremiumUser, user?.id]);

  const wrapHtmlWithStyles = (html: string) => {
    const style = `
      <meta charset="UTF-8">
      <base href="https://cai.autoimports.ge/">
      <style id="carfax-override">
        :root { color-scheme: only light; }
        *, *::before, *::after { box-sizing: border-box !important; }
        body {
          font-family: 'Outfit', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          background: #f6f7fb !important;
          color: #0c1b2a !important;
          line-height: 1.6 !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .page {
          max-width: 1080px !important;
          margin: 0 auto !important;
          padding: 24px !important;
        }
        .hero {
          background: linear-gradient(135deg, #0f2d4d, #0b3f6b) !important;
          color: #fff !important;
          border-radius: 18px !important;
          padding: 20px !important;
          margin-bottom: 18px !important;
          box-shadow: 0 16px 40px rgba(12,27,42,0.28) !important;
        }
        h1, h2, h3, h4, h5 {
          color: #0b3f6b !important;
          letter-spacing: 0.2px !important;
          margin-top: 18px !important;
          margin-bottom: 10px !important;
        }
        .hero h1, .hero h2, .hero h3 { color: #fff !important; }
        a { color: #0b64d4 !important; text-decoration: none !important; }
        a:hover { text-decoration: underline !important; }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          background: #fff !important;
          border: 1px solid #d9e2ec !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 10px 28px rgba(12,27,42,0.12) !important;
        }
        th, td {
          padding: 12px 14px !important;
          border-bottom: 1px solid #e3e8f0 !important;
          color: #0c1b2a !important;
          font-size: 14px !important;
        }
        th {
          background: #f0f4ff !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        tr:nth-child(even) td { background: #fbfcff !important; }
        tr:last-child td { border-bottom: none !important; }
        .card, .panel, .box, .section, .summary-row, .row {
          background: #fff !important;
          border: 1px solid #d9e2ec !important;
          border-radius: 16px !important;
          padding: 18px !important;
          margin: 14px 0 !important;
          box-shadow: 0 12px 32px rgba(12,27,42,0.14) !important;
        }
        .badge, .pill {
          display: inline-block !important;
          background: #e9eefb !important;
          color: #0b3f6b !important;
          border-radius: 999px !important;
          padding: 6px 12px !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          letter-spacing: 0.3px !important;
        }
        img { max-width: 100% !important; height: auto !important; border-radius: 8px !important; }
        .kv-row { display: flex !important; justify-content: space-between !important; gap: 12px !important; }
        .kv-row .label { color: #4b5563 !important; font-weight: 600 !important; }
        .kv-row .value { color: #0c1b2a !important; font-weight: 700 !important; }
      </style>
    `;

    // always wrap the body content in a page container for consistent padding
    const bodyWrapped = html.toLowerCase().includes('<body')
      ? html.replace(/<body[^>]*>/i, match => `${match}<div class="page">`).replace(/<\/body>/i, '</div></body>')
      : `<div class="page">${html}</div>`;

    if (html.toLowerCase().includes('</head>')) {
      return bodyWrapped.replace(/<\/head>/i, `${style}</head>`);
    }
    return `<!DOCTYPE html><html><head>${style}</head><body>${bodyWrapped}</body></html>`;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    loadCarFAXReports();
  }, []);

  useEffect(() => {
    const paid = params?.paid === '1';
    const packagePaid = params?.packagePaid === '1';
    const vinParam = params?.vinCode ? String(params.vinCode).toUpperCase() : '';
    
    if (packagePaid && isPremiumUser && user?.id) {
      // პაკეტის გადახდის შემდეგ usage-ის განახლება
      const updateUsage = async (retryCount = 0) => {
        try {
          const updatedUsage = await carfaxApi.getCarFAXUsage(user.id);
          setCarfaxUsage(updatedUsage);
          Alert.alert('წარმატება', '5 CarFAX შემოწმება წარმატებით დაემატა!');
        } catch (error) {
          console.error('Usage განახლების შეცდომა:', error);
          // Network error-ის შემთხვევაში, ვცდილობთ retry-ს (მაქს 3-ჯერ)
          if (error instanceof Error && error.message.includes('Network request failed') && retryCount < 3) {
            setTimeout(() => {
              updateUsage(retryCount + 1);
            }, 2000 * (retryCount + 1)); // Exponential backoff
          } else if (retryCount >= 3) {
            Alert.alert('გაფრთხილება', 'Usage-ის განახლება ვერ მოხერხდა. გთხოვთ განაახლოთ გვერდი.');
          }
        }
      };
      updateUsage();
    }
    
    if (paid && vinParam && !paidFetchRef.current) {
      paidFetchRef.current = true;
      setVinNumber(vinParam);
      fetchCarfaxReport(vinParam);
    }
  }, [params?.paid, params?.packagePaid, params?.vinCode, isPremiumUser, user?.id]);

  const loadCarFAXReports = async () => {
    // ბაზის ისტორიას აღარ ვქაჩავთ
    setCarfaxReports([]);
  };

  const fetchCarfaxReport = async (vin: string) => {
    setLoading(true);
    try {
      const trimmedVin = vin.trim().toUpperCase();
     
      
      // პირდაპირ API-სთან დაკავშირება (იგივე ლოგიკა, როგორც Direct API Test-ში)
      const result = await carfaxApi.getCarFAXReportDirect(trimmedVin);
      
      
      const isHtml = result.content && (
        result.content.includes('<html') || 
        result.content.includes('<!DOCTYPE') ||
        result.content.includes('<body')
      );

      if (!result.success || !isHtml) {
        const errorMsg = result.error || `HTTP ${result.status}: CarFAX მოხსენება ვერ მოიძებნა`;
        Alert.alert('შეცდომა', errorMsg);
        return;
      }

      // HTML-ის დამუშავება და პირდაპირ carfax-view-ზე გადაყვანა
      const styledHtml = wrapHtmlWithStyles(result.content);
      
      // HTML-ის შენახვა AsyncStorage-ში და carfax-view-ზე გადაყვანა
      try {
        const storageKey = `carfax-${trimmedVin}-${Date.now()}`;
        await AsyncStorage.setItem(storageKey, styledHtml);
        
        // Premium მომხმარებლებისთვის usage-ის გაზრდა და განახლება
        if (isPremiumUser && user?.id) {
          try {
            // Usage-ის გაზრდა
            await carfaxApi.incrementCarFAXUsage(user.id);
            // Usage-ის განახლება UI-ში
            const updatedUsage = await carfaxApi.getCarFAXUsage(user.id);
            setCarfaxUsage(updatedUsage);
          } catch (error) {
            console.error('CarFAX usage გაზრდის/განახლების შეცდომა:', error);
            // Network error-ის შემთხვევაში, ვცდილობთ retry-ს
            if (error instanceof Error && error.message.includes('Network request failed')) {
              console.log('🔄 Retrying usage update in 2 seconds...');
              setTimeout(async () => {
                try {
                  const updatedUsage = await carfaxApi.getCarFAXUsage(user.id);
                  setCarfaxUsage(updatedUsage);
                } catch (retryError) {
                  console.error('❌ Retry failed:', retryError);
                }
              }, 2000);
            }
          }
        }
        
        // პირდაპირ carfax-view-ზე გადაყვანა
        router.push({
          pathname: '/carfax-view',
          params: {
            storageKey,
            vinCode: trimmedVin,
          },
        });
      } catch (err) {
        console.error('❌ Error storing HTML:', err);
        Alert.alert('შეცდომა', 'HTML კონტენტის შენახვა ვერ მოხერხდა');
      }

    } catch (error) {
      console.error('❌ CarFAX API შეცდომა:', error);
      Alert.alert('შეცდომა', `CarFAX მოხსენების მიღებისას მოხდა შეცდომა: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };


  const handleCheckVIN = async () => {
    if (!vinNumber.trim()) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ VIN ნომერი');
      return;
    }
    if (vinNumber.trim().length !== 17) {
      Alert.alert('შეცდომა', 'VIN ნომერი უნდა შედგებოდეს 17 სიმბოლოსგან');
      return;
    }

    const trimmedVin = vinNumber.trim().toUpperCase();

    // Premium მომხმარებლებისთვის პირდაპირ მოძებნა
    if (isPremiumUser) {
      // შევამოწმოთ დარჩენილი შემოწმება
      if (carfaxUsage && carfaxUsage.remaining <= 0) {
        Alert.alert(
          'ლიმიტი ამოწურულია',
          'თქვენ გამოიყენეთ ყველა შემოწმება. შეიძინეთ დამატებითი პაკეტი 5 CarFAX შემოწმება 30 ლარად.',
          [
            { text: 'გაუქმება', style: 'cancel' },
            {
              text: 'პაკეტის ყიდვა',
              onPress: () => {
                router.push({
                  pathname: '/payment-card',
                  params: {
                    amount: '30',
                    description: 'CarFAX პაკეტი - 5 შემოწმება',
                    context: 'carfax-package',
                    orderId: `carfax_package_${user?.id || 'guest'}_${Date.now()}`,
                    successUrl: `/carfax?packagePaid=1`,
                    metadata: JSON.stringify({
                      packageType: 'package',
                      reportType: 'carfax',
                      credits: 5,
                    }),
                  },
                });
              },
            },
          ]
        );
        return;
      }
      await fetchCarfaxReport(trimmedVin);
      return;
    }

    router.push({
      pathname: '/payment-card',
      params: {
        amount: '14.99',
        description: 'CarFAX ერთჯერადი მოხსენება',
        context: 'carfax',
        orderId: `carfax_subscription_${user?.id || 'guest'}_${Date.now()}`,
        successUrl: `/carfax?paid=1&vinCode=${encodeURIComponent(trimmedVin)}`,
        vinCode: trimmedVin,
        metadata: JSON.stringify({
          packageType: 'single',
          vinNumber: trimmedVin,
          reportType: 'carfax',
          credits: 1,
        }),
      },
    });
  };

  const historyReports = carfaxReports.map(report => ({
    id: report._id,
    title: `${report.year} ${report.make} ${report.model}`,
    vin: report.vin,
    date: new Date(report.createdAt).toLocaleString('ka-GE'),
    accidents: report.accidents,
    serviceRecords: report.serviceRecords,
    mileage: report.mileage ? `${report.mileage.toLocaleString()} კმ` : 'უცნობი',
    owners: report.owners,
    reportId: report.reportId,
  }));

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
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={PRIMARY} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>CarFAX</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
                <Text style={styles.heroBadgeText}>დაცული გადახდა</Text>
              </View>
              <Text style={styles.heroTitle}>სრული CarFAX მოხსენება წუთებში</Text>
              <Text style={styles.heroSubtitle}>
                VIN კოდის შემოწმება, გადახდა და სრული HTML/PDF. ავარიები, სერვისები და მფლობელობა ერთ ეკრანზე.
              </Text>
              <View style={styles.heroChips}>
                <View style={styles.chip}>
                  <Ionicons name="time" size={14} color={PRIMARY} />
                  <Text style={styles.chipText}>სწრაფი პასუხი</Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="document-text" size={14} color={PRIMARY} />
                  <Text style={styles.chipText}>PDF/HTML</Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="card" size={14} color={PRIMARY} />
                  <Text style={styles.chipText}>უსაფრთხო გადახდა</Text>
                </View>
              </View>
            </View>

            <View style={styles.tabsWrapper}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'search' && styles.activeTab]}
                onPress={() => setActiveTab('search')}
              >
                <Ionicons name="search" size={18} color={activeTab === 'search' ? '#FFFFFF' : MUTED} />
                <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>ძებნა</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                onPress={() => setActiveTab('history')}
              >
                <Ionicons name="time" size={18} color={activeTab === 'history' ? '#FFFFFF' : MUTED} />
                <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>ისტორია</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'search' ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>VIN კოდის შემოწმება</Text>
                    <Text style={styles.cardSubtitle}>
                      {isPremiumUser && carfaxUsage 
                        ? `დარჩენილი შემოწმება: ${carfaxUsage.remaining} / ${carfaxUsage.totalLimit}`
                        : 'შეიყვანე 17 სიმბოლო და მიიღე მოხსენება'}
                    </Text>
                  </View>
                  <Ionicons name="car-sport" size={26} color={PRIMARY} />
                </View>
                
                {/* Premium User Info */}
                {isPremiumUser && carfaxUsage && (
                  <View style={{
                    backgroundColor: '#F0F9FF',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#BAE6FD',
                    marginBottom: 8,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="diamond" size={18} color="#0EA5E9" />
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#0C4A6E',
                        fontFamily: FONT,
                      }}>
                        პრემიუმ იუზერი
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 12,
                      color: '#075985',
                      fontFamily: FONT,
                      marginTop: 4,
                    }}>
                      გამოყენებული: {carfaxUsage.used} / {carfaxUsage.totalLimit} შემოწმება
                    </Text>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="key" size={18} color={MUTED} />
                  <TextInput
                    style={styles.vinInput}
                    placeholder="მაგ: 1HGCM82633A123456"
                    placeholderTextColor="#94A3B8"
                    value={vinNumber}
                    onChangeText={setVinNumber}
                    maxLength={17}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={[styles.checkButton, loading && styles.checkButtonDisabled]}
                    onPress={handleCheckVIN}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Ionicons name="search" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.helperRow}>
                  <Ionicons name="information-circle" size={16} color={MUTED} />
                  <Text style={styles.helperText}>VIN 17 სიმბოლოა და ჩანს წინა საქარე მინაზე ან კარსშიდა პლაკატზე.</Text>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleCheckVIN} disabled={loading}>
                  <View style={styles.primaryButtonLeft}>
                    <Ionicons name={isPremiumUser ? "checkmark-circle" : "card"} size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {isPremiumUser ? 'CarFAX შემოწმება' : 'გადახდა და სრული CarFAX'}
                    </Text>
                  </View>
                  <Text style={styles.primaryButtonPrice}>
                    {isPremiumUser ? 'უფასო' : '14.99₾'}
                  </Text>
                </TouchableOpacity>


                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="shield" size={18} color={PRIMARY} />
                    <Text style={styles.infoTitle}>ავარიები</Text>
                    <Text style={styles.infoText}>დაზიანებები, ტოტალ-ლოსი და ტიტული</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="construct" size={18} color={PRIMARY} />
                    <Text style={styles.infoTitle}>სერვისები</Text>
                    <Text style={styles.infoText}>მომსახურების ჩანაწერები და გარბენის დინამიკა</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="people" size={18} color={PRIMARY} />
                    <Text style={styles.infoTitle}>მფლობელები</Text>
                    <Text style={styles.infoText}>ფლობის ცვლები და რეგისტრაციის ზონები</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>მოხსენებების ისტორია</Text>
                    <Text style={styles.cardSubtitle}>წინა მოთხოვნები შენახულია</Text>
                  </View>
                  <Ionicons name="time" size={24} color={PRIMARY} />
                </View>

                {historyReports.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="archive-outline" size={32} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>ჯერ არაფერია შენახული</Text>
                    <Text style={styles.emptySubtitle}>გააკეთე VIN ძებნა და მოხსენებები აქ გამოჩნდება</Text>
                  </View>
                ) : (
                  <View style={styles.historyList}>
                    {historyReports.map(report => (
                      <TouchableOpacity
                        key={report.id}
                        style={styles.historyRow}
                        onPress={() => {
                          setSelectedReport(report);
                          setShowReportModal(true);
                        }}
                      >
                        <View style={styles.historyIcon}>
                          <Ionicons name="document-text" size={20} color={PRIMARY} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>{report.title}</Text>
                          <Text style={styles.historyMeta}>VIN: {report.vin}</Text>
                          <Text style={styles.historyMeta}>{report.date}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
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
              <View style={styles.modalHeader}>
                <View style={styles.modalIcon}>
                  <Ionicons name="document-text" size={24} color={PRIMARY} />
                </View>
                <Text style={styles.modalTitle}>CarFAX მოხსენება</Text>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowReportModal(false)}>
                  <Ionicons name="close" size={20} color={MUTED} />
                </TouchableOpacity>
              </View>

              {selectedReport && (
                <View style={styles.modalBody}>
                  <Text style={styles.reportTitle}>{selectedReport.title}</Text>
                  <Text style={styles.reportVin}>VIN: {selectedReport.vin}</Text>
                  <Text style={styles.reportDate}>თარიღი: {selectedReport.date}</Text>

                  <View style={styles.reportStats}>
                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons name="car" size={20} color={PRIMARY} />
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
                        <Ionicons name="settings" size={20} color={PRIMARY} />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>მომსახურების ისტორია</Text>
                        <Text style={styles.statValue}>{selectedReport.serviceRecords} ჩანაწერი</Text>
                      </View>
                    </View>

                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons name="speedometer" size={20} color={PRIMARY} />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>ოდომეტრი</Text>
                        <Text style={styles.statValue}>{selectedReport.mileage}</Text>
                      </View>
                    </View>

                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons name="people" size={20} color={PRIMARY} />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>საკუთრების ისტორია</Text>
                        <Text style={styles.statValue}>{selectedReport.owners} მფლობელი</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setShowReportModal(false)}>
                  <Text style={styles.modalSecondaryButtonText}>დახურვა</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    setShowReportModal(false);
                    const fullReport = carfaxReports.find(r => r._id === selectedReport?.id);
                    if (fullReport) {
                      router.push({
                        pathname: '/carfax-simulation',
                        params: {
                          vinCode: selectedReport?.vin,
                          carData: JSON.stringify(fullReport),
                        },
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


        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={() => {
            setShowSubscriptionModal(false);
          }}
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.18)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    letterSpacing: 0.2,
    fontFamily: FONT_BOLD,
  },
  headerSpacer: { width: 40 },
  heroCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F6F8FF',
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E0ECFF',
    borderColor: '#C7DBFF',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: { color: DARK, fontSize: 12, fontWeight: '600', fontFamily: FONT },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    lineHeight: 26,
    letterSpacing: 0.2,
    fontFamily: FONT_BOLD,
  },
  heroSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONT,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: { color: DARK, fontSize: 12, fontWeight: '600', fontFamily: FONT },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tabText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontFamily: FONT_BOLD,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: DARK, fontSize: 18, fontWeight: '700', letterSpacing: 0.2, fontFamily: FONT_BOLD },
  cardSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2, fontFamily: FONT },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    gap: 8,
  },
  vinInput: {
    flex: 1,
    color: DARK,
    fontSize: 16,
    paddingVertical: 14,
    letterSpacing: 1,
    fontFamily: FONT,
  },
  checkButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  checkButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperText: {
    color: MUTED,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
    fontFamily: FONT,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  primaryButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: FONT_BOLD },
  primaryButtonPrice: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', fontFamily: FONT_BOLD },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoItem: {
    width: '31%',
    minWidth: 0,
    backgroundColor: SOFT,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  infoTitle: { color: DARK, fontWeight: '500', fontSize: 13, fontFamily: FONT },
  infoText: { color: MUTED, fontSize: 12, lineHeight: 16, fontFamily: FONT },
  historyList: { gap: 10 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: SOFT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0ECFF',
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  historyTitle: { color: DARK, fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD },
  historyMeta: { color: MUTED, fontSize: 12, marginTop: 2, fontFamily: FONT },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  emptyTitle: { color: DARK, fontWeight: '700', fontSize: 16, fontFamily: FONT_BOLD },
  emptySubtitle: { color: MUTED, fontSize: 13, textAlign: 'center', fontFamily: FONT },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  modalTitle: { flex: 1, color: DARK, fontSize: 18, fontWeight: '700', fontFamily: FONT_BOLD },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalBody: { padding: 20, gap: 12 },
  reportTitle: { color: DARK, fontSize: 19, fontWeight: '700', fontFamily: FONT_BOLD },
  reportVin: { color: MUTED, fontSize: 13, fontFamily: FONT },
  reportDate: { color: '#94A3B8', fontSize: 12, marginTop: -4, fontFamily: FONT },
  reportStats: { gap: 10, marginTop: 6 },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SOFT,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  statContent: { flex: 1 },
  statLabel: { color: DARK, fontWeight: '600', fontSize: 13, fontFamily: FONT },
  statValue: { color: '#111827', fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: SOFT,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalSecondaryButtonText: { color: MUTED, fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD },
  modalPrimaryButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  modalPrimaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: FONT_BOLD },
});
