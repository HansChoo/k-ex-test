
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

        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
            <svg className="absolute top-[8%] left-[5%] w-10 h-10 md:w-14 md:h-14 text-white/[0.07] rotate-[-15deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <svg className="absolute top-[15%] right-[8%] w-8 h-8 md:w-12 md:h-12 text-white/[0.06] rotate-[20deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <svg className="absolute bottom-[12%] left-[10%] w-9 h-9 md:w-12 md:h-12 text-white/[0.06] rotate-[10deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            <svg className="absolute bottom-[20%] right-[6%] w-10 h-10 md:w-14 md:h-14 text-white/[0.07] rotate-[-10deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V3h2v5.17c1.16.42 2 1.52 2 2.83 0 1.66-1.34 3-3 3zm10-4c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM7 16c-2.76 0-5-2.24-5-5 0-2.17 1.39-4.02 3.33-4.7V3c0-.55.45-1 1-1h1.34c.55 0 1 .45 1 1v3.3C10.61 6.98 12 8.83 12 11c0 2.76-2.24 5-5 5z"/></svg>
            <svg className="absolute top-[45%] left-[25%] w-7 h-7 md:w-10 md:h-10 text-white/[0.05] rotate-[25deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
            <svg className="absolute top-[30%] right-[22%] w-6 h-6 md:w-9 md:h-9 text-white/[0.05] rotate-[-20deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <svg className="absolute bottom-[35%] left-[45%] w-8 h-8 md:w-11 md:h-11 text-white/[0.05] rotate-[15deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
            <svg className="absolute top-[60%] right-[35%] w-6 h-6 md:w-8 md:h-8 text-white/[0.04] rotate-[30deg]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </div>

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
