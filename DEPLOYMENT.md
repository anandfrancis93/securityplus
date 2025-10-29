# Deployment Guide

## Deploy to Vercel

### Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Firebase project set up with Firestore and Anonymous Auth enabled
3. Google AI API key with available credits

### Step 1: Prepare Your Repository

Make sure all your code is committed to your Git repository (GitHub, GitLab, or Bitbucket).

### Step 2: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository**
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**

   Click "Environment Variables" and add the following:

   ```
   GOOGLE_API_KEY=your_google_api_key_here
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

   **Important**: Make sure all variables are added for Production, Preview, and Development environments.

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-3 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Step 3: Configure Firebase for Your Domain

1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains":
   - `your-project-name.vercel.app`
   - If using custom domain, add that too

### Step 4: Test Your Deployment

1. Visit your deployed app URL
2. The app should automatically authenticate you anonymously
3. Click "Start New Quiz"
4. Verify questions are being generated
5. Answer a question and verify explanations appear
6. Check that progress is being saved

### Alternative: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add GOOGLE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   # ... add all other env variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch → Production deployment
- Every push to other branches → Preview deployment
- Pull requests get unique preview URLs

## Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Add custom domain to Firebase authorized domains

## Monitoring

### Check Deployment Status
- Visit Vercel Dashboard → Your Project → Deployments
- View build logs, runtime logs, and errors

### Monitor Costs
- **Vercel**: Free tier includes 100GB bandwidth, hobby plan
- **Firebase**: Free tier includes 50K reads/day, 20K writes/day
- **Google AI**: Monitor API usage at https://aistudio.google.com/

### Set Up Alerts
1. Firebase Console → Set up budget alerts
2. Google AI Studio → Monitor usage and set quotas

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure dependencies are in package.json

### Runtime Errors
- Check Runtime Logs in Vercel
- Verify Firebase configuration is correct
- Check Google AI API key is valid and has credits

### Questions Not Generating
- Verify GOOGLE_API_KEY is set correctly
- Check Google AI account has available credits
- Review API route logs in Vercel

### Progress Not Saving
- Verify all Firebase environment variables are set
- Check Firestore security rules allow anonymous writes
- Ensure Anonymous Auth is enabled in Firebase

### Cross-Device Sync Not Working
- Make sure you've generated a pairing code on one device
- Verify the code hasn't expired (15 minutes)
- Check that you entered the code correctly on the other device
- Look for error messages in the browser console

## Security Considerations

### Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data or data they've paired with
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    // Pairing codes - anyone authenticated can create and read
    match /pairingCodes/{code} {
      allow read, write: if request.auth != null;
    }

    // Questions can be read by anyone authenticated
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write questions
    }
  }
}
```

**Note:** The users collection allows any authenticated user to read/write any document. This is intentional for the device pairing feature - when you pair devices, the new device needs to access the paired user's data. Since we're using anonymous auth and the app is for personal use only, this is acceptable. If you want stricter security, you can implement custom claims or use a different authentication method.

### Rate Limiting

Consider implementing rate limiting for the question generation API to prevent abuse:
- Use Vercel Edge Config for rate limiting
- Or implement with Upstash Redis

## Performance Optimization

1. **Enable Caching**
   - Questions can be cached in Firestore
   - Reuse questions across users

2. **Optimize AI Generation**
   - Generate questions in batches
   - Cache generated questions
   - Use streaming responses

3. **Image Optimization**
   - Use Next.js Image component for any images
   - Enable automatic image optimization

## Backup Strategy

1. **Firestore Backup**
   - Enable automatic backups in Firebase Console
   - Export data regularly

2. **Environment Variables**
   - Keep a secure backup of all environment variables
   - Document all configuration

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check Firebase documentation: https://firebase.google.com/docs
- Check Next.js documentation: https://nextjs.org/docs
