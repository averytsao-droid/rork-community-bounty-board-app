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
    console.log('============================================');
    console.log('CREATE BOUNTY MUTATION CALLED');
    console.log('============================================');
    console.log('Input data:', JSON.stringify(input, null, 2));
    
    try {
      console.log('[Step 1] Getting Firebase Auth...');
      const auth = getFirebaseAuth();
      console.log('[Step 1] ✓ Firebase Auth obtained');
      
      console.log('[Step 2] Getting Firestore...');
      const db = getFirebaseFirestore();
      console.log('[Step 2] ✓ Firestore obtained');
      
      console.log('[Step 3] Checking current user...');
      const currentUser = auth.currentUser;
      console.log('[Step 3] Current user:', currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      } : 'NO USER LOGGED IN');

      if (!currentUser) {
        console.log('[Step 3] ✗ ERROR: No authenticated user!');
        throw new Error('User must be authenticated');
      }
      console.log('[Step 3] ✓ User authenticated');

      console.log('[Step 4] Preparing bounty data...');
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
      console.log('[Step 4] ✓ Bounty data prepared:', JSON.stringify(bountyData, null, 2));

      console.log('[Step 5] Getting bounties collection reference...');
      const bountiesCollection = collection(db, 'bounties');
      console.log('[Step 5] ✓ Collection reference obtained');

      console.log('[Step 6] Writing to Firestore...');
      const docRef = await addDoc(bountiesCollection, bountyData);
      console.log('[Step 6] ✓ Document written successfully!');
      console.log('[Step 6] Document ID:', docRef.id);
      console.log('[Step 6] Document Path:', docRef.path);
      
      console.log('============================================');
      console.log('BOUNTY CREATION SUCCESSFUL!');
      console.log('============================================');
      
      const createdBounty = {
        id: docRef.id,
        title: bountyData.title,
        description: bountyData.description,
        category: bountyData.category,
        reward: bountyData.reward,
        status: bountyData.status,
        duration: bountyData.duration,
        tags: bountyData.tags,
        huntersNeeded: bountyData.huntersNeeded,
        acceptedHunters: bountyData.acceptedHunters,
        postedBy: bountyData.postedBy,
        postedByName: currentUser.displayName || currentUser.email || 'Anonymous',
        postedByAvatar: currentUser.photoURL || 'https://i.pravatar.cc/150?img=1',
        createdAt: new Date(),
        applicants: bountyData.applicants,
      };
      
      console.log('[Step 7] Returning bounty data:', JSON.stringify(createdBounty, null, 2));
      
      return createdBounty;
    } catch (error: any) {
      console.log('============================================');
      console.log('BOUNTY CREATION FAILED!');
      console.log('============================================');
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        fullError: error
      });
      throw new Error(error.message || 'Failed to create bounty');
    }
  });
