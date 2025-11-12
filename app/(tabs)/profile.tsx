import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Star, Award, DollarSign, Calendar, Edit, LogOut, Wallet, Users } from 'lucide-react-native';
import { useBountyContext } from '@/contexts/BountyContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { currentUser, reviews } = useBountyContext();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔓 Starting logout process...');
              
              await logout();
              console.log('🔓 Logout completed');
              
              router.replace('/login');
              console.log('🔓 Navigation to login completed');
            } catch (error) {
              console.error('❌ Error during logout:', error);
              
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const userReviews = reviews.filter(r => r.revieweeId === currentUser.id);
  const averageRating = userReviews.length > 0
    ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
    : currentUser.rating;

  const followers = user?.followers || [];
  const following = user?.following || [];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
              <LogOut size={22} color="#EF4444" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{currentUser.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.bio}>{currentUser.bio}</Text>

          <View style={styles.socialStats}>
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{followers.length}</Text>
              <Text style={styles.socialStatLabel}>Followers</Text>
            </View>
            <View style={styles.socialStatDivider} />
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{following.length}</Text>
              <Text style={styles.socialStatLabel}>Following</Text>
            </View>
            <View style={styles.socialStatDivider} />
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{userReviews.length}</Text>
              <Text style={styles.socialStatLabel}>Reviews</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Edit size={16} color="#8B5CF6" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <View style={styles.creditsIconContainer}>
              <Wallet size={24} color="#8B5CF6" />
            </View>
            <View style={styles.creditsInfo}>
              <Text style={styles.creditsLabel}>Available Credits</Text>
              <Text style={styles.creditsValue}>¢{(currentUser.credits || 0).toLocaleString()}</Text>
            </View>
          </View>
          <Text style={styles.creditsSubtext}>Use credits to pay bounty hunters</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Award size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{currentUser.bountiesCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>${(currentUser.totalEarned || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Calendar size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{currentUser.bountiesPosted}</Text>
            <Text style={styles.statLabel}>Posted</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {formatDate(currentUser.joinedDate)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rating</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.infoValue}>
                  {currentUser.rating.toFixed(1)} / 5.0
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Success Rate</Text>
              <Text style={styles.infoValue}>
                {currentUser.bountiesCompleted > 0
                  ? Math.round((currentUser.bountiesCompleted / (currentUser.bountiesCompleted + currentUser.bountiesPosted)) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.settingText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/payment-methods')}
          >
            <Text style={styles.settingText}>Payment Methods</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/privacy')}
          >
            <Text style={styles.settingText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/terms')}
          >
            <Text style={styles.settingText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/support')}
          >
            <Text style={styles.settingText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.settingItemLast]}
            onPress={handleLogout}
          >
            <Text style={[styles.settingText, styles.settingTextDanger]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactMessageBox}>
          <Text style={styles.contactMessageText}>
            PLEASE text 202-823-7791 with questions, comments, concerns
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  creditsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  creditsIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsInfo: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  creditsValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#8B5CF6',
  },
  creditsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  socialStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  socialStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  socialStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  socialStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  settingTextDanger: {
    color: '#EF4444',
    fontWeight: '600' as const,
  },
  contactMessageBox: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactMessageText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600' as const,
  },
});
