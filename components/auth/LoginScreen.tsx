import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler,
  ScrollView,
  Modal,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import SubscriptionModal from '../ui/SubscriptionModal';
import API_BASE_URL from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const OTP_LENGTH = 4;
const TEST_PHONE = '557422634';
const TEST_PASSWORD = '1234';
const MIN_PHONE_LENGTH = 9;

// Types
type AuthIntent = 'login' | 'register';

interface ApiError {
  message?: string;
}

interface AuthVerifyResponse {
  user?: {
    id: string;
    phone: string;
    firstName?: string;
    email?: string;
    role: string;
    ownedCarwashes: string[];
  };
  intent?: AuthIntent;
  subscription?: unknown;
}

interface AuthStartResponse {
  id?: string;
  intent?: AuthIntent;
  code?: string;
  mockCode?: string;
  otp?: string;
}

export default function LoginScreen() {
  // State
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showOtpDisabledModal, setShowOtpDisabledModal] = useState(false);
  const [manualOtpCode, setManualOtpCode] = useState<string | null>(null);
  const [testPassword, setTestPassword] = useState('');

  // Refs
  const inputRef0 = useRef<TextInput>(null);
  const inputRef1 = useRef<TextInput>(null);
  const inputRef2 = useRef<TextInput>(null);
  const inputRef3 = useRef<TextInput>(null);
  const inputRefs = [inputRef0, inputRef1, inputRef2, inputRef3];

  // Hooks
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { login } = useUser();
  const { success, error } = useToast();

  // Memoized values
  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const isTestAccount = useMemo(() => cleanedPhone === TEST_PHONE, [cleanedPhone]);

  // Helper functions
  const formatPhoneNumber = useCallback((text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    const len = cleaned.length;

    if (len <= 3) return cleaned;
    if (len <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (len <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 11)}`;
  }, []);

  const resetOtpState = useCallback(() => {
    setOTP(Array(OTP_LENGTH).fill(''));
    setShowOTP(false);
    setVerificationId(null);
    setManualOtpCode(null);
  }, []);

  // Event handlers
  const handlePhoneChange = useCallback((text: string) => {
    const formatted = formatPhoneNumber(text.replace(/[^0-9]/g, ''));
    setPhone(formatted);
    if (!isTestAccount) {
      setTestPassword('');
    }
  }, [formatPhoneNumber, isTestAccount]);

  const handleOTPChange = useCallback((text: string, index: number) => {
    if (text.length > 1) return;
    
    const newOTP = [...otp];
    newOTP[index] = text;
    setOTP(newOTP);

    if (text.length === 1 && index < OTP_LENGTH - 1) {
      inputRefs[index + 1].current?.focus();
    }
  }, [otp, inputRefs]);

  const handleOTPKeyPress = useCallback((
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }, [otp, inputRefs]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    const handleBackPress = () => {
      if (keyboardVisible) {
        Keyboard.dismiss();
        return true;
      }
      return false;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      showSub.remove();
      hideSub.remove();
      backSub.remove();
    };
  }, [keyboardVisible]);

  // API functions
  const handleStartOtp = useCallback(async () => {
    if (!cleanedPhone || cleanedPhone.length < MIN_PHONE_LENGTH) {
      error('შეცდომა', 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone }),
      });

      const data: AuthStartResponse = await res.json();

      if (!res.ok) {
        const message = (data as ApiError)?.message || 'SMS-ის გაგზავნა ვერ მოხერხდა';
        throw new Error(message);
      }

      setVerificationId(data.id || null);
      setPendingIntent(data.intent || null);
      setShowOTP(true);
      success('SMS გაიგზავნა!', `კოდი გაიგზავნა ნომერზე ${phone}`);

      const otpCode = data.code ?? data.mockCode ?? data.otp;
      if (otpCode) {
        setManualOtpCode(String(otpCode));
        setShowOtpDisabledModal(true);
      } else {
        setManualOtpCode(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS-ის გაგზავნა ვერ მოხერხდა';
      error('შეცდომა', message);
    } finally {
      setLoading(false);
    }
  }, [cleanedPhone, phone, error, success]);

  const verifyOTP = useCallback(async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== OTP_LENGTH) {
      error('შეცდომა', 'გთხოვთ შეიყვანოთ სრული კოდი');
      return;
    }

    if (!verificationId) {
      error('შეცდომა', 'კოდი ვადაგასულია, სცადეთ ხელახლა');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId: verificationId, code: otpString }),
      });

      const data: AuthVerifyResponse = await res.json();

      if (!res.ok) {
        const message = (data as ApiError)?.message || 'ვერიფიკაცია ვერ მოხერხდა';
        error('შეცდომა', message);
        return;
      }

      if (!data.user) {
        error('შეცდომა', 'მომხმარებელი ვერ მოიძებნა');
        return;
      }

      const isRegisterIntent = data.intent === 'register' || pendingIntent === 'register';

      if (isRegisterIntent) {
        resetOtpState();
        setPendingIntent(null);
        success('კოდი დადასტურებულია', 'დასრულეთ რეგისტრაცია');
        router.push({
          pathname: '/register',
          params: { userId: data.user.id },
        });
      } else {
        await login(data.user);

        if (data.subscription) {
          await AsyncStorage.setItem('user_subscription', JSON.stringify(data.subscription));
        }

        success('წარმატება!', 'წარმატებით შეხვედით სისტემაში');
        resetOtpState();
        setPendingIntent(null);
        router.replace('/(tabs)');
      }
    } catch (err) {
      error('შეცდომა', 'ვერიფიკაცია ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }, [otp, verificationId, pendingIntent, error, success, login, resetOtpState]);

  const handleLogin = useCallback(async () => {
    if (isTestAccount) {
      if (!testPassword.trim()) {
        error('შეცდომა', 'გთხოვთ შეიყვანოთ password');
        return;
      }

      if (testPassword.trim() !== TEST_PASSWORD) {
        error('შეცდომა', 'არასწორი password');
        return;
      }

      try {
        setLoading(true);
        const testUser = {
          id: `test_user_${Date.now()}`,
          phone: TEST_PHONE,
          firstName: 'Test',
          email: 'test@example.com',
          role: 'customer',
          ownedCarwashes: [],
        };

        resetOtpState();
        await login(testUser);
        success('წარმატება!', 'ტესტ რეჟიმში შეხვედით სისტემაში');
        setTestPassword('');
        router.replace('/(tabs)');
      } catch (err) {
        error('შეცდომა', 'ტესტ რეჟიმში შესვლა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
      return;
    }

    await handleStartOtp();
  }, [isTestAccount, testPassword, error, success, login, resetOtpState, handleStartOtp]);


  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      minHeight: '100%',
    },
    content: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 200 : 40,
      paddingHorizontal: 5,
      paddingBottom: 20,
      justifyContent: 'center',
    },
    modal: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 30,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.35,
      shadowRadius: 35,
      elevation: 25,
    },
    subtitle: {
      fontSize: 17,
      color: '#111827',
      textAlign: 'center',
      letterSpacing: -0.2,
      marginBottom: 24,
      opacity: 0.8,
      fontFamily: 'Inter',
      fontWeight: '600',
    },
    form: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 16,
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    prefixContainer: {
      paddingLeft: 18,
      paddingRight: 8,
      borderRightWidth: 1,
      borderRightColor: '#E5E7EB',
    },
    prefix: {
      fontSize: 16,
      color: '#111827',
      fontFamily: 'Inter',
      fontWeight: '600',
    },
    label: {
      fontSize: 16,
      fontFamily: 'Inter',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      padding: 18,
      fontSize: 16,
      color: '#111827',
      letterSpacing: -0.2,
      fontFamily: 'Inter',
    },
    inputFocused: {
      backgroundColor: colors.background,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: 14,
      backgroundColor: colors.background,
      padding: 2,
      borderRadius: 8,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: 'Inter',
    },
    loginButton: {
      backgroundColor: '#111827',
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    loginButtonDisabled: {
      backgroundColor: colors.surface,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter',
      letterSpacing: -0.2,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    loadingText: {
      marginLeft: 8,
    },
    testLoginToggle: {
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
    },
    testLoginToggleText: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      textDecorationLine: 'underline',
    },
    testCredentialsInfo: {
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    testCredentialsText: {
      fontSize: 13,
      fontFamily: 'Inter',
      color: '#4B5563',
      textAlign: 'center',
      lineHeight: 20,
    },
    testCredentialsBold: {
      fontFamily: 'Inter_700Bold',
      color: '#111827',
    },
    otpModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
      paddingBottom: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -15 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 20,
    },
    otpTitle: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    otpSubtitle: {
      fontSize: 15,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 32,
    },
    otpInput: {
      width: 60,
      height: 60,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 16,
      fontSize: 24,
      fontFamily: 'Inter',
      textAlign: 'center',
      color: '#111827',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    otpInputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    resendContainer: {
      alignItems: 'center',
      marginTop: 24,
    },
    resendText: {
      color: colors.primary,
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.secondary,
      paddingHorizontal: 16,
      fontSize: 14,
      fontFamily: 'Inter',
    },
    socialButtons: {
      gap: 12,
      marginBottom: 32,
    },
    socialButton: {
      backgroundColor: colors.surface,
      borderWidth: 0,
      borderRadius: 14,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    socialButtonText: {
      fontSize: 15,
      fontFamily: 'Inter',
      color: colors.text,
      letterSpacing: -0.2,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      color: colors.secondary,
      fontSize: 14,
      fontFamily: 'Inter',
    },
    signupLink: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: 'Inter',
      marginLeft: 4,
    },
    primaryCta: {
      backgroundColor: '#111827',
      borderRadius: 16,
      padding: 18,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    secondaryCta: {
      alignItems: 'center',
      marginTop: 14,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    disabledCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 30,
      elevation: 24,
    },
    disabledTitle: {
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
    },
    disabledText: {
      fontSize: 15,
      fontFamily: 'Inter',
      color: '#4B5563',
      textAlign: 'center',
      lineHeight: 22,
    },
    disabledButton: {
      marginTop: 4,
      width: '100%',
      backgroundColor: '#111827',
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    disabledButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: 'Inter',
      fontWeight: '600',
    },
    codeBox: {
      marginTop: 8,
      marginBottom: 4,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: '#F3F4F6',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    codeText: {
      fontSize: 28,
      fontFamily: 'Inter',
      fontWeight: '700',
      letterSpacing: 10,
      textAlign: 'center',
      color: '#111827',
    },
  });

  return (
    <ImageBackground
      source={require('../../assets/images/car-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <View style={styles.modal}>
                <Text style={styles.subtitle}>
                  შეიყვანეთ თქვენი ტელეფონის ნომერი
                </Text>
                
                {/* Phone Login Form */}
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.prefixContainer}>
                        <Text style={styles.prefix}>+995</Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="მაგ: 599123456"
                        placeholderTextColor={colors.placeholder}
                        value={phone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        maxLength={12}
                      />
                    </View>
                  </View>
                  
                  {/* Password field for test account (557422634) */}
                  {phone.replace(/[^0-9]/g, '') === '557422634' && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="password"
                        placeholderTextColor={colors.placeholder}
                        value={testPassword}
                        onChangeText={setTestPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  )}
                </View>

                {/* Phone Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={[styles.loginButtonText, styles.loadingText]}>
                        მიმდინარეობს...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>გაგრძელება</Text>
                  )}
                </TouchableOpacity>
              </View>

              {showOTP && (
                <View style={styles.otpModal}>
                  <Text style={styles.otpTitle}>SMS კოდის ვერიფიკაცია</Text>
                  <Text style={styles.otpSubtitle}>
                  გთხოვთ შეიყვანოთ კოდი, რომელიც გამოგეგზავნათ ნომერზე {phone}
                </Text>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={inputRefs[index]}
                      style={[styles.otpInput]}
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOTPChange(text, index)}
                      onKeyPress={(e) => handleOTPKeyPress(e, index)}
                      keyboardType="number-pad"
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={verifyOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={[styles.loginButtonText, styles.loadingText]}>
                        მოწმდება...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>დადასტურება</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.resendContainer}
                  onPress={resetOtpState}
                >
                  <Text style={styles.resendText}>ხელახლა გაგზავნა</Text>
                </TouchableOpacity>
              </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Manual OTP Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showOtpDisabledModal}
        onRequestClose={() => setShowOtpDisabledModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.disabledCard}>
            <Ionicons name="alert-circle" size={48} color="#F97316" />
            <Text style={styles.disabledTitle}>ავტორიზაციის კოდი</Text>
            {manualOtpCode && (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{manualOtpCode}</Text>
              </View>
            )}
            <Text style={styles.disabledText}>
              SMS უკვე გაგზავნილია, მაგრამ ტესტ რეჟიმში კოდი აქაც ჩანს. გადააკოპირე და შეიყვანე OTP ველში.
            </Text>
            <TouchableOpacity
              style={styles.disabledButton}
              onPress={() => setShowOtpDisabledModal(false)}
            >
              <Text style={styles.disabledButtonText}>კოდის შეყვანა</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}
