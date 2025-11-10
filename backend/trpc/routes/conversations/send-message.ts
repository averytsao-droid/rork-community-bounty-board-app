import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, addDoc, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';

export const sendMessageProcedure = publicProcedure
  .input(
    z.object({
      conversationId: z.string(),
      content: z.string(),
      type: z.enum(['text', 'pay-request']).optional(),
      payRequest: z.object({
        amount: z.number(),
        status: z.enum(['pending', 'accepted', 'rejected']),
      }).optional(),
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

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;

      const messageData = {
        conversationId: input.conversationId,
        senderId: currentUser.uid,
        senderName: userData?.name || 'Unknown User',
        senderAvatar: userData?.avatar || 'https://ui-avatars.com/api/?name=Unknown',
        content: input.content,
        timestamp: Timestamp.now(),
        read: false,
        type: input.type || 'text',
        payRequest: input.payRequest,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      await updateDoc(doc(db, 'conversations', input.conversationId), {
        lastMessage: input.type === 'pay-request' 
          ? `Pay request: $${input.payRequest?.amount}` 
          : input.content,
        lastMessageTime: Timestamp.now(),
      });

      console.log('Message sent:', docRef.id);

      return {
        id: docRef.id,
        ...messageData,
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  });
