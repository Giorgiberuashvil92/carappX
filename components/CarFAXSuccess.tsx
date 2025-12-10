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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';

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

  const generatePDF = async (htmlContent: string): Promise<string | null> => {
    try {
      // Dynamic import for expo-print
      let Print: any;
      try {
        Print = require('expo-print');
      } catch (requireError) {
        Alert.alert(
          'შეცდომა',
          'expo-print module არ არის ხელმისაწვდომი. გთხოვთ გადააკეთოთ app-ი expo-print module-ით.'
        );
        throw new Error('expo-print module not found');
      }

      console.log('📄 PDF-ის გენერაცია CarFAX მოხსენებისთვის HTML-დან...');
      console.log('📄 HTML content length:', htmlContent.length);
      console.log('📄 HTML content preview (first 300 chars):', htmlContent.substring(0, 300));
      
      // Validate HTML content
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('HTML კონტენტი ცარიელია');
      }
      
      // Ensure HTML has proper structure for PDF generation
      let wrappedHtml = htmlContent.trim();
      
      // Check if HTML already has document structure
      const hasDocType = wrappedHtml.includes('<!DOCTYPE') || wrappedHtml.includes('<!doctype');
      const hasHtmlTag = wrappedHtml.toLowerCase().includes('<html');
      const hasBodyTag = wrappedHtml.toLowerCase().includes('<body');
      
      // If HTML is missing structure, wrap it
      if (!hasDocType || !hasHtmlTag || !hasBodyTag) {
        console.log('📦 Wrapping HTML content with proper document structure...');
        
        // Extract body content if it exists
        let bodyContent = wrappedHtml;
        if (hasBodyTag) {
          const bodyMatch = wrappedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (bodyMatch) {
            bodyContent = bodyMatch[1];
          }
        }
        
        // Create complete HTML document
        wrappedHtml = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CarFAX Report - ${vinCode}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 20px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
        
        console.log('✅ HTML wrapped with proper structure, new length:', wrappedHtml.length);
        console.log('📄 Wrapped HTML preview (first 500 chars):', wrappedHtml.substring(0, 500));
      } else {
        console.log('✅ HTML already has proper structure');
        // Even if it has structure, ensure it has proper encoding
        if (!wrappedHtml.includes('charset')) {
          // Add charset if missing
          wrappedHtml = wrappedHtml.replace('<head>', '<head><meta charset="UTF-8">');
          console.log('📝 Added charset meta tag');
        }
      }
      
      // Final validation - check if wrapped HTML has actual content
      const bodyMatch = wrappedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        const bodyContent = bodyMatch[1].trim();
        console.log('📄 Body content preview:', bodyContent.substring(0, 500));
        
        if (bodyContent.length < 100) {
          console.warn('⚠️ Body content seems too short:', bodyContent.length, 'characters');
          console.warn('⚠️ This might be a React SPA shell that needs JavaScript to render');
          
          // Try to find if there's a div with id="root" or similar
          if (bodyContent.includes('root') || bodyContent.includes('app') || bodyContent.includes('__next')) {
            console.warn('⚠️ Detected React/Next.js app shell - content needs JavaScript to render');
            
            // Try to extract any static content that might be in the HTML
            // Look for script tags that might contain data
            const scriptMatches = wrappedHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
            if (scriptMatches) {
              console.log('📜 Found', scriptMatches.length, 'script tags');
              
              // Check if scripts contain JSON data that we can use
              for (const script of scriptMatches) {
                // Look for JSON data in script tags
                const jsonMatch = script.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  try {
                    const jsonData = JSON.parse(jsonMatch[0]);
                    console.log('📦 Found JSON data in script tag');
                    // This might contain report data, but we still can't render React components
                  } catch (e) {
                    // Not valid JSON
                  }
                }
              }
            }
            
            // Check if HTML contains React hydration data
            if (wrappedHtml.includes('__NEXT_DATA__') || wrappedHtml.includes('window.__REACT') || bodyContent.includes('root')) {
              console.warn('⚠️ This is a React/Next.js app that requires client-side rendering');
              
              // Save HTML file as fallback so user can open it in browser
              console.log('💾 Saving HTML file as fallback...');
              try {
                if (FileSystem.documentDirectory) {
                  const htmlFileName = `carfax-report-${vinCode}-${Date.now()}.html`;
                  const htmlFileUri = `${FileSystem.documentDirectory}${htmlFileName}`;
                  
                  await FileSystem.writeAsStringAsync(htmlFileUri, wrappedHtml, {
                    encoding: FileSystem.EncodingType.UTF8,
                  });
                  
                  console.log('✅ HTML file saved:', htmlFileUri);
                  
                  // Show alert with option to share HTML file
                  // Use setTimeout to ensure Alert shows before error is thrown
                  setTimeout(() => {
                    Alert.alert(
                      'შეცდომა',
                      `HTML კონტენტი არის React აპლიკაცია, რომელიც საჭიროებს JavaScript-ს.\n\nPDF-ის გენერაცია ვერ მოხერხდა.\n\nHTML ფაილი შეინახა:\n${htmlFileName}\n\nგახსენით ის ბრაუზერში JavaScript-ით.`,
                      [
                        { text: 'კარგი' },
                        {
                          text: 'გაზიარება',
                          onPress: async () => {
                            try {
                              const Sharing = require('expo-sharing');
                              if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(htmlFileUri);
                              } else {
                                Alert.alert('შეცდომა', 'გაზიარება ხელმისაწვდომი არ არის');
                              }
                            } catch (shareError) {
                              console.error('Share error:', shareError);
                              Alert.alert('შეცდომა', 'გაზიარებისას მოხდა შეცდომა');
                            }
                          },
                        },
                      ]
                    );
                  }, 100);
                  
                  // Return null instead of throwing to prevent error from showing
                  return null;
                } else {
                  Alert.alert(
                    'შეცდომა',
                    'HTML კონტენტი არის React აპლიკაცია, რომელიც საჭიროებს JavaScript-ს.\n\nPDF-ის გენერაცია ვერ მოხერხდა.\n\nგთხოვთ დაუკავშირდეთ API developer-ს რომ აბრუნოს სერვერზე რენდერებული HTML.'
                  );
                  return null;
                }
              } catch (saveError) {
                console.error('Failed to save HTML file:', saveError);
                Alert.alert(
                  'შეცდომა',
                  'HTML კონტენტი არის React აპლიკაცია, რომელიც საჭიროებს JavaScript-ს.\n\nPDF-ის გენერაცია ვერ მოხერხდა.'
                );
                return null;
              }
            }
          }
        } else {
          console.log('✅ Body content validated, length:', bodyContent.length, 'characters');
        }
      }
      
      // PDF-ის შექმნა HTML-დან
      console.log('🔄 Generating PDF from HTML...');
      const { uri } = await Print.printToFileAsync({
        html: wrappedHtml,
        base64: false,
        width: 612, // A4 width in points (8.5 inches * 72 points/inch)
        height: 792, // A4 height in points (11 inches * 72 points/inch)
      });

      console.log('✅ PDF შექმნილია:', uri);
      console.log('📊 Final HTML length sent to print:', wrappedHtml.length);
      return uri;
    } catch (error) {
      console.error('❌ PDF-ის შექმნის შეცდომა:', error);
      throw error;
    }
  };

  const sharePDF = async (pdfUri: string) => {
    try {
      // Dynamic import for expo-sharing
      let Sharing: any;
      try {
        Sharing = require('expo-sharing');
      } catch (requireError) {
        Alert.alert(
          'შეცდომა',
          'expo-sharing module არ არის ხელმისაწვდომი. გთხოვთ გადააკეთოთ app-ი expo-sharing module-ით.'
        );
        throw new Error('expo-sharing module not found');
      }

      // PDF ფაილის გაზიარება
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('შეცდომა', 'გაზიარების ფუნქცია მიუწვდომელია ამ მოწყობილობაზე.');
        return;
      }
      
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'გააზიარეთ CarFAX მოხსენება',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('❌ PDF-ის გაზიარების შეცდომა:', error);
      throw error;
    }
  };

  const handleDownload = async () => {
    try {
      // Check if we have HTML content from API
      const htmlContent = carData?.htmlContent;
      
      if (!htmlContent) {
        Alert.alert(
          'შეცდომა', 
          'PDF-ის შესაქმნელად HTML კონტენტი არ არის ხელმისაწვდომი.\n\nეს ნიშნავს რომ CarFAX API-დან HTML მოხსენება ვერ მოიძებნა.'
        );
        console.warn('⚠️ HTML content არ არის carData-ში:', carData);
        return;
      }

      console.log('📄 HTML content length:', htmlContent.length);
      console.log('📄 HTML content preview (first 500 chars):', htmlContent.substring(0, 500));
      
      // Validate HTML content
      if (!htmlContent || htmlContent.trim().length === 0) {
        Alert.alert('შეცდომა', 'HTML კონტენტი ცარიელია.');
        return;
      }
      
      // Generate PDF
      const pdfUri = await generatePDF(htmlContent);
      
      if (!pdfUri) {
        // generatePDF already showed an Alert if it's a React app shell
        // Only show this Alert if pdfUri is null for other reasons
        console.log('⚠️ PDF generation returned null - Alert already shown if React app shell detected');
        return;
      }

      // Move to a better location with descriptive filename if needed
      if (FileSystem.documentDirectory) {
        const pdfFileName = `CarFAX_Report_${vinCode}_${Date.now()}.pdf`;
        const newPdfUri = `${FileSystem.documentDirectory}${pdfFileName}`;
        
        try {
          await FileSystem.moveAsync({
            from: pdfUri,
            to: newPdfUri,
          });
          
          Alert.alert(
            'წარმატება',
            `PDF ფაილი წარმატებით შეიქმნა:\n${pdfFileName}`,
            [
              { text: 'კარგი' },
              {
                text: 'გაზიარება',
                onPress: async () => {
                  try {
                    await sharePDF(newPdfUri);
                  } catch (shareError) {
                    Alert.alert('შეცდომა', 'გაზიარებისას მოხდა შეცდომა');
                  }
                },
              },
            ]
          );
        } catch (moveError) {
          // If move fails, just use original URI
          Alert.alert(
            'წარმატება',
            'PDF ფაილი წარმატებით შეიქმნა.',
            [
              { text: 'კარგი' },
              {
                text: 'გაზიარება',
                onPress: async () => {
                  try {
                    await sharePDF(pdfUri);
                  } catch (shareError) {
                    Alert.alert('შეცდომა', 'გაზიარებისას მოხდა შეცდომა');
                  }
                },
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'წარმატება',
          'PDF ფაილი წარმატებით შეიქმნა.',
          [
            { text: 'კარგი' },
            {
              text: 'გაზიარება',
              onPress: async () => {
                try {
                  await sharePDF(pdfUri);
                } catch (shareError) {
                  Alert.alert('შეცდომა', 'გაზიარებისას მოხდა შეცდომა');
                }
              },
            },
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ PDF-ის გენერაციის შეცდომა:', error);
      Alert.alert('შეცდომა', `PDF-ის გენერაციისას მოხდა შეცდომა: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleShare = async () => {
    try {
      const htmlContent = carData?.htmlContent;
      
      if (!htmlContent) {
        Alert.alert('შეცდომა', 'გაზიარებისთვის HTML კონტენტი არ არის ხელმისაწვდომი');
        return;
      }

      // Generate PDF first
      const pdfUri = await generatePDF(htmlContent);
      
      if (!pdfUri) {
        Alert.alert('შეცდომა', 'PDF-ის შექმნა ვერ მოხერხდა.');
        return;
      }

      // Share the PDF
      await sharePDF(pdfUri);
      
    } catch (error) {
      console.error('❌ გაზიარების შეცდომა:', error);
      Alert.alert('შეცდომა', `გაზიარებისას მოხდა შეცდომა: ${error instanceof Error ? error.message : String(error)}`);
    }
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
                <Text style={styles.carInfoValue}>
                  {carData.mileage ? `${carData.mileage.toLocaleString()} კმ` : 'უცნობი'}
                </Text>
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
