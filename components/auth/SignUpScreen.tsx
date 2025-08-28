import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('შეცდომა', 'გთხოვთ შეავსოთ ყველა ვალდებული ველი');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('შეცდომა', 'პაროლები არ ემთხვევა');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('შეცდომა', 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('შეცდომა', 'გთხოვთ დაეთანხმოთ წესებსა და პირობებს');
      return;
    }

    setLoading(true);
    // TODO: Implement actual signup logic
    setTimeout(() => {
      setLoading(false);
      Alert.alert('წარმატება', 'ანგარიში წარმატებით შეიქმნა!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    }, 1500);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    content: {
      padding: 24,
      paddingTop: 60,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logo: {
      width: 80,
      height: 80,
      backgroundColor: colors.primary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: 24,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputContainerHalf: {
      flex: 1,
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    required: {
      color: colors.error,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: 16,
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      marginRight: 12,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    termsText: {
      flex: 1,
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 20,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: '600',
    },
    signupButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    signupButtonDisabled: {
      backgroundColor: colors.placeholder,
    },
    signupButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    socialButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 24,
    },
    footerText: {
      color: colors.secondary,
      fontSize: 14,
    },
    loginLink: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

  return (
    <LinearGradient
      colors={[colors.primary, colors.background]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>🚗</Text>
                </View>
                <Text style={styles.title}>რეგისტრაცია</Text>
                <Text style={styles.subtitle}>შექმენით ახალი ანგარიში</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Name Row */}
                <View style={styles.row}>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>
                      სახელი <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="სახელი"
                      placeholderTextColor={colors.placeholder}
                      value={formData.firstName}
                      onChangeText={(value) => updateFormData('firstName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.inputContainerHalf}>
                    <Text style={styles.label}>
                      გვარი <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="გვარი"
                      placeholderTextColor={colors.placeholder}
                      value={formData.lastName}
                      onChangeText={(value) => updateFormData('lastName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    ელფოსტა <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="მაგ: example@gmail.com"
                    placeholderTextColor={colors.placeholder}
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* Phone */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ტელეფონი</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="მაგ: 599123456"
                    placeholderTextColor={colors.placeholder}
                    value={formData.phone}
                    onChangeText={(value) => updateFormData('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    პაროლი <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="მინიმუმ 6 სიმბოლო"
                      placeholderTextColor={colors.placeholder}
                      value={formData.password}
                      onChangeText={(value) => updateFormData('password', value)}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    პაროლის დადასტურება <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="გაიმეორეთ პაროლი"
                      placeholderTextColor={colors.placeholder}
                      value={formData.confirmPassword}
                      onChangeText={(value) => updateFormData('confirmPassword', value)}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms and Conditions */}
                <TouchableOpacity 
                  style={styles.termsContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    ვეთანხმები{' '}
                    <Text style={styles.termsLink}>მომსახურების წესებსა</Text>{' '}
                    და{' '}
                    <Text style={styles.termsLink}>კონფიდენციალურობის პოლიტიკას</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? 'მიმდინარეობს...' : 'ანგარიშის შექმნა'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ან</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Signup */}
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.socialButtonText}>Google-ით რეგისტრაცია</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                  <Text style={styles.socialButtonText}>Facebook-ით რეგისტრაცია</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>უკვე გაქვთ ანგარიში?</Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>შესვლა</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
