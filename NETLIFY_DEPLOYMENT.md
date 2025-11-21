# Netlify Deployment Guide

## Prerequisites
- Netlify account
- GitHub repository (recommended) or Netlify CLI

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build your app**
   ```bash
   bun run build:web
   ```

3. **Deploy**
   ```bash
   netlify login
   netlify deploy --prod
   ```
   - Select "dist" as the publish directory when prompted

## Configuration

The app is configured with:
- **Build command**: `bun install && bun run build:web`
- **Publish directory**: `dist`
- **Node version**: 20
- **Redirects**: All routes redirect to index.html (SPA routing)
- **Cache headers**: Optimized for static assets

## Environment Variables

Environment variables are configured in `.env.production` and `app.json`.
If you need to override them in Netlify:

1. Go to Site settings → Environment variables
2. Add your variables with the `EXPO_PUBLIC_` prefix

## Backend Considerations

⚠️ **Important**: This configuration deploys only the frontend (web version of your React Native app).

Your backend (`backend/hono.ts`) needs to be deployed separately:
- **Option 1**: Deploy to Vercel/Railway/Render
- **Option 2**: Use Netlify Functions (requires refactoring)

Update the backend URL in your tRPC client configuration once deployed.

## Post-Deployment

1. **Test your deployment**
   - Visit your Netlify URL
   - Test authentication flows
   - Verify Firebase connection

2. **Set up custom domain** (optional)
   - Go to Domain settings in Netlify
   - Add your custom domain

3. **Enable HTTPS** (automatic on Netlify)

## Troubleshooting

- **Build fails**: Check build logs in Netlify dashboard
- **Routes not working**: Verify `_redirects` configuration
- **Firebase errors**: Ensure environment variables are set correctly
- **Backend connection issues**: Update backend URL in `lib/trpc.ts`

## Performance Optimization

The deployment is optimized with:
- Asset caching (1 year)
- Static file generation
- Gzip compression (automatic)
- CDN distribution (automatic)
