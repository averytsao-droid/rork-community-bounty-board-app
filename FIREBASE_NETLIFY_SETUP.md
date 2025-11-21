# Firebase Backend Setup for Netlify

This guide will help you set up Firebase Authentication with your Netlify deployment.

## Prerequisites

1. A Firebase project (bounty-board-95ab5)
2. A Netlify account

## Firebase Service Account Setup

### Step 1: Generate Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bounty-board-95ab5**
3. Click the gear icon (⚙️) → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file securely (contains sensitive credentials)

### Step 2: Configure Netlify Environment Variables

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Add the following environment variables:

#### Required Variables:

```
FIREBASE_SERVICE_ACCOUNT_KEY
```
- Value: Copy the **entire contents** of the service account JSON file
- This should be a single-line JSON string

```
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bounty-board-95ab5
```

#### Already Set (from your env file):
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAVlkTl-xlwE6ynpJkjfGW62blk0MMbsW0
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bounty-board-95ab5.firebaseapp.com
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bounty-board-95ab5.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=926975971487
EXPO_PUBLIC_FIREBASE_APP_ID=1:926975971487:web:f26cc93c90bcec6adb12aa
EXPO_PUBLIC_RORK_API_BASE_URL=https://u7yl10fgtazotkaa17vqs.rork.app
```

### Step 3: Deploy to Netlify

#### Option A: Deploy via Netlify CLI
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Option B: Deploy via Git
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Netlify will automatically build and deploy

## Architecture

### How it Works:

1. **Client Side (React Native Web)**:
   - Uses Firebase Client SDK for authentication
   - Sends authenticated requests with JWT tokens in Authorization header

2. **Server Side (Netlify Functions)**:
   - Uses Firebase Admin SDK to verify tokens
   - Creates secure context with verified user ID
   - Protected procedures require authentication

3. **tRPC Flow**:
   ```
   Client → Firebase Auth → Get Token → tRPC Request (with Bearer token)
   → Netlify Function → Firebase Admin (verify token) → Protected Procedure
   ```

## Files Created/Modified:

- `backend/lib/firebaseAdmin.ts` - Firebase Admin SDK initialization
- `backend/trpc/create-context.ts` - Updated with auth verification
- `netlify/functions/api.ts` - Netlify serverless function wrapper
- `netlify.toml` - Updated with function configuration
- `lib/trpc.ts` - Updated to send auth tokens

## Testing Authentication

After deployment, test your authentication:

1. Sign in via your app
2. Make authenticated requests
3. Check Netlify Functions logs for verification success/failure

## Troubleshooting

### "Signature expired" Error
- This was caused by missing Firebase Admin SDK setup
- Now resolved with proper token verification

### "UNAUTHORIZED" Error
- User is not signed in
- Token is invalid or expired
- Check that client is sending Authorization header

### Function Timeout
- Increase timeout in netlify.toml if needed:
```toml
[functions]
  node_bundler = "esbuild"
  external_node_modules = ["firebase-admin"]
```

## Security Notes

- Never commit service account JSON to version control
- Use environment variables for all sensitive data
- Rotate service account keys regularly
- Enable Firebase App Check for additional security

## Next Steps

1. Set up Firebase Security Rules for Firestore
2. Configure CORS properly for production domain
3. Enable Firebase App Check
4. Set up monitoring and error tracking
