
import React from 'react';

interface PackageSectionProps {
  language: 'ko' | 'en';
  onBookClick?: () => void;
  onPremiumBookClick?: () => void;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ language, onBookClick, onPremiumBookClick }) => {
  const isEn = language === 'en';

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 pb-20 pt-10 font-sans tracking-tight">
        
        {/* Section Header Badge */}
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
                    <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight">
                        {isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직'}
                    </div>
                </div>
                <div className="p-8 flex flex-col h-full">
                    <p className="text-[16px] font-bold text-[#222] mb-6 pb-6 border-b border-[#F0F0F0] leading-snug tracking-[-0.03em] keep-all">
                        {isEn 
                            ? 'Basic Health Check + Basic Beauty Treatment + K-IDOL Experience'
                            : '베이직 건강검진 + GLASS SKIN 패키지 + 베이직 K-IDOL'
                        }
                    </p>
                    
                    <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow">
                        <div>
                            <div className="font-bold text-[#111] text-[16px] mb-2 flex items-center gap-2 tracking-[-0.03em]">
                                <span className="text-lg">🩺</span> 
                                {isEn ? 'Health Check Basic' : '베이직 건강 검진'}
                            </div>
                            <div className="bg-[#E9EBEE] px-3 py-2.5 rounded-lg text-[13px] text-[#555] font-semibold tracking-[-0.02em] leading-snug">
                                {isEn 
                                    ? 'Basic health check-up (for adults 20-40)' 
                                    : '기본 검진 + 혈액 검사 + 초음파'
                                }
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-[#111] text-[16px] mb-2 flex items-center gap-2 tracking-[-0.03em]">
                                <span className="text-lg">💉</span> 
                                {isEn ? 'GLASS SKIN Package' : 'GLASS SKIN 패키지'}
                            </div>
                            <div className="bg-[#E9EBEE] px-3 py-2.5 rounded-lg text-[13px] text-[#555] font-semibold tracking-[-0.02em] leading-snug">
                                {isEn
                                    ? 'Skin care + Botox + Goddess injection'
                                    : '피부관리 + 보톡스 2부위 + 여신주사'
                                }
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-[#111] text-[16px] mb-2 flex items-center gap-2 tracking-[-0.03em]">
                                <span className="text-lg">🎤</span> 
                                {isEn ? 'K-IDOL BASIC' : '베이직 K-IDOL'}
                            </div>
                            <div className="bg-[#E9EBEE] px-3 py-2.5 rounded-lg text-[13px] text-[#555] font-semibold tracking-[-0.02em] leading-snug">
                                {isEn
                                    ? 'Idol experience (profile photo + recording + MV)'
                                    : '프로필 사진 + 헤어&메이크업 + 의상 + 녹음 + MV촬영'
                                }
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex flex-col">
                            <div className="text-[13px] font-extrabold text-[#333] mb-1 tracking-tight">
                                {isEn ? 'Male' : '남성'}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[14px] line-through text-[#AAA] font-medium tracking-tight">
                                    {isEn ? '$ 2,126' : '₩ 3,070,000'}
                                </span>
                                <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold tracking-tight">10% {isEn ? 'OFF' : '할인'}</span>
                            </div>
                            <div className="text-[24px] font-black text-[#0070F0] tracking-[-0.04em]">
                                {isEn ? '$ 1,913' : '₩ 2,763,000'}
                            </div>
                        </div>
                        <div className="flex flex-col relative pl-4 border-l border-gray-200">
                            <div className="text-[13px] font-extrabold text-[#333] mb-1 tracking-tight">
                                {isEn ? 'Female' : '여성'}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[14px] line-through text-[#AAA] font-medium tracking-tight">
                                    {isEn ? '$ 2,216' : '₩ 3,200,000'}
                                </span>
                                <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold tracking-tight">10% {isEn ? 'OFF' : '할인'}</span>
                            </div>
                            <div className="text-[24px] font-black text-[#0070F0] tracking-[-0.04em]">
                                {isEn ? '$ 1,994' : '₩ 2,880,000'}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onBookClick}
                        className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 transition-colors text-[17px] shadow-lg shadow-blue-100 tracking-[-0.02em]"
                    >
                        {isEn ? 'Book Now' : '예약하기'}
                    </button>
                </div>
            </div>

            {/* Premium Card */}
            <div className="flex-1 bg-white rounded-[32px] overflow-hidden border border-[#EEE] shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col">
                <div className="bg-[#C8A32B] px-8 py-8 text-white">
                    <div className="text-[14px] font-extrabold opacity-90 mb-1 tracking-wide">PREMIUM</div>
                    <div className="text-[28px] font-black tracking-[-0.04em] keep-all leading-tight">
                        {isEn ? 'All-in-One Package - Premium' : '올인원 패키지 - 프리미엄'}
                    </div>
                </div>
                <div className="p-8 flex flex-col h-full">
                    <p className="text-[16px] font-bold text-[#222] mb-6 pb-6 border-b border-[#F0F0F0] leading-snug tracking-[-0.03em] keep-all">
                        {isEn
                            ? 'Premium Health Check + Premium Beauty Treatment + K-IDOL Experience'
                            : '프리미엄 건강검진 + REJURAN BOOST 패키지 + 프리미엄 K-IDOL'
                        }
                    </p>
                    
                    <div className="bg-[#F6F7F9] rounded-2xl p-6 mb-8 space-y-5 flex-grow">
                        <div>
                            <div className="font-bold text-[#111] text-[16px] mb-2 flex items-center gap-2 tracking-[-0.03em]">
                                <span className="text-lg">🩺</span> 
                                {isEn ? 'Health Check PREMIUM' : '프리미엄 건강검진'}
                            </div>
                            <div className="bg-[#E9EBEE] px-3 py-2.5 rounded-lg text-[13px] text-[#555] font-semibold tracking-[-0.02em] leading-snug">
                                {isEn
                                    ? 'Comprehensive precision check-up (for 40+ adults)'
                                    : '정밀 검진 + CT 3부위 + 수면내시경 + 전문의 상담'
                                }
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-[#111] text-[16px] mb-2 flex items-center gap-2 tracking-[-0.03em]">
                                <span className="text-lg">💉</span> 
                                {isEn ? 'REJURAN BOOST Package' : 'REJURAN BOOST 패키지'}
                            </div>
                            <div className="bg-[#E9EBEE] px-3 py-2.5 rounded-lg text-[13px] text-[#555] font-semibold tracking-[-0.02em] leading-snug">
                                {isEn
                                    ? 'Premium skin care + Botox + 10Thera/Density + Rejuran + Skin Botox'
                                    : '프리미엄 피부관리 + 보톡스 2부위 + 텐쎄라 + 덴서티 + 리쥬란 + 스킨 보톡스'
                                }
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-[#111] text-[16px] mb-2 flex items-center gap-2 tracking-[-0.03em]">
                                <span className="text-lg">🎤</span> 
                                {isEn ? 'K-IDOL PREMIUM' : '프리미엄 K-IDOL'}
                            </div>
                            <div className="bg-[#E9EBEE] px-3 py-2.5 rounded-lg text-[13px] text-[#555] font-semibold tracking-[-0.02em] leading-snug">
                                {isEn
                                    ? 'Hair & makeup through personal color diagnosis, nail art + recording + MV'
                                    : '퍼스널컬러 + 헤어&메이크업 + 네일 + 의상 + 녹음 + MV촬영'
                                }
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex flex-col">
                            <div className="text-[13px] font-extrabold text-[#333] mb-1 tracking-tight">
                                {isEn ? 'Male' : '남성'}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[14px] line-through text-[#AAA] font-medium tracking-tight">
                                    {isEn ? '$ 5,779' : '₩ 8,350,000'}
                                </span>
                                <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold tracking-tight">10% {isEn ? 'OFF' : '할인'}</span>
                            </div>
                            <div className="text-[24px] font-black text-[#0070F0] tracking-[-0.04em]">
                                {isEn ? '$ 5,201' : '₩ 7,515,000'}
                            </div>
                        </div>
                        <div className="flex flex-col relative pl-4 border-l border-gray-200">
                            <div className="text-[13px] font-extrabold text-[#333] mb-1 tracking-tight">
                                {isEn ? 'Female' : '여성'}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[14px] line-through text-[#AAA] font-medium tracking-tight">
                                    {isEn ? '$ 5,987' : '₩ 8,650,000'}
                                </span>
                                <span className="bg-[#FF4D4D] text-white px-1.5 py-[2px] rounded-[4px] text-[11px] font-bold tracking-tight">10% {isEn ? 'OFF' : '할인'}</span>
                            </div>
                            <div className="text-[24px] font-black text-[#0070F0] tracking-[-0.04em]">
                                {isEn ? '$ 5,388' : '₩ 7,785,000'}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onPremiumBookClick}
                        className="w-full bg-[#0070F0] text-white font-bold py-4 rounded-[12px] hover:bg-blue-600 transition-colors text-[17px] shadow-lg shadow-blue-100 tracking-[-0.02em]"
                    >
                        {isEn ? 'Book Now' : '예약하기'}
                    </button>
                </div>
            </div>

        </div>

        {/* Custom Configuration Section */}
        {isEn && (
            <div className="mt-12 bg-white border border-orange-100 rounded-xl p-8 text-center shadow-sm">
                 <div className="flex justify-center mb-4">
                     <span className="bg-[#FFF8F0] text-[#D97706] px-4 py-1.5 rounded-full text-xs font-bold border border-[#FFE4C4] tracking-tight">
                         🎁 Get up to 30% off with group buying!
                     </span>
                 </div>
                 <div className="flex flex-col items-center">
                     <div className="text-4xl mb-4">🛍️</div>
                     <h3 className="text-xl font-bold text-[#111] mb-2 tracking-tight">Build Your Own Package</h3>
                     <p className="text-gray-500 text-sm tracking-tight">Go to full catalog and add items freely</p>
                 </div>
            </div>
        )}
    </section>
  );
};
