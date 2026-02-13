
import React, { useRef } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Check, ChevronRight, ChevronLeft, Info } from 'lucide-react';

interface PackageSectionProps {
  language: 'ko' | 'en';
  onBookClick: (pkgId: string) => void;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onBookClick, language }) => {
  const { convertPrice, t, packages } = useGlobal();
  const isEn = language !== 'ko';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
          const scrollAmount = 300;
          scrollContainerRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  // Theme configuration: Determine background color and icon based on the selected theme in Admin
  const themeColors: any = {
    mint: { bg: 'bg-[#40E0D0]', badge: 'BASIC', icon: '💪' },
    yellow: { bg: 'bg-[#FFD700]', badge: 'PREMIUM', icon: '🎤' },
    orange: { bg: 'bg-[#FFB800]', badge: 'PREMIUM', icon: '✨' }
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto px-6 pb-6 pt-10 font-sans tracking-tight relative">
        <ScrollReveal>
            <div className="mb-6">
                <div className="text-[18px] mb-1">🎁 <strong>{t('pkg_title')}</strong></div>
                <p className="text-[13px] text-gray-500">{t('pkg_desc_sub')}</p>
            </div>
        </ScrollReveal>

        {packages.length === 0 ? (
            <div className="w-full py-16 bg-gray-50 rounded-[16px] flex items-center justify-center text-gray-400 text-sm">
                {isEn ? "Packages are being prepared." : "올인원 패키지가 준비 중입니다."}
            </div>
        ) : (
            <>
                {/* Scroll Buttons */}
                {packages.length > 2 && (
                    <>
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
                    </>
                )}

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
                                    <div className="text-4xl mb-2 drop-shadow-sm">{theme.icon}</div>
                                    <h3 className="text-white font-black text-[20px] leading-none drop-shadow-md px-2 break-keep">
                                        {isEn ? (pkg.title_en || pkg.title) : pkg.title}
                                    </h3>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-[13px] text-gray-500 font-medium mb-4 text-center min-h-[40px] flex items-center justify-center break-keep">
                                        {pkg.description}
                                    </p>
                                    
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {pkg.items?.map((item: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-[13px] text-[#333] font-medium">
                                                <div className="w-4 h-4 rounded-full bg-[#00C7AE] flex items-center justify-center text-white shrink-0 mt-0.5">
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                <span className="leading-tight">{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="border-t border-gray-100 pt-4 mb-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-bold text-gray-400">
                                                {isEn ? "Per Person" : "1인 기준"}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-black text-xl text-[#111]">{convertPrice(pkg.price)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => onBookClick(pkg.id)} className="w-full py-3 bg-[#111] text-white font-bold rounded-lg hover:bg-gray-800 transition-all text-sm shadow-md flex items-center justify-center gap-1">
                                        {t('detail')} <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        )}
    </section>
  );
};
