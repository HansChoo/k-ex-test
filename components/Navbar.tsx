
import React, { useEffect, useState } from 'react';
import { Menu, X, Search, ShoppingCart, User as UserIcon, ChevronDown, LogOut, Settings } from 'lucide-react';
import { NAV_LINKS, NAV_LINKS_EN } from '../constants';
import { logoutUser, subscribeToAuthChanges } from '../services/authService';
import { User } from 'firebase/auth';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  language: 'ko' | 'en';
  setLanguage: (lang: 'ko' | 'en') => void;
  onLogoClick?: () => void;
  onMyPageClick?: () => void;
  onAdminClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, toggleMenu, language, setLanguage, onLogoClick, onMyPageClick, onAdminClick }) => {
  const links = language === 'ko' ? NAV_LINKS : NAV_LINKS_EN;
  const isEn = language === 'en';
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
    // alert(isEn ? "Logged out." : "로그아웃 되었습니다."); // Optional toast
    if (onLogoClick) onLogoClick(); // Go home
  };

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 font-sans tracking-tight">
      <div className="max-w-[1320px] mx-auto px-4 md:px-6">
        
        {/* Top Utility Bar */}
        <div className="hidden md:flex justify-between items-center h-[42px] text-[12px] text-[#666] border-b border-[#F5F5F5] font-medium">
          {/* Left Side */}
          <div className="flex items-center gap-4">
             <div className="relative group cursor-pointer flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                <span className="tracking-tight">{isEn ? 'English' : '한국어'}</span> <ChevronDown size={10} strokeWidth={2} className="mt-0.5" />
                <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-md hidden group-hover:block z-50 w-24 py-1">
                   <div 
                        className={`px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-[12px] ${!isEn ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                        onClick={() => setLanguage('ko')}
                    >
                        한국어
                   </div>
                   <div 
                        className={`px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-[12px] ${isEn ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                        onClick={() => setLanguage('en')}
                    >
                        English
                   </div>
                </div>
             </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
             {!user ? (
               <>
                 <button onClick={handleLoginClick} className="hover:text-blue-600 transition-colors tracking-tight">{isEn ? 'Sign Up' : '회원가입'}</button>
                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={handleLoginClick} className="hover:text-blue-600 transition-colors tracking-tight">{isEn ? 'Login' : '로그인'}</button>
               </>
             ) : (
               <>
                 <span className="text-blue-600 font-bold">{user.displayName || user.email?.split('@')[0]}님</span>
                 
                 {/* Admin Button */}
                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={onAdminClick} className="flex items-center gap-1 text-[#333] font-bold hover:text-blue-600 transition-colors tracking-tight">
                    <Settings size={12} />
                    {isEn ? 'Admin' : '관리자'}
                 </button>

                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={onMyPageClick} className="hover:text-blue-600 transition-colors tracking-tight">{isEn ? 'My Page' : '마이페이지'}</button>
                 <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
                 <button onClick={handleLogout} className="hover:text-blue-600 transition-colors tracking-tight">{isEn ? 'Logout' : '로그아웃'}</button>
               </>
             )}
             
             <span className="w-px h-2.5 bg-[#DDD] mx-0.5"></span>
             <div className="relative group cursor-pointer flex items-center gap-0.5 hover:text-blue-600 transition-colors">
                <span className="tracking-tight">{isEn ? 'Support' : '고객센터'}</span> <ChevronDown size={10} strokeWidth={2} className="mt-0.5" />
                <div className="absolute top-full right-0 bg-white border border-gray-200 shadow-md hidden group-hover:block z-50 w-24 py-1">
                   <div className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-[12px]">FAQ</div>
                </div>
             </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex justify-between h-[90px] items-center relative">
          
          <div className="flex items-center justify-start flex-1">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center justify-start mr-12 pb-1 cursor-pointer" onClick={onLogoClick}>
                <img 
                    src="//ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/category/logo/v2_eeb789877378fab1385e25cce7da0111_7qvKZ1ZSa9_top.jpg" 
                    alt="K-Experience" 
                    className="h-[26px] object-contain"
                />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
                {links.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      if (link.href === '#') {
                        e.preventDefault();
                        onLogoClick?.();
                      }
                    }}
                    className="text-[#111] hover:text-[#0070F0] transition-colors font-bold text-[17px] tracking-[-0.03em] relative group h-[90px] flex items-center"
                >
                    {link.name}
                </a>
                ))}
            </div>
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center justify-end gap-6">
             <button className="text-[#111] hover:text-[#0070F0] transition-colors"><Search size={24} strokeWidth={1.5} /></button>
             <button onClick={user ? onMyPageClick : handleLoginClick} className="text-[#111] hover:text-[#0070F0] transition-colors"><UserIcon size={24} strokeWidth={1.5} /></button>
             <button className="text-[#111] hover:text-[#0070F0] transition-colors relative">
                <ShoppingCart size={24} strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1.5 bg-[#111] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
             </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center absolute right-0">
            <button
              onClick={toggleMenu}
              className="text-gray-900 p-2 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl z-50">
          <div className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-6 py-4 border-b border-gray-100 text-base font-bold text-gray-900 hover:text-blue-500 tracking-tight"
                onClick={() => {
                  toggleMenu();
                  if(link.href === '#') onLogoClick?.();
                }}
              >
                {link.name}
              </a>
            ))}
            <div className="bg-gray-50 px-6 py-4 space-y-3">
                 <div className="flex justify-between text-sm text-gray-600 tracking-tight">
                     {!user ? (
                       <>
                        <button onClick={() => { toggleMenu(); handleLoginClick(); }}>{isEn ? 'Login' : '로그인'}</button>
                        <button onClick={() => { toggleMenu(); handleLoginClick(); }}>{isEn ? 'Sign Up' : '회원가입'}</button>
                       </>
                     ) : (
                       <>
                        <button onClick={() => { toggleMenu(); onAdminClick?.(); }} className="text-blue-600 font-bold">{isEn ? 'Admin' : '관리자'}</button>
                        <button onClick={() => { toggleMenu(); onMyPageClick?.(); }}>{isEn ? 'My Page' : '마이페이지'}</button>
                        <button onClick={() => { toggleMenu(); handleLogout(); }}>{isEn ? 'Logout' : '로그아웃'}</button>
                       </>
                     )}
                 </div>
                 {/* Language Switch for Mobile */}
                 <div className="flex justify-start gap-4 pt-2 text-sm">
                    <button onClick={() => setLanguage('ko')} className={`tracking-tight ${!isEn ? 'font-bold text-blue-600' : 'text-gray-500'}`}>한국어</button>
                    <button onClick={() => setLanguage('en')} className={`tracking-tight ${isEn ? 'font-bold text-blue-600' : 'text-gray-500'}`}>English</button>
                 </div>
            </div>
          </div>
        </div>
      )}
    </nav>
    <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        language={language} 
    />
    </>
  );
};
