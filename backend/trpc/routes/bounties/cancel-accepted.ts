import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { doc, updateDoc, arrayRemove, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const cancelAcceptedBountyProcedure = publicProcedure
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

      await updateDoc(bountyRef, {
        acceptedHunters: arrayRemove(currentUser.uid),
        applicants: Math.max(0, (bountyDoc.data()?.applicants || 1) - 1),
      });

      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('bountyId', '==', input.bountyId),
        where('participantIds', 'array-contains', currentUser.uid)
      );
      const conversationSnapshot = await getDocs(q);

      for (const convDoc of conversationSnapshot.docs) {
        const convData = convDoc.data();
        if (convData.type === 'direct' && convData.participantIds?.length === 2) {
          await deleteDoc(doc(db, 'conversations', convDoc.id));
          console.log('Deleted conversation:', convDoc.id);
        }
      }

      console.log('Bounty cancelled successfully:', input.bountyId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to cancel accepted bounty:', error);
      throw new Error(error.message || 'Failed to cancel accepted bounty');
    }
  });
