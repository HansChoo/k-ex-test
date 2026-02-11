
import React from 'react';

interface PromoSectionProps {
  language: 'ko' | 'en';
  onGroupBuyClick?: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ language, onGroupBuyClick }) => {
  const isEn = language === 'en';

  return (
    <section id="promo" className="w-full max-w-[960px] mx-auto px-4 pb-24 font-sans tracking-tight">
        
        {/* Banner Container - Reduced height and border radius */}
        <div className="relative w-full rounded-[30px] overflow-hidden group cursor-pointer bg-[#1a1a1a] min-h-[300px] md:h-[390px] flex items-center shadow-2xl">
            
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ 
                    backgroundImage: "url('https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/banner_1.png')",
                }}
            ></div>
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Content - Reduced padding and max-width */}
            <div className="relative z-10 p-6 md:p-[50px] flex flex-col items-start justify-center h-full max-w-3xl">
                
                {/* Badge - Scaled down */}
                <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full mb-6">
                    <span className="text-orange-500 text-xs leading-none">🔥</span> 
                    <span className="text-white text-[13px] font-bold tracking-[-0.02em]">
                        {isEn ? 'Group Buy Promotion' : '공동구매 프로모션'}
                    </span>
                </div>

                {/* Title - Scaled down */}
                <h2 className="text-[32px] md:text-[46px] font-[900] text-white leading-[1.15] mb-4 tracking-[-0.04em] whitespace-pre-wrap keep-all">
                    {isEn ? 'More People\nLower Price!' : '함께할수록\n더 커지는 할인!'}
                </h2>

                {/* Description - Scaled down */}
                <p className="text-[15px] md:text-[17px] text-gray-100 mb-8 leading-[1.6] font-bold tracking-[-0.03em] whitespace-pre-wrap keep-all">
                    {isEn 
                        ? 'More affordable with friends! Get up to 30% discount based on group size\nFrom K-idol experience to Beauty treatments, medical checkup'
                        : '친구들과 함께하면 더 저렴하게! 공구 인원수에 따라 최대 30% 할인\nK-아이돌 체험부터 뷰티 케어, 건강검진까지'
                    }
                </p>

                {/* Button - Scaled down */}
                <button 
                    onClick={onGroupBuyClick}
                    className="bg-white text-[#111] px-7 py-3 rounded-[12px] font-extrabold text-[15px] hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-[-0.02em]"
                >
                    {isEn ? 'View Group Buy' : '공동구매 보기'}
                </button>
            </div>
        </div>
    </section>
  );
};
