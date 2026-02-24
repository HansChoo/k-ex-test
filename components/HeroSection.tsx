
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Flame } from 'lucide-react';

interface HeroSectionProps {
  language: 'ko' | 'en' | 'ja' | 'zh'; 
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useGlobal();

  return (
    <section className="w-full bg-gradient-to-b from-[#dce8f5] to-[#eef3f9] pt-[40px] pb-[60px] text-center font-sans tracking-tight relative overflow-hidden">

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Pill Badge */}
        <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-1.5 bg-[#d6e6f9] px-4 py-1.5 rounded-full mb-6">
                <span className="text-[#3b82f6] font-bold text-[13px] tracking-tight flex items-center gap-1">
                    <Flame size={12} className="fill-[#f97316] text-[#f97316]"/> {t('hero_badge')}
                </span>
            </div>
        </ScrollReveal>
        
        {/* Main Title */}
        <ScrollReveal delay={100}>
            <h1 className="text-[32px] md:text-[56px] font-[900] text-black mb-2 tracking-[-0.04em] leading-tight">
                {t('hero_title')}
            </h1>
        </ScrollReveal>
        
        {/* Subtitle */}
        <ScrollReveal delay={200}>
            <h2 className="text-[26px] md:text-[48px] font-[900] text-[#3b82f6] mb-6 tracking-[-0.04em] leading-tight">
                {t('hero_subtitle')}
            </h2>
        </ScrollReveal>
        
        {/* Description */}
        <ScrollReveal delay={300}>
            <p className="text-gray-500 text-[14px] md:text-[18px] font-medium leading-[1.5] tracking-[-0.02em] whitespace-pre-wrap keep-all max-w-[600px]">
                {t('hero_desc')}
            </p>
        </ScrollReveal>

      </div>
    </section>
  );
};
