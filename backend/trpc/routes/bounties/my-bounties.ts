import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export const myBountiesProcedure = publicProcedure.query(async () => {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return [];
    }

    const bountiesRef = collection(db, 'bounties');
    const q = query(
      bountiesRef,
      where('postedBy', '==', currentUser.uid)
    );
    const querySnapshot = await getDocs(q);

    let bounties = await Promise.all(
      querySnapshot.docs.map(async (bountyDoc) => {
        const bountyData = bountyDoc.data();
        
        const userDoc = await getDoc(doc(db, 'users', bountyData.postedBy));
        const userData = userDoc.exists() ? userDoc.data() : null;

        return {
          id: bountyDoc.id,
          title: bountyData.title,
          description: bountyData.description,
          category: bountyData.category,
          reward: bountyData.reward,
          status: bountyData.status,
          duration: bountyData.duration,
          tags: bountyData.tags,
          huntersNeeded: bountyData.huntersNeeded ?? 1,
          acceptedHunters: bountyData.acceptedHunters ?? [],
          postedBy: bountyData.postedBy,
          postedByName: userData?.name || 'Unknown User',
          postedByAvatar: userData?.avatar || 'https://ui-avatars.com/api/?name=Unknown',
          createdAt: bountyData.createdAt?.toDate() || new Date(),
          applicants: bountyData.applicants ?? 0,
        };
      })
    );

    bounties.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log('My bounties:', bounties.length);
    return bounties;
  } catch (error: any) {
    console.error('Failed to get my bounties:', error);
    throw new Error(error.message || 'Failed to get my bounties');
  }
});
