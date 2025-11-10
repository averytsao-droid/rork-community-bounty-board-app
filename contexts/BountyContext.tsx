import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bounty, Conversation, Message, Review } from '@/types';
import { mockBounties } from '@/mocks/bounties';
import { mockConversations, mockMessages } from '@/mocks/messages';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

const STORAGE_KEYS = {
  BOUNTIES: '@bounties',
  MY_BOUNTIES: '@my_bounties',
  APPLIED_BOUNTIES: '@applied_bounties',
  ACCEPTED_BOUNTIES: '@accepted_bounties',
  REVIEWS: '@reviews',
};

export const [BountyProvider, useBountyContext] = createContextHook(() => {
  const authContext = useAuth();
  const user = authContext.user ?? null;
  const addNotification = authContext.addNotification;
  
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [myPostedBounties, setMyPostedBounties] = useState<Bounty[]>([]);
  const [myAppliedBounties, setMyAppliedBounties] = useState<string[]>([]);
  const [acceptedBounties, setAcceptedBounties] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationsInitialized, setConversationsInitialized] = useState(false);

  const currentUser = useMemo(() => user ? {
    ...user,
    credits: user.credits ?? 1000,
    totalEarned: user.totalEarned ?? 0,
    bountiesPosted: user.bountiesPosted ?? 0,
    bountiesCompleted: user.bountiesCompleted ?? 0,
    rating: user.rating ?? 0,
  } : {
    id: 'guest',
    name: 'Guest',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: '',
    bountiesPosted: 0,
    bountiesCompleted: 0,
    totalEarned: 0,
    rating: 0,
    joinedDate: new Date(),
    credits: 1000,
  }, [user]);

  const bountiesQuery = trpc.bounties.list.useQuery(undefined, {
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  const myBountiesQuery = trpc.bounties.myBounties.useQuery(undefined, {
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const conversationsQuery = trpc.conversations.list.useQuery(undefined, {
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const createBountyMutation = trpc.bounties.create.useMutation({
    onSuccess: () => {
      bountiesQuery.refetch();
      myBountiesQuery.refetch();
    },
  });

  const acceptBountyMutation = trpc.bounties.accept.useMutation();
  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: () => {
      conversationsQuery.refetch();
    },
  });
  const sendMessageMutation = trpc.conversations.sendMessage.useMutation();

  useEffect(() => {
    if (bountiesQuery.data) {
      console.log('Setting bounties from backend:', bountiesQuery.data.length);
      setBounties(bountiesQuery.data as Bounty[]);
      setIsLoading(false);
    } else if (!user) {
      setIsLoading(false);
    }
  }, [bountiesQuery.data, user]);

  useEffect(() => {
    if (myBountiesQuery.data) {
      console.log('Setting my bounties from backend:', myBountiesQuery.data.length);
      setMyPostedBounties(myBountiesQuery.data as Bounty[]);
    }
  }, [myBountiesQuery.data]);

  useEffect(() => {
    if (conversationsQuery.data) {
      console.log('Setting conversations from backend:', conversationsQuery.data.length);
      setConversations(conversationsQuery.data as Conversation[]);
      setConversationsInitialized(true);
    } else if (!conversationsInitialized && !user) {
      setConversations(mockConversations);
      setMessages(mockMessages);
      setConversationsInitialized(true);
    }
  }, [conversationsQuery.data, conversationsInitialized, user]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedApplied, storedAccepted, storedReviews] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.APPLIED_BOUNTIES),
        AsyncStorage.getItem(STORAGE_KEYS.ACCEPTED_BOUNTIES),
        AsyncStorage.getItem(STORAGE_KEYS.REVIEWS),
      ]);

      if (storedApplied) {
        setMyAppliedBounties(JSON.parse(storedApplied));
      }

      if (storedAccepted) {
        setAcceptedBounties(JSON.parse(storedAccepted));
      }

      if (storedReviews) {
        const parsed = JSON.parse(storedReviews);
        setReviews(parsed.map((r: Review) => ({
          ...r,
          createdAt: new Date(r.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (
    newBounties?: Bounty[],
    newMyBounties?: Bounty[],
    newApplied?: string[],
    newAccepted?: string[]
  ) => {
    try {
      const promises = [];
      
      if (newBounties) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.BOUNTIES, JSON.stringify(newBounties))
        );
      }
      
      if (newMyBounties) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.MY_BOUNTIES, JSON.stringify(newMyBounties))
        );
      }
      
      if (newApplied) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.APPLIED_BOUNTIES, JSON.stringify(newApplied))
        );
      }
      
      if (newAccepted) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.ACCEPTED_BOUNTIES, JSON.stringify(newAccepted))
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addBounty = useCallback((bounty: Omit<Bounty, 'id' | 'postedBy' | 'postedByName' | 'postedByAvatar' | 'createdAt' | 'applicants'>) => {
    createBountyMutation.mutate({
      title: bounty.title,
      description: bounty.description,
      category: bounty.category,
      reward: bounty.reward,
      status: bounty.status,
      duration: bounty.duration,
      tags: bounty.tags,
      huntersNeeded: bounty.huntersNeeded,
      acceptedHunters: bounty.acceptedHunters,
    });
    
    console.log('Bounty creation requested');
  }, [createBountyMutation]);

  const addReview = useCallback(async (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updatedReviews));

    if (addNotification) {
      await addNotification({
        userId: review.revieweeId,
        type: 'review-received',
        title: 'New Review',
        message: `${review.reviewerName} left you a ${review.rating}-star review!`,
        relatedId: review.bountyId,
      });
    }

    console.log('Review added:', newReview);
  }, [reviews, addNotification]);

  const applyToBounty = useCallback(async (bountyId: string) => {
    if (myAppliedBounties.includes(bountyId)) {
      console.log('Already applied to this bounty');
      return;
    }

    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty) return;

    const updatedApplied = [...myAppliedBounties, bountyId];
    setMyAppliedBounties(updatedApplied);

    const updatedAccepted = [...acceptedBounties, bountyId];
    setAcceptedBounties(updatedAccepted);

    const updatedBounties = bounties.map(b =>
      b.id === bountyId ? { 
        ...b, 
        applicants: b.applicants + 1,
        acceptedHunters: [...(b.acceptedHunters || []), currentUser.id]
      } : b
    );
    setBounties(updatedBounties);

    try {
      await acceptBountyMutation.mutateAsync({ bountyId });

      const huntersNeeded = bounty.huntersNeeded || 1;
      const acceptedHunters = bounty.acceptedHunters || [];
      const allHunters = [...acceptedHunters, currentUser.id];

      const participants = [
        {
          id: bounty.postedBy,
          name: bounty.postedByName,
          avatar: bounty.postedByAvatar,
          role: 'poster' as const,
        },
        ...allHunters.map(hunterId => ({
          id: hunterId,
          name: hunterId === currentUser.id ? currentUser.name : 'Hunter',
          avatar: hunterId === currentUser.id ? currentUser.avatar : 'https://i.pravatar.cc/150',
          role: 'hunter' as const,
        })),
      ];

      const result = await createConversationMutation.mutateAsync({
        type: 'direct',
        participantId: bounty.postedBy,
        participantName: bounty.postedByName,
        participantAvatar: bounty.postedByAvatar,
        participants: huntersNeeded > 1 ? participants : undefined,
        bountyId: bounty.id,
        bountyTitle: bounty.title,
        originalReward: bounty.reward,
      });

      await sendMessageMutation.mutateAsync({
        conversationId: result.id,
        content: huntersNeeded > 1 
          ? `You accepted the bounty "${bounty.title}" for ${bounty.reward}. This bounty needs ${huntersNeeded} hunters. Good luck!`
          : `You accepted the bounty "${bounty.title}" for ${bounty.reward}. Good luck!`,
        type: 'text',
      });

      if (addNotification) {
        addNotification({
          userId: bounty.postedBy,
          type: 'bounty-accepted',
          title: 'Bounty Accepted!',
          message: `${currentUser.name} accepted your bounty: "${bounty.title}"`,
          relatedId: bountyId,
        });
      }

      await conversationsQuery.refetch();
      console.log('Applied to bounty:', bountyId, 'Hunters needed:', huntersNeeded);
    } catch (error) {
      console.error('Error accepting bounty:', error);
      setMyAppliedBounties(myAppliedBounties);
      setAcceptedBounties(acceptedBounties);
      setBounties(bounties);
    }

    saveData(updatedBounties, undefined, updatedApplied, updatedAccepted);
  }, [bounties, myAppliedBounties, acceptedBounties, currentUser, acceptBountyMutation, createConversationMutation, sendMessageMutation, conversationsQuery, addNotification]);

  const updateBountyStatus = useCallback((bountyId: string, status: Bounty['status']) => {
    const updatedBounties = bounties.map(b =>
      b.id === bountyId ? { ...b, status } : b
    );
    setBounties(updatedBounties);

    const updatedMyBounties = myPostedBounties.map(b =>
      b.id === bountyId ? { ...b, status } : b
    );
    setMyPostedBounties(updatedMyBounties);

    saveData(updatedBounties, updatedMyBounties);
    console.log('Bounty status updated:', bountyId, status);
  }, [bounties, myPostedBounties]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content,
      timestamp: new Date(),
      read: true,
      type: 'text',
    };

    const updatedMessages = {
      ...messages,
      [conversationId]: [...(messages[conversationId] || []), newMessage],
    };
    setMessages(updatedMessages);

    const updatedConversations = conversations.map(c =>
      c.id === conversationId
        ? { ...c, lastMessage: content, lastMessageTime: new Date() }
        : c
    );
    setConversations(updatedConversations);

    console.log('Message sent:', newMessage);
  }, [messages, conversations, currentUser]);

  const sendPayRequest = useCallback((conversationId: string, amount: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: '',
      timestamp: new Date(),
      read: true,
      type: 'pay-request',
      payRequest: {
        amount,
        status: 'pending',
      },
    };

    const updatedMessages = {
      ...messages,
      [conversationId]: [...(messages[conversationId] || []), newMessage],
    };
    setMessages(updatedMessages);

    const updatedConversations = conversations.map(c =>
      c.id === conversationId
        ? { ...c, lastMessage: `Pay request: ${amount}`, lastMessageTime: new Date() }
        : c
    );
    setConversations(updatedConversations);

    console.log('Pay request sent:', newMessage);
  }, [messages, conversations, currentUser]);

  const acceptPayRequest = useCallback((conversationId: string, messageId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const updatedMessages = {
      ...messages,
      [conversationId]: messages[conversationId].map(m =>
        m.id === messageId && m.payRequest
          ? {
              ...m,
              payRequest: {
                ...m.payRequest,
                status: 'accepted' as const,
                acceptedBy: currentUser.id,
              },
            }
          : m
      ),
    };
    setMessages(updatedMessages);

    const acceptedMessage = messages[conversationId].find(m => m.id === messageId);
    if (!acceptedMessage) return;

    const newDirectConvId = `conv-direct-${Date.now()}`;
    const otherParticipant = conversation.participants?.find(
      p => p.id === acceptedMessage.senderId
    );

    if (otherParticipant) {
      const newDirectConversation: Conversation = {
        id: newDirectConvId,
        type: 'direct',
        participantId: otherParticipant.id,
        participantName: otherParticipant.name,
        participantAvatar: otherParticipant.avatar,
        lastMessage: 'Pay request accepted! Let\'s get started.',
        lastMessageTime: new Date(),
        unreadCount: 0,
        bountyId: conversation.bountyId,
        bountyTitle: conversation.bountyTitle,
        originalReward: acceptedMessage.payRequest?.amount || conversation.originalReward,
      };

      const initialMessage: Message = {
        id: Date.now().toString(),
        conversationId: newDirectConvId,
        senderId: 'system',
        senderName: 'System',
        senderAvatar: '',
        content: `Pay request of $${acceptedMessage.payRequest?.amount} accepted! The bounty is now assigned.`,
        timestamp: new Date(),
        read: true,
        type: 'text',
      };

      setConversations(prev => [
        newDirectConversation,
        ...prev.filter(c => c.id !== conversationId),
      ]);

      setMessages(prev => ({
        ...prev,
        [newDirectConvId]: [initialMessage],
      }));

      console.log('Pay request accepted, created direct conversation:', newDirectConvId);
    }
  }, [conversations, messages, currentUser.id]);

  const markConversationAsRead = useCallback((conversationId: string) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    setConversations(updatedConversations);

    if (messages[conversationId]) {
      const updatedMessages = {
        ...messages,
        [conversationId]: messages[conversationId].map(m => ({ ...m, read: true })),
      };
      setMessages(updatedMessages);
    }
  }, [conversations, messages]);

  const startNegotiation = useCallback((bountyId: string) => {
    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty) return;

    const existingNegotiation = conversations.find(
      c => c.bountyId === bountyId && c.type === 'hunter-negotiation'
    );

    if (existingNegotiation) {
      console.log('Already negotiating this bounty');
      return;
    }

    const newNegotiationConvId = `conv-negotiation-${Date.now()}`;
    const newNegotiationConversation: Conversation = {
      id: newNegotiationConvId,
      type: 'hunter-negotiation',
      participants: [
        {
          id: bounty.postedBy,
          name: bounty.postedByName,
          avatar: bounty.postedByAvatar,
          role: 'poster',
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: 'hunter',
        },
      ],
      lastMessage: 'Started negotiation',
      lastMessageTime: new Date(),
      unreadCount: 0,
      bountyId: bounty.id,
      bountyTitle: bounty.title,
      originalReward: bounty.reward,
    };

    const initialMessage: Message = {
      id: Date.now().toString(),
      conversationId: newNegotiationConvId,
      senderId: 'system',
      senderName: 'System',
      senderAvatar: '',
      content: `Negotiation started for "${bounty.title}". Original offer: ${bounty.reward}`,
      timestamp: new Date(),
      read: true,
      type: 'text',
    };

    setConversations(prev => [newNegotiationConversation, ...prev]);
    setMessages(prev => ({
      ...prev,
      [newNegotiationConvId]: [initialMessage],
    }));

    console.log('Started negotiation for bounty:', bountyId);
  }, [bounties, conversations, currentUser]);

  const cancelBounty = useCallback((bountyId: string) => {
    const updatedAccepted = acceptedBounties.filter(id => id !== bountyId);
    setAcceptedBounties(updatedAccepted);

    const updatedApplied = myAppliedBounties.filter(id => id !== bountyId);
    setMyAppliedBounties(updatedApplied);

    const directConv = conversations.find(
      c => c.bountyId === bountyId && c.type === 'direct'
    );
    if (directConv) {
      setConversations(prev => prev.filter(c => c.id !== directConv.id));
    }

    saveData(undefined, undefined, updatedApplied, updatedAccepted);
    console.log('Bounty cancelled:', bountyId);
  }, [acceptedBounties, myAppliedBounties, conversations]);

  const deleteBounty = useCallback((bountyId: string) => {
    const updatedBounties = bounties.filter(b => b.id !== bountyId);
    setBounties(updatedBounties);

    const updatedMyBounties = myPostedBounties.filter(b => b.id !== bountyId);
    setMyPostedBounties(updatedMyBounties);

    const updatedAccepted = acceptedBounties.filter(id => id !== bountyId);
    setAcceptedBounties(updatedAccepted);

    const updatedApplied = myAppliedBounties.filter(id => id !== bountyId);
    setMyAppliedBounties(updatedApplied);

    const relatedConvs = conversations.filter(c => c.bountyId === bountyId);
    if (relatedConvs.length > 0) {
      setConversations(prev => prev.filter(c => c.bountyId !== bountyId));
    }

    saveData(updatedBounties, updatedMyBounties, updatedApplied, updatedAccepted);
    console.log('Bounty deleted:', bountyId);
  }, [bounties, myPostedBounties, acceptedBounties, myAppliedBounties, conversations]);

  return useMemo(() => ({
    bounties,
    myPostedBounties,
    myAppliedBounties,
    acceptedBounties,
    conversations,
    messages,
    reviews,
    isLoading: isLoading || (user ? (bountiesQuery.isLoading && !bountiesQuery.data) : false),
    addBounty,
    applyToBounty,
    updateBountyStatus,
    sendMessage,
    sendPayRequest,
    acceptPayRequest,
    markConversationAsRead,
    startNegotiation,
    cancelBounty,
    deleteBounty,
    addReview,
    currentUser,
    setConversations,
    setMessages,
  }), [
    bounties,
    myPostedBounties,
    myAppliedBounties,
    acceptedBounties,
    conversations,
    messages,
    reviews,
    isLoading,
    user,
    bountiesQuery.isLoading,
    bountiesQuery.data,
    currentUser,
    addBounty,
    applyToBounty,
    updateBountyStatus,
    sendMessage,
    sendPayRequest,
    acceptPayRequest,
    markConversationAsRead,
    startNegotiation,
    cancelBounty,
    deleteBounty,
    addReview,
  ]);
});

