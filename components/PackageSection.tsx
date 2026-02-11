
import React from 'react';

interface PackageSectionProps {
  language: 'ko' | 'en';
  onBookClick?: () => void;
  onPremiumBookClick?: () => void;
  basicData?: any;
  premiumData?: any;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ language, onBookClick, onPremiumBookClick, basicData, premiumData }) => {
  const isEn = language === 'en';

  // Use Dynamic Data if available, else fallback to defaults
  const basicTitle = basicData?.title || (isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직');
  const basicPrice = basicData?.price ? `₩ ${basicData.price.toLocaleString()}` : (isEn ? '$ 1,913' : '₩ 2,763,000');
  const basicOrigPrice = basicData?.originalPrice ? `₩ ${basicData.originalPrice.toLocaleString()}` : (isEn ? '$ 2,126' : '₩ 3,070,000');
  const basicDesc = basicData?.description || (isEn ? 'Basic Health Check + Basic Beauty + K-IDOL' : '베이직 건강검진 + GLASS SKIN 패키지 + 베이직 K-IDOL');

  const premTitle = premiumData?.title || (isEn ? 'All-in-One Package - Premium' : '올인원 패키지 - 프리미엄');
  const premPrice = premiumData?.price ? `₩ ${premiumData.price.toLocaleString()}` : (isEn ? '$ 5,201' : '₩ 7,515,000');
  const premOrigPrice = premiumData?.originalPrice ? `₩ ${premiumData.originalPrice.toLocaleString()}` : (isEn ? '$ 5,779' : '₩ 8,350,000');
  const premDesc = premiumData?.description || (isEn ? 'Premium Health Check + Premium Beauty + K-IDOL' : '프리미엄 건강검진 + REJURAN BOOST 패키지 + 프리미엄 K-IDOL');

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-10 font-sans tracking-tight">
        <div className="flex justify-center mb-12">
            <div className="bg-white px-8 py-3 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center gap-2">
                <span className="text-[#0070F0] font-black text-lg">★</span>
                <span className="text-[#111] font-bold text-[18px] tracking-[-0.03em]">
                    {isEn ? 'K-Experience All-in-One Packages' : 'K-체험 올인원 패키지'}
                </span>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            {/* Basic Card */}
            <div className="flex-1 bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                <div className="bg-[#0070F0] px-8 py-8 text-white">
                    <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide">BASIC</div>
                    <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight">{basicTitle}</div>
                </div>
                <div className="p-8 flex flex-col h-full">
                    <p className="text-[16px] font-bold text-[#222] mb-6 pb-6 border-b border-[#F0F0F0] leading-snug tracking-[-0.03em] keep-all">{basicDesc}</p>
                    {/* Features List (Static for layout stability, ideally also dynamic) */}
                    <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow">
                        <div><div className="font-bold text-[#111] mb-2">🩺 {isEn ? 'Health Check Basic' : '베이직 건강 검진'}</div></div>
                        <div><div className="font-bold text-[#111] mb-2">💉 {isEn ? 'GLASS SKIN Package' : 'GLASS SKIN 패키지'}</div></div>
                        <div><div className="font-bold text-[#111] mb-2">🎤 {isEn ? 'K-IDOL BASIC' : '베이직 K-IDOL'}</div></div>
                    </div>
                    <div className="flex flex-col mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] line-through text-[#AAA] font-medium">{basicOrigPrice}</span>
                            <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold">SALE</span>
                        </div>
                        <div className="text-[32px] font-black text-[#0070F0]">{basicPrice}</div>
                    </div>
                    <button onClick={onBookClick} className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 transition-colors text-[17px] shadow-lg shadow-blue-100">{isEn ? 'Book Now' : '예약하기'}</button>
                </div>
            </div>

            {/* Premium Card */}
            <div className="flex-1 bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                <div className="bg-[#C8A32B] px-8 py-8 text-white">
                    <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide">PREMIUM</div>
                    <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight">{premTitle}</div>
                </div>
                <div className="p-8 flex flex-col h-full">
                    <p className="text-[16px] font-bold text-[#222] mb-6 pb-6 border-b border-[#F0F0F0] leading-snug tracking-[-0.03em] keep-all">{premDesc}</p>
                    <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow">
                        <div><div className="font-bold text-[#111] mb-2">🩺 {isEn ? 'Health Check PREMIUM' : '프리미엄 건강검진'}</div></div>
                        <div><div className="font-bold text-[#111] mb-2">💉 {isEn ? 'REJURAN BOOST' : 'REJURAN BOOST 패키지'}</div></div>
                        <div><div className="font-bold text-[#111] mb-2">🎤 {isEn ? 'K-IDOL PREMIUM' : '프리미엄 K-IDOL'}</div></div>
                    </div>
                    <div className="flex flex-col mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] line-through text-[#AAA] font-medium">{premOrigPrice}</span>
                            <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold">SALE</span>
                        </div>
                        <div className="text-[32px] font-black text-[#0070F0]">{premPrice}</div>
                    </div>
                    <button onClick={onPremiumBookClick} className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 transition-colors text-[17px] shadow-lg shadow-blue-100">{isEn ? 'Book Now' : '예약하기'}</button>
                </div>
            </div>
        </div>
    </section>
  );
};
