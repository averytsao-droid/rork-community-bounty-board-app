import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack } from 'expo-router';
import { DollarSign, Users, XCircle, Award } from 'lucide-react-native';
import { useBountyContext } from '@/contexts/BountyContext';
import { categoryLabels, categoryColors } from '@/mocks/bounties';
import { Bounty } from '@/types';

export default function MyBountiesScreen() {
  const { myPostedBounties, acceptedBountiesList, updateBountyStatus, cancelBounty, deleteBounty, currentUser } = useBountyContext();
  const [activeTab, setActiveTab] = useState<'posted' | 'accepted'>('posted');
  const [expandedBountyId, setExpandedBountyId] = useState<string | null>(null);

  console.log('📋 My Bounties Debug:');
  console.log('  Current User ID:', currentUser.id);
  console.log('  Posted Bounties:', myPostedBounties.length);
  console.log('  Accepted Bounties:', acceptedBountiesList.length);
  console.log('  Accepted Bounty Details:', acceptedBountiesList.map(b => ({
    id: b.id,
    title: b.title,
    postedBy: b.postedBy,
    status: b.status,
    isMyBounty: b.postedBy === currentUser.id
  })));



  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const renderBountyCard = (bounty: Bounty, isPosted: boolean) => {
    const isExpanded = expandedBountyId === bounty.id;
    const isPoster = bounty.postedBy === currentUser.id;
    
    return (
    <TouchableOpacity 
      key={bounty.id} 
      style={styles.bountyCard}
      onPress={() => setExpandedBountyId(isExpanded ? null : bounty.id)}
      activeOpacity={0.7}
    >
      <View style={styles.bountyHeader}>
        <View style={styles.bountyHeaderLeft}>
          <Image source={{ uri: bounty.postedByAvatar }} style={styles.avatar} />
          <View>
            <Text style={styles.posterName}>{bounty.postedByName}</Text>
            <Text style={styles.postedDate}>
              {formatDate(bounty.createdAt)} ago
            </Text>
          </View>
        </View>
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
      </View>

      <Text style={styles.bountyTitle}>{bounty.title}</Text>
      <Text style={styles.bountyDescription} numberOfLines={isExpanded ? undefined : 2}>
        {bounty.description}
      </Text>

      <View style={styles.tagsContainer}>
        {(isExpanded ? bounty.tags : bounty.tags.slice(0, 3)).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {isExpanded && (
        <View style={styles.expandedInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{categoryLabels[bounty.category]}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{bounty.duration}</Text>
          </View>
          {bounty.huntersNeeded && bounty.huntersNeeded > 1 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hunters Needed:</Text>
              <Text style={styles.infoValue}>{bounty.huntersNeeded}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{bounty.createdAt.toLocaleDateString()}</Text>
          </View>
        </View>
      )}

      <View style={styles.bountyFooter}>
        <View style={styles.bountyFooterLeft}>
          <View style={styles.footerItem}>
            <DollarSign size={16} color="#8B5CF6" />
            <Text style={styles.rewardText}>${bounty.reward}</Text>
          </View>
          <View style={styles.footerItem}>
            <Users size={16} color="#6B7280" />
            <Text style={styles.footerText}>{bounty.applicants}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            bounty.status === 'open' && styles.statusOpen,
            bounty.status === 'in-progress' && styles.statusInProgress,
            bounty.status === 'completed' && styles.statusCompleted,
          ]}
        >
          <Text style={styles.statusText}>
            {bounty.status === 'in-progress' ? 'In Progress' : bounty.status}
          </Text>
        </View>
      </View>

      {isPosted && bounty.status === 'open' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => updateBountyStatus(bounty.id, 'cancelled')}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}



      {!isPosted && !isPoster && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={async () => {
              try {
                await cancelBounty(bounty.id);
              } catch (error) {
                console.error('Error cancelling bounty:', error);
              }
            }}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
              Cancel Bounty
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isPosted && isPoster && bounty.status === 'in-progress' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={() => updateBountyStatus(bounty.id, 'completed')}
          >
            <Award size={16} color="#10B981" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSuccess]}>
              Complete Bounty & Pay Hunter
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
  };

  const cancelledBounties = myPostedBounties.filter(b => b.status === 'cancelled');
  const openPostedBounties = myPostedBounties.filter(b => b.status === 'open' || b.status === 'cancelled');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Bounties' }} />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posted' && styles.tabActive]}
          onPress={() => setActiveTab('posted')}
        >
          <Text
            style={[styles.tabText, activeTab === 'posted' && styles.tabTextActive]}
          >
            Posted ({myPostedBounties.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accepted' && styles.tabActive]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text
            style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}
          >
            Accepted ({acceptedBountiesList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {cancelledBounties.length > 0 && activeTab === 'posted' && (
        <View style={styles.clearCancelledContainer}>
          <Text style={styles.clearCancelledText}>
            {cancelledBounties.length} cancelled {cancelledBounties.length === 1 ? 'bounty' : 'bounties'}
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              cancelledBounties.forEach(b => deleteBounty(b.id));
            }}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'posted' ? (
          openPostedBounties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posted bounties</Text>
              <Text style={styles.emptySubtext}>
                Create your first bounty to get started
              </Text>
            </View>
          ) : (
            openPostedBounties.map(b => renderBountyCard(b, true))
          )
        ) : (
          acceptedBountiesList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No accepted bounties</Text>
              <Text style={styles.emptySubtext}>
                Browse bounties and accept them to get started
              </Text>
            </View>
          ) : (
            acceptedBountiesList.map(b => renderBountyCard(b, false))
          )
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
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
  actionsContainer: {
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
  },
  actionButtonSuccess: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonTextSuccess: {
    color: '#10B981',
  },
  expandedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600' as const,
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
  clearCancelledContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  clearCancelledText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500' as const,
  },
  clearButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
