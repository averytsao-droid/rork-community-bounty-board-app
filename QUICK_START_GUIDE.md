# 🚀 Quick Start Guide - Fix Your App NOW!

## ⚠️ CRITICAL ISSUE: Firebase Not Configured

**Your app is failing because Firebase credentials are missing!**

The error "TRPCClientError: Failed to fetch" happens because:
1. Your `env` file has placeholder values
2. Firebase can't initialize properly
3. Backend requests fail before they even reach the server

---

## ✅ 5-Minute Fix

### Step 1: Get Firebase Credentials (2 minutes)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if you don't have it)
3. Click the ⚙️ gear icon → **Project Settings**
4. Scroll to **"Your apps"**
5. If you see a web app, click it. If not, click **"Add app"** → Web `</>`
6. Copy the config values (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567",
  authDomain: "my-project.firebaseapp.com",
  projectId: "my-project-12345",
  storageBucket: "my-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 2: Update Your `env` File (1 minute)

Open your `env` file and replace the placeholder values:

```bash
# Backend API URL (already correct)
EXPO_PUBLIC_RORK_API_BASE_URL=https://u7yl10fgtazotkaa17vqs.rork.app

# Firebase Configuration - REPLACE WITH YOUR REAL VALUES
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=my-project-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**⚠️ Make sure to use YOUR actual values, not the examples above!**

### Step 3: Update Firestore Rules (1 minute)

In Firebase Console:
1. Go to **Firestore Database**
2. Click **Rules** tab
3. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /bounties/{bountyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.postedBy == request.auth.uid;
    }
    
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
    }
    
    match /messages/{messageId} {
      allow read, create: if request.auth != null;
    }
  }
}
```

4. Click **Publish**

### Step 4: Restart Your App (1 minute)

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
```

---

## ✅ Verify It's Working

### Look for These Console Logs:

**Good signs:**
```
🔧 Firebase Config Check:
  API Key: ✓ Set
  Auth Domain: ✓ Set
  Project ID: ✓ Set
  Storage Bucket: ✓ Set
  Messaging Sender ID: ✓ Set
  App ID: ✓ Set

🔥 Initializing Firebase...
✅ Firebase initialized successfully

🔧 tRPC Configuration:
  Base URL: https://u7yl10fgtazotkaa17vqs.rork.app
  Full tRPC URL: https://u7yl10fgtazotkaa17vqs.rork.app/api/trpc

🌐 tRPC Request: https://u7yl10fgtazotkaa17vqs.rork.app/api/trpc/bounties.create
✅ tRPC Response: 200 OK

============================================
BOUNTY CREATION SUCCESSFUL!
============================================
```

**Bad signs (means you still have issues):**
```
❌ MISSING          ← Fix your env file!
❌ Firebase initialization failed
❌ tRPC Fetch Error: Failed to fetch
```

---

## 🎯 What Each Feature Does

### 1. **Persistent Login** ✅ (Already Working)
- Users stay logged in even after closing the app
- Implemented via Firebase Auth's `onAuthStateChanged`
- User data is cached in AsyncStorage

### 2. **Bounty Creation** (Will Work After Firebase Setup)
- Flow: Post form → Context → tRPC → Backend → Firestore → Success
- You'll see bounties in Firebase Console under "Firestore Database" → "bounties" collection
- Bounties will show up in Browse and My Bounties tabs

### 3. **Debugging Tools Added**
- Detailed console logs at every step
- Shows Firebase config status
- Shows tRPC requests/responses
- Helps diagnose issues quickly

---

## 🐛 Still Having Issues?

### Check This Checklist:

- [ ] All 6 Firebase env variables are set with REAL values (not placeholders)
- [ ] You restarted the app after updating env file
- [ ] Firestore rules are published
- [ ] You're logged into the app
- [ ] Console shows "Firebase initialized successfully"
- [ ] Console shows "tRPC Response: 200 OK"

### Common Mistakes:

1. **Forgot to restart app** - Env changes require restart
2. **Used example values** - Must use YOUR actual Firebase config
3. **Forgot Firestore rules** - Default rules block writes
4. **Not logged in** - Must be authenticated to create bounties
5. **Typo in env variables** - Variable names must be exact

---

## 📖 More Help

- **Network Issues**: See `TROUBLESHOOTING_NETWORK.md`
- **Firebase Setup**: See `FIREBASE_SETUP.md`
- **Firestore Rules**: See `FIRESTORE_RULES_FIX.md`

---

## 🎉 After It Works

Once Firebase is configured, you'll be able to:
- ✅ Post bounties (stored in Firestore)
- ✅ See bounties in Browse tab
- ✅ See your posted bounties in My Bounties tab
- ✅ Accept bounties
- ✅ Stay logged in across sessions
- ✅ Everything will work!

**The bounties collection will be automatically created when you post your first bounty!**
