import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function FinancingRequestScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!fullName || !phone) {
      Alert.alert('შევსება აუცილებელია', 'სახელი და ტელეფონი აუცილებელია.');
      return;
    }
    try {
      setLoading(true);
      // TODO: call financingApi.createRequest
      // await financingApi.createRequest({ fullName, phone, note });
      setLoading(false);
      Alert.alert('გაგზავნილია', 'ჩვენი ოპერატორი მალევე დაგიკავშირდებათ.');
      router.back();
    } catch (e) {
      setLoading(false);
      Alert.alert('შეცდომა', 'გთხოვ სცადო მოგვიანებით.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credo Bank • 0% განვადება</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>სახელი და გვარი</Text>
          <TextInput style={styles.input} placeholder="მაგ. გიორგი ბერუაშვილი" value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>ტელეფონის ნომერი</Text>
          <TextInput style={styles.input} placeholder="მაგ. +9955XXXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  label: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 48, color: '#111827' },
  submitBtn: { marginTop: 12, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});


