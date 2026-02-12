
import React, { useEffect, useState } from 'react';
import { Menu, X, Search, ShoppingCart, User as UserIcon, ChevronDown, Settings, Heart } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import { logoutUser, subscribeToAuthChanges } from '../services/authService';
import { User } from 'firebase/auth';
import { AuthModal } from './AuthModal';
import { useGlobal } from '../contexts/GlobalContext';

interface NavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  onLogoClick?: () => void;
  onMyPageClick?: () => void;
  onAdminClick?: () => void;
  onWishlistClick?: () => void;
}

const COUNTRIES = [
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', lang: '한국어', curr: 'KRW' },
    { code: 'US', name: 'USA', flag: '🇺🇸', lang: 'English', curr: 'USD' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', lang: '日本語', curr: 'JPY' },
    { code: 'CN', name: 'China', flag: '🇨🇳', lang: '中文', curr: 'CNY' }
];

export const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, toggleMenu, onLogoClick, onMyPageClick, onAdminClick, onWishlistClick }) => {
  const { language, setGlobalMode, t, currency, wishlist } = useGlobal();
  
  // Dynamic Links based on language
  const links = NAV_LINKS[language] || NAV_LINKS['en'];
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const ADMIN_EMAIL = "admin@k-experience.com";

  const currentCountry = COUNTRIES.find(c => c.curr === currency) || COUNTRIES[1];

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    if (onLogoClick) onLogoClick();
  };

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 font-sans tracking-tight">
      <div className="max-w-[1320px] mx-auto px-4 md:px-6">
        
        {/* Top Utility Bar */}
        <div className="hidden md:flex justify-between items-center h-[42px] text-[12px] text-[#666] border-b border-[#F5F5F5] font-medium">
          <div className="flex items-center gap-4">
             <div className="relative group cursor-pointer flex items-center gap-1.5 hover:text-blue-600 transition-colors py-2">
                <span className="text-base leading-none">{currentCountry.flag}</span>
                <span className="tracking-tight font-bold text-[#444] group-hover:text-blue-600">
                    {currentCountry.curr} ({currentCountry.lang})
                </span> 
                <ChevronDown size={10} strokeWidth={2} className="mt-0.5 opacity-50" />
                <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl hidden group-hover:block z-50 w-40 rounded-lg overflow-hidden py-1 animate-fade-in">
                   {COUNTRIES.map((country) => (
                       <div key={country.code} className={`px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-[12px] flex items-center gap-2 ${currency === country.curr ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`} onClick={() => setGlobalMode(country.code)}>
                            <span className="text-lg">{country.flag}</span>
                            <span>{country.curr} - {country.lang}</span>
                       </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {!user ? (
               <>
                 <button onClick={handleLoginClick} className="hover:text-blue-600 transition-colors tracking-tight">{t('signup')}</button>
                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={handleLoginClick} className="hover:text-blue-600 transition-colors tracking-tight">{t('login')}</button>
               </>
             ) : (
               <>
                 <span className="text-blue-600 font-bold">{user.displayName || user.email?.split('@')[0]}</span>
                 {user.email === ADMIN_EMAIL && (
                   <>
                     <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                     <button onClick={onAdminClick} className="flex items-center gap-1 text-[#333] font-bold hover:text-blue-600 transition-colors tracking-tight"><Settings size={12} /> {t('admin')}</button>
                   </>
                 )}
                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={onMyPageClick} className="hover:text-blue-600 transition-colors tracking-tight">{t('mypage')}</button>
                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={handleLogout} className="hover:text-blue-600 transition-colors tracking-tight">{t('logout')}</button>
               </>
             )}
          </div>
        </div>

        {/* Main Header */}
        <div className="flex justify-between h-[90px] items-center relative">
          <div className="flex items-center justify-start flex-1">
            <div className="flex-shrink-0 flex items-center justify-start mr-12 pb-1 cursor-pointer" onClick={onLogoClick}>
                <img src="//ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/category/logo/v2_eeb789877378fab1385e25cce7da0111_7qvKZ1ZSa9_top.jpg" alt="K-Experience" className="h-[26px] object-contain"/>
            </div>
            <div className="hidden md:flex items-center gap-10">
                {links.map((link: any) => (
                <a key={link.name} href={link.href} onClick={(e) => { if (link.href === '#') { e.preventDefault(); onLogoClick?.(); } }} className="text-[#111] hover:text-[#0070F0] transition-colors font-bold text-[17px] tracking-[-0.03em] relative group h-[90px] flex items-center">
                    {link.name}
                </a>
                ))}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-end gap-5">
             <button onClick={onWishlistClick} className="text-[#111] hover:text-[#FF4D4D] transition-colors relative p-1">
                <Heart size={24} strokeWidth={1.5} className={wishlist.length > 0 ? "fill-red-500 text-red-500" : ""} />
                {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-[#FF4D4D] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold shadow-sm">{wishlist.length}</span>}
             </button>
             <button className="text-[#111] hover:text-[#0070F0] transition-colors"><Search size={24} strokeWidth={1.5} /></button>
             <button onClick={user ? onMyPageClick : handleLoginClick} className="text-[#111] hover:text-[#0070F0] transition-colors"><UserIcon size={24} strokeWidth={1.5} /></button>
          </div>

          <div className="md:hidden flex items-center absolute right-0">
            <button onClick={toggleMenu} className="text-gray-900 p-2 focus:outline-none">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl z-50">
          <div className="flex flex-col">
            {links.map((link: any) => (
              <a key={link.name} href={link.href} className="block px-6 py-4 border-b border-gray-100 text-base font-bold text-gray-900 hover:text-blue-500 tracking-tight" onClick={() => { toggleMenu(); if(link.href === '#') onLogoClick?.(); }}>{link.name}</a>
            ))}
            <div className="bg-gray-50 px-6 py-4 space-y-4">
                 <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map(c => (
                        <button key={c.code} onClick={() => setGlobalMode(c.code)} className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-bold ${currency === c.curr ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}><span>{c.flag}</span><span>{c.curr}</span></button>
                    ))}
                 </div>
            </div>
          </div>
        </div>
      )}
    </nav>
    <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} language={language} />
    </>
  );
};
