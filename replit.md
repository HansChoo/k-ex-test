# K-Experience Clone

## Overview
A Korean experience platform (K-Experience) built with React, TypeScript, and Vite. It showcases various K-culture experiences including health checkups, beauty treatments, beauty consulting, and K-POP.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS (via CDN)
- **Build Tool**: Vite 5
- **External Services**: Firebase (Auth, Firestore, Storage), Google Gemini AI, PortOne (payments), EmailJS
- **Styling**: Tailwind CSS CDN + Pretendard font

## Project Structure
- `/components/` - Reusable React components (Navbar, Hero, Footer, AuthModal, etc.)
- `/pages/` - Page-level components (Admin, Product Detail, Reservations, etc.)
- `/services/` - Service layer (auth, payments, email, Firebase, Gemini AI)
- `/contexts/` - React context providers (GlobalContext with real-time Firestore listeners)
- `App.tsx` - Main application component with auth state management
- `index.tsx` - Entry point
- `constants.ts` - Shared constants
- `env.d.ts` - TypeScript declarations for Vite environment variables
- `vite.config.ts` - Vite configuration

## Firebase Configuration
All Firebase credentials are managed via environment variables (no hardcoded values):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY` (for AI assistant)

### Graceful Degradation
- When Firebase env vars are not set, Firebase is NOT initialized (no SDK errors)
- `auth`, `db`, `storage` exports are `null` when unconfigured
- All 16+ files that use Firebase have null guards
- Amber warning banner appears on all pages when Firebase is disconnected
- Empty states shown instead of crashes for categories, products, etc.

## Real-Time Sync
- Uses Firestore `onSnapshot` listeners in `GlobalContext.tsx` for: products, packages, categories, reservations
- Admin dashboard uses separate real-time listeners for admin-specific data
- All listeners are guarded by `isFirebaseConfigured` flag

## Admin Access
- Email: admin@k-experience.com or users with `role: 'admin'` in Firestore `users` collection

## Running the App
- **Dev**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Preview**: `npm run preview`

## Deployment
- Static deployment using Vite build output in `dist/` directory
