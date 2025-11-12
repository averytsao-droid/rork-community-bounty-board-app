import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Filter, DollarSign, Clock, Users, MessageCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react-native';
import { useBountyContext, useFilteredBounties } from '@/contexts/BountyContext';
import { categoryLabels, categoryColors, durationLabels } from '@/mocks/bounties';
import { Bounty } from '@/types';

export default function BrowseBountiesScreen() {
  const { isLoading, applyToBounty, startNegotiation, myAppliedBounties, currentUser } = useBountyContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'reward-high' | 'reward-low'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBountyId, setExpandedBountyId] = useState<string | null>(null);
  const router = useRouter();

  const filteredBounties = useFilteredBounties(searchQuery, selectedCategory, selectedDuration, sortBy);

  const categories = Object.keys(categoryLabels);
  const durations = Object.keys(durationLabels);

  const handleAcceptBounty = (bounty: Bounty) => {
    const conversationId = applyToBounty(bounty.id);
    if (conversationId) {
      router.push(`/messages?conversationId=${conversationId}`);
    } else {
      router.push('/messages');
    }
  };

  const handleNegotiate = (bounty: Bounty) => {
    const conversationId = startNegotiation(bounty.id);
    if (conversationId) {
      router.push(`/messages?conversationId=${conversationId}`);
    } else {
      router.push('/messages');
    }
  };

  const renderBountyCard = (bounty: Bounty) => {
    const isMyBounty = bounty.postedBy === currentUser.id;
    const hasApplied = myAppliedBounties.includes(bounty.id);
    const canInteract = bounty.status === 'open' && !isMyBounty;
    const isExpanded = expandedBountyId === bounty.id;

    return (
      <View key={bounty.id} style={styles.bountyCard}>
        <TouchableOpacity 
          onPress={() => setExpandedBountyId(isExpanded ? null : bounty.id)}
          activeOpacity={0.7}
        >
          <View style={styles.bountyHeader}>
            <View style={styles.bountyHeaderLeft}>
              <Image source={{ uri: bounty.postedByAvatar }} style={styles.avatar} />
              <View>
                <Text style={styles.posterName}>{bounty.postedByName}</Text>
                <Text style={styles.postedDate}>
                  {bounty.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
            {bounty.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColors[bounty.category] + '20' },
                ]}
              >
                <Text
                  style={[styles.categoryText, { color: categoryColors[bounty.category] }]}
                >
                  {categoryLabels[bounty.category]}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.bountyTitle}>{bounty.title}</Text>
          <Text 
            style={styles.bountyDescription} 
            numberOfLines={isExpanded ? undefined : 2}
          >
            {bounty.description}
          </Text>

          <View style={styles.bountyRewardRow}>
            <DollarSign size={16} color="#10B981" />
            <Text style={styles.bountyRewardText}>${bounty.reward}</Text>
          </View>

          {!isExpanded && (
            <View style={styles.tagsContainer}>
              {bounty.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {bounty.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{bounty.tags.length - 3} more</Text>
              )}
            </View>
          )}

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.tagsContainer}>
                {bounty.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Details</Text>
                
                <View style={styles.detailRow}>
                  <DollarSign size={18} color="#8B5CF6" />
                  <Text style={styles.detailLabel}>Reward:</Text>
                  <Text style={styles.detailValue}>${bounty.reward}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Clock size={18} color="#6B7280" />
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{durationLabels[bounty.duration]}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Users size={18} color="#6B7280" />
                  <Text style={styles.detailLabel}>Applicants:</Text>
                  <Text style={styles.detailValue}>{bounty.applicants}</Text>
                </View>

                {bounty.huntersNeeded && bounty.huntersNeeded > 1 && (
                  <View style={styles.detailRow}>
                    <Users size={18} color="#6B7280" />
                    <Text style={styles.detailLabel}>Hunters Needed:</Text>
                    <Text style={styles.detailValue}>{bounty.huntersNeeded}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Calendar size={18} color="#6B7280" />
                  <Text style={styles.detailLabel}>Posted:</Text>
                  <Text style={styles.detailValue}>
                    {bounty.createdAt.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={[
                    styles.statusIndicator,
                    bounty.status === 'open' && styles.statusIndicatorOpen,
                    bounty.status === 'in-progress' && styles.statusIndicatorInProgress,
                    bounty.status === 'completed' && styles.statusIndicatorCompleted,
                  ]} />
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>
                    {bounty.status === 'in-progress' ? 'In Progress' : bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.expandToggle}>
            {isExpanded ? (
              <ChevronUp size={20} color="#8B5CF6" />
            ) : (
              <ChevronDown size={20} color="#8B5CF6" />
            )}
            <Text style={styles.expandToggleText}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </View>
        </TouchableOpacity>

        {canInteract && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, hasApplied && styles.actionButtonDisabled]}
              onPress={() => handleAcceptBounty(bounty)}
              disabled={hasApplied}
            >
              <Text style={styles.acceptButtonText}>
                {hasApplied ? 'Applied' : 'Accept'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.negotiateButton]}
              onPress={() => handleNegotiate(bounty)}
            >
              <MessageCircle size={16} color="#8B5CF6" />
              <Text style={styles.negotiateButtonText}>Negotiate</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Browse' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bounties...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Browse' }} />
      
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bounties..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {categoryLabels[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Time to Complete</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedDuration && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedDuration(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedDuration && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {durations.map((dur) => (
              <TouchableOpacity
                key={dur}
                style={[
                  styles.categoryChip,
                  selectedDuration === dur && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedDuration(dur)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedDuration === dur && styles.categoryChipTextActive,
                  ]}
                >
                  {durationLabels[dur]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.sortContainer}>
            {(['newest', 'reward-high', 'reward-low'] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortChip,
                  sortBy === sort && styles.sortChipActive,
                ]}
                onPress={() => setSortBy(sort)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    sortBy === sort && styles.sortChipTextActive,
                  ]}
                >
                  {sort === 'newest' ? 'Newest' : sort === 'reward-high' ? 'Highest Reward' : 'Lowest Reward'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredBounties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bounties found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredBounties.map(renderBountyCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  sortChipActive: {
    backgroundColor: '#8B5CF6',
  },
  sortChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  bountyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bountyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bountyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  posterName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bountyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  bountyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bountyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bountyFooterLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#8B5CF6',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#10B98120',
  },
  statusInProgress: {
    backgroundColor: '#F59E0B20',
  },
  statusCompleted: {
    backgroundColor: '#6B728020',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  negotiateButton: {
    backgroundColor: '#F3E8FF',
  },
  negotiateButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8B5CF6',
  },
  actionButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  expandedContent: {
    marginTop: 12,
  },
  detailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600' as const,
    flex: 1,
  },
  statusIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  statusIndicatorOpen: {
    backgroundColor: '#10B981',
  },
  statusIndicatorInProgress: {
    backgroundColor: '#F59E0B',
  },
  statusIndicatorCompleted: {
    backgroundColor: '#6B7280',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  expandToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500' as const,
  },
  bountyRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  bountyRewardText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10B981',
  },
});
