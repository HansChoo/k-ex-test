
import React, { useEffect, useState } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Users, TrendingDown, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { db } from '../services/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface PromoSectionProps {
  language: 'ko' | 'en' | 'ja' | 'zh';
  onGroupBuyClick?: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ onGroupBuyClick, language }) => {
  const { t } = useGlobal();
  const isKo = language === 'ko';
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "group_buys"), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snap) => {
      setActiveCount(snap.size);
    }, () => {});
    return () => unsub();
  }, []);

  return (
    <section className="w-full font-sans tracking-tight relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B71C1C] via-[#D32F2F] to-[#FF5252] pointer-events-none"></div>
        
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none z-0"></div>

        <div className="max-w-[1280px] mx-auto px-6 py-6 md:py-16 relative z-10">
            <ScrollReveal>
                <div className="flex flex-col items-center text-center">
                    
                    <div className="flex items-center gap-2 mb-3 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="text-yellow-400 text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em]">{t('promo_badge')}</span>
                    </div>
                    
                    <h2 className="text-[24px] md:text-[48px] font-[900] text-white leading-[1.1] tracking-[-0.03em] drop-shadow-2xl whitespace-pre-wrap keep-all mb-3 md:mb-5">
                        {t('promo_title')}
                    </h2>

                    <p className="text-[13px] md:text-[17px] text-white/90 font-medium leading-relaxed max-w-xl mb-5 md:mb-8 keep-all whitespace-pre-wrap">
                        {t('promo_desc')}
                    </p>

                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onGroupBuyClick) onGroupBuyClick();
                        }} 
                        className="bg-white text-[#D32F2F] px-8 py-3 md:py-4 rounded-2xl font-black text-[15px] md:text-[18px] shadow-xl hover:bg-yellow-400 hover:text-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {t('promo_btn')}
                        <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                    </button>

                </div>
            </ScrollReveal>
        </div>
    </section>
  );
};
