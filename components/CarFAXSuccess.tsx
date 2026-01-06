import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { carfaxApi } from '../services/carfaxApi';

const { width } = Dimensions.get('window');
const ACCENT = '#0B64D4';
const SURFACE = '#F3F6FC';
const BG = '#FFFFFF';
const TEXT = '#0F172A';
const MUTED = '#475569';

interface CarFAXSuccessProps {
  vinCode: string;
  carData: any;
  onClose: () => void;
}

export default function CarFAXSuccess({ vinCode, carData, onClose }: CarFAXSuccessProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const wrapHtmlWithStyles = (html: string) => {
    const style = `
      <meta charset="UTF-8">
      <base href="https://cai.autoimports.ge/">
      <style id="carfax-override">
        :root { color-scheme: only light; }
        *, *::before, *::after { box-sizing: border-box !important; }
        body {
          font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
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
    const bodyWrapped = html.toLowerCase().includes('<body')
      ? html.replace(/<body[^>]*>/i, m => `${m}<div class="page">`).replace(/<\/body>/i, '</div></body>')
      : `<div class="page">${html}</div>`;
    if (html.toLowerCase().includes('</head>')) {
      return bodyWrapped.replace(/<\/head>/i, `${style}</head>`);
    }
    return `<!DOCTYPE html><html><head>${style}</head><body>${bodyWrapped}</body></html>`;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const generatePDF = async (htmlContent: string): Promise<string | null> => {
    try {
      const styled = wrapHtmlWithStyles(htmlContent);
      let Print: any;
      try {
        Print = require('expo-print');
      } catch {
        Alert.alert('შეცდომა', 'expo-print module არ არის ხელმისაწვდომი');
        throw new Error('expo-print module not found');
      }
      const { uri } = await Print.printToFileAsync({ html: styled, base64: false });
      return uri;
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      Alert.alert('შეცდომა', 'PDF-ის გენერაციისას მოხდა შეცდომა');
      return null;
    }
  };

  const sharePDF = async (pdfUri: string) => {
    const Sharing = require('expo-sharing');
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('შეცდომა', 'გაზიარება მიუწვდომელია ამ მოწყობილობაზე.');
      return;
    }
    await Sharing.shareAsync(pdfUri, {
      dialogTitle: 'გააზიარეთ CarFAX მოხსენება',
      UTI: 'com.adobe.pdf',
    });
  };

  const handleDownload = async () => {
    try {
      const htmlContent = carData?.htmlContent || carData?.reportData?.htmlContent;
      if (!htmlContent?.trim()) {
        Alert.alert('შეცდომა', 'HTML კონტენტი ვერ მოიძებნა PDF-ისთვის.');
        return;
      }
      const styledHtml = wrapHtmlWithStyles(htmlContent);
      const fileName = `CarFAX_Report_${vinCode}_${Date.now()}.pdf`;
      const { buffer } = await carfaxApi.generatePdfFromHtml(styledHtml, fileName);

      if (!FileSystem.documentDirectory) {
        Alert.alert('შეცდომა', 'ფაილური სისტემა მიუწვდომელია.');
        return;
      }
      const base64 = Buffer.from(buffer).toString('base64');
      const pdfPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(pdfPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      Alert.alert('PDF მზადაა', `ფაილი შეიქმნა: ${fileName}`, [
        { text: 'კარგი' },
        { text: 'გაზიარება', onPress: async () => sharePDF(pdfPath) },
      ]);
    } catch (error) {
      console.error('❌ PDF-ის გენერაციის შეცდომა:', error);
      Alert.alert('შეცდომა', 'PDF-ის გენერაციისას მოხდა შეცდომა');
    }
  };

  const handleShare = async () => {
    try {
      const htmlContent = carData?.htmlContent || carData?.reportData?.htmlContent;
      if (!htmlContent?.trim()) {
        Alert.alert('შეცდომა', 'HTML კონტენტი არ არის ხელმისაწვდომი');
        return;
      }
      const pdfUri = await generatePDF(htmlContent);
      if (pdfUri) await sharePDF(pdfUri);
    } catch (error) {
      console.error('❌ გაზიარების შეცდომა:', error);
      Alert.alert('შეცდომა', 'გაზიარებისას მოხდა შეცდომა');
    }
  };

  const make = carData?.make || 'უცნობი';
  const model = carData?.model || 'უცნობი';
  const year = carData?.year || '';
  const mileage = carData?.mileage ?? 0;
  const owners = carData?.owners ?? 0;
  const accidents = carData?.accidents ?? 0;
  const serviceRecords = carData?.serviceRecords ?? 0;
  const titleStatus = carData?.titleStatus || 'უცნობი';
  const lastServiceDate = carData?.lastServiceDate || '';

  const SpecRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
          colors={['#0b64d4', '#0f7bff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <Ionicons name="chevron-back" size={20} color="#E5E7EB" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>CarFAX Report</Text>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/carfax')}>
                <Ionicons name="refresh" size={18} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{make} {model}</Text>
                <Text style={styles.heroSubtitle}>{year} • VIN {vinCode}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#E0F2FE" />
                <Text style={styles.heroBadgeText}>Verified</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.card}>
              <SpecRow label="VIN" value={vinCode} />
              <SpecRow label="Model" value={`${make} ${model} ${year}`} />
              <SpecRow label="Mileage" value={mileage ? `${mileage} mi` : '—'} />
              <SpecRow label="Title status" value={titleStatus} />
              <SpecRow label="Last service" value={lastServiceDate || '—'} />
            </View>

            <View style={styles.grid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Owners</Text>
                <Text style={styles.infoValue}>{owners}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Accidents</Text>
                <Text style={styles.infoValue}>{accidents}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Service Records</Text>
                <Text style={styles.infoValue}>{serviceRecords}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Year</Text>
                <Text style={styles.infoValue}>{year || '—'}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.viewBtn} 
                onPress={async () => {
                  const htmlContent = carData?.htmlContent || carData?.reportData?.htmlContent;
                  if (htmlContent) {
                    try {
                      // HTML-ს შევინახავთ AsyncStorage-ში და გადავცემთ მხოლოდ key-ს
                      const storageKey = `carfax_html_${vinCode}_${Date.now()}`;
                      await AsyncStorage.setItem(storageKey, htmlContent);
                      console.log('✅ HTML saved to AsyncStorage:', storageKey, 'length:', htmlContent.length);
                      
                      router.push({
                        pathname: '/carfax-view',
                        params: {
                          storageKey: storageKey,
                          vinCode: vinCode,
                        },
                      });
                    } catch (error) {
                      console.error('HTML storage შეცდომა:', error);
                      Alert.alert('შეცდომა', 'HTML კონტენტის შენახვისას მოხდა შეცდომა');
                    }
                  } else {
                    Alert.alert('შეცდომა', 'HTML კონტენტი ვერ მოიძებნა');
                  }
                }}
              >
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.viewBtnText}>HTML ჩვენება</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleDownload}>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>PDF ჩამოტვირთვა</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={ACCENT} />
                <Text style={styles.secondaryText}>გაზიარება</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.flatBtn} onPress={onClose}>
              <Text style={styles.flatBtnText}>დახურვა</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: width * 0.94,
    maxHeight: '90%',
    backgroundColor: BG,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14,165,233,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#E0F2FE',
    fontWeight: '700',
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: BG,
    gap: 12,
  },
  card: {
    backgroundColor: SURFACE,
    borderColor: '#E3E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kvLabel: {
    color: MUTED,
    fontWeight: '600',
  },
  kvValue: {
    color: TEXT,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    backgroundColor: SURFACE,
    borderColor: '#E3E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  infoLabel: {
    color: MUTED,
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    color: TEXT,
    fontWeight: '700',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#0b64d4',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,100,212,0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(11,100,212,0.35)',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryText: {
    color: ACCENT,
    fontWeight: '700',
    marginLeft: 8,
  },
  flatBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  flatBtnText: {
    color: MUTED,
    fontWeight: '600',
  },
});
