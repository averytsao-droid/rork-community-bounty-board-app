import { publicProcedure } from '../../create-context';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

export const listConversationsProcedure = publicProcedure.query(async () => {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return [];
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const conversations = await Promise.all(
      querySnapshot.docs.map(async (convDoc) => {
        const convData = convDoc.data();
        
        const participants = await Promise.all(
          (convData.participants || []).map(async (p: any) => {
            const userDoc = await getDoc(doc(db, 'users', p.id));
            const userData = userDoc.exists() ? userDoc.data() : null;
            return {
              id: p.id,
              name: userData?.name || 'Unknown User',
              avatar: userData?.avatar || 'https://ui-avatars.com/api/?name=Unknown',
              role: p.role,
            };
          })
        );

        return {
          id: convDoc.id,
          type: convData.type,
          participantId: convData.participantId,
          participantName: convData.participantName,
          participantAvatar: convData.participantAvatar,
          participants: participants.length > 0 ? participants : undefined,
          lastMessage: convData.lastMessage || '',
          lastMessageTime: convData.lastMessageTime?.toDate() || new Date(),
          unreadCount: convData.unreadCount || 0,
          bountyId: convData.bountyId,
          bountyTitle: convData.bountyTitle,
          originalReward: convData.originalReward,
        };
      })
    );

    console.log('Listed conversations:', conversations.length);
    return conversations;
  } catch (error: any) {
    console.error('Failed to list conversations:', error);
    throw new Error(error.message || 'Failed to list conversations');
  }
});
