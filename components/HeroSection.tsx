
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Flame } from 'lucide-react';

interface HeroSectionProps {
  language: 'ko' | 'en'; 
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useGlobal();

  return (
    <section className="w-full bg-[#0070F0] pt-[40px] pb-[60px] text-center font-sans tracking-tight relative overflow-hidden">
      {/* Background Shapes for subtle depth */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[80%] bg-[#005BC2] rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#4dabf7] rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Pill Badge */}
        <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-6">
                <span className="text-white font-bold text-[13px] tracking-tight flex items-center gap-1">
                    <Flame size={12} className="fill-white text-white"/> {t('hero_badge')}
                </span>
            </div>
        </ScrollReveal>
        
        {/* Main Title */}
        <ScrollReveal delay={100}>
            <h1 className="text-[32px] md:text-[56px] font-[900] text-white mb-2 tracking-[-0.04em] leading-tight drop-shadow-sm">
                {t('hero_title')}
            </h1>
        </ScrollReveal>
        
        {/* Subtitle (Yellow) */}
        <ScrollReveal delay={200}>
            <h2 className="text-[26px] md:text-[48px] font-[900] text-[#FFE812] mb-6 tracking-[-0.04em] leading-tight drop-shadow-md">
                {t('hero_subtitle')}
            </h2>
        </ScrollReveal>
        
        {/* Description */}
        <ScrollReveal delay={300}>
            <p className="text-white/90 text-[14px] md:text-[18px] font-medium leading-[1.5] tracking-[-0.02em] whitespace-pre-wrap keep-all max-w-[600px]">
                {t('hero_desc')}
            </p>
        </ScrollReveal>

      </div>
    </section>
  );
};
