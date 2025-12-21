import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import SubscriptionModal from '../ui/SubscriptionModal';
import API_BASE_URL from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Firebase removed – using backend OTP endpoints

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState(['', '', '', '']);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<'login' | 'register' | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<'user' | 'partner' | null>(null);
  const [nameInputFocused, setNameInputFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showOtpDisabledModal, setShowOtpDisabledModal] = useState(false);
  const [manualOtpCode, setManualOtpCode] = useState<string | null>(null);
  // Test account password for App Store Review (phone: 557422634, password: 1234)
  const [testPassword, setTestPassword] = useState('');
  // Firebase removed - using backend OTP only
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // No Firebase init required

  // Use API_BASE_URL from config (which is already set to Railway backend)
  const API_URL = API_BASE_URL;
  
  console.log('🌐 API URL:', API_URL);
  const { login } = useUser();
  const { success, error, warning, info } = useToast();
  const { subscription, updateSubscription } = useSubscription();

  // Subscription modal disabled per request
  const showSubscriptionModalAfterLogin = () => {
    // setTimeout(() => {
    //   setShowSubscriptionModal(true);
    // }, 1000);
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const len = cleaned.length;

    if (len <= 3) return cleaned;
    if (len <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (len <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    // len >= 8
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text.replace(/[^0-9]/g, ''));
    setPhone(formatted);
    // Clear password if phone number changes away from test account
    const cleanedPhone = formatted.replace(/[^0-9]/g, '');
    if (cleanedPhone !== '557422634') {
      setTestPassword('');
    }
  };

  const handleOTPChange = (text: string, index: number) => {
    const newOTP = [...otp];
    newOTP[index] = text;
    setOTP(newOTP);

    // ავტომატურად გადასვლა შემდეგ ინფუთზე
    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleOTPKeyPress = (e: any, index: number) => {
    // წაშლის შემთხვევაში წინა ინფუთზე გადასვლა
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (keyboardVisible) {
        Keyboard.dismiss();
        return true; // გადავჭერით back მოვლენას მხოლოდ როცა კლავიატურაა გახსნილი
      }
      if (showRegister) {
        setShowRegister(false);
        return true;
      }
      return false; // სხვაგვარად მივცეთ ნავიგაციას უკანა ნაბიჯი
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      backSub.remove();
    };
  }, [keyboardVisible, showRegister]);

  // რეგისტრაციის მოდალის გახსნისას კლავიატურის დახურვა
  useEffect(() => {
    if (showRegister) {
      // მცირე დაყოვნება, რომ layout-მა დრო ჰქონდეს განახლებისთვის
      const timer = setTimeout(() => {
        Keyboard.dismiss();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showRegister]);

  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      error('შეცდომა', 'გთხოვთ შეიყვანოთ სრული კოდი');
      return;
    }
    if (!verificationId) {
      error('შეცდომა', 'კოდი ვადაგასულია, სცადეთ ხელახლა');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId: verificationId, code: otpString }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        const msg = typeof data === 'object' && data?.message ? String(data.message) : 'ვერიფიკაცია ვერ მოხერხდა';
        error('შეცდომა', msg);
        return;
      }
      if (data?.user) {
        // Check both data.intent from verify endpoint and pendingIntent from start endpoint
        const isRegisterIntent = data?.intent === 'register' || pendingIntent === 'register';
        
        console.log('🔍 OTP Verification Result:', {
          hasUser: !!data.user,
          dataIntent: data?.intent,
          pendingIntent: pendingIntent,
          isRegisterIntent: isRegisterIntent,
          userId: data.user.id,
        });
        
        if (isRegisterIntent) {
          console.log('✅ Showing registration form');
          setPendingUserId(data.user.id);
          setShowOTP(false);
          setShowRegister(true);
          setPendingIntent(null); // Reset after using
          success('კოდი დადასტურებულია', 'დასრულეთ რეგისტრაცია');
        } else {
          console.log('✅ Proceeding with login');
          await login(data.user);
          
          // Save subscription info if available
          if (data.subscription) {
            console.log('📋 Subscription info from auth:', data.subscription);
            await AsyncStorage.setItem('user_subscription', JSON.stringify(data.subscription));
          }
          
          success('წარმატება!', 'წარმატებით შეხვედით სისტემაში');
          setShowOTP(false);
          setVerificationId(null);
          setPendingIntent(null); // Reset after using
          router.replace('/(tabs)');
          // Show subscription modal after login
          showSubscriptionModalAfterLogin();
        }
      }
    } catch (e) {
      setLoading(false);
      error('შეცდომა', 'ვერიფიკაცია ვერ მოხერხდა');
    }
  };

  // Firebase OTP helper აღარ გვჭირდება ცალკე

  const handleStartOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      error('შეცდომა', 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data === 'object' && data?.message ? String(data.message) : 'SMS-ის გაგზავნა ვერ მოხერხდა';
        throw new Error(msg);
      }
      
      console.log('📞 OTP Start Response:', {
        id: data?.id,
        intent: data?.intent,
        hasCode: !!(data?.code ?? data?.mockCode ?? data?.otp),
      });
      
      setVerificationId(data?.id || null);
      setPendingIntent(data?.intent || null);
      setShowOTP(true);
      success('SMS გაიგზავნა!', `კოდი გაიგზავნა ნომერზე ${phone}`);
      const otpCode = data?.code ?? data?.mockCode ?? data?.otp;
      if (otpCode) {
        setManualOtpCode(String(otpCode));
        setShowOtpDisabledModal(true);
      } else {
        setManualOtpCode(null);
      }
    } catch (err: any) {
      error('შეცდომა', err?.message || 'SMS-ის გაგზავნა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };


  const handleLogin = async () => {
    // App Store Review test account: phone 557422634, password 1234
    const TEST_PHONE = '557422634';
    const TEST_PASSWORD = '1234';
    
    // Remove dashes from phone for comparison (formatPhoneNumber adds dashes)
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    
    console.log('🔍 Login attempt:', {
      phone: phone,
      cleanedPhone: cleanedPhone,
      testPhone: TEST_PHONE,
      isTestAccount: cleanedPhone === TEST_PHONE,
      hasPassword: !!testPassword.trim()
    });
    
    if (cleanedPhone === TEST_PHONE) {
      // Test account - require password
      if (!testPassword.trim()) {
        console.log('❌ Test account - password required');
        error('შეცდომა', 'გთხოვთ შეიყვანოთ password');
        return;
      }
      
      if (testPassword.trim() !== TEST_PASSWORD) {
        console.log('❌ Test account - wrong password:', testPassword.trim());
        error('შეცდომა', 'არასწორი password');
        return;
      }
      
      // Test account login without OTP
      try {
        setLoading(true);
        const testUser = {
          id: 'test_user_' + Date.now(),
          phone: TEST_PHONE,
          firstName: 'Test',
          email: 'test@example.com',
          role: 'customer',
          ownedCarwashes: [],
        };
        
        console.log('✅ Test Login - Using static test user:', testUser);
        setShowOTP(false); // Ensure OTP modal doesn't show for test account
        await login(testUser);
        success('წარმატება!', 'ტესტ რეჟიმში შეხვედით სისტემაში');
        setTestPassword('');
        router.replace('/(tabs)');
        showSubscriptionModalAfterLogin();
      } catch (err: any) {
        console.error('❌ Test login error:', err);
        error('შეცდომა', 'ტესტ რეჟიმში შესვლა ვერ მოხერხდა');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Regular OTP flow for other users
    await handleStartOtp();
  };


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
    registerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(17, 24, 39, 0.82)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerModal: {
      width: '100%',
      maxHeight: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderRadius: 28,
      padding: 22,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 22 },
      shadowOpacity: 0.26,
      shadowRadius: 32,
      elevation: 24,
      gap: 12,
      overflow: 'hidden',
    },
    registerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    registerHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    registerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EEF2FF',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 6,
      borderWidth: 1,
      borderColor: '#E0E7FF',
    },
    registerBadgeText: {
      fontSize: 12,
      fontFamily: 'Inter_700Bold',
      color: '#4F46E5',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    registerCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    registerTitle: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: '#111827',
      letterSpacing: -0.35,
    },
    registerSubtitle: {
      fontSize: 14,
      color: '#4B5563',
      lineHeight: 21,
      fontFamily: 'Inter',
      marginBottom: 4,
    },
    registerScroll: {
      flexGrow: 1,
      flexShrink: 1,
      gap: 12,
      paddingBottom: 12,
    },
    registerSectionCard: {
      backgroundColor: '#F8FAFC',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      marginTop: 6,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 4,
    },
    registerLabel: {
      fontSize: 12,
      fontFamily: 'Inter_700Bold',
      color: '#111827',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    registerInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      minHeight: 54,
    },
    registerInputWrapperFocused: {
      borderColor: '#4F46E5',
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
      backgroundColor: '#F9FAFF',
    },
    registerInput: {
      flex: 1,
      fontSize: 16,
      color: '#111827',
      fontFamily: 'Inter_600SemiBold',
      paddingVertical: 0,
    },
    registerHelper: {
      fontSize: 12,
      color: '#9CA3AF',
      fontFamily: 'Inter',
    },
    roleChipsRow: {
      gap: 12,
    },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: 12,
      marginTop: 8,
      minHeight: 72,
    },
    roleChipActive: {
      backgroundColor: '#EEF2FF',
      borderColor: '#4F46E5',
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    roleChipIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleChipIconActive: {
      backgroundColor: '#4F46E5',
    },
    roleChipTextWrap: {
      flex: 1,
      gap: 2,
    },
    roleChipTitle: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: '#111827',
      letterSpacing: -0.2,
    },
    roleChipTitleActive: {
      color: '#111827',
    },
    roleChipSubtitle: {
      fontSize: 12,
      fontFamily: 'Inter',
      color: '#6B7280',
      lineHeight: 16,
    },
    registerFooter: {
      marginTop: 10,
      gap: 12,
    },
    registerHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#ECFDF3',
      borderColor: '#BBF7D0',
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
    },
    registerHintText: {
      fontSize: 13,
      fontFamily: 'Inter',
      color: '#065F46',
      flex: 1,
    },
    registerPrimaryButton: {
      backgroundColor: '#111827',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    registerPrimaryButtonDisabled: {
      backgroundColor: '#E5E7EB',
      shadowOpacity: 0,
      elevation: 0,
    },
    registerPrimaryText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 0.3,
    },
    registerSecondaryButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    registerSecondaryText: {
      color: '#111827',
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
    },
    roleSegment: {
      flexDirection: 'row',
      backgroundColor: '#F3F4F6',
      borderRadius: 14,
      padding: 4,
    },
    roleSegmentOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
    },
    roleSegmentActive: {
      backgroundColor: '#111827',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    roleSegmentText: {
      fontSize: 15,
      fontFamily: 'Inter',
      color: '#111827',
      letterSpacing: -0.2,
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
                  onPress={() => {
                    setOTP(['', '', '', '']);
                    setShowOTP(false);
                    setVerificationId(null);
                  }}
                >
                  <Text style={styles.resendText}>ხელახლა გაგზავნა</Text>
                </TouchableOpacity>
              </View>
              )}

              {showRegister && (
                <Modal
                  visible={showRegister}
                  transparent
                  animationType="fade"
                  onRequestClose={() => {
                    Keyboard.dismiss();
                    setShowRegister(false);
                  }}
                >
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.registerOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    enabled
                  >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                      <View style={styles.registerOverlay}>
                        <TouchableWithoutFeedback>
                          <View style={styles.registerModal}>
                            <View style={styles.registerHeaderRow}>
                              <View style={styles.registerHeaderLeft}>
                                <View style={styles.registerBadge}>
                                  <Ionicons name="sparkles-outline" size={18} color="#4F46E5" />
                                  <Text style={styles.registerBadgeText}>ახალი პროფილი</Text>
                                </View>
                               
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  Keyboard.dismiss();
                                  setShowRegister(false);
                                }}
                                style={styles.registerCloseButton}
                                hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                              >
                                <Ionicons name="close" size={20} color="#111827" />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.registerTitle}>დასრულე რეგისტრაცია</Text>
                            <Text style={styles.registerSubtitle}>
                              შეიყვანე სახელი და აირჩიე როლი. შეძლებ ცვლილებას პროფილში მოგვიანებითაც.
                            </Text>

                            <ScrollView
                              contentContainerStyle={styles.registerScroll}
                              bounces={false}
                              showsVerticalScrollIndicator={false}
                              keyboardShouldPersistTaps="handled"
                              keyboardDismissMode="on-drag"
                            >
                      <View style={styles.registerSectionCard}>
                        <Text style={styles.registerLabel}>სახელი და გვარი</Text>
                        <View style={[
                          styles.registerInputWrapper,
                          nameInputFocused && styles.registerInputWrapperFocused
                        ]}>
                          <Ionicons
                            name="person-circle-outline"
                            size={22}
                            color={nameInputFocused ? '#4F46E5' : '#9CA3AF'}
                          />
                          <TextInput
                            style={styles.registerInput}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="მაგ: გიორგი გიორგიძე"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="words"
                            onFocus={() => setNameInputFocused(true)}
                            onBlur={() => setNameInputFocused(false)}
                          />
                          <Text style={styles.registerHelper}>{Math.min(firstName.trim().length, 30)}/30</Text>
                        </View>
                      </View>

                      <View style={styles.registerSectionCard}>
                        <Text style={styles.registerLabel}>აირჩიე როლი</Text>
                        <View style={styles.roleChipsRow}>
                          <TouchableOpacity
                            onPress={() => setRole('user')}
                            activeOpacity={0.85}
                            style={[
                              styles.roleChip,
                              role === 'user' && styles.roleChipActive
                            ]}
                          >
                            <View style={[
                              styles.roleChipIcon,
                              role === 'user' && styles.roleChipIconActive
                            ]}>
                              <Ionicons
                                name="person"
                                size={20}
                                color={role === 'user' ? '#FFFFFF' : '#111827'}
                              />
                            </View>
                            <View style={styles.roleChipTextWrap}>
                              <Text style={[
                                styles.roleChipTitle,
                                role === 'user' && styles.roleChipTitleActive
                              ]}>
                                მომხმარებელი
                              </Text>
                              <Text style={styles.roleChipSubtitle}>შეკვეთები და დაჯავშნები</Text>
                            </View>
                            {role === 'user' && (
                              <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setRole('partner')}
                            activeOpacity={0.85}
                            style={[
                              styles.roleChip,
                              role === 'partner' && styles.roleChipActive
                            ]}
                          >
                            <View style={[
                              styles.roleChipIcon,
                              role === 'partner' && styles.roleChipIconActive
                            ]}>
                              <Ionicons
                                name="business"
                                size={20}
                                color={role === 'partner' ? '#FFFFFF' : '#111827'}
                              />
                            </View>
                            <View style={styles.roleChipTextWrap}>
                              <Text style={[
                                styles.roleChipTitle,
                                role === 'partner' && styles.roleChipTitleActive
                              ]}>
                                პარტნიორი
                              </Text>
                              <Text style={styles.roleChipSubtitle}>ანგარიშები, სერვისები, გაყიდვები</Text>
                            </View>
                            {role === 'partner' && (
                              <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.registerFooter}>
                      <View style={styles.registerHintRow}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                        <Text style={styles.registerHintText}>შესვლის შემდეგ შეგიძლია პროფილის ცვლილება.</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.registerPrimaryButton,
                          (loading || !firstName.trim() || !role) && styles.registerPrimaryButtonDisabled
                        ]}
                        onPress={async () => {
                          if (!pendingUserId) {
                            error('შეცდომა', 'დაბრუნდით თავიდან');
                            setShowRegister(false);
                            return;
                          }
                          if (!firstName.trim() || !role) {
                            error('შეცდომა', 'შეიყვანეთ სახელი და აირჩიეთ როლი');
                            return;
                          }
                          try {
                            setLoading(true);
                            const res = await fetch(`${API_URL}/auth/complete`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: pendingUserId, firstName: firstName.trim(), role }),
                            });
                            const data = await res.json();
                            setLoading(false);
                            if (!res.ok) {
                              const msg = typeof data === 'object' && data?.message ? String(data.message) : 'შენახვა ვერ მოხერხდა';
                              error('შეცდომა', msg);
                              return;
                            }
                            if (data?.user) {
                              await login(data.user);
                            }
                            success('წარმატება!', 'ანგარიში წარმატებით შეიქმნა');
                            setShowRegister(false);
                            router.replace('/(tabs)');
                            showSubscriptionModalAfterLogin();
                          } catch (e) {
                            setLoading(false);
                            error('შეცდომა', 'ქსელური შეცდომა');
                          }
                        }}
                        disabled={loading || !firstName.trim() || !role}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#FFFFFF" />
                            <Text style={[styles.registerPrimaryText, styles.loadingText]}>შენახვა...</Text>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.registerPrimaryText}>დასრულება</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.registerSecondaryButton} 
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowRegister(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registerSecondaryText}>გაუქმება</Text>
                      </TouchableOpacity>
                    </View>
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </KeyboardAvoidingView>
                </Modal>
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
