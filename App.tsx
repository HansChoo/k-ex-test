
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

export type PageView = 'home' | 'reservation_basic' | 'reservation_premium' | 'mypage' | 'group_buying';

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
      <Navbar 
        isMenuOpen={isMenuOpen} 
        toggleMenu={toggleMenu} 
        language={language} 
        setLanguage={setLanguage}
        onLogoClick={() => navigateTo('home')}
        onMyPageClick={() => navigateTo('mypage')}
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
      </main>

      <Footer language={language} />
      
      {language === 'ko' ? <AIAssistant /> : <FloatingButtons />}
    </div>
  );
};

export default App;
