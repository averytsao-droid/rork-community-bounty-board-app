import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bounty, Conversation, Message, Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  arrayRemove
} from 'firebase/firestore';

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
  const [acceptedBountiesList, setAcceptedBountiesList] = useState<Bounty[]>([]);
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

  const loadBounties = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirebaseFirestore();
      const bountiesRef = collection(db, 'bounties');
      const q = query(bountiesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loadedBounties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Bounty[];
      console.log('Loaded bounties from Firebase:', loadedBounties.length);
      setBounties(loadedBounties);
    } catch (error) {
      console.error('Error loading bounties:', error);
    }
  }, [user]);

  const loadMyBounties = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirebaseFirestore();
      const bountiesRef = collection(db, 'bounties');
      const q = query(bountiesRef, where('postedBy', '==', user.id), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loadedBounties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Bounty[];
      console.log('Loaded my bounties from Firebase:', loadedBounties.length);
      setMyPostedBounties(loadedBounties);
    } catch (error) {
      console.error('Error loading my bounties:', error);
    }
  }, [user]);

  const loadAcceptedBounties = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirebaseFirestore();
      const bountiesRef = collection(db, 'bounties');
      const q = query(bountiesRef, where('acceptedHunters', 'array-contains', user.id));
      const snapshot = await getDocs(q);
      const loadedBounties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Bounty[];
      console.log('Loaded accepted bounties from Firebase:', loadedBounties.length);
      setAcceptedBountiesList(loadedBounties);
      setAcceptedBounties(loadedBounties.map(b => b.id));
      setMyAppliedBounties(loadedBounties.map(b => b.id));
    } catch (error) {
      console.error('Error loading accepted bounties:', error);
    }
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirebaseFirestore();
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participantIds', 'array-contains', user.id),
        orderBy('lastMessageTime', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedConversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastMessageTime: doc.data().lastMessageTime?.toDate() || new Date(),
      })) as Conversation[];
      console.log('Loaded conversations from Firebase:', loadedConversations.length);
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user]);

  const loadMessagesForConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      const db = getFirebaseFirestore();
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
      console.log('Loaded messages from Firebase:', conversationId, loadedMessages.length);
      setMessages(prev => ({
        ...prev,
        [conversationId]: loadedMessages,
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        loadBounties(),
        loadMyBounties(),
        loadAcceptedBounties(),
        loadConversations(),
      ]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user, loadBounties, loadMyBounties, loadAcceptedBounties, loadConversations]);

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

  const addBounty = useCallback(async (bounty: Omit<Bounty, 'id' | 'postedBy' | 'postedByName' | 'postedByAvatar' | 'createdAt' | 'applicants'>) => {
    console.log('============================================');
    console.log('addBounty() CALLED FROM CONTEXT');
    console.log('============================================');
    console.log('Bounty data to create:', bounty);
    
    if (!user) {
      throw new Error('Must be logged in to create a bounty');
    }
    
    try {
      const db = getFirebaseFirestore();
      const bountiesRef = collection(db, 'bounties');
      
      const bountyData = {
        ...bounty,
        postedBy: user.id,
        postedByName: user.name,
        postedByAvatar: user.avatar,
        createdAt: Timestamp.now(),
        applicants: 0,
      };
      
      console.log('Creating bounty in Firebase:', bountyData);
      const docRef = await addDoc(bountiesRef, bountyData);
      console.log('✓ Bounty created with ID:', docRef.id);
      
      await loadBounties();
      await loadMyBounties();
      
      console.log('============================================');
    } catch (error: any) {
      console.log('============================================');
      console.log('✗ ERROR in addBounty()');
      console.log('============================================');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      throw error;
    }
  }, [user, loadBounties, loadMyBounties]);

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
    if (acceptedBounties.includes(bountyId)) {
      console.log('Already accepted this bounty');
      return;
    }

    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty) {
      console.error('Bounty not found:', bountyId);
      return;
    }

    try {
      console.log('✅ ACCEPTING BOUNTY AT ORIGINAL PRICE:', bountyId);
      const db = getFirebaseFirestore();
      
      const bountyRef = doc(db, 'bounties', bountyId);
      await updateDoc(bountyRef, {
        acceptedHunters: arrayUnion(currentUser.id),
        applicants: (bounty.applicants || 0) + 1,
      });
      console.log('✅ Bounty updated with acceptedHunters');

      const huntersNeeded = bounty.huntersNeeded || 1;
      const acceptedHunters = bounty.acceptedHunters || [];
      const allHunters = [...acceptedHunters, currentUser.id];

      let participants;
      if (huntersNeeded > 1) {
        participants = [
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
      }

      const conversationData: any = {
        type: 'direct' as const,
        participantId: bounty.postedBy,
        participantName: bounty.postedByName,
        participantAvatar: bounty.postedByAvatar,
        participantIds: [currentUser.id, bounty.postedBy],
        bountyId: bounty.id,
        bountyTitle: bounty.title,
        originalReward: bounty.reward,
        lastMessage: huntersNeeded > 1 
          ? `You accepted the bounty "${bounty.title}" for ${bounty.reward}. This bounty needs ${huntersNeeded} hunters. Good luck!`
          : `You accepted the bounty "${bounty.title}" for ${bounty.reward}. Good luck!`,
        lastMessageTime: Timestamp.now(),
        unreadCount: 0,
      };
      
      if (participants) {
        conversationData.participants = participants;
      }

      const conversationsRef = collection(db, 'conversations');
      const conversationDoc = await addDoc(conversationsRef, conversationData);
      console.log('✅ Created direct conversation:', conversationDoc.id);

      if (addNotification) {
        addNotification({
          userId: bounty.postedBy,
          type: 'bounty-accepted',
          title: 'Bounty Accepted!',
          message: `${currentUser.name} accepted your bounty: "${bounty.title}"`,
          relatedId: bountyId,
        });
      }

      await loadBounties();
      await loadAcceptedBounties();
      await loadConversations();
      console.log('✅ Bounty accepted and direct chat created');
    } catch (error) {
      console.error('❌ Error accepting bounty:', error);
      throw error;
    }
  }, [bounties, acceptedBounties, currentUser, addNotification, loadBounties, loadAcceptedBounties, loadConversations]);

  const updateBountyStatus = useCallback(async (bountyId: string, status: Bounty['status']) => {
    try {
      console.log('Updating bounty status:', bountyId, status);
      
      const db = getFirebaseFirestore();
      const bountyRef = doc(db, 'bounties', bountyId);
      await updateDoc(bountyRef, { status });
      
      await Promise.all([
        loadBounties(),
        loadMyBounties(),
      ]);
      
      console.log('Bounty status updated successfully:', bountyId, status);
    } catch (error) {
      console.error('Error updating bounty status:', error);
      throw error;
    }
  }, [loadBounties, loadMyBounties]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      const db = getFirebaseFirestore();
      
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationExists = conversations.find(c => c.id === conversationId);
      
      if (!conversationExists) {
        console.error('Conversation does not exist:', conversationId);
        throw new Error(`Conversation ${conversationId} not found. Please ensure the conversation is created before sending messages.`);
      }
      
      const messageData = {
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content,
        timestamp: Timestamp.now(),
        read: false,
        type: 'text',
      };

      console.log('Sending message to conversation:', conversationId);
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('Message document created:', docRef.id);

      await updateDoc(conversationRef, {
        lastMessage: content,
        lastMessageTime: Timestamp.now(),
      });
      console.log('Conversation updated with last message');

      const newMessage: Message = {
        id: docRef.id,
        ...messageData,
        timestamp: new Date(),
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

      console.log('✅ Message sent successfully:', docRef.id);
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', error?.message);
      throw error;
    }
  }, [messages, conversations, currentUser]);

  const sendPayRequest = useCallback(async (conversationId: string, amount: number) => {
    try {
      const db = getFirebaseFirestore();
      
      const messageData = {
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content: '',
        timestamp: Timestamp.now(),
        read: false,
        type: 'pay-request',
        payRequest: {
          amount,
          status: 'pending',
        },
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: `Pay request: ${amount}`,
        lastMessageTime: Timestamp.now(),
      });

      const newMessage: Message = {
        id: docRef.id,
        ...messageData,
        timestamp: new Date(),
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

      console.log('Pay request sent to Firebase:', docRef.id);
    } catch (error) {
      console.error('Error sending pay request:', error);
      throw error;
    }
  }, [messages, conversations, currentUser]);

  const acceptPayRequest = useCallback(async (conversationId: string, messageId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const acceptedMessage = messages[conversationId]?.find(m => m.id === messageId);
    if (!acceptedMessage || !acceptedMessage.payRequest) return;

    try {
      const db = getFirebaseFirestore();

      console.log('💸 Accepting pay request:', messageId, 'Amount:', acceptedMessage.payRequest.amount);

      await updateDoc(doc(db, 'messages', messageId), {
        'payRequest.status': 'accepted',
        'payRequest.acceptedBy': currentUser.id,
      });

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

      const otherParticipant = conversation.participants?.find(
        p => p.id === acceptedMessage.senderId
      );

      if (otherParticipant) {
        console.log('📝 Creating direct conversation with:', otherParticipant.name);
        
        const existingDirectConv = conversations.find(
          c => c.type === 'direct' &&
          c.participantIds?.includes(otherParticipant.id) &&
          c.participantIds?.includes(currentUser.id) &&
          c.bountyId === conversation.bountyId
        );

        if (existingDirectConv) {
          console.log('✅ Direct conversation already exists:', existingDirectConv.id);
        } else {
          const newDirectConversationData = {
            type: 'direct',
            participantId: otherParticipant.id,
            participantName: otherParticipant.name,
            participantAvatar: otherParticipant.avatar,
            participantIds: [currentUser.id, otherParticipant.id],
            lastMessage: 'Pay request accepted! Let\'s get started.',
            lastMessageTime: Timestamp.now(),
            unreadCount: 0,
            bountyId: conversation.bountyId,
            bountyTitle: conversation.bountyTitle,
            originalReward: acceptedMessage.payRequest.amount || conversation.originalReward,
          };

          const newConvRef = await addDoc(collection(db, 'conversations'), newDirectConversationData);
          console.log('✅ Direct conversation created:', newConvRef.id);

          const initialMessageData = {
            conversationId: newConvRef.id,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '',
            content: `Pay request of ${acceptedMessage.payRequest.amount} accepted! The bounty is now assigned.`,
            timestamp: Timestamp.now(),
            read: true,
            type: 'text',
          };

          await addDoc(collection(db, 'messages'), initialMessageData);
          console.log('✅ Initial message created');

          setMessages(prev => ({
            ...prev,
            [newConvRef.id]: [{
              id: Date.now().toString(),
              ...initialMessageData,
              timestamp: new Date(),
            }],
          }));
        }

        console.log('🗑️ Deleting negotiation conversations for bounty:', conversation.bountyId);
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('bountyId', '==', conversation.bountyId),
          where('participantIds', 'array-contains', currentUser.id)
        );
        const snapshot = await getDocs(q);
        
        for (const convDoc of snapshot.docs) {
          const conv = convDoc.data();
          if (conv.type === 'hunter-negotiation' || conv.type === 'poster-negotiation') {
            console.log('🗑️ Deleting conversation:', convDoc.id, 'Type:', conv.type);
            await deleteDoc(doc(db, 'conversations', convDoc.id));
            
            const messagesRef = collection(db, 'messages');
            const msgQuery = query(messagesRef, where('conversationId', '==', convDoc.id));
            const msgSnapshot = await getDocs(msgQuery);
            for (const msgDoc of msgSnapshot.docs) {
              await deleteDoc(doc(db, 'messages', msgDoc.id));
            }
          }
        }

        await loadConversations();
        console.log('✅ Pay request accepted and negotiation conversations deleted');
      }
    } catch (error) {
      console.error('❌ Error accepting pay request:', error);
      throw error;
    }
  }, [conversations, messages, currentUser, loadConversations]);

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

  const startNegotiation = useCallback(async (bountyId: string) => {
    const bounty = bounties.find(b => b.id === bountyId);
    if (!bounty) return;

    const existingNegotiation = conversations.find(
      c => c.bountyId === bountyId && c.type === 'hunter-negotiation' && c.participantIds?.includes(currentUser.id)
    );

    if (existingNegotiation) {
      console.log('💬 Already negotiating this bounty, returning existing conversation');
      return;
    }

    try {
      const db = getFirebaseFirestore();

      const participants = [
        {
          id: bounty.postedBy,
          name: bounty.postedByName,
          avatar: bounty.postedByAvatar,
          role: 'poster' as const,
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: 'hunter' as const,
        },
      ];

      const hunterNegotiationData = {
        type: 'hunter-negotiation',
        participants,
        participantIds: [bounty.postedBy, currentUser.id],
        lastMessage: 'Started negotiation',
        lastMessageTime: Timestamp.now(),
        unreadCount: 0,
        bountyId: bounty.id,
        bountyTitle: bounty.title,
        originalReward: bounty.reward,
      };

      const conversationsRef = collection(db, 'conversations');
      const hunterConversationDoc = await addDoc(conversationsRef, hunterNegotiationData);
      console.log('💬 Created hunter-negotiation conversation:', hunterConversationDoc.id);

      const hunterInitialMessageData = {
        conversationId: hunterConversationDoc.id,
        senderId: 'system',
        senderName: 'System',
        senderAvatar: '',
        content: `Negotiation started for "${bounty.title}". Original offer: ${bounty.reward}`,
        timestamp: Timestamp.now(),
        read: true,
        type: 'text',
      };

      await addDoc(collection(db, 'messages'), hunterInitialMessageData);
      console.log('💬 Created initial message in hunter conversation');

      const existingPosterNegotiation = conversations.find(
        c => c.bountyId === bountyId && c.type === 'poster-negotiation'
      );

      if (!existingPosterNegotiation) {
        const posterNegotiationData = {
          type: 'poster-negotiation',
          participants,
          participantIds: [bounty.postedBy, currentUser.id],
          lastMessage: 'Negotiation started',
          lastMessageTime: Timestamp.now(),
          unreadCount: 1,
          bountyId: bounty.id,
          bountyTitle: bounty.title,
          originalReward: bounty.reward,
        };

        const posterConversationDoc = await addDoc(conversationsRef, posterNegotiationData);
        console.log('💬 Created poster-negotiation conversation:', posterConversationDoc.id);

        const posterInitialMessageData = {
          conversationId: posterConversationDoc.id,
          senderId: 'system',
          senderName: 'System',
          senderAvatar: '',
          content: `${currentUser.name} wants to negotiate on "${bounty.title}". Original offer: ${bounty.reward}`,
          timestamp: Timestamp.now(),
          read: false,
          type: 'text',
        };

        await addDoc(collection(db, 'messages'), posterInitialMessageData);
        console.log('💬 Created initial message in poster conversation');
      }

      await loadConversations();
      await loadMessagesForConversation(hunterConversationDoc.id);

      if (addNotification) {
        addNotification({
          userId: bounty.postedBy,
          type: 'negotiation-started',
          title: 'Negotiation Started',
          message: `${currentUser.name} wants to negotiate on your bounty: "${bounty.title}"`,
          relatedId: bountyId,
        });
      }

      console.log('✅ Started negotiation for bounty:', bountyId);
    } catch (error) {
      console.error('❌ Error starting negotiation:', error);
      throw error;
    }
  }, [bounties, conversations, currentUser, addNotification, loadConversations, loadMessagesForConversation]);

  const cancelBounty = useCallback(async (bountyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Cancelling accepted bounty:', bountyId);
      
      const db = getFirebaseFirestore();
      const bountyRef = doc(db, 'bounties', bountyId);
      
      await updateDoc(bountyRef, {
        acceptedHunters: arrayRemove(user.id),
        applicants: (bounties.find(b => b.id === bountyId)?.applicants || 1) - 1,
      });
      
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('bountyId', '==', bountyId), where('participantIds', 'array-contains', user.id));
      const snapshot = await getDocs(q);
      
      for (const conversationDoc of snapshot.docs) {
        await deleteDoc(doc(db, 'conversations', conversationDoc.id));
        
        const messagesRef = collection(db, 'messages');
        const msgQuery = query(messagesRef, where('conversationId', '==', conversationDoc.id));
        const msgSnapshot = await getDocs(msgQuery);
        for (const msgDoc of msgSnapshot.docs) {
          await deleteDoc(doc(db, 'messages', msgDoc.id));
        }
      }
      
      await Promise.all([
        loadBounties(),
        loadAcceptedBounties(),
        loadConversations(),
      ]);
      
      console.log('Bounty cancelled successfully:', bountyId);
    } catch (error) {
      console.error('Error cancelling bounty:', error);
      throw error;
    }
  }, [user, bounties, loadBounties, loadAcceptedBounties, loadConversations]);

  const deleteBounty = useCallback(async (bountyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Deleting bounty:', bountyId);
      
      const db = getFirebaseFirestore();
      
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('bountyId', '==', bountyId));
      const snapshot = await getDocs(q);
      
      for (const conversationDoc of snapshot.docs) {
        const messagesRef = collection(db, 'messages');
        const msgQuery = query(messagesRef, where('conversationId', '==', conversationDoc.id));
        const msgSnapshot = await getDocs(msgQuery);
        for (const msgDoc of msgSnapshot.docs) {
          await deleteDoc(doc(db, 'messages', msgDoc.id));
        }
        await deleteDoc(doc(db, 'conversations', conversationDoc.id));
      }
      
      await deleteDoc(doc(db, 'bounties', bountyId));
      
      await Promise.all([
        loadBounties(),
        loadMyBounties(),
        loadAcceptedBounties(),
        loadConversations(),
      ]);
      
      console.log('Bounty deleted successfully:', bountyId);
    } catch (error) {
      console.error('Error deleting bounty:', error);
      throw error;
    }
  }, [user, loadBounties, loadMyBounties, loadAcceptedBounties, loadConversations]);

  const createDirectConversation = useCallback(async (
    otherUserId: string, 
    otherUserName: string, 
    otherUserAvatar: string, 
    bountyId?: string, 
    bountyTitle?: string,
    originalReward?: number,
    negotiationConversationId?: string
  ) => {
    try {
      const db = getFirebaseFirestore();
      
      const existingConversation = conversations.find(
        c => c.type === 'direct' && 
        c.participantIds?.includes(otherUserId) && 
        c.participantIds?.includes(currentUser.id) &&
        (!bountyId || c.bountyId === bountyId)
      );
      
      if (existingConversation) {
        console.log('✅ Direct conversation already exists:', existingConversation.id);
        
        if (negotiationConversationId && bountyId) {
          console.log('🗑️ Deleting ALL negotiation conversations for bounty:', bountyId);
          const conversationsRef = collection(db, 'conversations');
          const q = query(
            conversationsRef,
            where('bountyId', '==', bountyId)
          );
          const snapshot = await getDocs(q);
          
          for (const convDoc of snapshot.docs) {
            const conv = convDoc.data();
            if (conv.type === 'hunter-negotiation' || conv.type === 'poster-negotiation') {
              console.log('🗑️ Deleting conversation:', convDoc.id, 'Type:', conv.type);
              await deleteDoc(doc(db, 'conversations', convDoc.id));
              
              const messagesRef = collection(db, 'messages');
              const msgQuery = query(messagesRef, where('conversationId', '==', convDoc.id));
              const msgSnapshot = await getDocs(msgQuery);
              for (const msgDoc of msgSnapshot.docs) {
                await deleteDoc(doc(db, 'messages', msgDoc.id));
              }
            }
          }
          
          if (bountyId) {
            const bountyRef = doc(db, 'bounties', bountyId);
            await updateDoc(bountyRef, {
              acceptedHunters: arrayUnion(currentUser.id),
            });
            console.log('✅ Added hunter to acceptedHunters');
          }
          
          await loadConversations();
          await loadBounties();
          await loadAcceptedBounties();
        }
        
        return existingConversation.id;
      }
      
      console.log('📝 Creating new direct conversation');
      const conversationData = {
        type: 'direct' as const,
        participantId: otherUserId,
        participantName: otherUserName,
        participantAvatar: otherUserAvatar,
        participantIds: [currentUser.id, otherUserId],
        bountyId: bountyId || null,
        bountyTitle: bountyTitle || null,
        originalReward: originalReward || 0,
        lastMessage: 'Bounty accepted at original price!',
        lastMessageTime: Timestamp.now(),
        unreadCount: 0,
      };
      
      const conversationsRef = collection(db, 'conversations');
      const conversationDoc = await addDoc(conversationsRef, conversationData);
      console.log('✅ Direct conversation created:', conversationDoc.id);
      
      const initialMessageData = {
        conversationId: conversationDoc.id,
        senderId: 'system',
        senderName: 'System',
        senderAvatar: '',
        content: `Bounty accepted at original price of ${originalReward}! The job is now assigned.`,
        timestamp: Timestamp.now(),
        read: true,
        type: 'text',
      };
      
      await addDoc(collection(db, 'messages'), initialMessageData);
      console.log('✅ Initial message created');
      
      if (negotiationConversationId && bountyId) {
        console.log('🗑️ Deleting ALL negotiation conversations for bounty:', bountyId);
        const q = query(
          conversationsRef,
          where('bountyId', '==', bountyId)
        );
        const snapshot = await getDocs(q);
        
        for (const convDoc of snapshot.docs) {
          const conv = convDoc.data();
          if (conv.type === 'hunter-negotiation' || conv.type === 'poster-negotiation') {
            console.log('🗑️ Deleting conversation:', convDoc.id, 'Type:', conv.type);
            await deleteDoc(doc(db, 'conversations', convDoc.id));
            
            const messagesRef = collection(db, 'messages');
            const msgQuery = query(messagesRef, where('conversationId', '==', convDoc.id));
            const msgSnapshot = await getDocs(msgQuery);
            for (const msgDoc of msgSnapshot.docs) {
              await deleteDoc(doc(db, 'messages', msgDoc.id));
            }
          }
        }
        
        const bountyRef = doc(db, 'bounties', bountyId);
        await updateDoc(bountyRef, {
          acceptedHunters: arrayUnion(currentUser.id),
        });
        console.log('✅ Added hunter to acceptedHunters');
      }
      
      await loadConversations();
      await loadBounties();
      await loadAcceptedBounties();
      
      return conversationDoc.id;
    } catch (error: any) {
      console.error('❌ Error creating direct conversation:', error);
      console.error('Error details:', error?.message);
      throw error;
    }
  }, [conversations, currentUser, loadConversations, loadBounties, loadAcceptedBounties]);

  return useMemo(() => ({
    bounties,
    myPostedBounties,
    acceptedBountiesList,
    myAppliedBounties,
    acceptedBounties,
    conversations,
    messages,
    reviews,
    isLoading: isLoading,
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
    loadMessagesForConversation,
    createDirectConversation,
  }), [
    bounties,
    myPostedBounties,
    acceptedBountiesList,
    myAppliedBounties,
    acceptedBounties,
    conversations,
    messages,
    reviews,
    isLoading,
    user,
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
    loadMessagesForConversation,
    createDirectConversation,
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
