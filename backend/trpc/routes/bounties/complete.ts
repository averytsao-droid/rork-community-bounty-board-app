import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';

export const completeBountyProcedure = publicProcedure
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

      console.log('💰 Starting bounty completion process:', input.bountyId);

      const bountyRef = doc(db, 'bounties', input.bountyId);
      const bountyDoc = await getDoc(bountyRef);

      if (!bountyDoc.exists()) {
        throw new Error('Bounty not found');
      }

      const bountyData = bountyDoc.data();
      
      if (bountyData.postedBy !== currentUser.uid) {
        throw new Error('Only the poster can complete the bounty');
      }

      if (bountyData.status === 'completed') {
        throw new Error('Bounty is already completed');
      }

      const posterRef = doc(db, 'users', bountyData.postedBy);
      const posterDoc = await getDoc(posterRef);

      if (!posterDoc.exists()) {
        throw new Error('Poster not found');
      }

      const posterData = posterDoc.data();
      const posterCredits = posterData.credits || 0;

      if (posterCredits < bountyData.reward) {
        throw new Error('Insufficient credits to complete bounty');
      }

      await updateDoc(posterRef, {
        credits: posterCredits - bountyData.reward,
      });
      console.log('💳 Deducted', bountyData.reward, 'credits from poster');

      const acceptedHunters = bountyData.acceptedHunters || [];
      if (acceptedHunters.length > 0) {
        const rewardPerHunter = bountyData.reward / acceptedHunters.length;

        for (const hunterId of acceptedHunters) {
          const hunterRef = doc(db, 'users', hunterId);
          const hunterDoc = await getDoc(hunterRef);

          if (hunterDoc.exists()) {
            const hunterData = hunterDoc.data();
            const hunterCredits = hunterData.credits || 0;
            const hunterTotalEarned = hunterData.totalEarned || 0;
            const hunterBountiesCompleted = hunterData.bountiesCompleted || 0;

            await updateDoc(hunterRef, {
              credits: hunterCredits + rewardPerHunter,
              totalEarned: hunterTotalEarned + rewardPerHunter,
              bountiesCompleted: hunterBountiesCompleted + 1,
            });
            console.log('💰 Added', rewardPerHunter, 'credits to hunter:', hunterId);
          }
        }
      }

      await updateDoc(bountyRef, { 
        status: 'completed' 
      });
      console.log('✅ Bounty marked as completed');

      console.log('🗑️ Starting cleanup of related messages and conversations...');
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('bountyId', '==', input.bountyId));
      const snapshot = await getDocs(q);

      let deletedConversations = 0;
      let deletedMessages = 0;

      for (const convDoc of snapshot.docs) {
        const messagesRef = collection(db, 'messages');
        const msgQuery = query(messagesRef, where('conversationId', '==', convDoc.id));
        const msgSnapshot = await getDocs(msgQuery);

        for (const msgDoc of msgSnapshot.docs) {
          await deleteDoc(doc(db, 'messages', msgDoc.id));
          deletedMessages++;
        }

        await deleteDoc(doc(db, 'conversations', convDoc.id));
        deletedConversations++;
      }

      console.log('🗑️ Cleanup complete:');
      console.log('  - Deleted', deletedConversations, 'conversations');
      console.log('  - Deleted', deletedMessages, 'messages');
      console.log('✅ Bounty completion process finished successfully');

      return { 
        success: true,
        deletedConversations,
        deletedMessages,
      };
    } catch (error: any) {
      console.error('❌ Failed to complete bounty:', error);
      throw new Error(error.message || 'Failed to complete bounty');
    }
  });
