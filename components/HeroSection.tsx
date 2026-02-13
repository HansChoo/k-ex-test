
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Flame, ShieldCheck, Globe, Star } from 'lucide-react';

interface HeroSectionProps {
  language: 'ko' | 'en'; 
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useGlobal();

  return (
    <section className="w-full bg-[#0070F0] pt-6 pb-8 md:pt-16 md:pb-20 text-center font-sans tracking-tight relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Morphing Blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#005BC2] rounded-full blur-[80px] md:blur-[100px] opacity-60 animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#4dabf7] rounded-full blur-[80px] md:blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
          
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Floating Badge */}
        <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-full mb-4 md:mb-6 shadow-2xl animate-float">
                <span className="text-white font-black text-[10px] md:text-[13px] tracking-widest flex items-center gap-2 uppercase">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    {t('hero_badge')}
                </span>
            </div>
        </ScrollReveal>
        
        {/* Main Title with Staggered Animation */}
        <div className="space-y-1.5 md:space-y-4 mb-4 md:mb-10">
            <ScrollReveal delay={100}>
                <h1 className="text-[26px] md:text-[64px] font-[900] text-white tracking-[-0.05em] leading-[1.1] drop-shadow-2xl">
                    {t('hero_title')}
                </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
                <h2 className="text-[22px] md:text-[54px] font-[900] text-[#FFE812] tracking-[-0.05em] leading-[1.1] drop-shadow-lg italic">
                    {t('hero_subtitle')}
                </h2>
            </ScrollReveal>
        </div>
        
        {/* Description */}
        <ScrollReveal delay={500}>
            <p className="text-white/80 text-[13px] md:text-[20px] font-medium leading-[1.4] tracking-[-0.02em] whitespace-pre-wrap keep-all max-w-[700px] mb-6 md:mb-12">
                {t('hero_desc')}
            </p>
        </ScrollReveal>

        {/* Trust Indicators / Stats Bar - Compact Version */}
        <ScrollReveal delay={700}>
            <div className="grid grid-cols-4 gap-2 md:gap-4 w-full max-w-4xl">
                {[
                    { icon: ShieldCheck, label: 'Verified', val: '100+' },
                    { icon: Globe, label: 'Global', val: '5k+' },
                    { icon: Star, label: 'Rating', val: '4.9' },
                    { icon: Flame, label: 'Daily', val: '24/7' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl p-1.5 md:p-4 flex flex-col items-center group hover:bg-white/10 transition-all duration-300">
                        <item.icon className="text-white/60 group-hover:text-yellow-400 mb-0.5 md:mb-1 transition-colors" size={14} />
                        <div className="text-white font-black text-[10px] md:text-lg leading-none mb-0.5">{item.val}</div>
                        <div className="text-white/40 text-[7px] md:text-[10px] font-bold uppercase tracking-widest">{item.label}</div>
                    </div>
                ))}
            </div>
        </ScrollReveal>

      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(15px, -20px) scale(1.05); }
          66% { transform: translate(-8px, 8px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-blob { animation: blob 7s infinite alternate ease-in-out; }
        .animate-float { animation: float 3s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </section>
  );
};
