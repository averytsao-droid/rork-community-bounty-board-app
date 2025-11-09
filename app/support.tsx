import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Mail, MessageSquare, AlertCircle } from 'lucide-react-native';
import { useBountyContext } from '@/contexts/BountyContext';

type IssueType = 'question' | 'bug' | 'feature' | 'other';

export default function SupportScreen() {
  const { currentUser } = useBountyContext();
  const router = useRouter();

  const [issueType, setIssueType] = useState<IssueType>('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const issueTypes: { value: IssueType; label: string; icon: any }[] = [
    { value: 'question', label: 'Question', icon: MessageSquare },
    { value: 'bug', label: 'Bug Report', icon: AlertCircle },
    { value: 'feature', label: 'Feature Request', icon: Mail },
    { value: 'other', label: 'Other', icon: Mail },
  ];

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSending(true);

    try {
      console.log('Support request:', {
        type: issueType,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim(),
        userId: currentUser.id,
        userName: currentUser.name,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Message Sent!',
        'Thank you for contacting us. We\'ll get back to you as soon as possible.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setMessage('');
              setEmail('');
              setIssueType('question');
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      console.error('Support request error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Stack.Screen options={{ title: 'Help & Support' }} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Mail size={48} color="#8B5CF6" />
            <Text style={styles.headerTitle}>How can we help?</Text>
            <Text style={styles.headerSubtitle}>
              Send us a message and we'll get back to you as soon as possible.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Issue Type *</Text>
            <View style={styles.issueTypeContainer}>
              {issueTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = issueType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.issueTypeButton,
                      isSelected && styles.issueTypeButtonActive,
                    ]}
                    onPress={() => setIssueType(type.value)}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? '#8B5CF6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.issueTypeText,
                        isSelected && styles.issueTypeTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Your Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description of your issue"
              placeholderTextColor="#9CA3AF"
              value={subject}
              onChangeText={setSubject}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please provide as much detail as possible..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              returnKeyType="default"
            />
            <Text style={styles.helperText}>
              {message.length}/1000 characters
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSending}
          >
            <Text style={styles.submitButtonText}>
              {isSending ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>

          <View style={styles.contactInfo}>
            <Text style={styles.contactInfoTitle}>Other ways to reach us:</Text>
            <Text style={styles.contactInfoText}>
              Email: support@bountyapp.com
            </Text>
            <Text style={styles.contactInfoText}>
              Response time: Usually within 24 hours
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  issueTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  issueTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minWidth: '47%',
  },
  issueTypeButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  issueTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  issueTypeTextActive: {
    color: '#8B5CF6',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 150,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  contactInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactInfoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  contactInfoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
});
