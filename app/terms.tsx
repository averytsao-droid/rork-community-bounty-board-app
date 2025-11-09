import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using Dartmouth Bounties, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          Dartmouth Bounties is a platform that connects Dartmouth College students who need tasks completed with students willing to complete those tasks for compensation.
        </Text>

        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          Users are responsible for:
        </Text>
        <Text style={styles.bulletPoint}>• Providing accurate information</Text>
        <Text style={styles.bulletPoint}>• Maintaining account security</Text>
        <Text style={styles.bulletPoint}>• Complying with all applicable laws</Text>
        <Text style={styles.bulletPoint}>• Treating other users with respect</Text>
        <Text style={styles.bulletPoint}>• Completing accepted bounties in good faith</Text>

        <Text style={styles.sectionTitle}>4. Payment Terms</Text>
        <Text style={styles.paragraph}>
          All payments are handled directly between users. Dartmouth Bounties is not responsible for payment disputes or non-payment issues.
        </Text>

        <Text style={styles.sectionTitle}>5. Prohibited Activities</Text>
        <Text style={styles.paragraph}>
          Users may not:
        </Text>
        <Text style={styles.bulletPoint}>• Post illegal or inappropriate content</Text>
        <Text style={styles.bulletPoint}>• Harass or threaten other users</Text>
        <Text style={styles.bulletPoint}>• Attempt to defraud other users</Text>
        <Text style={styles.bulletPoint}>• Violate Dartmouth College policies</Text>
        <Text style={styles.bulletPoint}>• Use the platform for commercial purposes</Text>

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          Dartmouth Bounties is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from the use of this service.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these terms, please contact us at support@dartmouth-bounties.app
        </Text>
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
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#111827',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
});
