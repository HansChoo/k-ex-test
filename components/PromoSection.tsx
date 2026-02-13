
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Users, Flame, TrendingDown, Sparkles, ChevronRight } from 'lucide-react';

interface PromoSectionProps {
  language: 'ko' | 'en';
  onGroupBuyClick?: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ onGroupBuyClick, language }) => {
  const { t } = useGlobal();

  return (
    <section className="w-full font-sans tracking-tight relative overflow-hidden">
        {/* Premium Background: Deep Crimson Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#920000] via-[#D32F2F] to-[#FF5252] pointer-events-none"></div>
        
        {/* Interactive SVG Network Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 md:opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="network-dots" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <circle cx="50" cy="50" r="2" fill="white" />
                        <path d="M50 50 L150 50 M50 50 L50 150" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#network-dots)" className="animate-pulse-slow" />
            </svg>
        </div>

        {/* Large Decorative Text (Watermark) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[80px] md:text-[220px] font-black text-white/[0.03] select-none pointer-events-none leading-none italic uppercase whitespace-nowrap z-0">
            Together
        </div>

        <div className="max-w-[1280px] mx-auto px-6 py-8 md:py-24 relative z-10">
            <ScrollReveal>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-16">
                    
                    <div className="flex-1 max-w-2xl relative z-10 text-left">
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2 mb-3 md:mb-8">
                            <div className="px-2 py-0.5 bg-yellow-400 rounded text-black font-black text-[9px] md:text-[11px] uppercase tracking-tighter shadow-lg shadow-yellow-400/20">LIVE</div>
                            <span className="text-white/80 text-[10px] md:text-[14px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">{t('promo_badge')}</span>
                        </div>
                        
                        {/* Main Catchphrase */}
                        <div className="relative inline-block mb-3 md:mb-8 text-left">
                            <h2 className="text-[24px] md:text-[68px] font-[900] text-white leading-[1.1] tracking-[-0.04em] drop-shadow-2xl whitespace-pre-wrap keep-all">
                                {t('promo_title')}
                            </h2>
                            {/* Accent Icon with floating animation */}
                            <div className="absolute -top-4 -right-4 md:-top-16 md:-right-20 text-yellow-300 drop-shadow-2xl pointer-events-none animate-bounce-slow">
                                <Sparkles size={24} className="md:w-20 md:h-20" />
                            </div>
                        </div>

                        <p className="text-[13px] md:text-[20px] text-white/90 font-medium leading-relaxed max-w-xl mb-4 md:mb-12 keep-all text-left">
                            {t('promo_desc')}
                        </p>

                        {/* Exclusive Benefits Badges */}
                        <div className="flex flex-wrap gap-2 md:gap-4">
                            <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 shadow-2xl group cursor-default">
                                <TrendingDown size={14} className="text-yellow-400 md:w-5 md:h-5" />
                                <span className="text-white text-[11px] md:text-[15px] font-black">최대 30% 할인</span>
                            </div>
                            <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 shadow-2xl group cursor-default">
                                <Users size={14} className="text-yellow-400 md:w-5 md:h-5" />
                                <span className="text-white text-[11px] md:text-[15px] font-black">글로벌 매칭</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Card Element: Ultra-Compact for Mobile */}
                    <div className="relative group lg:mr-8 z-50">
                        {/* Glowing Background Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-red-600 rounded-[24px] md:rounded-[44px] opacity-10 blur-lg group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>
                        
                        <div className="relative bg-white p-5 md:p-14 rounded-[24px] md:rounded-[40px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] flex flex-col items-center text-center min-w-[240px] md:min-w-[420px] transform transition-all duration-500 hover:-translate-y-2 border border-white/50">
                            
                            <div className="w-10 h-10 md:w-24 md:h-24 bg-red-50 rounded-[14px] md:rounded-[32px] flex items-center justify-center text-[#D32F2F] mb-3 md:mb-10 shadow-inner group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
                                <Flame size={20} className="md:w-12 md:h-12 fill-current" />
                            </div>
                            
                            <div className="mb-4 md:mb-12">
                                <p className="text-[#D32F2F] text-[11px] md:text-[16px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1 md:mb-3">Join the Movement</p>
                                <p className="text-gray-400 text-[9px] md:text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-2">
                                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    {language === 'ko' ? '인기 공동구매 12개 진행 중' : '12 HOT DEALS ARE LIVE'}
                                </p>
                            </div>

                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onGroupBuyClick) onGroupBuyClick();
                                }} 
                                className="w-full bg-[#111] text-white px-5 py-3 md:px-10 md:py-6 rounded-lg md:rounded-2xl font-black text-[14px] md:text-[20px] shadow-lg hover:bg-[#D32F2F] transition-all duration-500 flex items-center justify-center gap-3 group/btn cursor-pointer relative z-[60] overflow-hidden"
                            >
                                <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-white/20 skew-x-[45deg] group-hover/btn:left-[150%] transition-all duration-700 pointer-events-none"></div>
                                {t('promo_btn')}
                                <ChevronRight size={16} className="md:w-6 md:h-6 transform group-hover/btn:translate-x-1.5 transition-transform" />
                            </button>
                            
                            <p className="mt-3 md:mt-8 text-[8px] md:text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em] md:tracking-[0.3em]">Limited Time Opportunity</p>
                        </div>
                    </div>

                </div>
            </ScrollReveal>
        </div>

        <style>{`
            @keyframes pulse-slow {
                0%, 100% { opacity: 0.1; }
                50% { opacity: 0.2; }
            }
            @keyframes bounce-slow {
                0%, 100% { transform: translateY(0) rotate(12deg); }
                50% { transform: translateY(-5px) rotate(12deg); }
            }
            .animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
            .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        `}</style>
    </section>
  );
};
