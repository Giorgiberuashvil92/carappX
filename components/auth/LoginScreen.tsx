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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
import API_BASE_URL from '../../config/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState(['', '', '', '']);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<'login' | 'register' | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<'user' | 'partner' | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  function resolveApiBase(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_URL as string | undefined;
    if (envUrl) return envUrl;
    const hostUri = (Constants as any).expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
    if (typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      if (host && /\d+\.\d+\.\d+\.\d+/.test(host)) {
        return `http://${host}:4000`;
      }
    }
    return API_BASE_URL;
  }

  const API_URL = resolveApiBase();
  const { login } = useUser();
  const { success, error, warning, info } = useToast();

  const formatPhoneNumber = (text: string) => {
    // მხოლოდ ციფრების დატოვება
    const cleaned = text.replace(/\D/g, '');
    
    // ფორმატირება: XXX-XX-XX-XX
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      if (cleaned.length >= 5) {
        formatted = formatted.slice(0, 6) + '-' + formatted.slice(6);
        if (cleaned.length >= 7) {
          formatted = formatted.slice(0, 9) + '-' + formatted.slice(9);
        }
      }
    }
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text.replace(/[^0-9]/g, ''));
    setPhone(formatted);
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
      return false; // სხვაგვარად მივცეთ ნავიგაციას უკანა ნაბიჯი
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      backSub.remove();
    };
  }, [keyboardVisible]);

  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      error('შეცდომა', 'გთხოვთ შეიყვანოთ სრული კოდი');
      return;
    }

    if (!otpId) {
      error('შეცდომა', 'კოდი ვადაგასულია, სცადეთ ხელახლა');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId, code: otpString }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        const msg = typeof data === 'object' && data?.message ? String(data.message) : 'ვერიფიკაცია ვერ მოხერხდა';
        error('შეცდომა', msg);
        return;
      }
      // success
      const intent = (data?.intent === 'register' ? 'register' : 'login') as 'login' | 'register';
      const userId = data?.user?.id ? String(data.user.id) : null;
      setPendingUserId(userId);
      setPendingIntent(intent);
      setShowOTP(false);
      setOtpId(null);
      if (intent === 'register') {
        setShowRegister(true);
        success('წარმატება!', 'კოდი დადასტურებულია, გააგრძელეთ რეგისტრაცია');
      } else {
        // Save user data to context for login
        if (data?.user) {
          await login(data.user);
        }
        success('წარმატება!', 'წარმატებით შეხვედით სისტემაში');
        router.replace('/(tabs)');
      }
    } catch (e) {
      setLoading(false);
      error('შეცდომა', 'ქსელური შეცდომა');
    }
  };

  const handleLogin = async () => {
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
        body: JSON.stringify({ phone: `+995${cleanPhone}` }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        const msg = typeof data === 'object' && data?.message ? String(data.message) : 'ვერ გაიგზავნა კოდი';
        error('შეცდომა', msg);
        return;
      }
      if (data?.id) setOtpId(String(data.id));
      if (data?.intent) setPendingIntent(data.intent === 'register' ? 'register' : 'login');
      setShowOTP(true);
      success('SMS გაიგზავნა!', `კოდი გაიგზავნა ნომერზე ${phone}`);
      // dev only: თუ mockCode გვაქვს, შევავსოთ წასაკითხად კონსოლში
      if (data?.mockCode) {
        console.log('[AUTH] mockCode =', data.mockCode);
      }
    } catch (e) {
      setLoading(false);
      error('შეცდომა', 'ქსელური შეცდომა');
    }
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
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerCentered: {
      width: '100%',
      alignItems: 'center',
    },
    registerCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 22,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
      elevation: 24,
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
    roleChip: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
    },
    roleChipInactive: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
    },
    roleChipActive: {
      backgroundColor: '#111827',
      borderColor: '#111827',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    roleChipText: {
      fontSize: 15,
      fontFamily: 'Inter',
      color: '#111827',
      letterSpacing: -0.2,
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
                <Text style={styles.subtitle}>შეიყვანეთ თქვენი ტელეფონის ნომერი</Text>
                
                {/* Form */}
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
                </View>

                {/* Login Button */}
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
                  }}
                >
                  <Text style={styles.resendText}>ხელახლა გაგზავნა</Text>
                </TouchableOpacity>
              </View>
            )}

            {showRegister && (
              <View style={styles.otpModal}>
                <Text style={styles.otpTitle}>ანგარიშის შექმნა</Text>
                <Text style={styles.otpSubtitle}>შეიყვანეთ სახელი და აირჩიეთ როლი</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>სახელი</Text>
                  <View style={styles.phoneInputContainer}>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="მაგ: გიორგი"
                      placeholderTextColor={colors.placeholder}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                  <TouchableOpacity
                    onPress={() => setRole('user')}
                    style={[styles.socialButton, role === 'user' && { borderWidth: 1, borderColor: colors.primary }]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.socialButtonText}>მომხმარებელი</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRole('partner')}
                    style={[styles.socialButton, role === 'partner' && { borderWidth: 1, borderColor: colors.primary }]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.socialButtonText}>პარტნიორი</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
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
                      // Save updated user data to context
                      if (data?.user) {
                        await login(data.user);
                      }
                      success('წარმატება!', 'ანგარიში წარმატებით შეიქმნა');
                      setShowRegister(false);
                      router.replace('/(tabs)');
                    } catch (e) {
                      setLoading(false);
                      error('შეცდომა', 'ქსელური შეცდომა');
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={[styles.loginButtonText, styles.loadingText]}>შენახვა...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>დასრულება</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendContainer} onPress={() => setShowRegister(false)}>
                  <Text style={styles.resendText}>გაუქმება</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
