# K-Experience Clone

## Overview
A Korean experience platform (K-Experience) built with React, TypeScript, and Vite. It showcases various K-culture experiences including health checkups, beauty treatments, beauty consulting, and K-POP.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS (via CDN)
- **Build Tool**: Vite 5
- **External Services**: Firebase, Google Gemini AI, PortOne (payments), EmailJS
- **Styling**: Tailwind CSS CDN + Pretendard font

## Project Structure
- `/components/` - Reusable React components (Navbar, Hero, Footer, etc.)
- `/pages/` - Page-level components (Admin, Product Detail, Reservations, etc.)
- `/services/` - Service layer (auth, payments, email, Firebase, Gemini AI)
- `/contexts/` - React context providers
- `App.tsx` - Main application component
- `index.tsx` - Entry point
- `constants.ts` - Shared constants
- `vite.config.ts` - Vite configuration

## Running the App
- **Dev**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Preview**: `npm run preview`

## Deployment
- Static deployment using Vite build output in `dist/` directory
