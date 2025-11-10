# Firebase Troubleshooting Guide - Bounties Not Showing Up

## ✅ **GOOD NEWS: Your Code is Correct!**

The backend code is working properly and bounties ARE being stored in Firebase Firestore. The issue is likely one of these:

---

## 🔥 **Step 1: Verify Firebase Configuration**

### Check your `.env` file exists and has valid values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**⚠️ Common Issues:**
- File is named `env.example` instead of `.env`
- Values still say `your_api_key_here`
- Missing quotes around values (DON'T add quotes)

---

## 🔥 **Step 2: Check Firebase Console**

### 2.1 Open Firebase Console
Go to: https://console.firebase.google.com/

### 2.2 Check Firestore Database
1. Click on **Firestore Database** in the left sidebar
2. Look for a `bounties` collection
3. You should see your posted bounties there!

### 2.3 Check Firestore Rules
Click on **Rules** tab and make sure you have:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write bounties
    match /bounties/{bountyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.postedBy == request.auth.uid;
    }
    
    // Allow authenticated users to read/write their own user data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**If you see:**
- `allow read, write: if false;` - This blocks all access! Change it.
- `allow read, write: if request.time < timestamp...` - This means test mode expired.

---

## 🔥 **Step 3: Check Your App Is Connected**

### Open your app's console logs and look for:

**✅ Good signs:**
```
Firebase initialized
Auth state changed: <your-user-id>
Loaded Firebase user: <your-user-id>
Creating bounty: <bounty-title>
Bounty created: <document-id>
Bounty created successfully, invalidating queries
Queries refetched after bounty creation
Setting bounties from backend: 1
```

**❌ Bad signs:**
```
Firebase: Error (auth/network-request-failed)
Failed to list bounties: [FirebaseError: ...]
Error loading bounties: ...
```

---

## 🔥 **Step 4: Test Firestore Directly**

### In Firebase Console > Firestore Database:

1. Click **"Start collection"**
2. Collection ID: `bounties`
3. Add a test document with these fields:
   ```
   title: "Test Bounty"
   description: "This is a test"
   reward: 50
   status: "open"
   postedBy: "<your-user-id>"
   createdAt: <current timestamp>
   category: null
   duration: "short"
   tags: []
   huntersNeeded: 1
   acceptedHunters: []
   applicants: 0
   ```
4. Refresh your app - do you see this test bounty?

---

## 🔥 **Step 5: Common Fixes**

### Fix #1: Restart Your Dev Server
```bash
# Stop the server (Ctrl+C)
# Clear cache
rm -rf .expo node_modules/.cache
# Restart
bun run start --clear
```

### Fix #2: Check Authentication
- Make sure you're logged in
- Try logging out and back in
- Check that your user ID in Auth matches the one used in bounties

### Fix #3: Network Issues
- Check your internet connection
- Try on a different network
- Check if Firebase is down: https://status.firebase.google.com/

---

## 🔥 **Step 6: Debugging Checklist**

Run through this checklist:

- [ ] `.env` file exists in root directory
- [ ] `.env` has valid Firebase credentials (not example values)
- [ ] Firestore Database is created (not in "Create database" state)
- [ ] Firestore rules allow authenticated users to read/write
- [ ] User is logged in (check console for "Auth state changed")
- [ ] Console shows "Bounty created: <id>" after posting
- [ ] Console shows "Setting bounties from backend: X" on Browse page
- [ ] Firestore Console shows bounties in the `bounties` collection

---

## 🔥 **What The Code Does**

1. **When you post a bounty:**
   - `app/(tabs)/post.tsx` calls `addBounty()`
   - `contexts/BountyContext.tsx` calls `createBountyMutation.mutateAsync()`
   - `backend/trpc/routes/bounties/create.ts` saves to Firestore
   - Queries are refetched
   - You're redirected to Browse page

2. **When you view bounties:**
   - `app/(tabs)/index.tsx` loads
   - `contexts/BountyContext.tsx` runs `bountiesQuery`
   - `backend/trpc/routes/bounties/list.ts` reads from Firestore
   - Bounties are displayed

---

## 🔥 **Still Not Working?**

### Check these specific errors:

**Error: "User must be authenticated"**
- You're not logged in. Go to login page.

**Error: "Missing or insufficient permissions"**
- Firestore rules are too restrictive. See Step 2.3.

**Error: "Network request failed"**
- Can't reach Firebase. Check internet/firewall.

**No error, but no bounties show:**
- Check Firestore Console - are bounties there?
- If YES: Query filtering issue (check console logs)
- If NO: Backend isn't saving (check console for "Bounty created")

---

## 📝 **Need More Help?**

1. Open browser console (F12)
2. Go to Console tab
3. Post a bounty
4. Copy all console messages
5. Share with support

The logs will show exactly where it's failing!
