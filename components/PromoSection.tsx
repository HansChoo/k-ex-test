
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
    <section className="w-full font-sans tracking-tight relative overflow-hidden py-1">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B71C1C] via-[#D32F2F] to-[#FF5252] pointer-events-none"></div>
        
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none z-0"></div>

        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[120px] md:text-[180px] font-black text-white/[0.04] select-none pointer-events-none leading-none italic uppercase whitespace-nowrap z-0">
            Together
        </div>

        <div className="max-w-[1280px] mx-auto px-6 py-12 md:py-20 relative z-10">
            <ScrollReveal>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    
                    <div className="flex-1 max-w-2xl relative z-10">
                        <div className="flex items-center gap-2 mb-6 animate-pulse">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <span className="text-yellow-400 text-[13px] font-black uppercase tracking-[0.2em]">{t('promo_badge')}</span>
                        </div>
                        
                        <div className="relative inline-block mb-6">
                            <h2 className="text-[36px] md:text-[56px] font-[900] text-white leading-[1.1] tracking-[-0.03em] drop-shadow-2xl whitespace-pre-wrap keep-all">
                                {t('promo_title')}
                            </h2>
                            <div className="absolute -top-6 -right-10 md:-top-12 md:-right-16 text-yellow-400 rotate-12 drop-shadow-xl pointer-events-none">
                                <Sparkles size={48} className="md:w-16 md:h-16" />
                            </div>
                        </div>

                        <p className="text-[16px] md:text-[18px] text-white/90 font-medium leading-relaxed max-w-xl mb-10 keep-all">
                            {t('promo_desc')}
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm">
                                <TrendingDown size={18} className="text-yellow-400" />
                                <span className="text-white text-[13px] font-bold">{isKo ? '최대 30% 할인 혜택' : 'Up to 30% off'}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm">
                                <Users size={18} className="text-yellow-400" />
                                <span className="text-white text-[13px] font-bold">{isKo ? '전 세계 인원 매칭' : 'Global matching'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative group lg:mr-4 z-50">
                        <div className="absolute inset-0 bg-black/20 rounded-[36px] blur-3xl transform translate-y-6 group-hover:blur-4xl transition-all duration-500 opacity-60 pointer-events-none"></div>
                        
                        <div className="relative bg-white p-10 md:p-12 rounded-[36px] shadow-2xl flex flex-col items-center text-center min-w-[300px] md:min-w-[380px] transform transition-all duration-500 hover:-translate-y-3 border border-white/50">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#D32F2F]/10 to-[#FF5252]/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner rotate-3 group-hover:rotate-0 transition-transform">
                                <Users size={36} className="text-[#D32F2F]" />
                            </div>
                            
                            <div className="mb-10 pointer-events-none">
                                <p className="text-[#D32F2F] text-[14px] font-black uppercase tracking-widest mb-3 italic">Join the Movement</p>
                                {activeCount > 0 ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                                            <Zap size={12} className="text-red-500 fill-red-500" />
                                            <span className="text-red-600 text-xs font-black">
                                                {isKo ? `${activeCount}건 실시간 진행 중` : `${activeCount} groups live now`}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-xs font-bold">
                                        {isKo ? '새로운 공동구매를 시작해보세요' : 'Start a new group buy'}
                                    </p>
                                )}
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onGroupBuyClick) onGroupBuyClick();
                                }} 
                                className="w-full bg-[#111] text-white px-8 py-5 rounded-2xl font-black text-[18px] shadow-[0_15px_35px_rgba(0,0,0,0.25)] hover:bg-[#D32F2F] hover:shadow-[#D32F2F]/30 transition-all duration-300 flex items-center justify-center gap-3 group/btn cursor-pointer relative z-[60]"
                            >
                                {t('promo_btn')}
                                <ChevronRight size={22} className="transform group-hover/btn:translate-x-1.5 transition-transform" />
                            </button>
                            
                            <p className="mt-6 text-[11px] text-gray-300 font-bold uppercase tracking-[0.25em] pointer-events-none">Limited Time Opportunity</p>
                        </div>
                    </div>

                </div>
            </ScrollReveal>
        </div>
    </section>
  );
};
