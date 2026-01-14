import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function FinancingInfoScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>0%-იანი განვადება ყველაფერზე</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <LinearGradient colors={["#1E293B", "#0F172A"]} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.pill}><Text style={styles.pillText}>Credo Bank • 0%</Text></View>
              <Text style={styles.heroTitle}>დაიწყე ახლა, გადაიხადე ეტაპობრივად</Text>
              <Text style={styles.heroSubtitle}>სერვისებზე, ნაწილებზე, დეტეილინგზე და სხვა ყველაფერზე</Text>
            </View>
            <View style={styles.heroIcon}><Ionicons name="card-outline" size={22} color="#FFFFFF" /></View>
          </View>
        </LinearGradient>

        {/* Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.sectionTitle}>როგორ მუშაობს</Text>
          {[
            { icon: 'create-outline', title: 'შეავსე მოკლე განაცხადი', desc: 'სახელი, ტელეფონი და სურვილისამებრ კომენტარი' },
            { icon: 'call-outline', title: 'ოპერატორი დაგიკავშირდება', desc: 'ვადასტურებთ მონაცემებს და ვარჩევთ პირობებს' },
            { icon: 'shield-checkmark-outline', title: 'წინასწარი თანხმობა', desc: 'მოთხოვნის სწრაფი შეფასება და პირობების გაგზავნა' },
            { icon: 'sparkles-outline', title: 'სერვისის მიღება', desc: 'იღებ სერვისს ახლავე, გადახდა ნაწილებად 0%-ით' },
          ].map((s, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepIcon}><Ionicons name={s.icon as any} size={16} color="#111827" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/financing-request')} activeOpacity={0.9}>
          <Text style={styles.ctaText}>განაცხადის შევსება</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
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
  heroCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 8 },
  pillText: { color: '#93C5FD', fontWeight: '700', fontSize: 11 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { color: '#CBD5E1', fontSize: 12 },
  heroIcon: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 12 },
  stepsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  stepDesc: { fontSize: 12, color: '#6B7280' },
  ctaBtn: { marginTop: 16, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ctaText: { color: '#FFFFFF', fontWeight: '700' },
});