export const useFilteredBounties = (
  searchQuery: string,
  selectedCategory: string | null,
  selectedDuration: string | null,
  sortBy: 'newest' | 'reward-high' | 'reward-low'
) => {
  const { bounties, acceptedBounties } = useBountyContext();

  let filtered = bounties.filter(b => {
    const isAccepted = acceptedBounties.includes(b.id);
    const isCompleted = b.status === 'completed';
    const isInProgress = b.status === 'in-progress';
    const isCancelled = b.status === 'cancelled';
    
    const matchesSearch = 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || b.category === selectedCategory;
    const matchesDuration = !selectedDuration || b.duration === selectedDuration;
    
    return !isAccepted && !isCompleted && !isInProgress && !isCancelled && matchesSearch && matchesCategory && matchesDuration;
  });

  console.log('Filtered bounties:', filtered.length, 'Total bounties:', bounties.length);
  console.log('Excluded - Accepted:', acceptedBounties.length, 'Completed:', bounties.filter(b => b.status === 'completed').length, 'In Progress:', bounties.filter(b => b.status === 'in-progress').length, 'Cancelled:', bounties.filter(b => b.status === 'cancelled').length);

  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'reward-high':
        return b.reward - a.reward;
      case 'reward-low':
        return a.reward - b.reward;
      default:
        return 0;
    }
  });

  return filtered;
};
