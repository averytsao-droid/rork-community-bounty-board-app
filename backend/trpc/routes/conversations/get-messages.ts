import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export const getMessagesProcedure = publicProcedure
  .input(z.object({
    conversationId: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return [];
      }

      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', input.conversationId),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);

      const messages = querySnapshot.docs.map((msgDoc) => {
        const msgData = msgDoc.data();
        return {
          id: msgDoc.id,
          conversationId: msgData.conversationId,
          senderId: msgData.senderId,
          senderName: msgData.senderName,
          senderAvatar: msgData.senderAvatar,
          content: msgData.content || '',
          timestamp: msgData.timestamp?.toDate() || new Date(),
          read: msgData.read || false,
          type: msgData.type || 'text',
          payRequest: msgData.payRequest,
        };
      });

      console.log('Listed messages for conversation:', input.conversationId, messages.length);
      return messages;
    } catch (error: any) {
      console.error('Failed to get messages:', error);
      throw new Error(error.message || 'Failed to get messages');
    }
  });
