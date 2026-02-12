
import React, { useState, useEffect, Suspense } from 'react';
import { GlobalProvider, useGlobal } from './contexts/GlobalContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PromoSection } from './components/PromoSection';
import { PackageSection } from './components/PackageSection';
import { ProductList } from './components/ProductList';
import { BottomHero } from './components/BottomHero';
import { Footer } from './components/Footer';
import { AIAssistant } from './components/AIAssistant';
import { FloatingButtons } from './components/FloatingButtons';
import { ReservationBasic } from './pages/ReservationBasic';
import { ReservationPremium } from './pages/ReservationPremium';
import { GroupBuyingPage } from './pages/GroupBuyingPage';
import { MyPage } from './pages/MyPage';
import { ProductDetail } from './pages/ProductDetail';
import { WishlistPage } from './pages/WishlistPage';
import { MagazinePage } from './pages/MagazinePage';
import { collection, onSnapshot, query, orderBy, doc, increment, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from './services/firebaseConfig';
import { X, CheckCircle, AlertCircle, Info, ShoppingBag, Loader2 } from 'lucide-react';

const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

export type PageView = 'home' | 'reservation_basic' | 'reservation_premium' | 'mypage' | 'group_buying' | 'admin' | 'product_detail' | 'wishlist' | 'magazine';

interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Fallback Data if DB is empty
const DEFAULT_PACKAGES = [
    {
        id: 'package_basic',
        title: 'K-체험 올인원 패키지 - 베이직',
        title_en: 'K-Experience All-in-One Package - Basic',
        price: 2763000,
        originalPrice: 3070000,
        description: '건강검진 (Basic) + K-IDOL (Basic) + GLASS SKIN Package',
        description_en: 'Health Check (Basic) + K-IDOL (Basic) + GLASS SKIN Package',
    },
    {
        id: 'package_premium',
        title: 'K-체험 올인원 패키지 - 프리미엄',
        title_en: 'K-Experience All-in-One Package - Premium',
        price: 7515000,
        originalPrice: 8350000,
        description: '건강검진 (Premium) + K-IDOL (Premium) + REJURAN BOOST Package',
        description_en: 'Health Check (Premium) + K-IDOL (Premium) + REJURAN BOOST Package',
    }
];

const AppContent: React.FC = () => {
  const { language, t } = useGlobal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [socialProof, setSocialProof] = useState<{name: string, country: string, product: string} | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigateTo = (page: PageView) => {
    setCurrentView(page);
    window.scrollTo(0, 0);
  };

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

  // --- Affiliate & Admin Check ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Admin Route
    if (params.get('mode') === 'admin') {
        setCurrentView('admin');
        window.history.replaceState({}, '', window.location.pathname);
    }

    // Affiliate Tracking
    const refCode = params.get('ref');
    if (refCode) {
        sessionStorage.setItem('k_exp_ref', refCode);
        (async () => {
            try {
                const q = query(collection(db, "affiliates"), where("code", "==", refCode));
                const snap = await getDocs(q);
                if(!snap.empty) {
                    await updateDoc(snap.docs[0].ref, { clicks: increment(1) });
                }
            } catch(e) { console.error("Ref track error", e); }
        })();
    }
  }, []);

  useEffect(() => {
    const q = collection(db, "cms_packages");
    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            setPackages(DEFAULT_PACKAGES);
        } else {
            const pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            pkgs.sort((a,b) => a.id.localeCompare(b.id)); 
            setPackages(pkgs);
        }
    });
    return () => unsubscribe();
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

  // Correctly Matched Social Proof Data
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
      if (pkgId.includes('premium')) {
          navigateTo('reservation_premium');
      } else {
          navigateTo('reservation_basic');
      }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white font-sans tracking-tight">
      
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl backdrop-blur-md border animate-fade-in-down ${toast.type === 'success' ? 'bg-gray-900/95 text-white border-gray-800' : toast.type === 'error' ? 'bg-red-500/95 text-white border-red-600' : 'bg-blue-500/95 text-white border-blue-600'}`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle size={20} className="text-green-400"/>}
              {toast.type === 'error' && <AlertCircle size={20} className="text-white"/>}
              {toast.type === 'info' && <Info size={20} className="text-white"/>}
              <span className="font-bold text-sm tracking-tight">{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity"><X size={16}/></button>
          </div>
        ))}
      </div>

      {socialProof && currentView === 'home' && (
          <div className="fixed bottom-24 right-4 md:left-6 md:right-auto z-40 bg-white/90 backdrop-blur-md border border-gray-200 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 animate-slide-up max-w-[300px]">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <ShoppingBag size={20} />
              </div>
              <div>
                  <p className="text-xs text-gray-500 font-bold mb-0.5">{t('just_purchased')}</p>
                  <p className="text-sm font-bold text-[#333] leading-tight">
                      {socialProof.country} <span className="text-blue-600">{socialProof.name}</span> {t('bought')} <br/>
                      <span className="text-black font-black">"{socialProof.product}"</span>
                  </p>
              </div>
              <button onClick={() => setSocialProof(null)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"><X size={12}/></button>
          </div>
      )}

      {currentView !== 'admin' && (
          <Navbar 
            isMenuOpen={isMenuOpen} 
            toggleMenu={toggleMenu} 
            onLogoClick={() => navigateTo('home')}
            onMyPageClick={() => navigateTo('mypage')}
            onAdminClick={() => navigateTo('admin')}
            onWishlistClick={() => navigateTo('wishlist')}
          />
      )}
      
      <main className="flex-grow">
        {currentView === 'home' && (
          <>
            <HeroSection language={language} />
            <PromoSection language={language} onGroupBuyClick={() => navigateTo('group_buying')} />
            <PackageSection 
                language={language} 
                packages={packages}
                onBookClick={handlePackageBookClick}
            />
            <ProductList language={language} />
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
        
        {currentView === 'admin' && (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <AdminDashboard language={language} />
          </Suspense>
        )}
      </main>

      {currentView !== 'admin' && <Footer language={language} />}
      
      {currentView !== 'admin' && (language === 'ko' ? <AIAssistant /> : <FloatingButtons />)}
      {currentView !== 'admin' && <AIAssistant />}
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
