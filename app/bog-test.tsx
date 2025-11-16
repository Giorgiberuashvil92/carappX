import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { bogApi, BOGOAuthStatus } from '../services/bogApi';

export default function BOGTestScreen() {
  const router = useRouter();
  const [oauthStatus, setOauthStatus] = useState<BOGOAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const checkOAuthStatus = async () => {
    setIsLoading(true);
    try {
      const status = await bogApi.getOAuthStatus();
      setOauthStatus(status);
    } catch (error) {
      console.error('❌ OAuth სტატუსის შემოწმების შეცდომა:', error);
      Alert.alert('შეცდომა', 'OAuth სტატუსის შემოწმება ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  const clearTokenCache = async () => {
    setIsLoading(true);
    try {
      const result = await bogApi.clearTokenCache();
      if (result.success) {
        Alert.alert('წარმატება', 'Token cache წარმატებით გასუფთავებულია');
        // ხელახლა სტატუსის შემოწმება
        await checkOAuthStatus();
      } else {
        Alert.alert('შეცდომა', result.message);
      }
    } catch (error) {
      console.error('❌ Token cache-ის გასუფთავების შეცდომა:', error);
      Alert.alert('შეცდომა', 'Token cache-ის გასუფთავება ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    try {
      const results = await bogApi.testOAuthService();
      setTestResults(results);
      
      if (results.success) {
        Alert.alert('წარმატება', 'BOG OAuth სერვისი მუშაობს სწორად!');
      } else {
        Alert.alert('შეცდომა', results.message);
      }
    } catch (error) {
      console.error('❌ ტესტის შეცდომა:', error);
      Alert.alert('შეცდომა', 'ტესტი ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  const monitorService = async () => {
    setIsLoading(true);
    try {
      const monitor = await bogApi.monitorOAuthService();
      setTestResults(monitor);
      
      Alert.alert(
        'მონიტორინგი',
        `BOG OAuth სერვისი: ${monitor.isHealthy ? 'მუშაობს' : 'არ მუშაობს'}\n\n${monitor.tokenStatus.message}`
      );
    } catch (error) {
      console.error('❌ მონიტორინგის შეცდომა:', error);
      Alert.alert('შეცდომა', 'მონიტორინგი ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOAuthStatus();
  }, []);

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('ka-GE');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>BOG OAuth ტესტი</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* OAuth Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔐 OAuth სტატუსი</Text>
            <TouchableOpacity onPress={checkOAuthStatus} disabled={isLoading}>
              <Feather name="refresh-cw" size={20} color="#22C55E" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.loadingText}>შემოწმება...</Text>
            </View>
          ) : oauthStatus ? (
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Token ვალიდურია:</Text>
                <Text style={[
                  styles.statusValue,
                  { color: oauthStatus.isTokenValid ? '#22C55E' : '#EF4444' }
                ]}>
                  {oauthStatus.isTokenValid ? '✅ კი' : '❌ არა'}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>ვადის გასვლის დრო:</Text>
                <Text style={styles.statusValue}>
                  {formatTimestamp(oauthStatus.expiresAt)}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>მესიჯი:</Text>
                <Text style={styles.statusValue}>{oauthStatus.message}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>მონაცემები არ არის</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ მოქმედებები</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={checkOAuthStatus}
            disabled={isLoading}
          >
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>OAuth სტატუსის შემოწმება</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.warningButton]} 
            onPress={clearTokenCache}
            disabled={isLoading}
          >
            <Feather name="trash-2" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Token Cache-ის გასუფთავება</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.successButton]} 
            onPress={runFullTest}
            disabled={isLoading}
          >
            <Feather name="play" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>სრული ტესტი</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.infoButton]} 
            onPress={monitorService}
            disabled={isLoading}
          >
            <Feather name="monitor" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>მონიტორინგი</Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        {testResults && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 ტესტის შედეგები</Text>
            <ScrollView style={styles.resultsContainer}>
              <Text style={styles.resultsText}>
                {JSON.stringify(testResults, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#9CA3AF',
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },
  statusContainer: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  statusValue: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    textAlign: 'right',
  },
  noDataText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  successButton: {
    backgroundColor: '#22C55E',
  },
  infoButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  resultsText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
});
