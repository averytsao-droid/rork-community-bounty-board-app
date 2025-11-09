import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Bell, MessageSquare, DollarSign, CheckCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [newBounties, setNewBounties] = useState(true);
  const [messages, setMessages] = useState(true);
  const [payRequests, setPayRequests] = useState(true);
  const [bountyUpdates, setBountyUpdates] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <Text style={styles.sectionDescription}>
            Receive notifications on your device
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={24} color="#8B5CF6" />
              <Text style={styles.settingText}>Enable Push Notifications</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={pushEnabled ? '#8B5CF6' : '#F3F4F6'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>New Bounties</Text>
                <Text style={styles.settingSubtext}>
                  Get notified when new bounties are posted
                </Text>
              </View>
            </View>
            <Switch
              value={newBounties}
              onValueChange={setNewBounties}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={newBounties ? '#8B5CF6' : '#F3F4F6'}
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MessageSquare size={20} color="#6B7280" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Messages</Text>
                <Text style={styles.settingSubtext}>
                  Get notified when you receive new messages
                </Text>
              </View>
            </View>
            <Switch
              value={messages}
              onValueChange={setMessages}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={messages ? '#8B5CF6' : '#F3F4F6'}
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <DollarSign size={20} color="#6B7280" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Pay Requests</Text>
                <Text style={styles.settingSubtext}>
                  Get notified about payment requests
                </Text>
              </View>
            </View>
            <Switch
              value={payRequests}
              onValueChange={setPayRequests}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={payRequests ? '#8B5CF6' : '#F3F4F6'}
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <CheckCircle size={20} color="#6B7280" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Bounty Updates</Text>
                <Text style={styles.settingSubtext}>
                  Get notified about status changes
                </Text>
              </View>
            </View>
            <Switch
              value={bountyUpdates}
              onValueChange={setBountyUpdates}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={bountyUpdates ? '#8B5CF6' : '#F3F4F6'}
              disabled={!pushEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingText}>Email Digest</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={emailNotifications ? '#8B5CF6' : '#F3F4F6'}
            />
          </View>
          <Text style={styles.helperText}>
            Receive a daily summary of your bounty activity
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
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500' as const,
  },
  settingSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  helperText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: -4,
    marginLeft: 4,
  },
});
