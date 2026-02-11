
import React, { useState } from 'react';
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

export type PageView = 'home' | 'reservation_basic' | 'reservation_premium' | 'mypage' | 'group_buying' | 'admin';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [currentView, setCurrentView] = useState<PageView>('home');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigateTo = (page: PageView) => {
    setCurrentView(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white font-sans tracking-tight">
      {/* Hide Navbar only on Admin Dashboard if preferred, but keeping it for navigation is fine. */}
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
            <PackageSection 
                language={language} 
                onBookClick={() => navigateTo('reservation_basic')}
                onPremiumBookClick={() => navigateTo('reservation_premium')}
            />
            <ProductList language={language} />
            <BottomHero language={language} />
          </>
        )}
        
        {currentView === 'reservation_basic' && (
          <ReservationBasic language={language} />
        )}

        {currentView === 'reservation_premium' && (
          <ReservationPremium language={language} />
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
