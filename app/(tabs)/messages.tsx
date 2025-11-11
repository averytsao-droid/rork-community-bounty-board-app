import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Send, ArrowLeft, Users, DollarSign } from 'lucide-react-native';
import { useBountyContext } from '@/contexts/BountyContext';
import { Conversation, ConversationType, Message } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, messages, sendMessage, sendPayRequest, acceptPayRequest, markConversationAsRead, currentUser, bounties, myPostedBounties, setConversations, setMessages, loadMessagesForConversation, createDirectConversation } = useBountyContext();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedTab, setSelectedTab] = useState<ConversationType>('direct');
  const [showPayRequestInput, setShowPayRequestInput] = useState(false);
  const [payRequestAmount, setPayRequestAmount] = useState('');
  
  useEffect(() => {
    if (selectedConversation) {
      const updatedConv = conversations.find(c => c.id === selectedConversation.id);
      if (updatedConv) {
        setSelectedConversation(updatedConv);
      }
    }
  }, [conversations]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    markConversationAsRead(conversation.id);
    await loadMessagesForConversation(conversation.id);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    sendMessage(selectedConversation.id, messageText.trim());
    setMessageText('');
  };

  const handleSendPayRequest = () => {
    if (!payRequestAmount.trim() || !selectedConversation) return;
    
    const amount = parseFloat(payRequestAmount);
    if (isNaN(amount) || amount <= 0) return;

    sendPayRequest(selectedConversation.id, amount);
    setPayRequestAmount('');
    setShowPayRequestInput(false);
  };

  const handleAcceptPayRequest = (messageId: string) => {
    if (!selectedConversation) return;
    acceptPayRequest(selectedConversation.id, messageId);
  };

  const filteredConversations = conversations.filter(c => c.type === selectedTab);

  const groupedDirectConversations = useMemo(() => {
    if (selectedTab !== 'direct') return { posted: [], accepted: [] };

    const posted: Conversation[] = [];
    const accepted: Conversation[] = [];

    filteredConversations.forEach(conv => {
      const bounty = [...bounties, ...myPostedBounties].find(b => b.id === conv.bountyId);
      if (bounty && bounty.postedBy === currentUser.id) {
        posted.push(conv);
      } else {
        accepted.push(conv);
      }
    });

    posted.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    accepted.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

    return { posted, accepted };
  }, [filteredConversations, selectedTab, bounties, myPostedBounties, currentUser.id]);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      return conversation.participantName || 'Unknown';
    }
    return conversation.bountyTitle;
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      return conversation.bountyTitle;
    }
    const hunterCount = conversation.participants?.filter(p => p.role === 'hunter').length || 0;
    return `${hunterCount} hunter${hunterCount !== 1 ? 's' : ''} negotiating`;
  };

  const renderConversationList = () => (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'direct' && styles.tabActive]}
          onPress={() => setSelectedTab('direct')}
        >
          <Text style={[styles.tabText, selectedTab === 'direct' && styles.tabTextActive]}>
            Direct
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'hunter-negotiation' && styles.tabActive]}
          onPress={() => setSelectedTab('hunter-negotiation')}
        >
          <Text style={[styles.tabText, selectedTab === 'hunter-negotiation' && styles.tabTextActive]}>
            As Hunter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'poster-negotiation' && styles.tabActive]}
          onPress={() => setSelectedTab('poster-negotiation')}
        >
          <Text style={[styles.tabText, selectedTab === 'poster-negotiation' && styles.tabTextActive]}>
            As Poster
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.conversationList}
        contentContainerStyle={styles.conversationListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'direct' 
                ? 'Direct messages will appear here'
                : selectedTab === 'hunter-negotiation'
                ? 'Bounties you\'re negotiating will appear here'
                : 'Your posted bounties with negotiations will appear here'}
            </Text>
          </View>
        ) : selectedTab === 'direct' ? (
          <>
            {groupedDirectConversations.posted.length > 0 && (
              <View style={styles.conversationGroup}>
                <Text style={styles.groupLabel}>Bounties You Posted</Text>
                {groupedDirectConversations.posted.map((conversation) => (
                  <TouchableOpacity
                    key={conversation.id}
                    style={[styles.conversationItem, styles.conversationItemPosted]}
                    onPress={() => handleConversationSelect(conversation)}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/user-profile?userId=${conversation.participantId}`)}
                    >
                      <Image
                        source={{ uri: conversation.participantAvatar }}
                        style={styles.conversationAvatar}
                      />
                    </TouchableOpacity>
                    <View style={styles.conversationContent}>
                      <View style={styles.conversationHeader}>
                        <Text style={styles.conversationName}>
                          {getConversationTitle(conversation)}
                        </Text>
                        <Text style={styles.conversationTime}>
                          {formatTime(conversation.lastMessageTime)}
                        </Text>
                      </View>
                      <Text style={styles.bountyTitle} numberOfLines={1}>
                        {getConversationSubtitle(conversation)}
                      </Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {conversation.lastMessage}
                      </Text>
                    </View>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {groupedDirectConversations.accepted.length > 0 && (
              <View style={styles.conversationGroup}>
                <Text style={styles.groupLabel}>Bounties You Accepted</Text>
                {groupedDirectConversations.accepted.map((conversation) => (
                  <TouchableOpacity
                    key={conversation.id}
                    style={[styles.conversationItem, styles.conversationItemAccepted]}
                    onPress={() => handleConversationSelect(conversation)}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/user-profile?userId=${conversation.participantId}`)}
                    >
                      <Image
                        source={{ uri: conversation.participantAvatar }}
                        style={styles.conversationAvatar}
                      />
                    </TouchableOpacity>
                    <View style={styles.conversationContent}>
                      <View style={styles.conversationHeader}>
                        <Text style={styles.conversationName}>
                          {getConversationTitle(conversation)}
                        </Text>
                        <Text style={styles.conversationTime}>
                          {formatTime(conversation.lastMessageTime)}
                        </Text>
                      </View>
                      <Text style={styles.bountyTitle} numberOfLines={1}>
                        {getConversationSubtitle(conversation)}
                      </Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {conversation.lastMessage}
                      </Text>
                    </View>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationItem}
              onPress={() => handleConversationSelect(conversation)}
            >
              <View style={styles.groupAvatarContainer}>
                <Users size={24} color="#8B5CF6" />
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>
                    {getConversationTitle(conversation)}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {formatTime(conversation.lastMessageTime)}
                  </Text>
                </View>
                <Text style={styles.bountyTitle} numberOfLines={1}>
                  {getConversationSubtitle(conversation)}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
              </View>
              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  const handleAcceptOriginalPrice = async () => {
    if (!selectedConversation) return;
    
    const conversation = selectedConversation;
    const posterParticipant = conversation.participants?.find(p => p.role === 'poster');
    const hunterParticipant = conversation.participants?.find(p => p.role === 'hunter');
    
    if (!posterParticipant || !hunterParticipant) return;
    
    try {
      console.log('🎯 Accepting original price from negotiation:', conversation.id);
      console.log('Poster:', posterParticipant.name, 'Hunter:', hunterParticipant.name);
      
      const otherUserId = currentUser.id === posterParticipant.id ? hunterParticipant.id : posterParticipant.id;
      const otherUserName = currentUser.id === posterParticipant.id ? hunterParticipant.name : posterParticipant.name;
      const otherUserAvatar = currentUser.id === posterParticipant.id ? hunterParticipant.avatar : posterParticipant.avatar;
      
      const conversationId = await createDirectConversation(
        otherUserId,
        otherUserName,
        otherUserAvatar,
        conversation.bountyId,
        conversation.bountyTitle,
        conversation.originalReward,
        conversation.id
      );
      
      console.log('✅ Accepted bounty at original price, conversation created:', conversationId);
      
      setSelectedConversation(null);
    } catch (error) {
      console.error('❌ Error accepting original price:', error);
    }
  };

  const renderChatView = () => {
    if (!selectedConversation) return null;

    const conversationMessages = messages[selectedConversation.id] || [];
    const isNegotiation = selectedConversation.type !== 'direct';
    const isHunterNegotiation = selectedConversation.type === 'hunter-negotiation';
    const isPosterNegotiation = selectedConversation.type === 'poster-negotiation';
    
    const currentUserParticipant = selectedConversation.participants?.find(p => p.id === currentUser.id);
    const currentUserRole = currentUserParticipant?.role;

    return (
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          {selectedConversation.type === 'direct' ? (
            <>
              <TouchableOpacity
                onPress={() => router.push(`/user-profile?userId=${selectedConversation.participantId}`)}
              >
                <Image
                  source={{ uri: selectedConversation.participantAvatar }}
                  style={styles.chatAvatar}
                />
              </TouchableOpacity>
              <View style={styles.chatHeaderContent}>
                <Text style={styles.chatName}>{selectedConversation.participantName}</Text>
                {selectedConversation.bountyTitle && (
                  <Text style={styles.chatBountyTitle} numberOfLines={1}>
                    {selectedConversation.bountyTitle}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.groupAvatarContainerSmall}>
                <Users size={20} color="#8B5CF6" />
              </View>
              <View style={styles.chatHeaderContent}>
                <Text style={styles.chatName}>{selectedConversation.bountyTitle}</Text>
                <Text style={styles.chatBountyTitle} numberOfLines={1}>
                  Original: ${selectedConversation.originalReward}
                </Text>
              </View>
            </>
          )}
        </View>
        {isHunterNegotiation && currentUserRole === 'hunter' && (
          <View style={styles.acceptOriginalPriceContainer}>
            <TouchableOpacity
              style={styles.acceptOriginalPriceButton}
              onPress={handleAcceptOriginalPrice}
            >
              <DollarSign size={20} color="#FFFFFF" />
              <Text style={styles.acceptOriginalPriceText}>
                Accept Original Price (${selectedConversation.originalReward})
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {selectedConversation.type === 'poster-negotiation' && currentUserRole === 'poster' && (
          <View style={styles.acceptOriginalPriceContainer}>
            <TouchableOpacity
              style={[styles.acceptOriginalPriceButton, { backgroundColor: '#8B5CF6' }]}
              onPress={handleAcceptOriginalPrice}
            >
              <DollarSign size={20} color="#FFFFFF" />
              <Text style={styles.acceptOriginalPriceText}>
                Agree & Create Direct Chat (${selectedConversation.originalReward})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {conversationMessages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.id;
            const isPoster = isNegotiation && selectedConversation.participants?.find(p => p.id === message.senderId)?.role === 'poster';
            const isPayRequest = message.type === 'pay-request';

            if (isPayRequest && message.payRequest) {
              const senderParticipant = selectedConversation.participants?.find((p) => p.id === message.senderId);
              const senderRole = senderParticipant?.role;
              
              const canAccept = (
                isNegotiation && 
                message.senderId !== currentUser.id && 
                (
                  (currentUserRole === 'poster' && senderRole === 'hunter') ||
                  (currentUserRole === 'hunter' && senderRole === 'poster')
                )
              );
              
              console.log('Pay request check:', {
                messageId: message.id,
                senderId: message.senderId,
                senderRole,
                currentUserId: currentUser.id,
                currentUserRole,
                isNegotiation,
                canAccept,
                payRequestStatus: message.payRequest.status
              });
              
              return (
                <View key={message.id} style={styles.payRequestContainer}>
                  <View style={styles.payRequestCard}>
                    <View style={styles.payRequestHeader}>
                      <DollarSign size={24} color="#10B981" />
                      <Text style={styles.payRequestTitle}>Pay Request</Text>
                    </View>
                    <Text style={styles.payRequestAmount}>${message.payRequest.amount}</Text>
                    <Text style={styles.payRequestFrom}>
                      From: {message.senderName}
                    </Text>
                    {message.payRequest.status === 'pending' && canAccept && (
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptPayRequest(message.id)}
                      >
                        <Text style={styles.acceptButtonText}>Accept & Start Job</Text>
                      </TouchableOpacity>
                    )}
                    {message.payRequest.status === 'pending' && !canAccept && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    )}
                    {message.payRequest.status === 'accepted' && (
                      <View style={styles.acceptedBadge}>
                        <Text style={styles.acceptedText}>Accepted</Text>
                      </View>
                    )}
                    <Text style={styles.payRequestTime}>{formatTime(message.timestamp)}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft,
                ]}
              >
                {!isCurrentUser && isNegotiation && (
                  <TouchableOpacity
                    onPress={() => router.push(`/user-profile?userId=${message.senderId}`)}
                  >
                    <Image
                      source={{ uri: message.senderAvatar }}
                      style={styles.messageAvatar}
                    />
                  </TouchableOpacity>
                )}
                {!isCurrentUser && !isNegotiation && (
                  <TouchableOpacity
                    onPress={() => router.push(`/user-profile?userId=${message.senderId}`)}
                  >
                    <Image
                      source={{ uri: message.senderAvatar }}
                      style={styles.messageAvatar}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.messageContent}>
                  {!isCurrentUser && isNegotiation && (
                    <Text style={styles.messageSenderName}>{message.senderName}</Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isCurrentUser 
                        ? styles.messageBubbleRight 
                        : isPoster 
                        ? styles.messageBubblePoster 
                        : styles.messageBubbleLeft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        (isCurrentUser || isPoster) && styles.messageTextRight,
                      ]}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        (isCurrentUser || isPoster) && styles.messageTimeRight,
                      ]}
                    >
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {showPayRequestInput ? (
          <View style={styles.payRequestInputContainer}>
            <View style={styles.payRequestInputHeader}>
              <Text style={styles.payRequestInputTitle}>Send Pay Request</Text>
              <TouchableOpacity onPress={() => setShowPayRequestInput(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.payRequestInputRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.payRequestInput}
                placeholder="Enter amount"
                placeholderTextColor="#9CA3AF"
                value={payRequestAmount}
                onChangeText={setPayRequestAmount}
                keyboardType="decimal-pad"
                autoFocus
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.sendPayRequestButton,
                  !payRequestAmount.trim() && styles.sendPayRequestButtonDisabled,
                ]}
                onPress={handleSendPayRequest}
                disabled={!payRequestAmount.trim()}
              >
                <Text style={styles.sendPayRequestButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            {isNegotiation && (
              <TouchableOpacity
                style={styles.payRequestIconButton}
                onPress={() => setShowPayRequestInput(true)}
              >
                <DollarSign size={24} color="#10B981" />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: selectedConversation ? '' : 'Messages',
          headerShown: !selectedConversation,
        }}
      />
      {selectedConversation ? renderChatView() : renderConversationList()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
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
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  conversationList: {
    flex: 1,
  },
  conversationListContent: {
    padding: 16,
  },
  conversationGroup: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  conversationItemPosted: {
    borderLeftColor: '#8B5CF6',
    borderLeftWidth: 4,
  },
  conversationItemAccepted: {
    borderLeftColor: '#10B981',
    borderLeftWidth: 4,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatarContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  bountyTitle: {
    fontSize: 13,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  chatBountyTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
    paddingTop: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageWrapperLeft: {
    justifyContent: 'flex-start',
  },
  messageWrapperRight: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageSenderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  messageBubblePoster: {
    backgroundColor: '#10B981',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextRight: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageTimeRight: {
    color: '#E9D5FF',
  },
  payRequestContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  payRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  payRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  payRequestTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10B981',
    marginLeft: 8,
  },
  payRequestAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#111827',
    marginBottom: 8,
  },
  payRequestFrom: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  acceptedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  payRequestTime: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  payRequestIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  payRequestInputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payRequestInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payRequestInputTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  cancelText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  payRequestInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginRight: 4,
  },
  payRequestInput: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    paddingVertical: 12,
  },
  sendPayRequestButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendPayRequestButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendPayRequestButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  acceptOriginalPriceContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  acceptOriginalPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptOriginalPriceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
