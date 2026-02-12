
import React from 'react';
import { Home, Grid, Heart, User, Users } from 'lucide-react';
import { useGlobal } from '../contexts/GlobalContext';

interface BottomNavProps {
  onNavClick: (view: string) => void;
  currentView: string;
  toggleMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNavClick, currentView, toggleMenu }) => {
  const { wishlist, t } = useGlobal();

  const navItems = [
    { id: 'home', icon: Home, label: t('tab_all') === 'All' ? 'Home' : '홈' },
    { id: 'group_buying', icon: Users, label: t('promo_badge') === 'Group Buy Promotion' ? 'Group Buy' : '공동구매' },
    { id: 'product_list', icon: Grid, label: t('prod_title') === 'All K-Experience Products' ? 'All Exp.' : '전체체험' },
    { id: 'wishlist', icon: Heart, label: t('wishlist'), count: wishlist.length },
    { id: 'mypage', icon: User, label: t('mypage') },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 flex justify-between items-end h-[80px] pb-6">
      {navItems.map((item) => {
        const isActive = currentView === item.id || (currentView === 'home' && item.id === 'home'); // Basic active logic
        return (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${isActive ? 'text-[#0070F0] -translate-y-1' : 'text-[#999]'}`}
          >
            <div className="relative">
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-[#0070F0]/10' : ''} />
                {item.count ? <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.count}</span> : null}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
