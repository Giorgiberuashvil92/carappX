import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GamificationCardProps {
  points?: number;
  level?: string;
  nextLevel?: string;
  progress?: number;
  badges?: Array<{
    id: string;
    icon: string;
    title: string;
    color: string;
    gradient: [string, string];
  }>;
}

const GamificationCard: React.FC<GamificationCardProps> = ({
  points = 1250,
  level = "Gold Member",
  nextLevel = "Platinum",
  progress = 65,
  badges = [
    {
      id: '1',
      icon: 'checkmark-circle',
      title: '10 სერვისი',
      color: '#10B981',
      gradient: ['#10B981', '#059669']
    },
    {
      id: '2',
      icon: 'star',
      title: 'ეკონომია 100₾',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706']
    },
    {
      id: '3',
      icon: 'heart',
      title: 'ლოიალური',
      color: '#EF4444',
      gradient: ['#EF4444', '#DC2626']
    }
  ]
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&auto=format&fit=crop' }} 
          style={styles.backgroundImage} 
        />
        <LinearGradient 
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.7)"]} 
          style={styles.overlay} 
        />
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏆 მიღწევები</Text>
            </View>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>დეტალები</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.leftSection}>
              <Text style={styles.title}>შენი ქულები</Text>
              <Text style={styles.subtitle}>{level}</Text>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>{points.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>ქულა</Text>
              </View>
            </View>
            
            <View style={styles.rightSection}>
              <View style={styles.badgesRow}>
                {badges.slice(0, 3).map((badge) => (
                  <View key={badge.id} style={styles.miniBadge}>
                    <Ionicons name={badge.icon as any} size={16} color={badge.color} />
                  </View>
                ))}
              </View>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{nextLevel}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    marginBottom: 6,
  },
  subtitle: {
    color: '#E5E7EB',
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    marginBottom: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsText: {
    color: '#FFD700',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
  },
  pointsLabel: {
    color: '#E5E7EB',
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'flex-end',
    width: 130,
  },
  progressText: {
    color: '#E5E7EB',
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  actionButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
});

export default GamificationCard;
