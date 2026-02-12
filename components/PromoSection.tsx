
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Users } from 'lucide-react';

interface PromoSectionProps {
  language: 'ko' | 'en';
  onGroupBuyClick?: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ onGroupBuyClick }) => {
  const { t } = useGlobal();

  return (
    <section className="w-full bg-[#D32F2F] font-sans tracking-tight relative overflow-hidden">
        {/* SALE Watermark Background */}
        <div className="absolute right-[-20px] bottom-[-20px] text-[100px] font-black text-black/10 transform -rotate-6 select-none pointer-events-none">
            SALE
        </div>

        <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
            <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3 border border-white/20">
                            <Users size={12} className="text-white fill-white" /> 
                            <span className="text-white text-[11px] font-bold">{t('promo_badge')}</span>
                        </div>
                        
                        {/* Text */}
                        <h2 className="text-[24px] font-[900] text-white leading-[1.2] mb-2 whitespace-pre-wrap drop-shadow-md">
                            {t('promo_title')}
                        </h2>
                        <p className="text-[12px] text-white/80 font-medium leading-[1.5] max-w-md">
                            {t('promo_desc')}
                        </p>
                    </div>

                    {/* Button */}
                    <button 
                        onClick={onGroupBuyClick} 
                        className="bg-white text-[#D32F2F] px-6 py-3 rounded-[10px] font-bold text-[14px] shadow-lg hover:bg-gray-50 transition-all active:scale-95 self-start md:self-center"
                    >
                        {t('promo_btn')}
                    </button>
                </div>
            </ScrollReveal>
        </div>
    </section>
  );
};
