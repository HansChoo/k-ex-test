
import React, { useState, useEffect, Suspense } from 'react';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HeroSection } from './components/HeroSection';
import { CategorySection } from './components/CategorySection';
import { PromoSection } from './components/PromoSection';
import { PackageSection } from './components/PackageSection';
import { ProductList } from './components/ProductList';
import { BottomHero } from './components/BottomHero';
import { Footer } from './components/Footer';
import { ReservationBasic } from './pages/ReservationBasic';
import { ReservationPremium } from './pages/ReservationPremium';
import { GroupBuyingPage } from './pages/GroupBuyingPage';
import { MyPage } from './pages/MyPage';
import { ProductDetail } from './pages/ProductDetail';
import { WishlistPage } from './pages/WishlistPage';
import { MagazinePage } from './pages/MagazinePage';
import { SurveyPage } from './pages/SurveyPage'; // New Import
import { collection, query, doc, increment, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from './services/firebaseConfig';
import { X, CheckCircle, AlertCircle, Info, ShoppingBag, Loader2 } from 'lucide-react';
import { subscribeToAuthChanges } from './services/authService';
import { User } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export type PageView = 'home' | 'reservation_basic' | 'reservation_premium' | 'mypage' | 'group_buying' | 'admin' | 'product_detail' | 'wishlist' | 'magazine' | 'survey';

interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const AppContent: React.FC = () => {
  const { language, t, packages } = useGlobal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [socialProof, setSocialProof] = useState<{name: string, country: string, product: string} | null>(null);
  
  // Category Selection State (Stores ID and timestamp to force updates)
  const [selectedCategory, setSelectedCategory] = useState<{id: string, ts: number} | null>(null);
  
  // Auth State Lifted to App Level
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigateTo = (page: PageView) => {
    setCurrentView(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
  };

  // Scroll to top on initial load
  useEffect(() => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Protected Navigation Handler
  const handleProtectedNav = (page: string) => {
      // Protected Routes check
      if ((page === 'mypage' || page === 'wishlist') && !user) {
          setIsAuthModalOpen(true);
          return;
      }
      
      // Default Navigation
      if (page === 'home' || page === 'group_buying' || page === 'wishlist' || page === 'mypage') {
          navigateTo(page as PageView);
      }
      // Handle 'product_list' nav click (from bottom nav) -> Go Home and Scroll
      if (page === 'product_list') {
          setCurrentView('home');
          setTimeout(() => {
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  const handleCategoryClick = (category: string) => {
      // 1. Set category with timestamp to ensure ProductList detects change even if clicking same category
      setSelectedCategory({ id: category, ts: Date.now() });

      // 2. Ensure we are on Home view
      if (currentView !== 'home') {
          setCurrentView('home');
          // ProductList will mount and useEffect will handle the scroll
      } else {
          // 3. If already on home, manually scroll
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const handleLogoClick = () => {
      setSelectedCategory(null); // Reset category filter so it doesn't auto-scroll down
      navigateTo('home');
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleToast = (e: any) => {
      const newToast: ToastMsg = {
        id: Date.now(),
        message: e.detail.message,
        type: e.detail.type || 'info'
      };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== newToast.id)), 3000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Admin Shortcut
    if (params.get('mode') === 'admin') {
        setCurrentView('admin');
        window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Survey Route Handling
    if (params.get('page') === 'survey' && params.get('id')) {
        setCurrentView('survey');
    }

    const refCode = params.get('ref');
    if (refCode) {
        sessionStorage.setItem('k_exp_ref', refCode);
        (async () => {
            try {
                const q = query(collection(db, "affiliates"), where("code", "==", refCode));
                const snap = await getDocs(q);
                if(!snap.empty) await updateDoc(snap.docs[0].ref, { clicks: increment(1) });
            } catch(e) { console.error("Ref track error", e); }
        })();
    }
  }, []);

  useEffect(() => {
      const handleProductNav = (e: any) => {
          setSelectedProduct(e.detail);
          navigateTo('product_detail');
      };
      const handleMagNav = () => navigateTo('magazine');
      
      window.addEventListener('navigate-product-detail', handleProductNav);
      window.addEventListener('navigate-magazine', handleMagNav);
      
      return () => {
          window.removeEventListener('navigate-product-detail', handleProductNav);
          window.removeEventListener('navigate-magazine', handleMagNav);
      };
  }, []);

  // Social Proof Logic
  useEffect(() => {
      const SOCIAL_DATA = [
          { country: "🇺🇸 USA", names: ["James", "Emma", "Michael", "Olivia", "William"] },
          { country: "🇬🇧 UK", names: ["Oliver", "George", "Amelia", "Lily", "Harry"] },
          { country: "🇰🇷 Korea", names: ["Minji", "Junho", "Seoyan", "Dohyung", "Jiwoo"] },
          { country: "🇯🇵 Japan", names: ["Haruto", "Yui", "Ren", "Sakura", "Hiroto"] },
          { country: "🇨🇳 China", names: ["Wei", "Li", "Chen", "Zhang", "Liu"] },
          { country: "🇫🇷 France", names: ["Gabriel", "Leo", "Louise", "Alice"] },
          { country: "🇩🇪 Germany", names: ["Noah", "Leon", "Mia", "Hannah"] }
      ];
      const products = ["K-IDOL Basic", "Health Checkup", "Glass Skin Pkg", "Rejuran Boost"];
      const showPopup = () => {
          const randomRegion = SOCIAL_DATA[Math.floor(Math.random() * SOCIAL_DATA.length)];
          const randomName = randomRegion.names[Math.floor(Math.random() * randomRegion.names.length)];
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          setSocialProof({ name: randomName, country: randomRegion.country, product: randomProduct });
          setTimeout(() => setSocialProof(null), 5000);
          const nextInterval = Math.random() * 30000 + 20000;
          setTimeout(showPopup, nextInterval);
      };
      const timer = setTimeout(showPopup, 10000);
      return () => clearTimeout(timer);
  }, []);

  const handlePackageBookClick = (pkgId: string) => {
      // Find package in fetched packages
      const pkg = packages.find(p => p.id === pkgId);
      if (pkg) {
          setSelectedProduct(pkg);
          navigateTo('product_detail');
      } else {
          // Fallback legacy logic if not found
          if (pkgId.includes('pkg_idol')) navigateTo('reservation_premium');
          else if (pkgId.includes('pkg_glow')) navigateTo('reservation_premium');
          else navigateTo('reservation_basic');
      }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white font-sans tracking-tight text-[#111]">
      
      {/* Toast */}
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl backdrop-blur-md border animate-fade-in-down ${toast.type === 'success' ? 'bg-black/80 text-white border-black' : toast.type === 'error' ? 'bg-red-500/90 text-white border-red-600' : 'bg-blue-500/90 text-white border-blue-600'}`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle size={18} className="text-green-400"/>}
              {toast.type === 'error' && <AlertCircle size={18} className="text-white"/>}
              {toast.type === 'info' && <Info size={18} className="text-white"/>}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)}><X size={16}/></button>
          </div>
        ))}
      </div>

      {/* Social Proof */}
      {socialProof && currentView === 'home' && (
          <div className="fixed bottom-24 right-4 z-40 bg-white/95 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up max-w-[90%] md:max-w-[320px]">
              <div className="w-10 h-10 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                  <ShoppingBag size={18} />
              </div>
              <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">{t('just_purchased')}</p>
                  <p className="text-xs font-bold text-[#111] leading-tight truncate">
                      {socialProof.country} <span className="text-blue-600">{socialProof.name}</span>
                  </p>
                  <p className="text-xs font-black text-[#111] truncate">"{socialProof.product}"</p>
              </div>
              <button onClick={() => setSocialProof(null)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"><X size={12}/></button>
          </div>
      )}

      {currentView !== 'admin' && currentView !== 'survey' && (
          <Navbar 
            isMenuOpen={isMenuOpen} 
            toggleMenu={toggleMenu} 
            onLogoClick={handleLogoClick}
            onMyPageClick={() => handleProtectedNav('mypage')}
            onAdminClick={() => navigateTo('admin')}
            onWishlistClick={() => handleProtectedNav('wishlist')}
            onLoginClick={() => setIsAuthModalOpen(true)}
          />
      )}
      
      <main className={`flex-grow pb-24 md:pb-0 transition-all duration-300 ${currentView === 'home' ? '' : 'pt-4'}`}>
        {currentView === 'home' && (
          <>
            <HeroSection language={language} />
            <CategorySection onCategoryClick={handleCategoryClick} />
            <PromoSection language={language} onGroupBuyClick={() => navigateTo('group_buying')} />
            <PackageSection language={language} onBookClick={handlePackageBookClick} />
            <ProductList language={language} initialCategory={selectedCategory} />
            <BottomHero language={language} />
          </>
        )}
        {currentView === 'reservation_basic' && <ReservationBasic language={language} />}
        {currentView === 'reservation_premium' && <ReservationPremium language={language} />}
        {currentView === 'product_detail' && selectedProduct && <ProductDetail language={language} product={selectedProduct} />}
        {currentView === 'group_buying' && <GroupBuyingPage language={language} />}
        {currentView === 'mypage' && <MyPage language={language} />}
        {currentView === 'magazine' && <MagazinePage />}
        {currentView === 'wishlist' && <WishlistPage language={language} />}
        
        {/* Survey Page Route */}
        {currentView === 'survey' && <SurveyPage language={language} />}
        
        {currentView === 'admin' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <AdminDashboard language={language} />
          </Suspense>
        )}
      </main>

      {currentView !== 'admin' && currentView !== 'survey' && <Footer language={language} />}
      {currentView !== 'admin' && currentView !== 'survey' && <BottomNav onNavClick={handleProtectedNav} currentView={currentView} toggleMenu={toggleMenu} />}
      
      {/* Global Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} language={language} />
    </div>
  );
};

const App: React.FC = () => {
    return (
        <GlobalProvider>
            <AppContent />
        </GlobalProvider>
    );
};

export default App;
