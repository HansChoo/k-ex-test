
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';

interface PackageSectionProps {
  language: 'ko' | 'en';
  onBookClick?: () => void;
  onPremiumBookClick?: () => void;
  basicData?: any;
  premiumData?: any;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onBookClick, onPremiumBookClick, basicData, premiumData }) => {
  const { convertPrice, t } = useGlobal();

  // Hardcoded defaults for demo purposes, mapped to translation keys
  const basicPrice = 2763000;
  const basicOrig = 3070000;
  const premPrice = 7515000;
  const premOrig = 8350000;

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-10 font-sans tracking-tight">
        <div className="flex justify-center mb-12">
            <div className="bg-white px-8 py-3 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center gap-2">
                <span className="text-[#0070F0] font-black text-lg">★</span>
                <span className="text-[#111] font-bold text-[18px] tracking-[-0.03em]">{t('pkg_title')}</span>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                <div className="bg-[#0070F0] px-8 py-8 text-white">
                    <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide">BASIC</div>
                    <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight">{t('pkg_basic')}</div>
                </div>
                <div className="p-8 flex flex-col h-full">
                    <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow">
                        <div><div className="font-bold text-[#111] mb-2">🩺 {t('tab_health')} - Basic</div></div>
                        <div><div className="font-bold text-[#111] mb-2">💉 GLASS SKIN Package</div></div>
                        <div><div className="font-bold text-[#111] mb-2">🎤 {t('tab_idol')} - Basic</div></div>
                    </div>
                    <div className="flex flex-col mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] line-through text-[#AAA] font-medium">{convertPrice(basicOrig)}</span>
                            <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold">SALE</span>
                        </div>
                        <div className="text-[32px] font-black text-[#0070F0]">{convertPrice(basicPrice)}</div>
                    </div>
                    <button onClick={onBookClick} className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 transition-colors text-[17px] shadow-lg shadow-blue-100">{t('book_now')}</button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                <div className="bg-[#C8A32B] px-8 py-8 text-white">
                    <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide">PREMIUM</div>
                    <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight">{t('pkg_prem')}</div>
                </div>
                <div className="p-8 flex flex-col h-full">
                    <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow">
                        <div><div className="font-bold text-[#111] mb-2">🩺 {t('tab_health')} - Premium</div></div>
                        <div><div className="font-bold text-[#111] mb-2">💉 REJURAN BOOST</div></div>
                        <div><div className="font-bold text-[#111] mb-2">🎤 {t('tab_idol')} - Premium</div></div>
                    </div>
                    <div className="flex flex-col mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] line-through text-[#AAA] font-medium">{convertPrice(premOrig)}</span>
                            <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold">SALE</span>
                        </div>
                        <div className="text-[32px] font-black text-[#0070F0]">{convertPrice(premPrice)}</div>
                    </div>
                    <button onClick={onPremiumBookClick} className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 transition-colors text-[17px] shadow-lg shadow-blue-100">{t('book_now')}</button>
                </div>
            </div>
        </div>
    </section>
  );
};
