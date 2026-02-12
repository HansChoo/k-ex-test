
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';

interface PackageSectionProps {
  language: 'ko' | 'en';
  onBookClick?: () => void;
  onPremiumBookClick?: () => void;
  basicData?: any;
  premiumData?: any;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onBookClick, onPremiumBookClick, basicData, premiumData }) => {
  const { convertPrice, t } = useGlobal();

  // Use dynamic data from Firestore (passed via props) with fallbacks
  const basicPrice = basicData?.price || 2763000;
  const basicOrig = basicData?.originalPrice || 3070000;
  const basicTitle = basicData?.title || t('pkg_basic');
  const basicDesc = basicData?.description || '';

  const premPrice = premiumData?.price || 7515000;
  const premOrig = premiumData?.originalPrice || 8350000;
  const premTitle = premiumData?.title || t('pkg_prem');
  const premDesc = premiumData?.description || '';

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

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
                <ScrollReveal delay={100} className="h-full">
                    <div className="bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,112,240,0.15)] transition-all duration-300 flex flex-col h-full group">
                        <div className="bg-[#0070F0] px-8 py-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide relative z-10">BASIC</div>
                            <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight relative z-10">{basicTitle}</div>
                        </div>
                        <div className="p-8 flex flex-col h-full">
                            <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow group-hover:bg-[#F0F8FF] transition-colors duration-300">
                                {basicDesc ? (
                                    <div className="whitespace-pre-line text-sm font-medium text-[#444]">{basicDesc}</div>
                                ) : (
                                    <>
                                        <div><div className="font-bold text-[#111] mb-2">🩺 {t('tab_health')} - Basic</div></div>
                                        <div><div className="font-bold text-[#111] mb-2">💉 GLASS SKIN Package</div></div>
                                        <div><div className="font-bold text-[#111] mb-2">🎤 {t('tab_idol')} - Basic</div></div>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col mb-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[14px] line-through text-[#AAA] font-medium">{convertPrice(basicOrig)}</span>
                                    <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold animate-pulse">SALE</span>
                                </div>
                                <div className="text-[32px] font-black text-[#0070F0]">{convertPrice(basicPrice)}</div>
                            </div>
                            <button onClick={onBookClick} className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 active:scale-95 transition-all text-[17px] shadow-lg shadow-blue-100 group-hover:shadow-blue-300">
                                {t('book_now')}
                            </button>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            <div className="flex-1">
                <ScrollReveal delay={200} className="h-full">
                    <div className="bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(200,163,43,0.15)] transition-all duration-300 flex flex-col h-full group">
                        <div className="bg-[#C8A32B] px-8 py-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide relative z-10">PREMIUM</div>
                            <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight relative z-10">{premTitle}</div>
                        </div>
                        <div className="p-8 flex flex-col h-full">
                            <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow group-hover:bg-[#FFFBE6] transition-colors duration-300">
                                {premDesc ? (
                                    <div className="whitespace-pre-line text-sm font-medium text-[#444]">{premDesc}</div>
                                ) : (
                                    <>
                                        <div><div className="font-bold text-[#111] mb-2">🩺 {t('tab_health')} - Premium</div></div>
                                        <div><div className="font-bold text-[#111] mb-2">💉 REJURAN BOOST</div></div>
                                        <div><div className="font-bold text-[#111] mb-2">🎤 {t('tab_idol')} - Premium</div></div>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col mb-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[14px] line-through text-[#AAA] font-medium">{convertPrice(premOrig)}</span>
                                    <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold animate-pulse">SALE</span>
                                </div>
                                <div className="text-[32px] font-black text-[#0070F0]">{convertPrice(premPrice)}</div>
                            </div>
                            <button onClick={onPremiumBookClick} className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 active:scale-95 transition-all text-[17px] shadow-lg shadow-blue-100 group-hover:shadow-blue-300">
                                {t('book_now')}
                            </button>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    </section>
  );
};
