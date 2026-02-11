
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Heart, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
import { createReservation, checkAvailability } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { loginWithGoogle, handleAuthError } from '../services/authService';

interface ReservationBasicProps {
  language: 'ko' | 'en';
}

export const ReservationBasic: React.FC<ReservationBasicProps> = ({ language }) => {
  const isEn = language === 'en';
  
  // --- States ---
  const [activeTab, setActiveTab] = useState<'detail' | 'info' | 'faq'>('detail');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Accordion States for Right Sidebar
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Initialize PortOne with Test ID
  useEffect(() => {
    initializePayment('imp19424728'); // Public Test Shop ID (KG Inicis)
  }, []);

  const handleReservation = async () => {
    if (!auth.currentUser) {
        const confirmLogin = window.confirm(isEn ? "Login required. Login with Google?" : "로그인이 필요합니다. 구글로 로그인하시겠습니까?");
        if (confirmLogin) {
            try {
                await loginWithGoogle();
            } catch (error: any) {
                handleAuthError(error, isEn);
            }
        }
        return;
    }

    if (!selectedDate || !selectedGender || !selectedPayment) {
        alert(isEn ? "Please select all options." : "모든 옵션을 선택해주세요.");
        return;
    }

    // 1. Check Availability
    try {
        const { available } = await checkAvailability(selectedDate);
        if (available <= 0) {
            alert(isEn ? "Sold out for this date." : "해당 날짜는 매진되었습니다.");
            return;
        }

        // 2. Calculate Price (Numeric)
        // Prices based on PackageSection:
        // Male: 2,763,000 KRW
        // Female: 2,880,000 KRW
        // Deposit (approx 20%): 550,000 KRW (Simulated)
        let priceNum = 2763000;
        if (selectedGender === 'Female') priceNum = 2880000;
        if (selectedPayment === 'deposit') priceNum = 550000; 

        const productName = `Basic Package (${selectedDate})`;

        // 3. Request Payment
        const merchant_uid = `mid_${new Date().getTime()}`;
        
        try {
            const paymentResult = await requestPayment({
                merchant_uid,
                name: productName,
                amount: priceNum,
                buyer_email: auth.currentUser.email || '',
                buyer_name: auth.currentUser.displayName || ''
            });

            if (paymentResult.success) {
                // 4. Create Reservation in Firebase
                await createReservation({
                    userId: auth.currentUser.uid,
                    productName,
                    date: selectedDate,
                    peopleCount: 1,
                    totalPrice: priceNum,
                    options: {
                        gender: selectedGender,
                        payment: selectedPayment
                    }
                });
                alert(isEn ? "Reservation Confirmed!" : "예약이 확정되었습니다!");
                window.location.href = "/"; // Go home or MyPage
            }
        } catch (paymentError) {
            // Payment cancelled or failed
            console.error(paymentError);
            alert(isEn ? `Payment failed: ${paymentError}` : `결제에 실패했습니다: ${paymentError}`);
        }

    } catch (error: any) {
        console.error(error);
        alert(isEn ? `Error: ${error.message || error}` : `오류가 발생했습니다: ${error.message || error}`);
    }
  };


  // Calendar Logic (Feb 2026 based on HTML source)
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  // Images for Basic
  const IMAGES = [
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/big/20260105/1d40ee250a607379e09525c0385c0db3.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/3d0ff24d11e471f14321f9f3de9634b3.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/5a243e7fc79a94c744361baff3dc6b92.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/bf84fcaaaf51a7865e1141be56ecd827.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/078b9626123006c414d12880e09b6529.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/7f35b305ccf541df9a5b1b36dd6b04b5.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/f9f94f1fc27306b9ef8714815e26e444.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/3eda0289cec6e6eb635b9dd613ff8178.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/c35530aa965ad1c13ef60cbb96ef2ba5.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/93c7f8f7eda9c685388ef5130efd26e5.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/e5ae3a8d512c235fbc92de021a786209.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/778d16585a7e86f26c2aab1e0f05b4ee.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/45f29f4fa1120bd4e9687af6d14e7596.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/48e2377e216413eb36cd33cb8eb12103.png",
    "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/extra/big/20260119/73d7ae713e39f846219a8a41dd98171c.png"
  ];

  const DETAIL_IMAGES = {
    topBanner: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/7676076939ff6ba43d9bf00100968f4b.png",
    intro: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/c8bacd4323350a63de2418a099f697.png", // Corrected
    healthCheck: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/b354b41ad399d23b59c8b7476aa3f884.png", // Basic might use same asset or similar
    checkupTable: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/f4dfe8ac38ee2993a58e0f6b4140e866.png",
    glassSkinMain: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/9c1296c05c003793087dffe5e67613c4.png", // Using similar asset for structure
    idolMain: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/13ada9aafbca4b183122c2395d78ef79.png",
    mv1: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260121/a93621b0ecfbbb91ac5c9ca74ea028ff.png",
    mv2: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260121/62e5060701e65d0473f0fc2f61e1ec07.png",
    mv3: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260121/157221254767e59f4604a7b7ea7d66a1.png"
  };

  // --- Helpers ---
  const handleDateSelect = (day: number) => {
    setSelectedDate(`2026-02-${day.toString().padStart(2, '0')}`);
    setOpenSection('options'); // Move to next section
  };

  const getPrice = () => {
    if (selectedPayment === 'deposit') {
        return isEn ? '$ 380.00' : '550,000원'; // Approx 20%
    }
    // Logic for Male/Female Price Diff
    if (selectedGender === 'Female') {
        return isEn ? '$ 1,994' : '2,880,000원';
    }
    return isEn ? '$ 1,913' : '2,763,000원';
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      
      {/* Mobile Top Actions */}
      <div className="lg:hidden flex items-center px-4 py-3 border-b border-gray-100 sticky top-[50px] bg-white z-40">
         <button onClick={() => window.history.back()} className="mr-4">
            <ChevronLeft size={24} />
         </button>
         <span className="font-bold text-lg truncate">
            {isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직'}
         </span>
      </div>

      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        
        {/* ================= LEFT COLUMN: MAIN CONTENT ================= */}
        <div className="flex-1 w-full min-w-0">
            
            {/* 1. Product Header */}
            <div className="px-4 lg:px-0 mb-8">
                <h1 className="text-[24px] lg:text-[32px] font-[900] text-[#111] mb-2 leading-snug tracking-[-0.03em] keep-all">
                    {isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직'}
                </h1>
                <p className="text-[14px] lg:text-[15px] text-[#888] mb-6 font-medium tracking-tight keep-all border-b border-gray-100 pb-5">
                    {isEn 
                        ? 'Health Check (Basic) + K-IDOL (Basic) + GLASS SKIN Package' 
                        : '건강검진(베이직) + K-IDOL(베이직) + GLASS SKIN 패키지'}
                </p>
                
                {/* Price & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[26px] lg:text-[32px] font-black text-[#111]">{isEn ? '$ 1,913 ~' : '2,763,000원 ~'}</span>
                        <span className="text-sm lg:text-base text-gray-400 line-through font-medium">{isEn ? '$ 2,126' : '3,070,000원'}</span>
                        <span className="text-[#FF4D4D] text-sm lg:text-base font-bold ml-1">10% {isEn ? 'OFF' : '할인'}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[13px] lg:text-[14px] font-bold text-[#555]">
                        <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                            <Heart size={18} className="text-gray-400" /> 
                            <span>{isEn ? 'Add to Wishlist' : 'Add to wishlist'}</span>
                        </button>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                            <CalendarIcon size={18} className="text-gray-400" />
                            <span>{isEn ? 'Calendar' : '예약 달력'}</span>
                        </button>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                            <MapPin size={18} className="text-gray-400" />
                            <span>{isEn ? 'Map' : '지도'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Image Gallery */}
            <div className="mb-12">
                <div className="relative w-full bg-gray-50 rounded-none lg:rounded-2xl overflow-hidden mb-3 group aspect-square lg:aspect-[1.2/1]">
                    <img 
                        src={IMAGES[currentImageIndex]} 
                        alt="Product Main" 
                        className="w-full h-full object-cover"
                    />
                    <button 
                        onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : prev)}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0`}
                        disabled={currentImageIndex === 0}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setCurrentImageIndex(prev => prev < IMAGES.length - 1 ? prev + 1 : prev)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0`}
                        disabled={currentImageIndex === IMAGES.length - 1}
                    >
                        <ChevronRight size={20} />
                    </button>
                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-bold">
                        {currentImageIndex + 1} / {IMAGES.length}
                    </div>
                </div>
                {/* Thumbnails (PC) */}
                <div className="hidden lg:flex gap-2 overflow-x-auto no-scrollbar px-1">
                    {IMAGES.map((img, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-[76px] h-[76px] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Tab Menu */}
            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8">
                <div className="flex text-center">
                    {['detail', 'info', 'faq'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-4 text-[15px] lg:text-[16px] font-bold transition-all relative ${
                                activeTab === tab ? 'text-[#111]' : 'text-[#888] hover:text-[#555]'
                            }`}
                        >
                            {tab === 'detail' && (isEn ? 'Detail' : '상세정보')}
                            {tab === 'info' && (isEn ? 'Notice' : '안내사항')}
                            {tab === 'faq' && 'FAQ'}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#111]"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Tab Contents */}
            <div className="px-4 lg:px-0 min-h-[600px] pb-20">
                {activeTab === 'detail' && (
                    <div className="flex flex-col space-y-12">
                        
                        {/* Top Section */}
                        <div className="text-center">
                            <img src={DETAIL_IMAGES.topBanner} alt="Top Banner" className="w-full max-w-[850px] mx-auto mb-4" />
                            <div className="text-center py-3 bg-[#F8F9FA] mb-8 cursor-pointer hover:bg-gray-100 transition-colors rounded-lg w-full max-w-[850px] mx-auto">
                                <span className="font-bold text-[#111]">→ [공동구매 페이지 바로가기]</span>
                            </div>
                            
                            <img src={DETAIL_IMAGES.intro} alt="Intro" className="w-full max-w-[850px] mx-auto mb-8" />
                            
                            <div className="bg-[#F9FAFB] p-6 rounded-xl border border-gray-100 text-left space-y-3 max-w-[850px] mx-auto">
                                <h3 className="text-lg font-bold text-[#111] mb-2 flex items-center gap-2">
                                    <span>🔳</span> 올인원 패키지 베이직
                                </h3>
                                <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2 text-sm text-[#333]">
                                    <p>
                                        ( <span className="bg-[#DEF7E5] px-1">건강검진 베이직</span> + 
                                        <span className="bg-[#FFE8E8] px-1 mx-1">K-IDOL 베이직</span> + 
                                        <span className="bg-[#C9E0F0] px-1">GLASS SKIN 패키지</span> )
                                    </p>
                                </div>
                                <div className="space-y-3 text-[14px] text-[#555] leading-relaxed">
                                    <p>🔶 성인(20-40세)을 위한 <strong>기본 건강검진</strong> (혈액 검사 + 초음파 등)</p>
                                    <p>🔶 아이돌 프로필 사진 촬영과 뮤직비디오 촬영을 포함한 <strong>K-IDOL 체험</strong></p>
                                    <p>🔶 피부관리, 보톡스, 여신주사를 포함한 <strong>GLASS SKIN 뷰티 패키지</strong></p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Health Check */}
                        <div>
                            <img src={DETAIL_IMAGES.healthCheck} alt="Health Check" className="w-full max-w-[850px] mx-auto mb-6" />
                            <div className="space-y-4 max-w-[850px] mx-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🔶</span>
                                    <h4 className="text-lg font-bold text-[#111] bg-[#DEF7E5] px-2">건강검진 베이직</h4>
                                    <span className="text-lg font-bold text-[#111]">| 총 약 3시간</span>
                                </div>
                                
                                <div className="space-y-2 text-[#555] text-sm leading-relaxed pl-2">
                                    <strong className="text-[#333] text-[15px]">🔹 추천 이유</strong>
                                    <ul className="list-none space-y-2 mt-2">
                                        <li>✔ 20-30대 젊은 층을 위한 필수 검진 항목으로 구성되었습니다.</li>
                                        <li>✔ 합리적인 가격으로 한국의 선진 의료 서비스를 체험할 수 있습니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* K-IDOL */}
                        <div>
                            <img src={DETAIL_IMAGES.idolMain} alt="K-IDOL" className="w-full max-w-[850px] mx-auto mb-6" />
                            <div className="space-y-6 max-w-[850px] mx-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🔶</span>
                                    <h4 className="text-lg font-bold text-[#111] bg-[#FFE8E8] px-2">K-IDOL 베이직</h4>
                                    <span className="text-lg font-bold text-[#111]">| 총 약 2.5시간</span>
                                </div>
                                <p className="text-sm text-[#555] pl-8 font-bold">(프로필 촬영 + 뮤직비디오 촬영)</p>
                                <div className="space-y-2 text-[#555] text-sm leading-relaxed pl-2">
                                     <ul className="list-none space-y-2 mt-2">
                                        <li>✔ 전문 포토그래퍼와 함께하는 프로필 촬영</li>
                                        <li>✔ 나만의 뮤직비디오를 소장하세요.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Glass Skin */}
                        <div>
                            <img src={DETAIL_IMAGES.glassSkinMain} alt="Glass Skin" className="w-full max-w-[850px] mx-auto mb-6" />
                            <div className="space-y-6 max-w-[850px] mx-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🔶</span>
                                    <h4 className="text-lg font-bold text-[#111] bg-[#C9E0F0] px-2">GLASS SKIN 패키지</h4>
                                    <span className="text-lg font-bold text-[#111]">| 총 약 1.5시간</span>
                                </div>
                                <div className="space-y-2 text-[#555] text-sm leading-relaxed pl-2">
                                    <strong className="text-[#333] text-[15px]">🔹 포함 시술</strong>
                                    <ul className="list-none space-y-2 mt-2">
                                        <li>✔ 기본 수분/재생 피부관리</li>
                                        <li>✔ 주름 보톡스 (2부위)</li>
                                        <li>✔ 여신주사 (피부 광채)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
                
                {activeTab === 'info' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 text-sm text-[#555] leading-7 space-y-6">
                        <div>
                            <h3 className="font-bold text-lg text-[#111] mb-3">{isEn ? 'Reservation Guide' : '예약 안내'}</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>패키지 내 각 항목별 상세 예약 가이드는 상세정보 탭에서 확인하실 수 있습니다.</li>
                                <li>건강검진은 예약일 기준 최소 3일 전 변경 가능합니다.</li>
                                <li>예약 확정 후 바우처가 이메일로 발송됩니다. 현장에서 제시해 주세요.</li>
                            </ul>
                        </div>
                    </div>
                )}
                
                {activeTab === 'faq' && (
                    <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors cursor-pointer">
                            <p className="font-bold text-[#111] mb-2 text-sm">Q. 예약을 변경하고 싶어요.</p>
                            <p className="text-gray-600 text-sm">A. 예약일 기준 3일 전까지 고객센터를 통해 변경 가능합니다. (단, 예약 상황에 따라 불가할 수 있습니다.)</p>
                        </div>
                    </div>
                )}
            </div>

        </div>

        {/* ================= RIGHT COLUMN: STICKY OPTION BAR ================= */}
        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                
                {/* Scrollable Area */}
                <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                    
                    {/* 1. Date Selection Accordion */}
                    <div className={`border-b border-[#eee] transition-all ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button 
                            onClick={() => setOpenSection(openSection === 'date' ? null : 'date')}
                            className="w-full flex items-center justify-between p-5 text-left group"
                        >
                            <div>
                                <span className="block text-xs text-[#888] font-bold mb-1">{isEn ? 'STEP 1' : '이용 날짜'}</span>
                                <span className={`text-[15px] font-bold ${selectedDate ? 'text-[#0070F0]' : 'text-[#111]'}`}>
                                    {selectedDate || (isEn ? 'Select Date' : '날짜를 선택하세요')}
                                </span>
                            </div>
                            <ChevronDown size={20} className={`text-[#888] transition-transform ${openSection === 'date' ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Calendar Body */}
                        {openSection === 'date' && (
                            <div className="px-5 pb-6 animate-fade-in">
                                <div className="border border-[#eee] rounded-lg p-4 bg-white">
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <button className="text-gray-400 hover:text-black"><ChevronLeft size={18} /></button>
                                        <span className="font-bold text-[15px]">2026.02</span>
                                        <button className="text-gray-400 hover:text-black"><ChevronRight size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-7 text-center mb-2">
                                        {DAYS.map((d, i) => (
                                            <span key={d} className={`text-[11px] font-bold ${i === 0 || i === 6 ? 'text-[#FF4D4D]' : 'text-[#999]'}`}>{d}</span>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {CALENDAR_DAYS.map(day => {
                                            const isSelected = selectedDate === `2026-02-${day.toString().padStart(2, '0')}`;
                                            const isDisabled = day < 10 && day !== 1;
                                            
                                            return (
                                                <button
                                                    key={day}
                                                    disabled={isDisabled}
                                                    onClick={() => handleDateSelect(day)}
                                                    className={`
                                                        h-9 text-[13px] rounded hover:bg-gray-50 flex items-center justify-center transition-all relative font-medium
                                                        ${isDisabled ? 'text-gray-200 cursor-not-allowed' : 'text-[#333]'}
                                                        ${isSelected ? 'bg-[#0070F0] text-white hover:bg-[#0070F0] font-bold shadow-md' : ''}
                                                    `}
                                                >
                                                    {day}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Option Selection Accordion */}
                    <div className={`border-b border-[#eee] transition-all ${openSection === 'options' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button 
                            onClick={() => setOpenSection(openSection === 'options' ? null : 'options')}
                            disabled={!selectedDate}
                            className={`w-full flex items-center justify-between p-5 text-left ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div>
                                <span className="block text-xs text-[#888] font-bold mb-1">{isEn ? 'STEP 2' : '옵션 선택'}</span>
                                <span className={`text-[15px] font-bold ${selectedGender && selectedPayment ? 'text-[#0070F0]' : 'text-[#111]'}`}>
                                    {selectedGender ? `${selectedGender} / ${selectedPayment}` : (isEn ? 'Select Options' : '옵션을 선택하세요')}
                                </span>
                            </div>
                            <ChevronDown size={20} className={`text-[#888] transition-transform ${openSection === 'options' ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Options Body */}
                        {openSection === 'options' && selectedDate && (
                            <div className="px-5 pb-6 animate-fade-in bg-white">
                                <div className="mb-4">
                                    <p className="text-[13px] font-bold text-[#333] mb-2">{isEn ? 'Gender' : '성별'}</p>
                                    <div className="flex gap-2">
                                        {['Male', 'Female'].map(g => (
                                            <button 
                                                key={g}
                                                onClick={() => setSelectedGender(g)}
                                                className={`flex-1 py-2.5 border rounded text-[13px] font-medium transition-all ${
                                                    selectedGender === g 
                                                    ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' 
                                                    : 'border-[#ddd] text-[#666] hover:bg-gray-50'
                                                }`}
                                            >
                                                {isEn ? g : (g === 'Male' ? '남성' : '여성')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-[#333] mb-2">{isEn ? 'Payment Type' : '예약금 결제 후 상담'}</p>
                                    <div className="flex flex-col gap-2">
                                        {['deposit', 'full'].map(p => (
                                            <button 
                                                key={p}
                                                onClick={() => setSelectedPayment(p)}
                                                className={`w-full py-2.5 px-3 border rounded text-[13px] font-medium text-left flex justify-between items-center transition-all ${
                                                    selectedPayment === p 
                                                    ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' 
                                                    : 'border-[#ddd] text-[#666] hover:bg-gray-50'
                                                }`}
                                            >
                                                {isEn 
                                                    ? (p === 'deposit' ? 'Deposit (20%)' : 'Full Payment') 
                                                    : (p === 'deposit' ? '예약금 (20%)' : '전액 결제')
                                                }
                                                {selectedPayment === p && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selected Item Summary */}
                    {selectedDate && selectedGender && selectedPayment && (
                        <div className="p-5 bg-white border-b border-[#eee]">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-[14px] text-[#333] font-bold leading-snug">
                                    {isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직'}
                                    <div className="text-[12px] text-[#888] font-normal mt-1">
                                        {selectedDate} / {selectedGender} / {selectedPayment}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-[#111]">{getPrice()}</span>
                                </div>
                            </div>
                            {/* Quantity Control Mock */}
                            <div className="flex justify-end mt-2">
                                <div className="flex items-center border border-[#ddd] rounded-sm">
                                    <button className="w-6 h-6 flex items-center justify-center bg-[#f9f9f9] text-[#999]">-</button>
                                    <input type="text" value="1" readOnly className="w-8 h-6 text-center text-[12px] border-x border-[#ddd]" />
                                    <button className="w-6 h-6 flex items-center justify-center bg-[#f9f9f9] text-[#999]">+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Total & Button */}
                <div className="bg-[#f9f9f9] p-5">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[14px] font-bold text-[#555]">{isEn ? 'Total' : '총 상품금액'}</span>
                        <div className="text-right">
                            <span className="text-[20px] font-black text-[#111]">{selectedDate && selectedGender && selectedPayment ? getPrice() : '0'}</span>
                            <span className="text-[12px] text-[#888] ml-1">({selectedDate && selectedGender && selectedPayment ? '1' : '0'}{isEn ? 'ea' : '개'})</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleReservation}
                        className={`w-full py-4 rounded-lg font-bold text-[16px] transition-colors ${
                            selectedDate && selectedGender && selectedPayment
                            ? 'bg-[#0070F0] text-white hover:bg-blue-600 shadow-lg shadow-blue-100'
                            : 'bg-[#999] text-white cursor-not-allowed'
                        }`}
                    >
                        {isEn ? 'Book Now' : '예약하기'}
                    </button>
                </div>
            </div>
        </div>

      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 flex gap-2">
         <button className="flex-1 bg-white border border-[#ddd] text-[#333] font-bold py-3 rounded-lg text-[14px]">
            {isEn ? 'Cart' : '장바구니'}
         </button>
         <button 
            className="flex-[2] bg-[#0070F0] text-white font-bold py-3 rounded-lg text-[14px] shadow-md"
            onClick={handleReservation}
         >
            {isEn ? 'Book Now' : '예약하기'}
         </button>
      </div>

    </div>
  );
};
