import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState(['', '', '', '']);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

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

  const verifyOTP = () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ სრული კოდი');
      return;
    }

    setLoading(true);
    // TODO: Implement actual OTP verification
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleLogin = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      Alert.alert('შეცდომა', 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი');
      return;
    }

    setLoading(true);
    // TODO: Implement actual SMS sending
    setTimeout(() => {
      setLoading(false);
      setShowOTP(true);
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 500 : 40,
      paddingHorizontal: 5,
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
      fontWeight: '500',
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
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
      fontWeight: '600',
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
      fontWeight: '600',
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
    otpTitle: {
      fontSize: 20,
      fontWeight: '700',
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
      fontWeight: '600',
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
      fontWeight: '600',
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
      fontWeight: '500',
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
    },
    signupLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
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
        >
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
          </View>
        </KeyboardAvoidingView>
    </ImageBackground>
  );
}
