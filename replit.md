# K-Experience Clone

## Overview
A Korean experience platform (K-Experience) built with React, TypeScript, and Vite. It showcases various K-culture experiences including health checkups, beauty treatments, beauty consulting, and K-POP. Supports 4 languages (Korean, English, Japanese, Chinese) with full multilingual content management.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS (via CDN)
- **Build Tool**: Vite 5
- **External Services**: Firebase (Auth, Firestore, Storage), Google Gemini AI, PayPal (payments), EmailJS
- **Backend**: Express.js (PayPal API server on port 3001)
- **Rich Text Editor**: Tiptap (ProseMirror-based) with extensions
- **Styling**: Tailwind CSS CDN + Pretendard font

## Project Structure
- `/styles/` - CSS files (tiptap-editor.css for rich text editor styling)
- `/components/` - Reusable React components (Navbar, Hero, Footer, AuthModal, RichTextEditor, MagazinePreview, etc.)
- `/pages/` - Page-level components (Admin, Product Detail, Reservations, MagazinePage, etc.)
- `/server/` - Express backend (PayPal order creation, capture API)
- `/services/` - Service layer (auth, paypal, email, Firebase, Gemini AI, seoService)
- `/contexts/` - React context providers (GlobalContext with real-time Firestore listeners)
- `App.tsx` - Main application component with auth state management
- `index.tsx` - Entry point
- `constants.ts` - Shared constants
- `env.d.ts` - TypeScript declarations for Vite environment variables
- `vite.config.ts` - Vite configuration

## Multilingual System (4 Languages)
- **Languages**: Korean (ko), English (en), Japanese (ja), Chinese (zh)
- **Currencies**: KRW, USD, JPY, CNY with real-time exchange rate conversion
- **UI Translation**: `t()` function with 200+ keys per language in `TRANSLATIONS` object (GlobalContext.tsx). All 4 languages fully translated.
- **Content Localization**: `getLocalizedValue(data, field)` reads `field_en`, `field_ja`, `field_zh` with Korean fallback
- **Admin Language Tabs**: Product, Magazine editors have 🇰🇷/🇺🇸/🇨🇳/🇯🇵 tabs for per-language content (title, description, content, image)
- **All-in-One Packages**: Managed as regular products with "올인원 패키지" category (no separate cms_packages collection). PackageSection filters products by category name.
- **Category Labels**: `label` (ko), `labelEn` (en), `label_ja` (ja), `label_zh` (zh) fields
- **Firestore Field Pattern**: Korean = base fields (title, description, content, image), Other languages = suffixed fields (title_en, description_en, content_en, image_en, etc.)
- **Magazine/MagazinePreview**: Uses `getLocalizedValue()` for title, subtitle, content - admin can manage per-language magazine content
- **No Hardcoded UI Text**: All user-facing text uses `t()` function (Navbar, ProductList, PackageSection, MagazinePage, BottomHero, BottomNav, CategorySection, RecommendationQuiz, Footer)

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
- Uses Firestore `onSnapshot` listeners in `GlobalContext.tsx` for: products, categories, reservations
- Admin dashboard uses separate real-time listeners for admin-specific data (reviews, faqs, etc.)
- ProductDetail uses per-product onSnapshot listeners for reviews and FAQs
- All listeners are guarded by `isFirebaseConfigured` flag

## Product Detail Tabs
- **Detail**: Rich text content (from admin editor), localized via `getLocalizedValue`
- **Reviews**: Firebase `reviews` collection, filtered by productId, real-time sync
- **FAQ**: Firebase `faqs` collection, filtered by productId, accordion UI, real-time sync
- **MAP**: Google Maps embed from `mapLocations` array on product document

## Mobile Booking Flow
- **Desktop**: Right sidebar with sticky booking panel (date → option → guest → payment)
- **Mobile (lg:hidden)**: Fixed bottom bar with price + "Book Now" button
- **Mobile Modal**: Full-screen step-by-step booking flow (date → option → guest info → payment)
- Step indicator with progress bar at top, Back/Next navigation at bottom
- Guest validation requires name + messengerId before proceeding to payment
- PayPal checkout fully supported in mobile modal
- All UI text uses `t()` translation keys for 4-language support

