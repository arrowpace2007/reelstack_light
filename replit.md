# Reelstack - Video Library Application

## Overview
Reelstack is a personal video library application that allows users to save and organize video content from various platforms (YouTube, Instagram, TikTok, etc.) without the distractions of endless scrolling, ads, or social pressure.

**Current State**: Fully functional frontend application running on Vite + TypeScript

## Recent Changes
- **2024-11-08**: Imported from GitHub and configured for Replit environment
  - Changed server port from 3000 to 5000 for Replit compatibility
  - Added `allowedHosts: ['all']` to vite.config.ts to allow Replit proxy access
  - Configured HMR (Hot Module Reload) for proper proxying (WSS on port 443)
  - Added .env.local file for GEMINI_API_KEY configuration
  - Updated .gitignore to exclude environment files
  - Set up development workflow and deployment configuration

## Project Architecture

### Tech Stack
- **Frontend Framework**: Vite + TypeScript (vanilla, no React/Vue/Angular)
- **Styling**: TailwindCSS (via CDN)
- **AI Integration**: Google Gemini API (@google/genai)
- **Storage**: LocalStorage for video data persistence
- **Metadata**: noembed.com API for video metadata fetching

### File Structure
```
/
├── index.html          # Main HTML with embedded styles and structure
├── index.tsx           # TypeScript entry point with all app logic
├── vite.config.ts      # Vite configuration (port 5000, HMR setup)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── .env.local          # Environment variables (GEMINI_API_KEY)
└── README.md           # Original project documentation
```

### Key Features
1. **Landing Page**: Marketing site with manifesto and feature highlights
2. **Dashboard**: Video collection management interface
3. **Video Saving**: One-click saving from any platform via URL
4. **Smart Search**: AI-powered video organization (using Gemini API)
5. **Custom Cursor**: Interactive cursor effects for enhanced UX
6. **Scroll Animations**: Reveal animations on scroll

### Configuration
- **Server**: Runs on port 5000 (0.0.0.0)
- **HMR**: Configured for Replit proxy (WSS on port 443)
- **Environment**: GEMINI_API_KEY required in .env.local

### API Integration
The app uses Google's Gemini API for AI features. Users need to:
1. Get a Gemini API key from Google AI Studio
2. Add it to .env.local as `GEMINI_API_KEY=your_key_here`

### Development
- **Start Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## User Preferences
None documented yet.
