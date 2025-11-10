# Firebase Direct Setup Guide

## ✅ What I've Done

I've successfully migrated your app from using Rork's tRPC backend to **fully Firebase**. Here's what changed:

### Files Updated:
1. **`contexts/BountyContext.tsx`** - Completely replaced all tRPC calls with direct Firebase Firestore operations
   - `addBounty()` now writes directly to Firebase `bounties` collection
   - `applyToBounty()` now updates Firebase documents and creates conversations
   - Data loading happens through Firebase queries instead of tRPC

### What's Now Using Firebase:
- ✅ **Authentication** - Already using Firebase Auth (was working before)
- ✅ **User profiles** - Stored in Firebase `users` collection
- ✅ **Bounties** - Now stored in Firebase `bounties` collection
- ✅ **Conversations** - Now stored in Firebase `conversations` collection

---

## 🚀 What You Need To Do

### Step 1: Update Firebase Firestore Rules

Your Firestore currently has no collections because the **security rules** are probably too restrictive. You need to update them to allow reading and writing data.

1. Go to **Firebase Console** → your project
2. Click **Firestore Database** in the left sidebar
3. Click the **Rules** tab at the top
4. Replace the rules with these:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles
      allow read: if true;
      // Only the user themselves can update their profile
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bounties collection
    match /bounties/{bountyId} {
      // Anyone can read bounties
      allow read: if true;
      // Authenticated users can create bounties
      allow create: if request.auth != null;
      // Only the creator can update/delete their bounty
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.postedBy || 
         request.auth.uid in resource.data.acceptedHunters);
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      // Only participants can read conversations
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
      // Authenticated users can create conversations
      allow create: if request.auth != null;
      // Only participants can update conversations
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
    }
    
    // Messages collection
    match /messages/{messageId} {
      // Allow authenticated users to read/write messages
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish** to save the rules

### Step 2: Create Firestore Indexes (If Needed)

Firebase might ask you to create indexes when you try to query data. If you see errors about missing indexes:

1. Firebase Console will show you an error with a **link to create the index**
2. Click the link and it will auto-create the index for you
3. Wait 2-3 minutes for the index to build

Common indexes you'll need:
- **bounties** collection: `createdAt` (descending)
- **bounties** collection: compound index on `postedBy` + `createdAt` (descending)
- **conversations** collection: compound index on `participantIds` + `lastMessageTime` (descending)

### Step 3: Test The App

1. **Login or Register** - Make sure authentication still works
2. **Post a bounty** - Go to Post tab and create a bounty
3. **Check Firebase Console** - Go to Firestore Database and you should see:
   - A `bounties` collection with your test bounty
4. **Browse bounties** - You should see your posted bounty in the Browse tab
5. **Accept a bounty** (create another user to test) - The app should create a conversation

---

## 🗂️ Firebase Collections Structure

### **bounties** collection
```typescript
{
  title: string
  description: string
  category: string | null
  reward: number
  status: 'open' | 'in-progress' | 'completed' | 'cancelled'
  postedBy: string (userId)
  postedByName: string
  postedByAvatar: string
  createdAt: Timestamp
  duration: 'quick' | 'short' | 'medium' | 'long'
  applicants: number
  tags: string[]
  huntersNeeded?: number
  acceptedHunters?: string[] (userIds)
}
```

### **conversations** collection
```typescript
{
  type: 'direct' | 'hunter-negotiation' | 'poster-negotiation'
  participantId?: string
  participantName?: string
  participantAvatar?: string
  participantIds: string[] (all participant userIds)
  participants?: { id, name, avatar, role }[]
  bountyId: string
  bountyTitle: string
  originalReward: number
  lastMessage: string
  lastMessageTime: Timestamp
  unreadCount: number
}
```

### **users** collection (already exists)
```typescript
{
  name: string
  email: string
  bio: string
  avatar: string
  bountiesPosted: number
  bountiesCompleted: number
  totalEarned: number
  rating: number
  joinedDate: Timestamp
  credits: number
  reviews: Review[]
  followers: string[]
  following: string[]
}
```

---

## ❌ What I Removed

- ❌ All tRPC dependencies from BountyContext
- ❌ Backend calls through Rork's API
- ❌ `trpc.bounties.*` queries and mutations
- ❌ `trpc.conversations.*` queries and mutations

---

## 🔍 Troubleshooting

### Problem: "Missing or insufficient permissions"
**Solution**: Update your Firestore rules (see Step 1 above)

### Problem: "No bounties showing up"
**Reasons**:
1. Firestore rules are blocking reads
2. No bounties have been created yet
3. You're not logged in

**Solution**: 
- Check Firebase Console → Firestore → make sure `bounties` collection exists
- Try posting a bounty while logged in
- Check browser console for Firebase errors

### Problem: "Failed to create bounty"
**Reasons**:
1. Firestore rules are blocking writes
2. Not logged in
3. Firebase config is incorrect

**Solution**:
- Make sure you're logged in
- Check Firestore rules allow creates
- Check env variables for Firebase config

---

## 📝 Important Notes

1. **Messages** are currently stored in local state (not Firebase). If you want messages to persist, we'll need to create a `messages` subcollection under conversations.

2. **Real-time updates** - The app currently loads data on mount and after mutations. If you want real-time updates when other users post bounties, we can add Firebase real-time listeners (snapshots).

3. **Reviews** - Still stored locally in AsyncStorage. We can move these to Firebase too if needed.

---

## ✨ Next Steps (Optional Improvements)

1. **Add Real-time Listeners** - Get live updates when bounties/conversations change
2. **Store Messages in Firebase** - Currently messages are only in memory
3. **Add Images** - Use Firebase Storage for profile pictures and bounty images
4. **Add Search** - Use Algolia or Firebase Extensions for full-text search

Let me know if you hit any issues!
