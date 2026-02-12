
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';

interface HeroSectionProps {
  language: 'ko' | 'en'; 
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useGlobal();

  return (
    <section className="w-full bg-[#F4FAFF] pt-[100px] pb-24 text-center font-sans tracking-tight overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 flex flex-col items-center">
        <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 bg-white px-8 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-10 hover:shadow-lg transition-shadow duration-300">
            <span className="text-[#FF4D4D] font-black text-xl leading-none pt-0.5 animate-bounce">🔥</span>
            <span className="text-[#FF4D4D] font-bold text-[16px] tracking-[-0.02em] pt-[1px]">{t('hero_badge')}</span>
            </div>
        </ScrollReveal>
        
        <ScrollReveal delay={100}>
            <h1 className="text-[46px] md:text-[68px] font-[900] text-[#111] mb-2 tracking-[-0.05em] leading-[1.1] keep-all">{t('hero_title')}</h1>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
            <h2 className="text-[36px] md:text-[60px] font-[900] text-[#0070F0] mb-12 tracking-[-0.05em] leading-[1.1]">{t('hero_subtitle')}</h2>
        </ScrollReveal>
        
        <ScrollReveal delay={300}>
            <p className="text-[#555] text-lg md:text-[22px] font-bold leading-[1.6] tracking-[-0.03em] whitespace-pre-wrap keep-all opacity-80">{t('hero_desc')}</p>
        </ScrollReveal>
      </div>
    </section>
  );
};
