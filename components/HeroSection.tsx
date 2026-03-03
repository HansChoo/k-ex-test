
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Flame } from 'lucide-react';
import { db, isFirebaseConfigured } from '../services/firebaseConfig';
import { doc, onSnapshot, increment, setDoc } from 'firebase/firestore';

const BASE_COUNT = 2847;

interface HeroSectionProps {
  language: 'ko' | 'en' | 'ja' | 'zh'; 
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useGlobal();
  const [visitorCount, setVisitorCount] = useState(BASE_COUNT);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const ref = doc(db, 'site_stats', 'visitors');

    const incrementVisitor = async () => {
      try {
        await setDoc(ref, { count: increment(1) }, { merge: true });
      } catch (e) {
        console.warn('Visitor count increment failed:', e);
      }
    };

    incrementVisitor();

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setVisitorCount(data.count || BASE_COUNT);
      }
    }, (err) => {
      console.warn('Visitor count listener error:', err);
    });

    return () => unsub();
  }, []);

  const badgeText = t('hero_badge').replace('{count}', visitorCount.toLocaleString());

  return (
    <section className="w-full bg-gradient-to-b from-[#3b82f6] via-[#7ab4ff] to-[#e4efff] pt-[40px] pb-[60px] text-center font-sans tracking-tight relative overflow-hidden">

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
        
        <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-1.5 bg-white/30 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
                <span className="text-white font-bold text-[13px] tracking-tight flex items-center gap-1">
                    <Flame size={12} className="fill-[#f97316] text-[#f97316]"/> {badgeText}
                </span>
            </div>
        </ScrollReveal>
        
        <ScrollReveal delay={100}>
            <h1 className="text-[32px] md:text-[56px] font-[900] text-white mb-2 tracking-[-0.04em] leading-tight drop-shadow-sm">
                {t('hero_title')}
            </h1>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
            <h2 className="text-[26px] md:text-[48px] font-[900] text-[#3b82f6] mb-6 tracking-[-0.04em] leading-tight">
                {t('hero_subtitle')}
            </h2>
        </ScrollReveal>
        
        <ScrollReveal delay={300}>
            <p className="text-white/70 text-[14px] md:text-[18px] font-medium leading-[1.5] tracking-[-0.02em] whitespace-pre-wrap keep-all max-w-[600px]">
                {t('hero_desc')}
            </p>
        </ScrollReveal>

      </div>
    </section>
  );
};
