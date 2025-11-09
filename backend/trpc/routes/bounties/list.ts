import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';

export const listBountiesProcedure = publicProcedure.query(async () => {
  try {
    const db = getFirebaseFirestore();
    const bountiesRef = collection(db, 'bounties');
    const q = query(bountiesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const bounties = await Promise.all(
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

    console.log('Listed bounties:', bounties.length);
    return bounties;
  } catch (error: any) {
    console.error('Failed to list bounties:', error);
    throw new Error(error.message || 'Failed to list bounties');
  }
});
