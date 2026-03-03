
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
import { MagazinePreview } from './components/MagazinePreview';
import { Footer } from './components/Footer';
import { ReservationBasic } from './pages/ReservationBasic';
import { ReservationPremium } from './pages/ReservationPremium';
import { GroupBuyingPage } from './pages/GroupBuyingPage';
import { MyPage } from './pages/MyPage';
import { ProductDetail } from './pages/ProductDetail';
import { WishlistPage } from './pages/WishlistPage';
import { MagazinePage } from './pages/MagazinePage';
import { SurveyPage } from './pages/SurveyPage';
import { AllProductsPage } from './pages/AllProductsPage';
import { collection, query, doc, increment, updateDoc, getDocs, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './services/firebaseConfig';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { subscribeToAuthChanges } from './services/authService';
import { User } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export type PageView = 'home' | 'reservation_basic' | 'reservation_premium' | 'mypage' | 'group_buying' | 'admin' | 'product_detail' | 'wishlist' | 'magazine' | 'survey' | 'all_products';

interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const AppContent: React.FC = () => {
  const { language, t, products } = useGlobal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<{id: string, ts: number} | null>(null);
  const [allProductsCategoryLabel, setAllProductsCategoryLabel] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- Router Logic ---
  const navigateTo = (page: PageView, pushState = true) => {
    setCurrentView(page);
    if (pushState) {
        window.location.hash = page === 'home' ? '' : page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageView || 'home';
      if (hash !== currentView) {
          // If it's a product detail, we might need to recover the product object from the products list
          if (hash === 'product_detail' && !selectedProduct) {
              // Fallback: If product object is lost on refresh/back, just go home
              setCurrentView('home');
          } else {
              setCurrentView(hash);
          }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check on mount
    handleHashChange();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedProduct, currentView]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleProtectedNav = (page: string) => {
      if ((page === 'mypage' || page === 'wishlist') && !user) {
          setIsAuthModalOpen(true);
          return;
      }
      
      if (page === 'product_list') {
          navigateTo('home');
          setTimeout(() => {
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
          return;
      }

      navigateTo(page as PageView);
  };

  const handleCategoryClick = (category: string) => {
      setSelectedCategory({ id: category, ts: Date.now() });
      if (currentView !== 'home') {
          navigateTo('home');
          setTimeout(() => {
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
      } else {
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const handleLogoClick = () => {
      setSelectedCategory(null);
      navigateTo('home');
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;
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
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('show-toast', handleToast);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => { window.removeEventListener('show-toast', handleToast); window.removeEventListener('open-auth-modal', handleOpenAuth); };
  }, []);

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin') {
        navigateTo('admin');
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
    if (params.get('page') === 'survey' && params.get('id')) {
        navigateTo('survey');
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


  const handlePackageBookClick = (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (product) {
          setSelectedProduct(product);
          navigateTo('product_detail');
      }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white font-sans tracking-tight text-[#111]">
      
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white py-3 px-4 text-center text-sm font-bold z-[9999] relative">
          Firebase 연동이 설정되지 않았습니다. 환경 변수(VITE_FIREBASE_API_KEY 등)를 설정해 주세요.
        </div>
      )}

      {/* Toast UI */}
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
            <ProductList language={language} initialCategory={selectedCategory} onViewAll={() => { setAllProductsCategoryLabel(undefined); navigateTo('all_products'); }} />
            <PromoSection language={language} onGroupBuyClick={() => navigateTo('group_buying')} />
            <PackageSection language={language} onBookClick={handlePackageBookClick} onViewAll={() => { setAllProductsCategoryLabel('올인원 패키지'); navigateTo('all_products'); }} />
            <MagazinePreview />
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
        {currentView === 'survey' && <SurveyPage language={language} />}
        {currentView === 'all_products' && <AllProductsPage language={language} initialCategoryLabel={allProductsCategoryLabel} />}
        
        {currentView === 'admin' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <AdminDashboard language={language} />
          </Suspense>
        )}
      </main>

      {currentView !== 'admin' && currentView !== 'survey' && <Footer language={language} />}
      {currentView !== 'admin' && currentView !== 'survey' && currentView !== 'product_detail' && <BottomNav onNavClick={handleProtectedNav} currentView={currentView} toggleMenu={toggleMenu} />}
      
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
