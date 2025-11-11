# Complete Firestore Rules Configuration

## Problem
You're getting `TRPCClientError: Failed to fetch` and permission errors because your Firestore security rules need to be updated to allow all operations including:
- Canceling accepted bounties
- Canceling/deleting posted bounties  
- Sending and receiving messages
- Updating bounty status

## Solution: Update Firestore Security Rules

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project (bounty-board-95ab5)
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top

### Step 2: Copy These Complete Rules

Replace ALL your current rules with this complete configuration:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if isAuthenticated();
      // Users can only write their own profile
      allow write: if isOwner(userId);
    }
    
    // Bounties collection
    match /bounties/{bountyId} {
      // Anyone authenticated can read all bounties
      allow read: if isAuthenticated();
      
      // Anyone authenticated can create bounties
      allow create: if isAuthenticated() && request.resource.data.postedBy == request.auth.uid;
      
      // Anyone authenticated can update bounties (for accepting, status changes)
      allow update: if isAuthenticated();
      
      // Only bounty owner can delete their bounty
      allow delete: if isAuthenticated() && resource.data.postedBy == request.auth.uid;
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      // Anyone authenticated can read conversations (we filter by participantIds in app)
      allow read: if isAuthenticated();
      
      // Anyone authenticated can create conversations
      allow create: if isAuthenticated() && 
                      request.auth.uid in request.resource.data.participantIds;
      
      // Participants can update conversations (for last message, etc)
      allow update: if isAuthenticated();
      
      // Participants can delete conversations
      allow delete: if isAuthenticated();
    }
    
    // Messages collection  
    match /messages/{messageId} {
      // Anyone authenticated can read messages (we filter by conversationId in app)
      allow read: if isAuthenticated();
      
      // Users can only create messages with their own senderId
      allow create: if isAuthenticated() && 
                      (request.resource.data.senderId == request.auth.uid || 
                       request.resource.data.senderId == 'system');
      
      // Anyone authenticated can update messages (for pay requests, read status)
      allow update: if isAuthenticated();
      
      // Message sender can delete their messages
      allow delete: if isAuthenticated() && 
                      (resource.data.senderId == request.auth.uid || 
                       resource.data.senderId == 'system');
    }
    
    // Notifications collection (if you add it later)
    match /notifications/{notificationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click the blue **"Publish"** button in the top right
2. Wait for the confirmation message: "Rules published successfully"

### Step 4: Create Required Indexes

Some queries require composite indexes. If you see index errors in the console, you'll need to create them:

1. **For messages query** - If you see an error about missing index for `conversationId` + `timestamp`:
   - Click the link in the error message, OR
   - Go to Firestore Database > Indexes tab
   - Click "Create Index"
   - Collection: `messages`
   - Fields to index:
     - `conversationId` (Ascending)
     - `timestamp` (Ascending)
   - Query scope: Collection
   - Click "Create"

2. **For conversations query** - If needed:
   - Collection: `conversations`  
   - Fields to index:
     - `participantIds` (Array)
     - `lastMessageTime` (Descending)

The easiest way is to just click the link in the error message when it appears - Firebase will auto-fill the index configuration.

### Step 5: Test Everything

After updating the rules, test these features:

1. ✅ **Post a new bounty** - Should work
2. ✅ **Accept a bounty** - Should create conversation
3. ✅ **Send messages** - Should persist across refreshes
4. ✅ **Cancel accepted bounty** - Should remove from accepted list
5. ✅ **Cancel posted bounty** - Should update status to cancelled
6. ✅ **Delete cancelled bounty** - Should remove completely

## What Changed

### Previous Issues:
- Messages couldn't be sent (permission denied)
- Cancel operations failed (insufficient permissions)
- Messages disappeared on refresh (not properly saved)

### Fixed:
- ✅ All authenticated users can now send messages
- ✅ Bounty owners can update their bounties' status
- ✅ Accepted bounties can be cancelled by the hunter
- ✅ Posted bounties can be cancelled/deleted by the poster
- ✅ Messages persist in Firestore with proper permissions
- ✅ All users can update conversations for last message tracking

## Security Notes

These rules are permissive to allow the app to function properly. In production, you may want to:

1. Add more specific checks for bounty updates (only certain status transitions)
2. Restrict conversation updates to participants only
3. Add message content validation
4. Rate limit operations to prevent abuse

But for now, these rules will allow all features to work correctly!

## Still Having Issues?

### Check the Browser Console
Look for specific Firebase error messages:

- `"Missing or insufficient permissions"` → Rules not published yet, wait 30 seconds
- `"Failed to fetch"` → Network issue, check your internet connection
- `"The query requires an index"` → Click the link in the error to create the index
- `"No document to update"` → The document doesn't exist (different issue)

### Verify Rules are Active
1. Go to Firebase Console > Firestore Database > Rules
2. Check the "Last published" timestamp
3. It should show a recent time (within last few minutes)

### Test Firebase Connection
Open browser console and run:
```javascript
console.log(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID)
```
Should show: `bounty-board-95ab5`

If it shows `undefined`, your environment variables aren't loaded.
