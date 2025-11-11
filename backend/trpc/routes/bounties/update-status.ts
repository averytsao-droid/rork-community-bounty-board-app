import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const updateBountyStatusProcedure = publicProcedure
  .input(z.object({
    bountyId: z.string(),
    status: z.enum(['open', 'in-progress', 'completed', 'cancelled']),
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
        throw new Error('You can only update your own bounties');
      }

      await updateDoc(bountyRef, {
        status: input.status,
      });

      console.log('Bounty status updated successfully:', input.bountyId, input.status);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to update bounty status:', error);
      throw new Error(error.message || 'Failed to update bounty status');
    }
  });