## Admin Product Sub-tabs
- Categories (with 4-language label fields), Items
- Product edit modal includes language tabs (🇰🇷/🇺🇸/🇨🇳/🇯🇵) for multilingual content entry
- Product edit modal includes inline management for: MAP locations, Reviews, FAQ (all per-product, Firebase CRUD)
- Magazine editor also has language tabs
- **Product Ordering**: Admin items list has ↑↓ buttons to reorder products; `order` field saved to Firestore via batch write, GlobalContext sorts products by `order` asc (fallback 9999)
- **Category Ordering**: Admin category list has ↑↓ buttons to reorder categories; `order` field saved via batch write, GlobalContext sorts categories by `order` asc
- **Product Options**: Admin can add multiple options (name + price) per product. Lowest option price auto-sets as product base price. Options saved as `options` array in Firestore. ProductDetail shows option selection step (STEP 2) before guest info. ProductList/AllProductsPage show "~" prefix for products with options.

## Wishlist & Cart
- **Wishlist**: Stored in Firestore `user_data/{uid}` document, synced across devices via `onSnapshot` listener
- **Cart**: Stored in Firestore `user_data/{uid}` document, synced across devices via `onSnapshot` listener
- **Data Sync**: On login, wishlist/cart loaded from Firestore; on logout, local state cleared; real-time listener keeps data in sync across tabs/devices
- **Auth Check**: Heart (wishlist) and Plus (cart) buttons on product cards check `auth.currentUser`; if not logged in, dispatches `open-auth-modal` event to show AuthModal
- **MyPage Tabs**: Reservations, Wishlist, Cart, 1:1 Inquiries — wishlist shows products with view/remove actions, cart shows items with quantity controls and total summary
- **Toast Notifications**: Adding to cart triggers a success toast via `show-toast` custom event

## Admin Access
- Email: admin@k-experience.com or users with `role: 'admin'` in Firestore `users` collection

## PayPal Payment Integration
- **Secrets**: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` (Sandbox mode)
- **Backend**: Express server on port 3001, handles order creation and capture
- **Frontend**: PayPal JS SDK loaded dynamically, Smart Payment Buttons
- **Flow**: User fills booking form → clicks "Book Now" → PayPal buttons appear → payment → reservation created in Firestore
- **Currency**: Real-time exchange rate for USD/JPY/CNY via Frankfurter API (`/api/exchange-rate` endpoint), 1-hour server cache, backup API fallback, `currencyService.ts` fetches rates on app load → `liveRates` state in GlobalContext
- **Live Rate Indicator**: Green pulsing dot with "Live exchange rate" text appears next to prices when viewing in non-KRW currency. Uses `ratesLoaded` flag from GlobalContext.
- **Pages**: ProductDetail, ReservationBasic, ReservationPremium all use PayPal
- **Vite Proxy**: `/api` routes proxied to backend server (port 3001)

## Visitor Counter
- HeroSection shows real-time visitor count from Firestore `site_stats/visitors` document
- Uses atomic `increment(1)` with `merge: true` (no race conditions)
- Real-time updates via `onSnapshot` listener
- Fallback to BASE_COUNT=2847 when Firebase not connected

## No Hardcoded Fake Data Policy
- No fake user counts, mock reviews, or simulated social proof notifications
- All reviews come from Firebase only; empty state shown when no reviews exist
- Calendar dates are dynamically generated based on current date (next month)
- Exchange rates are fetched from real APIs (Frankfurter + backup), never static values
- Company info in Footer is real business data from `constants.ts` COMPANY_INFO
- `PRODUCTS_DATA` in constants.ts is reference data for AI chatbot only, not displayed in UI

## Guest Reservation Form
- All fields with labels: Passport Name, Date of Birth, Gender, Nationality (dropdown: 60+ countries), Phone Number (auto country code based on nationality), Messenger App (WhatsApp/KakaoTalk/LINE/WeChat), Messenger ID
- NATIONALITIES array in ProductDetail.tsx includes 60+ countries with ISO codes and phone country codes
- All labels use `t()` function for multilingual display

## Mobile Product Detail Layout
- BottomNav always visible on mobile (md:hidden, fixed bottom-0, z-50, h-[80px])
- Booking bar positioned above BottomNav on mobile (bottom-[80px] md:bottom-0)
- Full-screen booking modal (z-[60]) overlays everything when opened

## Product Card Consistency
- ProductList (home) and AllProductsPage use identical card styles: aspect-square images, rounded-[16px], p-4, category emoji+label, text-[14px] title, text-[16px] price

## Running the App
- **Dev**: `npm run dev` (starts Express backend + Vite frontend)
- **Build**: `npm run build` (outputs to `dist/`)
- **Preview**: `npm run preview`

## Deployment
- Backend: Express server for PayPal API (port 3001)
- Frontend: Vite build output in `dist/` directory
- Deployment type: VM (needs backend server running)
