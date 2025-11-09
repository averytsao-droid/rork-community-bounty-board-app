import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const createBountyProcedure = publicProcedure
  .input(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string().nullable(),
      reward: z.number(),
      status: z.string(),
      duration: z.string(),
      tags: z.array(z.string()),
      huntersNeeded: z.number().optional(),
      acceptedHunters: z.array(z.string()).optional(),
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

      const bountyData = {
        title: input.title,
        description: input.description,
        category: input.category,
        reward: input.reward,
        status: input.status,
        duration: input.duration,
        tags: input.tags,
        huntersNeeded: input.huntersNeeded ?? 1,
        acceptedHunters: input.acceptedHunters ?? [],
        postedBy: currentUser.uid,
        createdAt: Timestamp.now(),
        applicants: 0,
      };

      const docRef = await addDoc(collection(db, 'bounties'), bountyData);
      
      console.log('Bounty created:', docRef.id);
      
      return {
        id: docRef.id,
        ...bountyData,
        createdAt: new Date(),
      };
    } catch (error: any) {
      console.error('Failed to create bounty:', error);
      throw new Error(error.message || 'Failed to create bounty');
    }
  });
