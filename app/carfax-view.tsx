import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, ActivityIndicator, Share, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CARFAX_CSS } from '../utils/carfaxStyles';

const PRIMARY = '#2563EB';

// CarFAX CSS სტილების ჩატვირთვა
async function loadCarfaxCSS(): Promise<string> {
  try {
    // CSS ფაილი TypeScript ფაილიდან იტვირთება (production-ready)
    // CARFAX_CSS არის constant, ამიტომ სინქრონულად ხელმისაწვდომია
    if (CARFAX_CSS && CARFAX_CSS.length > 0) {
      if (__DEV__) {
        console.log('✅ CarFAX CSS loaded from TypeScript module, length:', CARFAX_CSS.length);
      }
      return CARFAX_CSS;
    }
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error loading CarFAX CSS:', error);
    }
    // Fallback - ვიყენებთ მინიმალურ CSS-ს
    return `html,body,div,span,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,abbr,acronym,address,del,strong,sub,sup,tt,var,b,u,i,dl,dt,dd,ol,ul,li,fieldset,form,label,table,caption,tbody,tr,th,td{margin:0;padding:0;border:0;outline:0}html{font-family:"Roboto",sans-serif;font-size:14px;font-weight:400;line-height:1.5;color:#212121}body{min-width:320px}`;
  }
  
  // Fallback CSS თუ CARFAX_CSS არ არის ხელმისაწვდომი
  return `html,body,div,span,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,abbr,acronym,address,del,strong,sub,sup,tt,var,b,u,i,dl,dt,dd,ol,ul,li,fieldset,form,label,table,caption,tbody,tr,th,td{margin:0;padding:0;border:0;outline:0}html{font-family:"Roboto",sans-serif;font-size:14px;font-weight:400;line-height:1.5;color:#212121}body{min-width:320px}`;
}

// window.__INITIAL__DATA__-ის ამოღება HTML-დან
function extractInitialData(html: string): any {
  try {
    const match = html.match(/window\.__INITIAL__DATA__\s*=\s*({[\s\S]*?});/);
    if (match && match[1]) {
      // ვცდილობთ parse-ი გავაკეთოთ
      const dataStr = match[1].replace(/!0/g, 'true').replace(/!1/g, 'false');
      return JSON.parse(dataStr);
    }
  } catch (e) {
    console.error('❌ Error parsing __INITIAL__DATA__:', e);
  }
  return null;
}

// BODY-ის ამოღება HTML-დან
function extractBody(html: string): string {
  // ვცდილობთ სხვადასხვა ვარიანტებით
  let match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (match && match[1]) {
    const bodyContent = match[1].trim();
    // თუ body-ში მხოლოდ root div არის (React app), ვაბრუნებთ მთელ HTML-ს
    if (bodyContent === '<div id="root"></div>' || bodyContent === '<div id=\'root\'></div>' || bodyContent.includes('<div id="root"></div>')) {
      // ვცდილობთ ვიპოვოთ სრული HTML სტრუქტურა
      return html; // ვაბრუნებთ მთელ HTML-ს რადგან React app-ია
    }
    return bodyContent;
  }
  
  // თუ body tag არ არის, ვაბრუნებთ მთელ HTML-ს
  return html;
}

// HTML sanitization - წაშლა script, iframe, noscript, link, meta
function sanitizeCarfaxHtml(html: string): string {
  let sanitized = html;
  
  // წაშლა script tags (გარდა inline scripts-ის, რომელიც შეიცავს __INITIAL__DATA__)
  sanitized = sanitized.replace(/<script[^>]*>(?![\s\S]*?__INITIAL__DATA__)[\s\S]*?<\/script>/gi, '');
  
  // წაშლა iframe tags
  sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  
  // წაშლა noscript tags
  sanitized = sanitized.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  
  // წაშლა link tags (CSS) - დავტოვოთ viewport meta
  sanitized = sanitized.replace(/<link[^>]*>/gi, '');
  
  // წაშლა meta tags (გარდა viewport-ის)
  sanitized = sanitized.replace(/<meta(?![^>]*viewport)[^>]*>/gi, '');
  
  // წაშლა style tags (head-ში ან სხვა ადგილას)
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  return sanitized;
}

