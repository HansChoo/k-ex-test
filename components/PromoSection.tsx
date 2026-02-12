
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';

interface PromoSectionProps {
  language: 'ko' | 'en';
  onGroupBuyClick?: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ onGroupBuyClick }) => {
  const { t } = useGlobal();

  return (
    <section id="promo" className="w-full max-w-[960px] mx-auto px-4 pb-24 font-sans tracking-tight">
        <div className="relative w-full rounded-[30px] overflow-hidden group cursor-pointer bg-[#1a1a1a] min-h-[300px] md:h-[390px] flex items-center shadow-2xl">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/banner_1.png')" }}></div>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 p-6 md:p-[50px] flex flex-col items-start justify-center h-full max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full mb-6">
                    <span className="text-orange-500 text-xs leading-none">🔥</span> 
                    <span className="text-white text-[13px] font-bold tracking-[-0.02em]">{t('promo_badge')}</span>
                </div>
                <h2 className="text-[32px] md:text-[46px] font-[900] text-white leading-[1.15] mb-4 tracking-[-0.04em] whitespace-pre-wrap keep-all">{t('promo_title')}</h2>
                <p className="text-[15px] md:text-[17px] text-gray-100 mb-8 leading-[1.6] font-bold tracking-[-0.03em] whitespace-pre-wrap keep-all">{t('promo_desc')}</p>
                <button onClick={onGroupBuyClick} className="bg-white text-[#111] px-7 py-3 rounded-[12px] font-extrabold text-[15px] hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-[-0.02em]">{t('promo_btn')}</button>
            </div>
        </div>
    </section>
  );
};
