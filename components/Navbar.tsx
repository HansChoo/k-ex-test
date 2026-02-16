
import React, { useEffect, useState, useRef } from 'react';
import { Menu, X, Search, User as UserIcon, Star, Globe, ChevronDown, Lock } from 'lucide-react';
import { NAV_LINKS, COUNTRY_CODES } from '../constants';
import { logoutUser, subscribeToAuthChanges } from '../services/authService';
import { User } from 'firebase/auth';
import { useGlobal } from '../contexts/GlobalContext';

interface NavbarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  onLogoClick?: () => void;
  onMyPageClick?: () => void;
  onAdminClick?: () => void;
  onWishlistClick?: () => void;
  onLoginClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isMenuOpen, toggleMenu, onLogoClick, onMyPageClick, onLoginClick, onAdminClick, onWishlistClick }) => {
  const { language, setGlobalMode, t, wishlist } = useGlobal();
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
    });
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => { 
        unsubscribe(); 
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (code: string) => {
      setGlobalMode(code);
      setIsLangOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 font-sans tracking-tight bg-white ${scrolled ? 'shadow-sm border-b border-gray-100' : ''}`}>
      <div className="max-w-[1320px] mx-auto px-4 h-[60px] flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-1 cursor-pointer" onClick={onLogoClick}>
           <Star className="fill-[#0070F0] text-[#0070F0] w-6 h-6" />
           <span className="text-[20px] font-black text-[#0070F0] tracking-tighter">K-Experience</span>
        </div>

        {/* Right: Icons (Language, User Actions) */}
        <div className="flex items-center gap-4">
             {/* Language Dropdown */}
             <div className="relative" ref={langRef}>
                 <button 
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center gap-1.5 text-[#333] hover:text-[#0070F0] transition-colors font-bold text-sm px-2 py-1 rounded-full hover:bg-gray-50"
                 >
                    <Globe size={18} strokeWidth={2} />
                    <span>{language.toUpperCase()}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {/* Dropdown Menu */}
                 {isLangOpen && (
                     <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-fade-in-down">
                         {COUNTRY_CODES.map((country) => (
                             <button
                                key={country.code}
                                onClick={() => handleCountrySelect(country.code)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors ${language === country.lang ? 'bg-blue-50 text-[#0070F0]' : 'text-[#333]'}`}
                             >
                                <span className="flex items-center gap-3">
                                    <span className="text-xl">{country.flag}</span>
                                    <span className="font-bold text-sm">{country.name}</span>
                                </span>
                                {language === country.lang && <div className="w-1.5 h-1.5 rounded-full bg-[#0070F0]"></div>}
                             </button>
                         ))}
                     </div>
                 )}
             </div>

             {/* Auth Section */}
             {user ? (
                 <div className="flex items-center gap-3">
                     {/* My Page Link */}
                     <button onClick={onMyPageClick} className="text-[#333] hover:text-[#0070F0] transition-colors" title={language === 'ko' ? '마이페이지' : 'My Page'}>
                        <UserIcon size={24} strokeWidth={1.5} />
                     </button>
                     {/* Logout Button */}
                     <button onClick={logoutUser} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors whitespace-nowrap">
                        {language === 'ko' ? '로그아웃' : 'Logout'}
                     </button>
                 </div>
             ) : (
                 <button onClick={onLoginClick} className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm">
                    {language === 'ko' ? '로그인/회원가입' : 'Login / Sign Up'}
                 </button>
             )}
        </div>

      </div>
    </nav>
  );
};
