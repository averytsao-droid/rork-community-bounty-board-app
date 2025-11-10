import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';

export const acceptBountyProcedure = publicProcedure
  .input(
    z.object({
      bountyId: z.string(),
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

      const bountyRef = doc(db, 'bounties', input.bountyId);
      const bountyDoc = await getDoc(bountyRef);
      
      if (!bountyDoc.exists()) {
        throw new Error('Bounty not found');
      }

      const bountyData = bountyDoc.data();
      const acceptedHunters = bountyData.acceptedHunters || [];
      
      if (acceptedHunters.includes(currentUser.uid)) {
        throw new Error('Already accepted this bounty');
      }

      await updateDoc(bountyRef, {
        acceptedHunters: arrayUnion(currentUser.uid),
        applicants: increment(1),
      });

      console.log('Bounty accepted:', input.bountyId);

      return { success: true };
    } catch (error: any) {
      console.error('Failed to accept bounty:', error);
      throw new Error(error.message || 'Failed to accept bounty');
    }
  });
