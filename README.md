# Parkify 🏔️

Transform your photos into South Park style illustrations using AI!

## Features

- 📸 Easy drag-and-drop image upload
- 🎨 South Park style transformation using OpenAI
- 💾 Download and share your South Park-ified images
- 📱 Responsive design for all devices

## Quick Setup Guide

### 1. Get Required API Keys

**OpenAI API Key:**
   - Visit [OpenAI's website](https://platform.openai.com/api-keys)
   - Create an account and generate an API key

**Supabase Project:**
   - Visit [Supabase](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key from Settings → API

### 2. Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd parkify
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - For local development with Netlify Functions:
     ```bash
     # Install Netlify CLI
     npm install -g netlify-cli
     
     # Login to Netlify
     netlify login
     
     # Link your project
     netlify link
     
     # Start development server with Netlify Functions
     netlify dev
     ```
   - Add your API keys to Netlify:
     ```bash
     netlify env:set OPENAI_API_KEY your_actual_api_key_here
     ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### 3. Deployment Setup

#### GitHub Setup
1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

#### Netlify Deployment
1. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Choose your Parkify repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Add Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add these variables:
     - `OPENAI_API_KEY`: Your OpenAI API key (used by serverless functions)
     - `VITE_SUPABASE_URL`: Your Supabase project URL (optional)
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (optional)
   
   Note: The OpenAI API key is now securely stored and only accessible by the serverless functions.
   It is no longer exposed to the frontend.

4. **Deploy:**
   - Click "Deploy site"
   - Your site will be live at `https://your-site-name.netlify.app`

#### Supabase Integration
1. **Database Setup** (if needed for future features):
   - Go to your Supabase dashboard
   - Use the SQL editor to create tables
   - Set up Row Level Security (RLS) policies

2. **Storage Setup** (for image uploads):
   - Go to Storage in Supabase dashboard
   - Create a new bucket for images
   - Configure public access policies

### 4. Continuous Deployment

Once connected:
- Push changes to your GitHub repository
- Netlify automatically rebuilds and deploys
- Environment variables are securely managed in Netlify

## How It Works

1. Upload a photo using the drag-and-drop interface
2. The app processes your image using OpenAI with a specialized South Park transformation prompt
3. Preview your South Park-style image
4. Download or share your creation!

## Tech Stack

- React + TypeScript
- Tailwind CSS
- OpenAI API
- Supabase (for future features)
- Vite
- Netlify (deployment)

## Environment Variables

| Variable | Description | Required | Location |
|----------|-------------|----------|----------|
| `OPENAI_API_KEY` | OpenAI API key for image generation | Yes | Netlify Environment |
| `VITE_SUPABASE_URL` | Supabase project URL | Optional* | Frontend Environment |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Optional* | Frontend Environment |

*Required for future features like user accounts, image history, etc.

Enjoy South Park-ifying your photos! 🌟