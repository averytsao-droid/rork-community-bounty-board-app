import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, DollarSign, Clock, Tag, Users, Share2 } from 'lucide-react-native';
import { useBountyContext } from '@/contexts/BountyContext';
import { bountyTemplates, categoryLabels, durationLabels } from '@/mocks/bounties';
import { BountyCategory, BountyTemplate, TimeDuration } from '@/types';

export default function PostBountyScreen() {
  const router = useRouter();
  const { addBounty } = useBountyContext();
  
  const [selectedTemplate, setSelectedTemplate] = useState<BountyTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showDurations, setShowDurations] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BountyCategory | null>(null);
  const [reward, setReward] = useState('');
  const [duration, setDuration] = useState<TimeDuration>('short');
  const [tags, setTags] = useState('');
  const [huntersNeeded, setHuntersNeeded] = useState('1');
  const [postToFizz, setPostToFizz] = useState(false);

  const handleTemplateSelect = (template: BountyTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setTags(template.tags.join(', '));
    setShowTemplates(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!reward || isNaN(Number(reward)) || Number(reward) <= 0) {
      Alert.alert('Error', 'Please enter a valid reward amount');
      return;
    }

    const tagArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const huntersCount = Number(huntersNeeded) || 1;

    addBounty({
      title: title.trim(),
      description: description.trim(),
      category,
      reward: Number(reward),
      status: 'open',
      duration,
      tags: tagArray,
      huntersNeeded: huntersCount,
      acceptedHunters: [],
    });

    if (postToFizz) {
      console.log('Creating Fizz post:', {
        title: title.trim(),
        reward: Number(reward),
        description: description.trim(),
      });
      Alert.alert(
        'Fizz Integration',
        `Would create a Fizz post:\n\n"${title.trim()} - Paying ${reward}"\n\nNote: Fizz API integration would be implemented here.`,
        [{ text: 'OK' }]
      );
    }

    setTitle('');
    setDescription('');
    setReward('');
    setDuration('short');
    setTags('');
    setCategory(null);
    setSelectedTemplate(null);
    setHuntersNeeded('1');
    setPostToFizz(false);

    Alert.alert('Success', 'Bounty posted successfully!', [
      {
        text: 'OK',
        onPress: () => {
          router.push('/(tabs)');
        },
      },
    ]);
  };

  return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Post Bounty' }} />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Use a Template (Optional)</Text>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => setShowTemplates(!showTemplates)}
          >
            <Text style={styles.templateButtonText}>
              {selectedTemplate ? selectedTemplate.name : 'Select a template'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {showTemplates && (
            <View style={styles.templateList}>
              {bountyTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateCategory}>
                    {categoryLabels[template.category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter bounty title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the bounty in detail"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            returnKeyType="default"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category (Optional)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={styles.selectButtonText}>
              {category ? categoryLabels[category] : 'None'}
            </Text>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryList}>
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => {
                  setCategory(null);
                  setShowCategories(false);
                }}
              >
                <Text style={styles.categoryItemText}>None</Text>
              </TouchableOpacity>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.categoryItem}
                  onPress={() => {
                    setCategory(key as BountyCategory);
                    setShowCategories(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reward Amount ($) *</Text>
          <View style={styles.inputWithIcon}>
            <DollarSign size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithPadding]}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              value={reward}
              onChangeText={setReward}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Time to Complete *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDurations(!showDurations)}
          >
            <View style={styles.selectButtonContent}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.selectButtonText}>
                {durationLabels[duration]}
              </Text>
            </View>
            <ChevronDown size={20} color="#6B7280" />
          </TouchableOpacity>

          {showDurations && (
            <View style={styles.categoryList}>
              {Object.entries(durationLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.categoryItem}
                  onPress={() => {
                    setDuration(key as TimeDuration);
                    setShowDurations(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <View style={styles.inputWithIcon}>
            <Tag size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithPadding]}
              placeholder="React, Node.js, TypeScript"
              placeholderTextColor="#9CA3AF"
              value={tags}
              onChangeText={setTags}
              returnKeyType="done"
            />
          </View>
          <Text style={styles.helperText}>Separate tags with commas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Number of Hunters Needed (Optional)</Text>
          <View style={styles.inputWithIcon}>
            <Users size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithPadding]}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              value={huntersNeeded}
              onChangeText={setHuntersNeeded}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <Text style={styles.helperText}>Enter the number of hunters you need (default is 1)</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.fizzToggle}
            onPress={() => setPostToFizz(!postToFizz)}
          >
            <View style={styles.fizzToggleContent}>
              <Share2 size={24} color={postToFizz ? '#8B5CF6' : '#6B7280'} />
              <View style={styles.fizzToggleText}>
                <Text style={styles.fizzToggleTitle}>Post to Fizz</Text>
                <Text style={styles.fizzToggleSubtitle}>
                  Share your bounty on Fizz to reach more people
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggleSwitch,
                postToFizz && styles.toggleSwitchActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  postToFizz && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Post Bounty</Text>
        </TouchableOpacity>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
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
    minHeight: 120,
  },
  inputWithIcon: {
    position: 'relative' as const,
  },
  inputIcon: {
    position: 'absolute' as const,
    left: 14,
    top: 14,
    zIndex: 1,
  },
  inputWithPadding: {
    paddingLeft: 44,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  templateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  templateButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  templateList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  templateItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  categoryList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  categoryItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  fizzToggle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fizzToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fizzToggleText: {
    flex: 1,
  },
  fizzToggleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  fizzToggleSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
});
