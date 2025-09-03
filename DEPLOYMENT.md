# Deploying Campus Bazaar to Vercel

This guide will help you deploy your Campus Bazaar application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A MongoDB Atlas database (or any MongoDB instance accessible from the internet)
3. Environment variables configured

## Deployment Steps

### 1. Prepare Your Environment Variables

Copy the `.env.example` file to create your production environment variables. You'll need:

- `MONGODB_URI`: Your MongoDB connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: For Google OAuth (optional)
- Cloudinary credentials for image uploads (optional)

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel
   ```

4. Follow the prompts and configure your environment variables when asked.

#### Option B: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Connect your GitHub repository to Vercel
3. Vercel will automatically detect the configuration and deploy

### 3. Configure Environment Variables in Vercel

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the required variables from your `.env.example`

### 4. Update API Base URL

If you're using relative API calls in your frontend, they should work automatically. If you have hardcoded URLs, update them to use your Vercel domain.

## Project Structure for Vercel

The project has been configured with:

- `vercel.json`: Deployment configuration
- `api/`: Serverless functions for your backend API
- `client/`: React frontend application

## Important Notes

1. **Database**: Make sure your MongoDB instance allows connections from Vercel's IP ranges
2. **Environment Variables**: All sensitive data should be in environment variables, not committed to code
3. **CORS**: The API functions are configured to work with your frontend domain
4. **Authentication**: The current setup uses session-based authentication. For production, consider JWT tokens.

## API Endpoints

Your Vercel deployment will have these endpoints:

- `POST /api/auth/login` - User login
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `GET /api/categories` - Get categories

## Troubleshooting

1. **Build Errors**: Check the Vercel build logs for specific error messages
2. **API Errors**: Ensure all environment variables are set correctly
3. **Database Connection**: Verify your MongoDB URI and network access
4. **CORS Issues**: Make sure your API functions return proper CORS headers

## Monitoring

After deployment, monitor your application using:
- Vercel Analytics
- MongoDB Atlas monitoring
- Vercel Function logs

Your application will be available at: `https://your-project-name.vercel.app`