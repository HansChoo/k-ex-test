
import React, { useState, useEffect } from 'react';
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
import { AdminDashboard } from './pages/AdminDashboard';
import { ProductDetail } from './pages/ProductDetail';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

export type PageView = 'home' | 'reservation_basic' | 'reservation_premium' | 'mypage' | 'group_buying' | 'admin' | 'product_detail';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // State for Dynamic Main Packages
  const [basicPkgData, setBasicPkgData] = useState<any>(null);
  const [premiumPkgData, setPremiumPkgData] = useState<any>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigateTo = (page: PageView) => {
    setCurrentView(page);
    window.scrollTo(0, 0);
  };

  // Fetch Main Package Settings on Load
  useEffect(() => {
    const fetchPackages = async () => {
        try {
            const basicSnap = await getDoc(doc(db, "cms_packages", "package_basic"));
            if (basicSnap.exists()) setBasicPkgData(basicSnap.data());
            
            const premiumSnap = await getDoc(doc(db, "cms_packages", "package_premium"));
            if (premiumSnap.exists()) setPremiumPkgData(premiumSnap.data());
        } catch(e) { console.error("Pkg fetch error", e); }
    };
    fetchPackages();
  }, []);

  // Listen for Product Clicks from ProductList
  useEffect(() => {
      const handleProductNav = (e: any) => {
          setSelectedProduct(e.detail);
          navigateTo('product_detail');
      };
      window.addEventListener('navigate-product-detail', handleProductNav);
      return () => window.removeEventListener('navigate-product-detail', handleProductNav);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative bg-white font-sans tracking-tight">
      <Navbar 
        isMenuOpen={isMenuOpen} 
        toggleMenu={toggleMenu} 
        language={language} 
        setLanguage={setLanguage}
        onLogoClick={() => navigateTo('home')}
        onMyPageClick={() => navigateTo('mypage')}
        onAdminClick={() => navigateTo('admin')}
      />
      
      <main className="flex-grow">
        {currentView === 'home' && (
          <>
            <HeroSection language={language} />
            <PromoSection language={language} onGroupBuyClick={() => navigateTo('group_buying')} />
            {/* Pass Dynamic Package Data */}
            <PackageSection 
                language={language} 
                basicData={basicPkgData}
                premiumData={premiumPkgData}
                onBookClick={() => navigateTo('reservation_basic')}
                onPremiumBookClick={() => navigateTo('reservation_premium')}
            />
            <ProductList language={language} />
            <BottomHero language={language} />
          </>
        )}
        
        {currentView === 'reservation_basic' && (
          <ReservationBasic language={language} pkgData={basicPkgData} />
        )}

        {currentView === 'reservation_premium' && (
          <ReservationPremium language={language} pkgData={premiumPkgData} />
        )}
        
        {currentView === 'product_detail' && selectedProduct && (
            <ProductDetail language={language} product={selectedProduct} />
        )}

        {currentView === 'group_buying' && (
          <GroupBuyingPage language={language} />
        )}

        {currentView === 'mypage' && (
          <MyPage language={language} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard language={language} />
        )}
      </main>

      {currentView !== 'admin' && <Footer language={language} />}
      
      {language === 'ko' ? <AIAssistant /> : <FloatingButtons />}
    </div>
  );
};

export default App;
