import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { financingApi } from '@/services/financingApi';
import { useUser } from '@/contexts/UserContext';
import API_BASE_URL from '@/config/api';

export default function FinancingRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string; amount?: string }>();
  const { user } = useUser();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [personalId, setPersonalId] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [termMonths, setTermMonths] = useState('12');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params?.amount && !amount) setAmount(String(params.amount));
  }, [params?.amount]);

  const submit = async () => {
    if (!phone || !amount) {
      Alert.alert('შევსება აუცილებელია', 'თანხა და ტელეფონი აუცილებელია.');
      return;
    }
    try {
      setLoading(true);
      const requestId = typeof params?.requestId === 'string' ? params.requestId : '';
      
      // თუ user და requestId არის, გამოვიყენოთ createLead
      if (user?.id && requestId) {
        await financingApi.createLead({
          userId: user.id,
          requestId,
          amount: parseFloat(amount) || 0,
          phone,
          merchantPhone: merchantPhone || undefined,
          downPayment: parseFloat(downPayment) || undefined,
          termMonths: parseInt(termMonths || '12', 10) || 12,
          personalId: personalId || undefined,
          note: fullName ? `${fullName}\n${note || ''}`.trim() : note || undefined,
        });
      } else {
        // fallback: general request (თუ user ან requestId არ არის)
        const noteText = [
          fullName && `სახელი: ${fullName}`,
          amount && `თანხა: ${amount}₾`,
          merchantPhone && `მაღაზიის ნომერი: ${merchantPhone}`,
          personalId && `პირადი ნომერი: ${personalId}`,
          downPayment && `ავანსი: ${downPayment}₾`,
          termMonths && `ვადა: ${termMonths} თვე`,
          note,
        ].filter(Boolean).join('\n');
        
        await fetch(`${API_BASE_URL}/financing/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName || 'უცნობი',
            phone,
            note: noteText,
          }),
        });
      }
      setLoading(false);
      Alert.alert('გაგზავნილია', 'ჩვენი ოპერატორი მალევე დაგიკავშირდებათ.');
      router.back();
    } catch (e) {
      setLoading(false);
      console.error('Financing request error:', e);
      Alert.alert('შეცდომა', 'გთხოვ სცადო მოგვიანებით.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credo Bank • 0% განვადება</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>თანხა (₾)</Text>
          <TextInput style={styles.input} placeholder="მაგ. 1200" keyboardType="numeric" value={amount} onChangeText={(t)=>setAmount(t.replace(/[^0-9.]/g,''))} />

          <Text style={styles.label}>სახელი და გვარი</Text>
          <TextInput style={styles.input} placeholder="მაგ. გიორგი ბერუაშვილი" value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>ტელეფონის ნომერი</Text>
          <TextInput style={styles.input} placeholder="მაგ. +9955XXXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <Text style={styles.label}>მაღაზიის ნომერი</Text>
          <TextInput style={styles.input} placeholder="მაგ. +9955XXXXX" keyboardType="phone-pad" value={merchantPhone} onChangeText={setMerchantPhone} />

          <Text style={styles.label}>პირადი ნომერი </Text>
          <TextInput style={styles.input} placeholder="12345678901" keyboardType="number-pad" value={personalId} onChangeText={setPersonalId} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ავანსი (არასავალდებულო)</Text>
              <TextInput style={styles.input} placeholder="მაგ. 200" keyboardType="numeric" value={downPayment} onChangeText={(t)=>setDownPayment(t.replace(/[^0-9.]/g,''))} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ვადა (თვე)</Text>
              <TextInput style={styles.input} placeholder="12" keyboardType="number-pad" value={termMonths} onChangeText={setTermMonths} />
            </View>
          </View>

          <Text style={styles.label}>შენიშვნა (არასავალდებულო)</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="დამატებითი ინფორმაცია" multiline value={note} onChangeText={setNote} />

          <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'იგზავნება...' : 'მოთხოვნის გაგზავნა'}</Text>
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  label: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 48, color: '#111827' },
  submitBtn: { marginTop: 12, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});


