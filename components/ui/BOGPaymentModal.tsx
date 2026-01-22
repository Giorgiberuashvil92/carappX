import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface BOGPaymentModalProps {
  visible: boolean;
  paymentUrl: string;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function BOGPaymentModal({
  visible,
  paymentUrl,
  onClose,
  onSuccess,
  onError,
}: BOGPaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);

  const handleWebViewLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ BOG WebView შეცდომა:', nativeEvent);
    
    // თუ error-ი არის external redirect-ის გამო, ეს success-ია
    if (nativeEvent.url && (
        nativeEvent.url.includes('carapp.ge') || 
        nativeEvent.url.includes('order-return-redirect') ||
        nativeEvent.url.includes('success'))) {
      console.log('✅ BOG გადახდა წარმატებულია (external redirect)!');
      onSuccess?.();
      onClose();
      return;
    }
    
    setError('BOG გადახდის გვერდის ჩატვირთვა ვერ მოხერხდა');
    setLoading(false);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 BOG WebView Message:', message);
      
      if (message.type === 'payment_success') {
        console.log('✅ BOG გადახდა წარმატებულია (JavaScript message)!');
        onSuccess?.();
        onClose();
      } else if (message.type === 'payment_error') {
        console.log('❌ BOG გადახდა წარუმატებელია (JavaScript message)!');
        onError?.(message.error || 'გადახდა წარუმატებელია');
        onClose();
      }
    } catch (error) {
      console.log('📨 BOG WebView Raw Message:', event.nativeEvent.data);
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log('🔍 BOG Should Start Load:', request.url);
    
    const url = request.url || '';
    
    // ვამოწმებთ არის თუ არა order-return-redirect URL
    if (url.includes('order-return-redirect')) {
      console.log('🎯 BOG გადახდა დასრულდა!');
      
      // Extract redirectURL from query params
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const redirectURL = urlParams.get('redirectURL') || '';
      
      console.log('🔗 Redirect URL:', redirectURL);
      
      if (redirectURL.includes('payment/success') || redirectURL.includes('booking-success') || url.includes('payment/success')) {
        console.log('✅ BOG გადახდა წარმატებულია!');
        onClose(); 
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          onSuccess?.();
        }, 2000);
        return false;
      } else if (redirectURL.includes('payment/fail') || url.includes('payment/fail')) {
        console.log('❌ BOG გადახდა წარუმატებელია!');
        onClose(); 
        setShowFailModal(true);
        setTimeout(() => {
          setShowFailModal(false);
          onError?.('გადახდა წარუმატებელია');
        }, 2000);
        return false;
      }
    }
    
    // ვამოწმებთ BOG-ის success/fail URL-ებს პირდაპირ
    if (url.includes('/payment/success') || url.includes('success') || url.includes('completed')) {
      console.log('✅ BOG Success URL detected!');
      onClose();
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onSuccess?.();
      }, 2000);
      return false;
    }
    
    if (url.includes('/payment/fail') || url.includes('fail') || url.includes('error') || url.includes('cancel')) {
      console.log('❌ BOG Fail URL detected!');
      onClose();
      setShowFailModal(true);
      setTimeout(() => {
        setShowFailModal(false);
        onError?.('გადახდა წარუმატებელია');
      }, 2000);
      return false;
    }
    
    return true;
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('🔄 BOG Navigation State:', navState.url);
    
    // ვამოწმებთ success/fail URL-ებს navigation state-ში
    if (navState.url.includes('success') || navState.url.includes('completed')) {
      console.log('✅ BOG Success detected in navigation!');
      onClose(); // WebView მაშინვე იხურება
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onSuccess?.();
      }, 2000);
    }
    
    if (navState.url.includes('fail') || navState.url.includes('error') || navState.url.includes('cancel')) {
      console.log('❌ BOG Fail detected in navigation!');
      onClose(); // WebView მაშინვე იხურება
      setShowFailModal(true);
      setTimeout(() => {
        setShowFailModal(false);
        onError?.('გადახდა წარუმატებელია');
      }, 2000);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'გადახდის გაუქმება',
      'ნამდვილად გსურთ გადახდის გაუქმება?',
      [
        { text: 'არა', style: 'cancel' },
        { 
          text: 'კი', 
          style: 'destructive',
          onPress: onClose 
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="card" size={24} color="#22C55E" />
            <Text style={styles.headerTitle}>BOG გადახდა</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* WebView Container */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.loadingText}>BOG გადახდის გვერდი იტვირთება...</Text>
            </View>
          )}
          
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorTitle}>შეცდომა</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setError(null)}>
                <Text style={styles.retryButtonText}>ხელახლა ცდა</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webView}
              onLoad={handleWebViewLoad}
              onError={handleWebViewError}
              onNavigationStateChange={handleNavigationStateChange}
              onMessage={handleWebViewMessage}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
              injectedJavaScript={`
                // მარტივი BOG მონიტორინგი
                console.log('🔍 BOG Payment Monitor injected');
                
                // URL-ის ცვლილების მონიტორინგი
                let currentUrl = window.location.href;
                
                const checkUrl = () => {
                  if (window.location.href !== currentUrl) {
                    currentUrl = window.location.href;
                    console.log('🔍 URL Changed:', currentUrl);
                    
                    // Success detection
                    if (currentUrl.includes('success') || 
                        currentUrl.includes('completed') ||
                        currentUrl.includes('order-return-redirect')) {
                      console.log('✅ Payment Success Detected!');
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'payment_success',
                        url: currentUrl
                      }));
                    }
                  }
                };
                
                // პერიოდული შემოწმება
                setInterval(checkUrl, 1000);
                
                true; // WebView-ისთვის
              `}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 უსაფრთხო გადახდა BOG-ის მიერ
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
              </View>
              <Text style={styles.modalTitle}>გადახდა წარმატებულია!</Text>
              <Text style={styles.modalText}>
                თქვენი გადახდა წარმატებით დამუშავდა
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Fail Modal */}
      {showFailModal && (
        <Modal
          visible={showFailModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.failIcon}>
                <Ionicons name="close-circle" size={64} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>გადახდა წარუმატებელია</Text>
              <Text style={styles.modalText}>
                გადახდა ვერ დამუშავდა. გთხოვთ სცადოთ ხელახლა
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins_600SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  // Success/Fail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 16,
  },
  failIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
  },
});
