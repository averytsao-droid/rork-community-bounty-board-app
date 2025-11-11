import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { doc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const deleteBountyProcedure = publicProcedure
  .input(z.object({
    bountyId: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const bountyRef = doc(db, 'bounties', input.bountyId);
      const bountyDoc = await getDoc(bountyRef);

      if (!bountyDoc.exists()) {
        throw new Error('Bounty not found');
      }

      const bountyData = bountyDoc.data();
      if (bountyData.postedBy !== currentUser.uid) {
        throw new Error('You can only delete your own bounties');
      }

      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('bountyId', '==', input.bountyId));
      const conversationSnapshot = await getDocs(q);

      for (const convDoc of conversationSnapshot.docs) {
        await deleteDoc(doc(db, 'conversations', convDoc.id));
        console.log('Deleted conversation:', convDoc.id);
      }

      await deleteDoc(bountyRef);

      console.log('Bounty deleted successfully:', input.bountyId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete bounty:', error);
      throw new Error(error.message || 'Failed to delete bounty');
    }
  });