export default function CarFAXViewScreen() {
  const router = useRouter();
  const { htmlContent: encodedHtml, storageKey, vinCode } = useLocalSearchParams<{ 
    htmlContent?: string; 
    storageKey?: string; 
    vinCode?: string 
  }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [carfaxCSS, setCarfaxCSS] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // გაზიარების ფუნქცია
  const handleShare = async () => {
    if (!sanitizedHtml) {
      Alert.alert('შეცდომა', 'HTML კონტენტი ვერ მოიძებნა');
      return;
    }

    try {
      setIsSharing(true);
      
      // HTML-ის ფაილად შენახვა
      const fileName = `carfax-report-${vinCode || Date.now()}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, sanitizedHtml, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // გაზიარება
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'CarFAX მოხსენების გაზიარება',
        });
        if (__DEV__) {
          console.log('✅ Report shared successfully');
        }
      } else {
        // Fallback - Share API
        const shareMessage = vinCode 
          ? `CarFAX მოხსენება VIN: ${vinCode}\n\nფაილი: ${fileName}`
          : `CarFAX მოხსენება\n\nფაილი: ${fileName}`;
        
        const result = await Share.share({
          message: shareMessage,
          title: 'CarFAX მოხსენება',
        });
        
        if (__DEV__ && result.action === Share.sharedAction) {
          console.log('✅ Report shared successfully');
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.error('❌ Share error:', err);
      }
      Alert.alert('შეცდომა', 'გაზიარებისას მოხდა შეცდომა');
    } finally {
      setIsSharing(false);
    }
  };

  // გადმოწერის ფუნქცია
  const handleDownload = async () => {
    if (!sanitizedHtml) {
      Alert.alert('შეცდომა', 'HTML კონტენტი ვერ მოიძებნა');
      return;
    }

    try {
      setIsDownloading(true);
      
      const fileName = `carfax-report-${vinCode || Date.now()}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, sanitizedHtml, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // iOS-ზე გაზიარება, Android-ზე დოკუმენტების ფოლდერში შენახვა
      if (Platform.OS === 'ios') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'CarFAX მოხსენების შენახვა',
          });
        } else {
          Alert.alert('წარმატება', `ფაილი შენახულია: ${fileName}`);
        }
      } else {
        // Android-ზე შეგვიძლია დოკუმენტების ფოლდერში შევინახოთ
        const downloadsDir = FileSystem.documentDirectory;
        const downloadUri = `${downloadsDir}${fileName}`;
        
        await FileSystem.writeAsStringAsync(downloadUri, sanitizedHtml, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        Alert.alert(
          'წარმატება', 
          `ფაილი გადმოწერილია: ${fileName}\n\nდოკუმენტების ფოლდერში შეგიძლიათ იპოვოთ.`,
          [
            {
              text: 'გაზიარება',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(downloadUri);
                }
              },
            },
            { text: 'კარგი', style: 'default' },
          ]
        );
      }
    } catch (err) {
      if (__DEV__) {
        console.error('❌ Download error:', err);
      }
      Alert.alert('შეცდომა', 'გადმოწერისას მოხდა შეცდომა');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // CSS-ის ჩატვირთვა - სინქრონულად, რადგან CARFAX_CSS არის constant
  useEffect(() => {
    try {
      // CARFAX_CSS არის constant export, ამიტომ სინქრონულად ხელმისაწვდომია
      if (CARFAX_CSS && CARFAX_CSS.length > 0) {
        setCarfaxCSS(CARFAX_CSS);
        if (__DEV__) {
          console.log('✅ CarFAX CSS loaded synchronously, length:', CARFAX_CSS.length);
        }
      } else {
        // Fallback - async load
        const loadCSS = async () => {
          try {
            const css = await loadCarfaxCSS();
            setCarfaxCSS(css);
          } catch (err) {
            if (__DEV__) {
              console.error('❌ Error loading CSS:', err);
            }
          }
        };
        loadCSS();
      }
    } catch (err) {
      if (__DEV__) {
        console.error('❌ Error initializing CSS:', err);
      }
      // Fallback - async load
      const loadCSS = async () => {
        try {
          const css = await loadCarfaxCSS();
          setCarfaxCSS(css);
        } catch (error) {
          if (__DEV__) {
            console.error('❌ Error loading CSS fallback:', error);
          }
        }
      };
      loadCSS();
    }
  }, []);

  // HTML-ის ჩატვირთვა AsyncStorage-დან ან params-დან
  useEffect(() => {
    const loadHtml = async () => {
      try {
        let content: string | null = null;
        
        // პირველ რიგში ვცდილობთ AsyncStorage-დან
        if (storageKey) {
          console.log('📦 Loading HTML from AsyncStorage:', storageKey);
          content = await AsyncStorage.getItem(storageKey);
          if (content) {
            console.log('✅ HTML loaded from AsyncStorage, length:', content.length);
            // წაშლა AsyncStorage-დან გამოყენების შემდეგ
            await AsyncStorage.removeItem(storageKey);
          }
        }
        
        // თუ AsyncStorage-ში არ არის, ვცდილობთ params-დან
        if (!content && encodedHtml) {
          try {
            content = Buffer.from(encodedHtml, 'base64').toString('utf8');
            console.log('✅ HTML decoded from params, length:', content.length);
          } catch (e) {
            try {
              content = decodeURIComponent(encodedHtml);
              console.log('✅ HTML URI decoded from params, length:', content.length);
            } catch (e2) {
              content = encodedHtml;
            }
          }
        }
        
        if (content) {
          console.log('📄 HTML preview (first 300 chars):', content.substring(0, 300));
          setHtmlContent(content);
        } else {
          console.warn('⚠️ No HTML content found');
          setError('HTML კონტენტი ვერ მოიძებნა');
        }
      } catch (err) {
        console.error('❌ Error loading HTML:', err);
        setError('HTML კონტენტის ჩატვირთვისას მოხდა შეცდომა');
      } finally {
        setLoading(false);
      }
    };
    
    loadHtml();
  }, [storageKey, encodedHtml]);

  // HTML sanitization და BODY-ის ამოღება - useMemo-ით რომ carfaxCSS-ის ჩატვირთვის შემდეგ განახლდეს
  const sanitizedHtml = useMemo(() => {
    if (!htmlContent) {
      return '';
    }
    
    if (__DEV__) {
      console.log('🧹 Sanitizing HTML...');
      console.log('📦 CarFAX CSS loaded:', carfaxCSS ? `Yes (${carfaxCSS.length} chars)` : 'No');
    }
    
    // ვამოწმებთ, არის თუ არა React app (მხოლოდ root div)
    const isReactApp = htmlContent.includes('<div id="root"></div>') || htmlContent.includes("<div id='root'></div>");
    
    if (isReactApp) {
      if (__DEV__) {
        console.log('🔍 Detected React SPA, enabling JavaScript...');
      }
      // React app-ისთვის ვტოვებთ JavaScript-ს და CSS-ს
      let sanitized = htmlContent;
      
      // წაშლა Google Tag Manager და analytics scripts
      sanitized = sanitized.replace(/<script[^>]*gtag[^>]*>[\s\S]*?<\/script>/gi, '');
      sanitized = sanitized.replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, '');
      sanitized = sanitized.replace(/<script[^>]*qualtrics[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // წაშლა iframe tags
      sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
      
      // წაშლა noscript tags
      sanitized = sanitized.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
      
      // დავტოვოთ CSS link tags და React bundle scripts (CarFAX report-ს სჭირდება)
      // წაშლა მხოლოდ analytics/tracking link tags
      sanitized = sanitized.replace(/<link[^>]*rel=["'](?:preconnect|dns-prefetch|preload)["'][^>]*>/gi, '');
      
      // დავამატოთ base tag relative paths-ისთვის
      if (!sanitized.includes('<base')) {
        sanitized = sanitized.replace(/<head[^>]*>/i, '$&<base href="https://www.carfaxonline.com/">');
      }
      
      // დავამატოთ CarFAX CSS სტილები (სრული CSS ფაილიდან)
      const carfaxStyles = carfaxCSS ? `<style>${carfaxCSS}</style>` : '';
      
      // დავამატოთ სტილები head-ში
      if (carfaxStyles) {
        // წაშლა არსებული style tags (თუ არის)
        sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // დავამატოთ CarFAX CSS head-ში
        if (sanitized.includes('<head')) {
          sanitized = sanitized.replace(/<\/head>/i, `${carfaxStyles}</head>`);
        } else {
          // თუ head არ არის, შევქმნათ
          sanitized = sanitized.replace(/<html[^>]*>/i, `$&<head>${carfaxStyles}</head>`);
        }
        if (__DEV__) {
          console.log('✅ CarFAX CSS added to React app HTML, total length:', sanitized.length);
        }
      } else {
        if (__DEV__) {
          console.warn('⚠️ CarFAX CSS not loaded yet');
        }
      }
      
      return sanitized;
    } else {
      // ჩვეულებრივი HTML-ისთვის
      const sanitized = sanitizeCarfaxHtml(htmlContent);
      const bodyOnly = extractBody(sanitized);
      if (__DEV__) {
        console.log('✅ Body extracted, length:', bodyOnly.length);
        console.log('📄 Body preview (first 200 chars):', bodyOnly.substring(0, 200));
      }
      
      // CarFAX CSS სტილების დამატება
      const carfaxStyles = carfaxCSS ? `<style>${carfaxCSS}</style>` : '';
      
      const finalHtml = `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${carfaxStyles}
</head>
<body>
${bodyOnly}
</body>
</html>`;
      
      if (__DEV__) {
        if (carfaxStyles) {
          console.log('✅ CarFAX CSS added to regular HTML, total length:', finalHtml.length);
        } else {
          console.warn('⚠️ CarFAX CSS not loaded yet');
        }
      }
      
      return finalHtml;
    }
  }, [htmlContent, carfaxCSS]);

  if (!htmlContent || !sanitizedHtml) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>HTML კონტენტი ვერ მოიძებნა</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>დაბრუნება</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={PRIMARY} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>CarFAX მოხსენება</Text>
            {vinCode && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                VIN: {vinCode}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerActionBtn} 
              onPress={handleDownload}
              disabled={isDownloading || !sanitizedHtml}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <Text style={[styles.headerActionText, !sanitizedHtml && styles.headerActionTextDisabled]}>
                  გადმოწერა
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerActionBtn} 
              onPress={handleShare}
              disabled={isSharing || !sanitizedHtml}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <Text style={[styles.headerActionText, !sanitizedHtml && styles.headerActionTextDisabled]}>
                  გაზიარება
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>მოხსენების ჩატვირთვა...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>დაბრუნება</Text>
            </TouchableOpacity>
          </View>
        )}

        <WebView
          originWhitelist={['*']}
          source={{
            html: sanitizedHtml,
          }}
          style={[styles.webview, (loading || error) && styles.webviewHidden]}
          onLoadStart={() => {
            console.log('📄 WebView load started');
            setLoading(true);
            setError(null);
          }}
          onLoadEnd={() => {
            console.log('✅ WebView load ended');
            setTimeout(() => setLoading(false), 500); // მცირე დაყოვნება რომ კონტენტი გამოჩნდეს
          }}
          onMessage={(event) => {
            console.log('📨 WebView message:', event.nativeEvent.data);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
            setError('HTML კონტენტის ჩვენებისას მოხდა შეცდომა');
            setLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView HTTP error:', nativeEvent);
            setError(`HTTP შეცდომა: ${nativeEvent.statusCode}`);
            setLoading(false);
          }}
          scalesPageToFit={true}
          javaScriptEnabled={htmlContent?.includes('<div id="root"></div>') || htmlContent?.includes("<div id='root'></div>") || false}
          domStorageEnabled={false}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          startInLoadingState={true}
          mixedContentMode="always"
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.18)',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.18)',
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
    fontFamily: 'Inter_600SemiBold',
  },
  headerActionTextDisabled: {
    color: '#9CA3AF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webviewHidden: {
    opacity: 0,
    height: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

