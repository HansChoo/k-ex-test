import React from 'react';

interface HeroSectionProps {
  language: 'ko' | 'en';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ language }) => {
  const isEn = language === 'en';

  return (
    <section className="w-full bg-[#F4FAFF] pt-[100px] pb-24 text-center font-sans tracking-tight">
      <div className="max-w-[1280px] mx-auto px-4 flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white px-8 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-10">
          <span className="text-[#FF4D4D] font-black text-xl leading-none pt-0.5">🔥</span>
          <span className="text-[#FF4D4D] font-bold text-[16px] tracking-[-0.02em] pt-[1px]">
            {isEn ? '2,847 Americans already experiencing!' : '2,847 미국인이 이미 체험 중!'}
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-[46px] md:text-[68px] font-[900] text-[#111] mb-2 tracking-[-0.05em] leading-[1.1] keep-all">
          {isEn ? 'Your BEST K-Experience!' : 'K-체험의 모든 것!'}
        </h1>
        
        {/* Sub Title */}
        <h2 className="text-[36px] md:text-[60px] font-[900] text-[#0070F0] mb-12 tracking-[-0.05em] leading-[1.1]">
          Every K You Want Is Here!
        </h2>

        {/* Description */}
        <p className="text-[#555] text-lg md:text-[22px] font-bold leading-[1.6] tracking-[-0.03em] whitespace-pre-wrap keep-all">
          {isEn 
            ? 'Health Check · Beauty Treatment · Beauty Consulting · KPOP\nAll-in-one platform for various K-experiences!' 
            : '건강검진 · 뷰티시술 · 뷰티컨설팅 · K-POP\n다양한 K-체험을 한번에 할 수 있는 올인원 플랫폼!'
          }
        </p>

      </div>
    </section>
  );
};