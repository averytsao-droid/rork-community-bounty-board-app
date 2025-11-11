# Fix: Bounties Not Being Created in Firebase

## Problem
Bounties are not being saved to Firestore even though users ARE being created successfully. This means Firebase is connected, but **Firestore write permissions are blocking bounty creation**.

## Root Cause
Your Firebase Firestore security rules are preventing writes to the `bounties` collection.

## Solution: Update Firestore Security Rules

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select your project
3. Click on **"Firestore Database"** in the left sidebar
4. Click on the **"Rules"** tab

### Step 2: Update Your Rules
Replace your current rules with these:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - authenticated users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bounties collection - authenticated users can read all, write their own
    match /bounties/{bountyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.postedBy == request.auth.uid;
    }
    
    // Conversations collection - authenticated users can read/write conversations they're part of
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Messages collection - authenticated users can send messages
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
      allow update: if request.auth != null;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click the **"Publish"** button
2. Wait for confirmation that rules are published

### Step 4: Test Again
1. Try posting a bounty in your app
2. Check the browser console for detailed logs
3. Go to Firestore Database > Data tab
4. You should now see a `bounties` collection appear!

## What These Rules Do

- **Users**: Users can read all user profiles, but only write their own
- **Bounties**: Authenticated users can:
  - Read all bounties
  - Create new bounties
  - Update any bounty (needed for accepting bounties)
  - Delete only their own bounties
- **Conversations & Messages**: Authenticated users can read/write all (for messaging features)

## Verify It's Working

After updating the rules, you should see these logs in the console when posting a bounty:

```
============================================
CREATE BOUNTY MUTATION CALLED
============================================
[Step 1] ✓ Firebase Auth obtained
[Step 2] ✓ Firestore obtained
[Step 3] ✓ User authenticated
[Step 4] ✓ Bounty data prepared
[Step 5] ✓ Collection reference obtained
[Step 6] ✓ Document written successfully!
[Step 6] Document ID: [some-id]
============================================
BOUNTY CREATION SUCCESSFUL!
============================================
```

And you should now see the `bounties` collection in your Firebase Console!

## Still Not Working?

If you still see errors after updating the rules, check:

1. **Are you logged in?** The backend requires authentication
2. **Check console logs** - Look for the specific error message
3. **Firestore Database is enabled** - Make sure you've created a Firestore database in Firebase Console
4. **Check Firebase Console logs** - Go to Firebase Console > Firestore > Usage tab to see any errors

## Common Error Messages

- `"Missing or insufficient permissions"` → Firestore rules issue (follow steps above)
- `"No authenticated user"` → You need to log in first
- `"Firebase not initialized"` → Check your .env file has correct values
