import React from 'react';

interface BottomHeroProps {
  language: 'ko' | 'en';
}

export const BottomHero: React.FC<BottomHeroProps> = ({ language }) => {
  const isEn = language === 'en';

  return (
    <section className="w-full bg-[#F0F8FF] py-24 font-sans tracking-tight">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
             <div className="inline-flex items-center gap-1.5 bg-white px-5 py-2 rounded-full border border-blue-100 text-[#007BFF] font-bold text-[14px] mb-8 shadow-sm">
                <span>✔</span>
                <span className="tracking-tight">{isEn ? 'Start Now!' : '지금 시작하세요!'}</span>
             </div>
             
             <h2 className="text-[32px] md:text-[42px] font-black text-[#111] leading-tight mb-4 tracking-[-0.04em] keep-all">
                {isEn ? 'Enjoy Your Own K-Experience' : '나만의 K-체험을 즐겨보세요'}
             </h2>
             
             <p className="text-[16px] text-[#666] mb-12 font-medium leading-relaxed tracking-[-0.02em] keep-all">
                {isEn 
                    ? <React.Fragment>Health check, beauty treatment, K-IDOL and more!<br/>All Korean experiences you want in one place</React.Fragment>
                    : <React.Fragment>건강검진부터 뷰티 케어, K-아이돌 체험까지!<br/>당신이 원하는 모든 한국 체험이 이곳에 있습니다.</React.Fragment>
                }
             </p>
             
             <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <button className="min-w-[180px] px-8 py-4 bg-[#007BFF] text-white font-bold rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all text-[16px] tracking-[-0.02em]">
                    {isEn ? 'View Packages' : '패키지 상품 보기'}
                 </button>
                 <button className="min-w-[180px] px-8 py-4 bg-white text-[#007BFF] border border-[#007BFF] font-bold rounded-lg hover:bg-blue-50 hover:shadow-md transition-all text-[16px] tracking-[-0.02em]">
                    {isEn ? 'Customize Your Own' : '커스텀 구성하기'}
                 </button>
             </div>
        </div>
    </section>
  );
};