# Firebase Setup Guide

Your Dartmouth Bounties app now uses Firebase for authentication and data storage!

## Quick Start

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing one
3. Follow the setup wizard

### 2. Enable Services

#### Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click Save

#### Firestore Database
1. Go to **Firestore Database** > **Create database**
2. Start in **test mode** for development
3. Choose a location close to your users
4. Click Enable

### 3. Get Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Dartmouth Bounties")
5. Copy the configuration values

### 4. Add to Your App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase config values in `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. Restart your development server

## What's Stored in Firebase

### Authentication
- User email and password (securely hashed)
- User session tokens

### Firestore Database Structure

```
users (collection)
  └── {userId} (document)
      ├── name: string
      ├── email: string
      ├── bio: string
      ├── avatar: string (URL)
      ├── bountiesPosted: number
      ├── bountiesCompleted: number
      ├── totalEarned: number
      ├── rating: number
      ├── credits: number
      ├── joinedDate: timestamp
      ├── reviews: array
      ├── followers: array of userIds
      └── following: array of userIds
```

## Security Rules (Recommended for Production)

Replace the default Firestore rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read any user profile
      allow read: if true;
      
      // Users can only write to their own document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing

You can now:
- ✅ Register new users with email/password
- ✅ Login with existing credentials
- ✅ Update user profiles
- ✅ Follow/unfollow users
- ✅ All data persists across sessions

## Troubleshooting

### "Failed to load user data"
- Check that Firestore is enabled
- Verify your config values in `.env`
- Check browser console for specific errors

### "Login failed"
- Make sure Email/Password auth is enabled
- Check that the email format is valid
- Password must be at least 6 characters

### "Registration failed" 
- Email may already be in use
- Check Firebase Console > Authentication > Users
- Verify Firestore is accessible

## Local Development

For local development, notifications are still stored in AsyncStorage. In production, you may want to:
- Move notifications to Firestore
- Implement push notifications
- Add real-time updates with Firestore listeners

## Next Steps

Consider adding:
- Password reset functionality
- Email verification
- Social auth providers (Google, Apple, etc.)
- Real-time updates for bounties and messages
- Cloud Functions for server-side logic
