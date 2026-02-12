
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';

interface PackageSectionProps {
  language: 'ko' | 'en';
  packages: any[];
  onBookClick: (pkgId: string) => void;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onBookClick, packages }) => {
  const { convertPrice, t } = useGlobal();

  // Determine grid columns based on package count to ensure good layout
  let gridClass = 'grid-cols-1 md:grid-cols-2'; // Default for 2
  if (packages.length === 1) gridClass = 'grid-cols-1 max-w-[600px] mx-auto';
  else if (packages.length === 3) gridClass = 'grid-cols-1 md:grid-cols-3';
  else if (packages.length >= 4) gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-10 font-sans tracking-tight">
        <ScrollReveal>
            <div className="flex justify-center mb-12">
                <div className="bg-white px-8 py-3 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                    <span className="text-[#0070F0] font-black text-lg">★</span>
                    <span className="text-[#111] font-bold text-[18px] tracking-[-0.03em]">{t('pkg_title')}</span>
                </div>
            </div>
        </ScrollReveal>

        <div className={`grid ${gridClass} gap-6`}>
            {packages.map((pkg, idx) => {
                // Determine styling based on package ID or order
                const isPremium = pkg.id.includes('premium');
                const isBasic = pkg.id.includes('basic');
                // Fallback style for new dynamic packages
                const isCustom = !isBasic && !isPremium;

                const headerColor = isPremium ? 'bg-[#C8A32B]' : isBasic ? 'bg-[#0070F0]' : 'bg-[#333]';
                const shadowColor = isPremium ? 'hover:shadow-[0_20px_50px_rgba(200,163,43,0.15)]' : isBasic ? 'hover:shadow-[0_20px_50px_rgba(0,112,240,0.15)]' : 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]';
                const boxBg = isPremium ? 'group-hover:bg-[#FFFBE6]' : isBasic ? 'group-hover:bg-[#F0F8FF]' : 'group-hover:bg-gray-50';
                
                return (
                    <ScrollReveal key={pkg.id} delay={100 + (idx * 100)} className="h-full">
                        <div className={`bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${shadowColor} transition-all duration-300 flex flex-col h-full group`}>
                            <div className={`${headerColor} px-8 py-8 text-white relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide relative z-10 uppercase">
                                    {isPremium ? 'PREMIUM' : isBasic ? 'BASIC' : 'SPECIAL'}
                                </div>
                                <div className="text-[24px] lg:text-[28px] font-black tracking-[-0.04em] keep-all leading-tight relative z-10">{pkg.title}</div>
                            </div>
                            <div className="p-8 flex flex-col h-full">
                                <div className={`bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow ${boxBg} transition-colors duration-300`}>
                                    {pkg.description ? (
                                        <div className="whitespace-pre-line text-sm font-medium text-[#444]">{pkg.description}</div>
                                    ) : (
                                        <div className="text-gray-400 text-sm">No description available.</div>
                                    )}
                                </div>
                                <div className="flex flex-col mb-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[14px] line-through text-[#AAA] font-medium">{convertPrice(pkg.originalPrice)}</span>
                                        <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold animate-pulse">SALE</span>
                                    </div>
                                    <div className={`text-[32px] font-black ${isPremium ? 'text-[#C8A32B]' : isBasic ? 'text-[#0070F0]' : 'text-[#333]'}`}>{convertPrice(pkg.price)}</div>
                                </div>
                                <button onClick={() => onBookClick(pkg.id)} className={`w-full ${headerColor} text-white font-bold py-4 rounded-[12px] opacity-90 hover:opacity-100 active:scale-95 transition-all text-[17px] shadow-lg`}>
                                    {t('book_now')}
                                </button>
                            </div>
                        </div>
                    </ScrollReveal>
                );
            })}
        </div>
    </section>
  );
};
