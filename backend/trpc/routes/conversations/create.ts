import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const createConversationProcedure = publicProcedure
  .input(
    z.object({
      type: z.enum(['direct', 'hunter-negotiation', 'poster-negotiation']),
      participantId: z.string().optional(),
      participantName: z.string().optional(),
      participantAvatar: z.string().optional(),
      participants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string(),
        role: z.enum(['hunter', 'poster']),
      })).optional(),
      bountyId: z.string(),
      bountyTitle: z.string(),
      originalReward: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const participantIds = input.participants 
        ? input.participants.map(p => p.id)
        : [currentUser.uid, input.participantId].filter(Boolean);

      const conversationData = {
        type: input.type,
        participantId: input.participantId,
        participantName: input.participantName,
        participantAvatar: input.participantAvatar,
        participants: input.participants,
        participantIds,
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        unreadCount: 0,
        bountyId: input.bountyId,
        bountyTitle: input.bountyTitle,
        originalReward: input.originalReward,
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);

      console.log('Conversation created:', docRef.id);

      return {
        id: docRef.id,
        ...conversationData,
        lastMessageTime: new Date(),
      };
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      throw new Error(error.message || 'Failed to create conversation');
    }
  });
