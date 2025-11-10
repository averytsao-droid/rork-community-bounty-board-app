# Network Troubleshooting Guide

## 🚨 Current Issue: TRPCClientError: Failed to fetch

This error means your app **cannot connect** to the tRPC backend server. Here's how to diagnose and fix it:

---

## Step 1: Verify Firebase Configuration ⚠️ **MOST CRITICAL**

**The #1 cause of "Failed to fetch" is missing Firebase credentials!**

### Check your `env` file:

Your `env` file should have **REAL** Firebase values, not placeholders:

```bash
# ❌ WRONG - These are placeholders
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# ✅ CORRECT - These are real values from Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
EXPO_PUBLIC_FIREBASE_PROJECT_ID=my-bounty-app-12345
```

### How to Get Firebase Credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click ⚙️ **Project Settings** (gear icon next to Project Overview)
4. Scroll to **"Your apps"** section
5. If you don't have a web app:
   - Click **"Add app"** → Select **Web** `</>`
   - Give it a nickname (e.g., "Bounty Board Web")
6. You'll see a config object like this:

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

7. Copy these values into your `env` file:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=my-project-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

8. **Restart your app completely** after updating the env file

---

## Step 2: Check Console Logs

Open your browser DevTools (F12) or terminal and look for these logs:

### ✅ Good Signs:
```
🔧 Firebase Config Check:
  API Key: ✓ Set
  Auth Domain: ✓ Set
  Project ID: ✓ Set
  ...

🔧 tRPC Configuration:
  Base URL: https://u7yl10fgtazotkaa17vqs.rork.app
  Full tRPC URL: https://u7yl10fgtazotkaa17vqs.rork.app/api/trpc

🔥 Initializing Firebase...
✅ Firebase initialized successfully

🌐 tRPC Request: https://u7yl10fgtazotkaa17vqs.rork.app/api/trpc/bounties.create
✅ tRPC Response: 200 OK
```

### ❌ Bad Signs:
```
🔧 Firebase Config Check:
  API Key: ❌ MISSING          ← Fix your env file!
  Project ID: ❌ MISSING        ← Fix your env file!

❌ Firebase initialization failed: invalid API key

❌ tRPC Fetch Error: Failed to fetch
```

---

## Step 3: Verify Backend URL

Your backend URL should be:
```
https://u7yl10fgtazotkaa17vqs.rork.app
```

Check that this is set in your `env` file:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://u7yl10fgtazotkaa17vqs.rork.app
```

### Test Backend Connection:

Open this URL in your browser:
```
https://u7yl10fgtazotkaa17vqs.rork.app/
```

You should see:
```json
{"status":"ok","message":"API is running"}
```

If this doesn't work, your backend server is down or not accessible.

---

## Step 4: Check Network Tab (Browser DevTools)

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try posting a bounty
4. Look for requests to `u7yl10fgtazotkaa17vqs.rork.app`

### What to Look For:

| Status | Meaning | Action |
|--------|---------|--------|
| **200** | ✅ Success | Great! Backend is working |
| **401/403** | 🔐 Authentication issue | Check Firebase auth |
| **404** | 🔍 Wrong URL | Verify backend URL |
| **500** | 💥 Backend error | Check backend logs |
| **Failed (CORS)** | 🚫 CORS blocked | Backend CORS issue |
| **Failed (net::ERR_*)** | 🌐 Network issue | Can't reach server |

---

## Step 5: Firebase Firestore Rules

Make sure your Firestore database rules allow writes:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click **Rules** tab
5. Update rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to create bounties
    match /bounties/{bountyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.postedBy == request.auth.uid;
    }
    
    // Allow authenticated users to manage conversations
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Allow authenticated users to manage messages
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

---

## Step 6: Clear Cache & Restart

Sometimes cached data causes issues:

1. **Stop the development server** (Ctrl+C in terminal)
2. **Clear Metro bundler cache:**
   ```bash
   rm -rf node_modules/.cache
   ```
3. **Restart the app:**
   ```bash
   npm start
   ```
4. **Force refresh in browser:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

## Step 7: Check for Error Details

When you see the error, check the console for more details:

```javascript
// Look for logs like:
Mutation error: TRPCClientError: Failed to fetch
Error message: Failed to fetch
```

The actual error might be buried in the logs. Look for:
- Firebase authentication errors
- Network connection errors
- CORS errors
- Backend server errors

---

## Quick Checklist

✅ Firebase credentials are REAL values (not placeholders)  
✅ `EXPO_PUBLIC_RORK_API_BASE_URL` is set to `https://u7yl10fgtazotkaa17vqs.rork.app`  
✅ All 6 Firebase env variables are set  
✅ App was restarted after updating env file  
✅ Backend URL returns `{"status":"ok"}` when opened in browser  
✅ Firestore rules allow writes from authenticated users  
✅ You're logged in to the app  
✅ Console shows "Firebase initialized successfully"  
✅ Console shows tRPC request logs  

---

## Still Not Working?

If you've checked everything above and it's still not working:

1. **Copy ALL console logs** (from the moment the app starts)
2. **Take screenshots** of:
   - Your `env` file (hide sensitive keys)
   - Firebase Console showing your project
   - Network tab in DevTools
3. **Share the exact error message** you're seeing

The issue is almost always:
- Missing/incorrect Firebase configuration
- Backend server not running
- Network connectivity issue
- Firestore rules blocking writes
