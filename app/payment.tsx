import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  const handlePay = async () => {
    if (!canPay) return;
    setIsPaying(true);
    await new Promise(r => setTimeout(r, 900));
    try {
      if (saveCard) {
        await AsyncStorage.setItem('testCard', JSON.stringify({ cardholder, cardNumber, expiry }));
      }
    } catch {}
    const q = new URLSearchParams({
      driver: '1',
      lat: String(params.lat ?? ''),
      lng: String(params.lng ?? ''),
      storeName: String(params.storeName ?? ''),
    }).toString();
    router.replace(`/map?${q}` as never);
  };

  const handleWalletPay = async () => {
    // Simულაცია Apple/Google Pay
    setIsPaying(true);
    await new Promise(r => setTimeout(r, 700));
    const q = new URLSearchParams({
      driver: '1',
      lat: String(params.lat ?? ''),
      lng: String(params.lng ?? ''),
      storeName: String(params.storeName ?? ''),
    }).toString();
    router.replace(`/map?${q}` as never);
  };

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
    payText: { color: '#0B0B0E', fontFamily: 'Poppins_700Bold' },
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

        <View style={styles.sheet}>
          <Text style={styles.sectionTitle}>შეჯამება</Text>
          <View style={styles.row}><Text style={styles.storeMeta}>სლოტი</Text><Text style={styles.storeMeta}>{params.slot || '—'}</Text></View>
          <View style={styles.row}><Text style={styles.storeMeta}>Live ლოკაცია</Text><Text style={styles.storeMeta}>{params.live === '1' ? 'ჩართულია' : 'გამორთულია'}</Text></View>
        </View>
        <TouchableOpacity onPress={handleWalletPay} style={[styles.sheet, { alignItems: 'center', gap: 10 }]}> 
          <Feather name={Platform.OS==='ios' ? 'smartphone' : 'credit-card'} size={18} color="#E5E7EB" />
          <Text style={styles.storeName}>{Platform.OS==='ios' ? 'Apple Pay' : 'Google Pay'}</Text>
          <Text style={styles.storeMeta}>სწრაფი გადახდა</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.payBar}>
        <Text style={styles.totalText}>ჯამი: {totalGel}</Text>
        <TouchableOpacity disabled={!canPay} style={styles.payBtn} onPress={handlePay}>
          <Text style={styles.payText}>{isPaying ? 'გადახდა...' : 'დადასტურება'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


