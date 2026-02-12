
import React, { useRef, useState, useEffect } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface PackageSectionProps {
  language: 'ko' | 'en';
  onBookClick: (pkgId: string) => void;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onBookClick, language }) => {
  const { convertPrice, t } = useGlobal();
  const isEn = language !== 'ko';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync with Firestore (cms_packages) - NO FALLBACK to constants
  useEffect(() => {
    const q = query(collection(db, "cms_packages"), orderBy("id", "asc")); // Sort by ID to keep order roughly consistent
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPackages(fetched);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
          const scrollAmount = 300;
          scrollContainerRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  const themeColors: any = {
    mint: { bg: 'bg-[#40E0D0]', badge: 'BASIC', icon: '💪' },
    yellow: { bg: 'bg-[#FFD700]', badge: 'PREMIUM', icon: '🎤' },
    orange: { bg: 'bg-[#FFB800]', badge: 'PREMIUM', icon: '✨' }
  };

  if (loading) return null; // Don't show anything while initial loading
  if (packages.length === 0) return null; // Don't show section if no packages in DB

  return (
    <section className="w-full max-w-[1280px] mx-auto px-6 pb-6 pt-10 font-sans tracking-tight relative">
        <ScrollReveal>
            <div className="mb-6">
                <div className="text-[18px] mb-1">🎁 <strong>{t('pkg_title')}</strong></div>
                <p className="text-[13px] text-gray-500">{t('pkg_desc_sub')}</p>
            </div>
        </ScrollReveal>

        {/* Scroll Buttons */}
        <button 
            onClick={() => scroll('left')} 
            className="absolute left-2 top-[55%] z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-colors"
        >
            <ChevronLeft size={20} />
        </button>
        <button 
            onClick={() => scroll('right')} 
            className="absolute right-2 top-[55%] z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-colors"
        >
            <ChevronRight size={20} />
        </button>

        {/* Horizontal Scroll Container */}
        <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-8 -mx-6 px-6 no-scrollbar snap-x snap-mandatory relative scroll-smooth"
        >
            {packages.map((pkg, idx) => {
                const theme = themeColors[pkg.theme] || themeColors.mint;
                
                return (
                    <div 
                        key={pkg.id || idx}
                        className="flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-lg snap-center flex flex-col"
                    >
                        {/* Header */}
                        <div className={`h-[140px] ${theme.bg} relative flex flex-col items-center justify-center text-center p-4`}>
                            <span className="absolute top-4 left-4 bg-white/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">{theme.badge}</span>
                            <div className="text-4xl mb-2">{theme.icon}</div>
                            <h3 className="text-white font-black text-[20px] leading-none drop-shadow-md">{isEn ? (pkg.title_en || pkg.title) : pkg.title}</h3>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 flex flex-col">
                            <p className="text-[12px] text-gray-500 font-medium mb-4 text-center">{pkg.description}</p>
                            
                            <ul className="space-y-2 mb-6 flex-1">
                                {pkg.items?.map((item: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-[13px] text-[#333] font-medium">
                                        <div className="w-4 h-4 rounded-full bg-[#00C7AE] flex items-center justify-center text-white"><Check size={10} strokeWidth={4} /></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="border-t border-gray-100 pt-4 mb-4">
                                <div className="flex justify-between items-center text-[12px] text-gray-500 mb-1">
                                    <span>남성</span>
                                    <div><span className="font-bold text-[#111]">{convertPrice(pkg.price * 0.9)}</span> <span className="text-red-500 text-[10px]">10% 할인</span></div>
                                </div>
                                <div className="flex justify-between items-center text-[12px] text-gray-500">
                                    <span>여성</span>
                                    <div><span className="font-bold text-[#111]">{convertPrice(pkg.price)}</span> <span className="text-red-500 text-[10px]">10% 할인</span></div>
                                </div>
                            </div>

                            <button onClick={() => onBookClick(pkg.id)} className="w-full py-3 bg-[#40E0D0] text-white font-bold rounded-lg hover:brightness-95 transition-all text-sm shadow-md">
                                {t('detail')}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </section>
  );
};
