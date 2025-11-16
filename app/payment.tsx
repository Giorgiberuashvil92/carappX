import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Switch, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../contexts/UserContext';
import { bogApi } from '../services/bogApi';

export default function PaymentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useUser();

  const params = useLocalSearchParams<{
    storeName?: string;
    address?: string;
    lat?: string;
    lng?: string;
    phone?: string;
    slot?: string;
    total?: string;
    live?: string;
  }>();

  const [cardholder, setCardholder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [saveCard, setSaveCard] = useState<boolean>(true);
  const [useBOG, setUseBOG] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bog' | 'google-pay' | 'apple-pay'>('bog');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [bogOAuthStatus, setBogOAuthStatus] = useState<any>(null);
  const [isCheckingBOG, setIsCheckingBOG] = useState<boolean>(false);

  const totalGel = useMemo(() => {
    const n = Number(params.total || 0);
    return isFinite(n) ? `${n}₾` : '0₾';
  }, [params.total]);

  const formatCardNumber = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };
  const luhnCheck = (num: string) => {
    const digits = num.replace(/\s+/g, '');
    if (digits.length < 13) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  };
  const isCardNumberValid = luhnCheck(cardNumber);
  const isExpiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const isCvcValid = /^\d{3,4}$/.test(cvc);
  const canPay = isCardNumberValid && isExpiryValid && isCvcValid && !isPaying;

  const handlePayment = async () => {
    if (isProcessingPayment) return;
    
    setIsProcessingPayment(true);
    
    try {
      if (paymentMethod === 'bog') {
        // BOG გადახდა
        const orderId = `carwash_${Date.now()}_${user?.id || 'guest'}`;
        
        const paymentData = {
          amount: Number(params.total || 0),
          currency: 'GEL',
          orderId: orderId,
          description: `CarWash გადახდა - ${params.storeName || 'მაღაზია'}`,
          customerInfo: {
            name: user?.name || 'მომხმარებელი',
            email: user?.email || 'user@example.com',
            phone: user?.phone || '+995555123456',
          },
          callbackUrl: 'https://carappx.onrender.com/bog/callback',
          returnUrl: 'https://carapp.ge/payment-success',
        };

        console.log('💳 BOG გადახდის დაწყება:', paymentData);

        // const result = await bogPaymentApi.processPayment(paymentData);
        const result = { success: false, message: 'Payment services temporarily disabled' };

        if (result.success) {
          Alert.alert(
            'გადახდის გვერდზე გადამისამართება',
            'გადამისამართდებით BOG გადახდის გვერდზე',
            [
              { text: 'გაუქმება', style: 'cancel' },
              { 
                text: 'გაგრძელება', 
                onPress: () => {
                  // გადახდის გვერდზე გადამისამართება უკვე მოხდა bogPaymentApi.processPayment-ში
                }
              }
            ]
          );
        } else {
          Alert.alert('შეცდომა', result.message || 'გადახდის დაწყება ვერ მოხერხდა');
        }
      } else {
        // სხვა გადახდის მეთოდები (Google Pay, Apple Pay, Card)
        Alert.alert('მოხერხდება მალე', 'ეს გადახდის მეთოდი მალე იქნება ხელმისაწვდომი');
      }
    } catch (error) {
      console.error('❌ გადახდის შეცდომა:', error);
      Alert.alert(
        'შეცდომა',
        'გადახდის დაწყება ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.',
        [{ text: 'კარგი' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('testCard');
        if (saved) {
          const data = JSON.parse(saved);
          setCardholder(data.cardholder || '');
          setCardNumber(data.cardNumber || '');
          setExpiry(data.expiry || '');
        }
      } catch {}
    })();
  }, []);

  // BOG OAuth სტატუსის შემოწმება
  useEffect(() => {
    const checkBOGStatus = async () => {
      if (paymentMethod === 'bog') {
        setIsCheckingBOG(true);
        try {
          const status = await bogApi.getOAuthStatus();
          setBogOAuthStatus(status);
          console.log('🔍 BOG OAuth სტატუსი:', status);
        } catch (error) {
          console.error('❌ BOG OAuth სტატუსის შემოწმების შეცდომა:', error);
          setBogOAuthStatus({
            isTokenValid: false,
            message: 'BOG OAuth სერვისთან კავშირის შეცდომა'
          });
        } finally {
          setIsCheckingBOG(false);
        }
      }
    };

    checkBOGStatus();
  }, [paymentMethod]);



  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B0E', padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    title: { color: '#F9FAFB', fontFamily: 'Poppins_700Bold', fontSize: 22 },
    sheet: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, gap: 14 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    storeName: { color: '#E5E7EB', fontFamily: 'Poppins_700Bold', fontSize: 16 },
    storeMeta: { color: '#9CA3AF', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
    sectionTitle: { color: '#E5E7EB', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
    input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
    inputRow: { flexDirection: 'row', gap: 10 },
    payBar: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 16 },
    totalText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
    payBtn: { backgroundColor: '#22C55E', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
    payButton: { backgroundColor: '#22C55E', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
    payButtonDisabled: { backgroundColor: '#6B7280', opacity: 0.6 },
    payText: { color: '#0B0B0E', fontFamily: 'Poppins_700Bold' },
    
    // გადახდის მეთოდის სტილები
    paymentMethod: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      marginBottom: 8,
    },
    paymentMethodActive: {
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    paymentMethodContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    paymentMethodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    paymentMethodInfo: {
      flex: 1,
    },
    paymentMethodRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    paymentMethodTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Poppins_600SemiBold',
      marginBottom: 2,
    },
    paymentMethodDesc: {
      fontSize: 12,
      color: '#9CA3AF',
      fontFamily: 'Poppins_400Regular',
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    radioButtonActive: {
      borderColor: '#22C55E',
      backgroundColor: '#22C55E',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={20} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.title}>გადახდა</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 120 }} showsVerticalScrollIndicator>
        <View style={styles.sheet}>
          <Text style={styles.sectionTitle}>მაღაზია</Text>
          <Text style={styles.storeName}>{params.storeName || 'Store'}</Text>
          {!!params.address && <Text style={styles.storeMeta}>{params.address}</Text>}
          {!!params.slot && <Text style={styles.storeMeta}>სლოტი: {params.slot}</Text>}
        </View>

        {/* გადახდის მეთოდის არჩევა */}
        <View style={styles.sheet}>
          <Text style={styles.sectionTitle}>გადახდის მეთოდი</Text>
          
          {/* BOG გადახდა */}
          <TouchableOpacity 
            style={[styles.paymentMethod, paymentMethod === 'bog' && styles.paymentMethodActive]}
            onPress={() => setPaymentMethod('bog')}
          >
            <View style={styles.paymentMethodContent}>
              <View style={styles.paymentMethodIcon}>
                <Text style={{ fontSize: 20, color: paymentMethod === 'bog' ? "#22C55E" : "#9CA3AF" }}>🏦</Text>
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodTitle, { color: paymentMethod === 'bog' ? "#22C55E" : "#E5E7EB" }]}>
                  🏦 BOG გადახდა
                </Text>
                <Text style={styles.paymentMethodDesc}>
                  {isCheckingBOG ? 'BOG სერვისის შემოწმება...' : 
                   bogOAuthStatus?.isTokenValid ? '✅ BOG OAuth მზადაა' : 
                   bogOAuthStatus?.message || 'საქართველოს ბანკი - უსაფრთხო გადახდა'}
                </Text>
              </View>
              <View style={styles.paymentMethodRight}>
                {isCheckingBOG ? (
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : bogOAuthStatus?.isTokenValid ? (
                  <Text style={{ color: "#22C55E", fontSize: 12 }}>✅</Text>
                ) : (
                  <Text style={{ color: "#EF4444", fontSize: 12 }}>⚠️</Text>
                )}
                <View style={[styles.radioButton, paymentMethod === 'bog' && styles.radioButtonActive]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Google Pay */}
          <TouchableOpacity 
            style={[styles.paymentMethod, paymentMethod === 'google-pay' && styles.paymentMethodActive]}
            onPress={() => setPaymentMethod('google-pay')}
          >
            <View style={styles.paymentMethodContent}>
              <View style={styles.paymentMethodIcon}>
                <Feather name="smartphone" size={20} color={paymentMethod === 'google-pay' ? "#22C55E" : "#9CA3AF"} />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodTitle, { color: paymentMethod === 'google-pay' ? "#22C55E" : "#E5E7EB" }]}>
                  Google Pay
                </Text>
                <Text style={styles.paymentMethodDesc}>სწრაფი გადახდა Google Pay-ით</Text>
              </View>
              <View style={[styles.radioButton, paymentMethod === 'google-pay' && styles.radioButtonActive]} />
            </View>
          </TouchableOpacity>

          {/* Apple Pay */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'apple-pay' && styles.paymentMethodActive]}
              onPress={() => setPaymentMethod('apple-pay')}
            >
              <View style={styles.paymentMethodContent}>
                <View style={styles.paymentMethodIcon}>
                  <Feather name="smartphone" size={20} color={paymentMethod === 'apple-pay' ? "#22C55E" : "#9CA3AF"} />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[styles.paymentMethodTitle, { color: paymentMethod === 'apple-pay' ? "#22C55E" : "#E5E7EB" }]}>
                    Apple Pay
                  </Text>
                  <Text style={styles.paymentMethodDesc}>სწრაფი გადახდა Apple Pay-ით</Text>
                </View>
                <View style={[styles.radioButton, paymentMethod === 'apple-pay' && styles.radioButtonActive]} />
              </View>
            </TouchableOpacity>
          )}

          {/* ტრადიციული ბარათი */}
          <TouchableOpacity 
            style={[styles.paymentMethod, paymentMethod === 'card' && styles.paymentMethodActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentMethodContent}>
              <View style={styles.paymentMethodIcon}>
                <Feather name="credit-card" size={20} color={paymentMethod === 'card' ? "#22C55E" : "#9CA3AF"} />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodTitle, { color: paymentMethod === 'card' ? "#22C55E" : "#E5E7EB" }]}>
                  ბარათის მონაცემები
                </Text>
                <Text style={styles.paymentMethodDesc}>შეიყვანეთ ბარათის მონაცემები</Text>
              </View>
              <View style={[styles.radioButton, paymentMethod === 'card' && styles.radioButtonActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ბარათის მონაცემები - მხოლოდ ტრადიციული ბარათის არჩევისას */}
        {paymentMethod === 'card' && (
          <View style={styles.sheet}>
            <Text style={styles.sectionTitle}>ბარათის მონაცემები</Text>
            <TextInput placeholder="ბარათის მფლობელი" placeholderTextColor="#9CA3AF" value={cardholder} onChangeText={setCardholder} style={styles.input} autoCapitalize="words" />
            <TextInput placeholder="1234 5678 9012 3456" placeholderTextColor="#9CA3AF" value={cardNumber} onChangeText={(t)=>setCardNumber(formatCardNumber(t))} keyboardType="number-pad" maxLength={19} style={styles.input} />
            <View style={styles.inputRow}>
              <TextInput placeholder="MM/YY" placeholderTextColor="#9CA3AF" value={expiry} onChangeText={(t)=>setExpiry(t.replace(/[^0-9/]/g,''))} keyboardType="number-pad" maxLength={5} style={[styles.input, { flex: 1 }]} />
              <TextInput placeholder="CVC" placeholderTextColor="#9CA3AF" value={cvc} onChangeText={(t)=>setCvc(t.replace(/[^0-9]/g,''))} keyboardType="number-pad" maxLength={4} style={[styles.input, { flex: 1 }]} />
            </View>
            <View style={styles.row}>
              <Text style={styles.storeMeta}>შეინახე სატესტო ბარათი</Text>
              <Switch value={saveCard} onValueChange={setSaveCard} />
            </View>
          </View>
        )}

        <View style={styles.sheet}>
          <Text style={styles.sectionTitle}>შეჯამება</Text>
          <View style={styles.row}><Text style={styles.storeMeta}>სლოტი</Text><Text style={styles.storeMeta}>{params.slot || '—'}</Text></View>
          <View style={styles.row}><Text style={styles.storeMeta}>Live ლოკაცია</Text><Text style={styles.storeMeta}>{params.live === '1' ? 'ჩართულია' : 'გამორთულია'}</Text></View>
        </View>
       
      </ScrollView>
      <View style={styles.payBar}>
        <Text style={styles.totalText}>ჯამი: {totalGel}</Text>
        
        <TouchableOpacity 
          style={[
            styles.payButton, 
            (isProcessingPayment || (paymentMethod === 'bog' && !bogOAuthStatus?.isTokenValid)) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={isProcessingPayment || (paymentMethod === 'bog' && !bogOAuthStatus?.isTokenValid)}
        >
          {isProcessingPayment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payText}>
              {paymentMethod === 'bog' && !bogOAuthStatus?.isTokenValid ? 'BOG არ მზადაა' : 'გადახდა'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}


