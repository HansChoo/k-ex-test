
import React, { useState, useEffect } from 'react';
import { Calendar, Info, Users, Lock, CheckCircle2, User, Zap, MessageCircle, Flame, Ban, CreditCard, ChevronDown, X, Share2, Check, Sparkles, Megaphone, Timer, Plus } from 'lucide-react';
import { initializePayment, requestPayment } from '../services/paymentService';
import { auth, db } from '../services/firebaseConfig';
import { createReservation } from '../services/reservationService';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc, 
    increment, 
    serverTimestamp,
    getDocs 
} from 'firebase/firestore';

interface GroupBuyingPageProps {
  language: 'ko' | 'en';
}

interface GroupBuyItem {
    id: string;
    type: 'public';
    product: 'basic' | 'premium';
    currentCount: number;
    maxCount: number;
    startDate: number; // timestamp
    endDate: number;   // timestamp
    creatorName: string;
}

// Pricing Constants
const PRICES = {
    basic: { male: 2205000, female: 2322000 },
    premium: { male: 6012000, female: 6282000 }
};

const DEPOSIT_AMOUNT = 100000; // Fixed Deposit

// Custom Hook for Real-time Countdown
const CountdownTimer = ({ targetDate }: { targetDate: number }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                setTimeLeft('EXPIRED');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return <span className="font-mono tabular-nums tracking-tight">{timeLeft}</span>;
};

export const GroupBuyingPage: React.FC<GroupBuyingPageProps> = ({ language }) => {
  const isEn = language === 'en';

  // --- Dynamic Group List State (Real-time from Firebase) ---
  const [publicGroups, setPublicGroups] = useState<GroupBuyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Join Modal State ---
  const [joiningGroup, setJoiningGroup] = useState<GroupBuyItem | null>(null);
  const [joinFormData, setJoinFormData] = useState({
      name: '',
      email: '',
      phone: '',
      gender: 'male', // default
      date: '',
      agreed: false
  });

  // --- Create Wizard State ---
  const [step, setStep] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<'public' | 'private' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<'basic' | 'premium' | null>(null);
  const [maleCount, setMaleCount] = useState<number>(0);
  const [femaleCount, setFemaleCount] = useState<number>(0);
  
  // Payment Modal State (For Creation)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    request: ''
  });

  // 1. [REAL-TIME LISTENER] Load groups from Firestore
  useEffect(() => {
    // Listen to 'group_buys' collection, ordered by endDate
    const q = query(collection(db, "group_buys"), orderBy("endDate", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as GroupBuyItem));
        
        // Filter only active groups locally if needed, or rely on Query
        // Here we just show all for demo
        setPublicGroups(groups);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Pre-fill user info
  useEffect(() => {
    if (auth.currentUser) {
        const userEmail = auth.currentUser.email || '';
        const userName = auth.currentUser.displayName || '';
        setFormData(prev => ({ ...prev, name: userName, email: userEmail }));
        setJoinFormData(prev => ({ ...prev, name: userName, email: userEmail }));
    }
  }, [auth.currentUser]);

  useEffect(() => {
    initializePayment('imp19424728'); 
  }, []);
  
  const handleTypeSelect = (type: 'public' | 'private') => {
    setSelectedType(type);
    setStep(1); 
  };

  const handleProductSelect = (product: 'basic' | 'premium') => {
    setSelectedProduct(product);
    setStep(2); 
    setMaleCount(1); 
    setFemaleCount(0);
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'K-Experience Group Buy',
                text: 'Join me for a K-Experience trip with up to 50% discount!',
                url: window.location.href,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert(isEn ? "Link copied!" : "링크가 복사되었습니다!");
    }
  };

  // --- Calculations ---
  const totalCount = maleCount + femaleCount;
  let discountRate = 0;
  if (totalCount > 0) {
      if (totalCount <= 2) discountRate = 10;
      else discountRate = Math.min(50, 15 + (totalCount - 3) * 5);
  }

  const baseMalePrice = selectedProduct ? PRICES[selectedProduct].male : 0;
  const baseFemalePrice = selectedProduct ? PRICES[selectedProduct].female : 0;
  const finalPrice = (maleCount * baseMalePrice * (1 - discountRate/100)) + (femaleCount * baseFemalePrice * (1 - discountRate/100));
  const maxMale = 10 - femaleCount;
  const maxFemale = 10 - maleCount;

  const handlePaymentClick = () => {
      if (totalCount === 0) return;
      setIsPaymentModalOpen(true);
  };

  // --- [CREATE] Payment & DB Update ---
  const handlePaymentSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.date) {
        alert(isEn ? "Please fill in all fields." : "필수 정보를 모두 입력해주세요.");
        return;
    }

    const productName = selectedProduct === 'basic' 
        ? (isEn ? 'All-in-One Basic' : '올인원 패키지 - 베이직')
        : (isEn ? 'All-in-One Premium' : '올인원 패키지 - 프리미엄');
    
    // In Public Group Creation, user pays Deposit (or Full amount for Private). 
    // Simplified: Just pay full amount for Private, Deposit for Public.
    const amountToPay = selectedType === 'public' ? DEPOSIT_AMOUNT : finalPrice;

    try {
        const response = { success: true }; // Simulated Payment

        if (response.success) {
             // 1. If Public, Create a new Group Document in Firestore
             if (selectedType === 'public' && selectedProduct) {
                 await addDoc(collection(db, "group_buys"), {
                     type: 'public',
                     product: selectedProduct,
                     currentCount: totalCount,
                     maxCount: 10,
                     startDate: new Date().getTime(),
                     endDate: new Date().getTime() + (7 * 24 * 60 * 60 * 1000), // +7 Days
                     creatorName: formData.name,
                     createdAt: serverTimestamp()
                 });
                 window.scrollTo({ top: 0, behavior: 'smooth' });
             }

             // 2. Save Reservation Record
             await createReservation({
                userId: auth.currentUser?.uid || 'guest',
                productName,
                date: formData.date,
                peopleCount: totalCount,
                totalPrice: amountToPay,
                options: {
                    type: selectedType,
                    role: 'leader', // Creator
                    discountRate,
                    originalPrice: finalPrice / (1 - discountRate/100) // Approx
                }
             });

             alert(isEn ? "Group Created!" : "그룹이 생성되었습니다! 상단 리스트에서 확인해보세요.");
             setIsPaymentModalOpen(false);
             
             // Reset
             if (selectedType === 'private') {
                 setStep(0);
                 setSelectedType(null);
             } else {
                 // Refresh or scroll up handled by realtime listener
             }
        }
    } catch (error) {
        console.error("Payment Error", error);
        alert(isEn ? "Payment Failed." : "결제에 실패했습니다.");
    }
  };

  // --- [JOIN] Logic ---
  const handleJoinClick = (group: GroupBuyItem) => {
      setJoiningGroup(group);
      setJoinFormData(prev => ({
          ...prev,
          name: auth.currentUser?.displayName || prev.name,
          email: auth.currentUser?.email || prev.email,
      }));
  };

  const joinCalcs = (() => {
      if (!joiningGroup) return { discount: 0, finalPrice: 0, deposit: 0, balance: 0 };
      
      // Calculate Discount based on CURRENT count + 1 (Assuming I join)
      // Usually users want to see discount based on current achieved tier
      let currentDiscount = 0;
      if (joiningGroup.currentCount <= 2) currentDiscount = 10;
      else currentDiscount = Math.min(50, 15 + (joiningGroup.currentCount - 3) * 5);
      
      const basePrice = joinFormData.gender === 'male' 
        ? PRICES[joiningGroup.product].male 
        : PRICES[joiningGroup.product].female;
      
      const finalPrice = basePrice * (1 - currentDiscount / 100);
      const balance = finalPrice - DEPOSIT_AMOUNT;

      return { discount: currentDiscount, finalPrice, deposit: DEPOSIT_AMOUNT, balance };
  })();

  const handleJoinSubmit = async () => {
      if (!joiningGroup) return;
      if (!joinFormData.name || !joinFormData.email || !joinFormData.phone || !joinFormData.date) {
          alert(isEn ? "Please fill in all fields." : "모든 정보를 입력해주세요.");
          return;
      }
      if (!joinFormData.agreed) {
          alert(isEn ? "Please agree to the terms." : "약관에 동의해주세요.");
          return;
      }

      try {
          // 1. Simulate Payment
          const response = { success: true };

          if (response.success) {
              // 2. [CORE LOGIC] Update Firestore: Increment Count
              const groupRef = doc(db, "group_buys", joiningGroup.id);
              
              // We use 'increment(1)' to safely add 1 even if multiple people join at exact same time
              await updateDoc(groupRef, {
                  currentCount: increment(1)
              });

              // 3. Save Reservation Record
              await createReservation({
                  userId: auth.currentUser?.uid || 'guest',
                  productName: `Join: ${joiningGroup.product}`,
                  date: joinFormData.date,
                  peopleCount: 1,
                  totalPrice: DEPOSIT_AMOUNT, // Deposit paid
                  options: {
                      groupId: joiningGroup.id,
                      role: 'member',
                      gender: joinFormData.gender
                  }
              });

              alert(isEn ? "Joined Successfully!" : "참여가 완료되었습니다! 실시간으로 인원이 업데이트 됩니다.");
              setJoiningGroup(null);
          }
      } catch (error) {
          console.error("Join Error", error);
          alert("Error joining group");
      }
  };

  const StepIndicator = () => (
      <div className="flex justify-center items-center mb-10 gap-2 md:gap-4">
          {[
              { num: 1, label: isEn ? 'Type' : '유형' },
              { num: 2, label: isEn ? 'Product' : '상품' },
              { num: 3, label: isEn ? 'Details' : '인원/결제' }
          ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                  <div className={`flex items-center gap-2 ${idx <= step ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === step ? 'bg-[#0070F0] text-white' : (idx < step ? 'bg-[#00C7AE] text-white' : 'bg-gray-200 text-gray-500')
                      }`}>
                          {idx < step ? <Check size={16} strokeWidth={3} /> : s.num}
                      </div>
                      <span className={`text-sm font-bold ${idx === step ? 'text-[#0070F0]' : 'text-gray-500'}`}>{s.label}</span>
                  </div>
                  {idx < 2 && <div className="w-8 md:w-16 h-[2px] bg-gray-200 mx-2 md:mx-4">
                      <div className={`h-full bg-[#00C7AE] transition-all duration-300 ${idx < step ? 'w-full' : 'w-0'}`}></div>
                  </div>}
              </div>
          ))}
      </div>
  );

  return (
    <div className="w-full font-sans text-[#1a1a1a] bg-[#F5F9FC] pb-20">
      
      {/* 1. Hero Section */}
      <div className="pt-20 pb-16 text-center bg-[#F0F8FF] px-4">
        <div className="inline-flex items-center gap-1.5 bg-white px-5 py-2 rounded-full border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] mb-8">
            <span className="text-[#FF4D4D] text-lg leading-none animate-pulse">🔥</span>
            <span className="text-[#333] text-[13px] font-bold tracking-tight">HOT {isEn ? 'Group Buy' : '공동구매'}</span>
        </div>
        <h1 className="text-[34px] md:text-[44px] font-[900] text-[#111] mb-2 tracking-[-0.03em] leading-tight drop-shadow-sm">
            Your BEST K-experience
        </h1>
        <h2 className="text-[38px] md:text-[54px] font-[900] text-[#FF4D6D] mb-8 tracking-[-0.03em] leading-tight drop-shadow-sm">
            More People, Lower Price!
        </h2>
        <p className="text-[#555] text-[15px] md:text-[16px] font-medium leading-relaxed tracking-[-0.02em]">
            {isEn ? 'Cheaper together! Up to 50% discount per person' : '친구들과 함께하면 더 저렴하게! 인원별 최대 50% 할인 혜택을 누리세요'}
            <br />
            <span className="text-[#888] text-[14px] md:text-[15px] font-normal mt-2 block tracking-tight">
                {isEn ? 'From K-Idol Experience to Health Checkup' : 'K-아이돌 체험부터 뷰티시술, 건강검진까지'}
                <br/>
                {isEn ? 'Up to 50% off with friends!' : '친구들과 함께하면 최대 50% 할인!'}
            </span>
        </p>
      </div>

      {/* Container */}
      <div className="max-w-[1000px] mx-auto px-4 -mt-6">
        
        {/* Section Title with Live Indicator */}
        <div className="flex items-center justify-between mb-6 ml-1">
            <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <Flame className="w-6 h-6 text-[#FF8800] fill-[#FF8800]" />
                <h3 className="text-[20px] font-bold text-[#111] tracking-[-0.03em]">{isEn ? 'Ongoing Public Group Buys' : '진행중인 공개 공동구매'}</h3>
            </div>
            {publicGroups.length > 0 && (
                <div className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    LIVE
                </div>
            )}
        </div>

        {/* --- DYNAMIC GROUP LIST --- */}
        <div className="space-y-6 mb-20 min-h-[200px]">
            {loading ? (
                <div className="text-center py-20 text-gray-400">{isEn ? 'Loading groups...' : '진행중인 그룹을 불러오는 중입니다...'}</div>
            ) : publicGroups.length === 0 ? (
                // EMPTY STATE
                <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center animate-fade-in relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-500">
                             <Megaphone size={32} className="animate-wiggle" />
                        </div>
                        <h4 className="text-[20px] font-bold text-[#333] mb-2">{isEn ? 'No active groups yet!' : '진행중인 공개 모집이 없습니다!'}</h4>
                        <p className="text-[#666] text-sm mb-8">{isEn ? 'Be the first leader and get huge discounts!' : '첫 번째 리더가 되어 최대 50% 할인을 받아보세요!'}</p>
                        
                        <button 
                            onClick={() => {
                                document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' });
                                handleTypeSelect('public');
                            }}
                            className="bg-[#0070F0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-blue-600 hover:shadow-blue-200 transition-all flex items-center gap-2"
                        >
                            <Sparkles size={16} fill="white" />
                            {isEn ? 'Create Group Buy Now' : '지금 바로 공동구매 생성하기'}
                        </button>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-10 left-10 text-yellow-400 opacity-30 animate-bounce"><Sparkles size={24} /></div>
                    <div className="absolute bottom-10 right-10 text-red-400 opacity-30 animate-pulse"><Flame size={24} /></div>
                </div>
            ) : (
                // ACTIVE GROUPS LIST
                publicGroups.map((group) => {
                    const isBasic = group.product === 'basic';
                    let currentDiscount = 0;
                    if (group.currentCount <= 2) currentDiscount = 10;
                    else currentDiscount = Math.min(50, 15 + (group.currentCount - 3) * 5);
                    
                    const nextDiscountThreshold = group.currentCount < 3 ? 3 : group.currentCount + 1;
                    const neededForNext = nextDiscountThreshold - group.currentCount;

                    const imgUrl = isBasic 
                        ? "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/ff52ffbd8b074f22f92879af29f72de4.png"
                        : "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/38201343997edc3482db1092fb6f6d44.png";
                    const accentColor = isBasic ? '#0070F0' : '#00C7AE';
                    const badgeColor = isBasic ? '#999' : '#EF4444';

                    return (
                        <div key={group.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 animate-slide-up hover:shadow-lg transition-all">
                            {/* Left Image */}
                            <div className="w-full md:w-[340px] shrink-0">
                                <div className="rounded-xl overflow-hidden bg-gray-100 h-[240px] md:h-full relative group/img">
                                    <img src={imgUrl} alt={group.product} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"/>
                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                                    </div>
                                </div>
                            </div>

                            {/* Right Content */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-[24px] font-[800] text-[#111] tracking-[-0.04em] leading-tight">
                                            {isBasic 
                                                ? (isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직')
                                                : (isEn ? 'All-in-One Package - Premium' : '올인원 패키지 - 프리미엄')
                                            }
                                        </h3>
                                        <span className={`text-white text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 tracking-tight`} style={{ backgroundColor: badgeColor }}>
                                            <Flame size={12} fill="white" />
                                            {isEn ? 'Recruiting' : '모집중'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-[13px] font-bold mb-1.5 tracking-tight" style={{ color: accentColor }}>
                                        <User size={15} strokeWidth={2.5} />
                                        <span>Leader: {group.creatorName}</span>
                                    </div>
                                    <p className="text-[12px] text-[#888] mb-8 font-medium tracking-tight">
                                        {isBasic
                                            ? <><span className="text-[#8B5CF6] font-bold">DAY 1</span> K-IDOL <span className="text-gray-300 mx-1">|</span> <span className="text-[#10B981] font-bold">DAY 2</span> Health + Beauty</>
                                            : <><span className="text-[#8B5CF6] font-bold">DAY 1</span> K-IDOL (Premium) <span className="text-gray-300 mx-1">|</span> <span className="text-[#10B981] font-bold">DAY 2</span> Premium Health + Rejuran</>
                                        }
                                    </p>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                                        <div className="bg-[#F8F9FA] rounded-lg py-3">
                                            <span className="block text-[12px] text-[#888] mb-1 font-medium tracking-tight">{isEn ? 'Current' : '현재 참여'}</span>
                                            <span className="block text-[20px] font-[800] tracking-tight" style={{ color: accentColor }}>{group.currentCount}/{group.maxCount}{isEn ? '' : '명'}</span>
                                        </div>
                                        <div className="bg-[#F8F9FA] rounded-lg py-3">
                                            <span className="block text-[12px] text-[#888] mb-1 font-medium tracking-tight">{isEn ? 'Discount' : '현재 할인율'}</span>
                                            <span className="block text-[20px] font-[800] text-[#111] tracking-tight">{currentDiscount}%</span>
                                        </div>
                                        <div className="bg-[#FFF0F0] border border-[#FFD6D6] rounded-lg py-3 relative overflow-hidden">
                                            <span className="block text-[12px] text-[#FF4D4D] mb-1 font-bold tracking-tight z-10 relative">{isEn ? 'Time Left' : '남은 시간'}</span>
                                            <div className="text-[16px] font-black text-[#FF4D4D] tracking-tight z-10 relative flex items-center justify-center gap-1">
                                                <Timer size={14} />
                                                <CountdownTimer targetDate={group.endDate} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-2 bg-[#F8F9FA] p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between text-[12px] text-[#555] font-bold mb-2 tracking-tight">
                                            <span>{isEn ? 'Progress' : '진행률'}</span>
                                            <span>{Math.round((group.currentCount / group.maxCount) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-white rounded-full h-3 mb-2 border border-gray-100">
                                            <div className="h-3 rounded-full transition-all duration-1000" style={{ width: `${(group.currentCount / group.maxCount) * 100}%`, backgroundColor: accentColor }}></div>
                                        </div>
                                        <p className="text-[12px] text-[#666] tracking-tight font-medium flex items-center gap-1">
                                            <Zap size={12} className="text-yellow-500 fill-yellow-500" />
                                            {isEn 
                                                ? `${neededForNext} more people needed for next discount!` 
                                                : `${neededForNext}명 더 모이면 할인율 증가!`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="bg-[#fff] pt-4">
                                     <div className="bg-[#111] text-white text-center text-[15px] font-[800] py-3.5 rounded-[10px] mb-3 shadow-sm tracking-tight flex items-center justify-center gap-2">
                                        <Flame size={16} className="text-orange-500 fill-orange-500" />
                                        {currentDiscount}% {isEn ? 'Discount Applied' : '할인 적용 중'}
                                    </div>

                                    <div className="flex gap-2.5">
                                        <button className="flex-1 bg-white border border-[#E5E7EB] text-[#333] py-3.5 rounded-[10px] text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors tracking-tight">
                                            <Info size={16} strokeWidth={2.5} /> {isEn ? 'Details' : '상세보기'}
                                        </button>
                                        <button onClick={() => handleJoinClick(group)} className="flex-1 bg-[#0070F0] text-white py-3.5 rounded-[10px] text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-600 shadow-md transition-all transform hover:-translate-y-0.5 tracking-tight">
                                            <Users size={16} fill="white" /> {isEn ? 'Join Now' : '참여하기'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* --- Create Group Section --- */}
        <div id="create-group-section" className="bg-[#EAF8FF] rounded-[24px] p-10 md:p-14 mb-20 mx-auto max-w-[1200px] scroll-mt-20">
            <div className="text-center mb-10">
                <h3 className="text-[28px] font-black text-[#111] mb-3 flex items-center justify-center gap-2 tracking-[-0.03em]">
                    <div className="w-8 h-8 bg-[#111] rounded-full text-white flex items-center justify-center"><Plus size={20} strokeWidth={4} /></div>
                    {isEn ? 'Create Group Buy' : '공동구매 생성하기'}
                </h3>
                <p className="text-[#555] text-[15px] font-medium tracking-tight mb-8">
                    {isEn ? 'Choose discount and start! The more people, the bigger the discount.' : '인원을 선택하고 할인된 가격으로 구매하세요! 더 많은 인원이 모일수록 할인율이 커집니다.'}
                </p>
                <StepIndicator />
            </div>

            {/* STEP 0: Select Type */}
            {step === 0 && (
                <div className="animate-fade-in">
                    <div className="text-center mb-8 text-[16px] font-bold text-[#333] tracking-tight">{isEn ? 'Select Group Type' : '그룹 모집 유형 선택'}</div>
                    <div className="flex flex-col md:flex-row gap-6 max-w-[1000px] mx-auto">
                        <div onClick={() => handleTypeSelect('public')} className="flex-1 bg-white rounded-2xl border-2 border-transparent hover:border-[#6A75E6] p-8 text-center cursor-pointer shadow-sm hover:shadow-xl transition-all group">
                             <div className="w-20 h-20 bg-[#6A75E6] rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-md group-hover:scale-105 transition-transform"><Users size={40} fill="white" /></div>
                             <h4 className="text-[20px] font-bold text-[#111] mb-2 tracking-tight">{isEn ? 'Public Group' : '공개 그룹 모집'}</h4>
                             <p className="text-[13px] text-[#666] mb-8 font-medium tracking-tight">{isEn ? 'Recruit with others' : '다른 사람들과 함께 모집'}</p>
                             <div className="text-left bg-white rounded-xl p-6 mb-8 space-y-3 text-[13px] text-[#444] leading-relaxed shadow-sm">
                                <ul className="text-[#666] space-y-1.5 list-disc pl-4 marker:text-[#ccc] tracking-tight">
                                    <li>{isEn ? 'Deposit 100,000 KRW' : '예약금 ₩100,000 결제'}</li>
                                    <li>{isEn ? 'Anyone can join' : '다른 사람들도 참여 가능'}</li>
                                    <li>{isEn ? 'Recruit in 7 days' : '7일간 최대 10명까지 모집'}</li>
                                    <li>{isEn ? 'Discount 10-50%' : '모집 인원별 할인율 상이 (10~50%)'}</li>
                                </ul>
                             </div>
                             <div className="bg-[#E8F4FF] rounded-lg py-4"><span className="block text-[12px] text-[#0070F0] mb-1 font-bold tracking-tight">MAX</span><span className="text-[28px] font-black text-[#0070F0] tracking-[-0.03em]">50%</span></div>
                        </div>
                        <div onClick={() => handleTypeSelect('private')} className="flex-1 bg-white rounded-2xl border-2 border-transparent hover:border-[#FF6B9B] p-8 text-center cursor-pointer shadow-sm hover:shadow-xl transition-all group">
                             <div className="w-20 h-20 bg-[#FF6B9B] rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-md group-hover:scale-105 transition-transform"><User size={40} fill="white" /></div>
                             <h4 className="text-[20px] font-bold text-[#111] mb-2 tracking-tight">{isEn ? 'Private Group' : '비공개 그룹 모집'}</h4>
                             <p className="text-[13px] text-[#666] mb-8 font-medium tracking-tight">{isEn ? 'With friends only' : '친구, 가족끼리만'}</p>
                             <div className="text-left bg-white rounded-xl p-6 mb-8 space-y-3 text-[13px] text-[#444] leading-relaxed shadow-sm">
                                <ul className="text-[#666] space-y-1.5 list-disc pl-4 marker:text-[#ccc] tracking-tight">
                                    <li>{isEn ? 'Select headcount' : '현재 인원 선택 (1~10명)'}</li>
                                    <li>{isEn ? 'Instant discount' : '인원별 할인가 즉시 적용'}</li>
                                    <li>{isEn ? 'Full payment' : '전액 바로 결제'}</li>
                                    <li>{isEn ? 'Instant confirm' : '예약 즉시 확정'}</li>
                                </ul>
                             </div>
                             <div className="bg-[#FFF0F0] rounded-lg py-4"><span className="block text-[12px] text-[#FF4D4D] mb-1 font-bold tracking-tight">Confirm</span><span className="text-[24px] font-black text-[#FF4D4D] tracking-[-0.03em]">10% ~ 50%</span></div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* STEP 1: Select Product */}
            {step === 1 && (
                <div className="animate-fade-in max-w-[1000px] mx-auto">
                    <div className="text-center mb-8 text-[16px] font-bold text-[#333] tracking-tight">{isEn ? 'Step 1: Select Product' : '1단계: 상품 선택'}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => handleProductSelect('basic')} className="bg-white rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0070F0] shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-full group">
                            <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden"><img src="https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/ff52ffbd8b074f22f92879af29f72de4.png" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt=""/></div>
                            <h4 className="text-[20px] font-extrabold text-[#111] mb-2 tracking-[-0.03em]">{isEn ? 'Basic Package' : '올인원 패키지 - 베이직'}</h4>
                            <p className="text-[14px] text-[#555] mb-4 font-medium">{isEn ? 'Base Price (Male):' : '기준가 (남성):'} <span className="font-bold text-[#111]">₩2,205,000</span></p>
                        </div>
                        <div onClick={() => handleProductSelect('premium')} className="bg-white rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0070F0] shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-full group">
                             <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden"><img src="https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/38201343997edc3482db1092fb6f6d44.png" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt=""/></div>
                            <h4 className="text-[20px] font-extrabold text-[#111] mb-2 tracking-[-0.03em]">{isEn ? 'Premium Package' : '올인원 패키지 - 프리미엄'}</h4>
                            <p className="text-[14px] text-[#555] mb-4 font-medium">{isEn ? 'Base Price (Male):' : '기준가 (남성):'} <span className="font-bold text-[#111]">₩6,012,000</span></p>
                        </div>
                    </div>
                    <button onClick={() => setStep(0)} className="mt-8 block mx-auto text-[#888] hover:text-[#333] text-sm font-medium underline underline-offset-4">{isEn ? 'Back' : '이전 단계로 돌아가기'}</button>
                </div>
            )}

            {/* STEP 2: Select Headcount */}
            {step === 2 && selectedProduct && (
                 <div className="animate-fade-in max-w-[800px] mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="text-[16px] font-bold text-[#333] tracking-tight">{isEn ? 'Step 2: Headcount' : '2단계: 인원 선택'}</div>
                        <button onClick={handleShare} className="text-[#0070F0] font-bold text-sm flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"><Share2 size={16} />{isEn ? 'Invite' : '친구 초대하기'}</button>
                    </div>
                    <div className="bg-white rounded-[20px] p-8 md:p-10 shadow-sm border border-gray-100 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[14px] font-bold text-[#0070F0] mb-2">♂ {isEn ? 'Male' : '남성 인원'}</label>
                                <div className="relative"><select value={maleCount} onChange={(e) => setMaleCount(Number(e.target.value))} className="w-full h-[50px] px-4 rounded-lg border border-[#DDD] appearance-none font-bold text-[#333] bg-white cursor-pointer">{[...Array(maxMale + 1)].map((_, i) => (<option key={i} value={i}>{i}{isEn ? '' : '명'}</option>))}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" size={20} /></div>
                             </div>
                             <div>
                                <label className="block text-[14px] font-bold text-[#FF4D6D] mb-2">♀ {isEn ? 'Female' : '여성 인원'}</label>
                                <div className="relative"><select value={femaleCount} onChange={(e) => setFemaleCount(Number(e.target.value))} className="w-full h-[50px] px-4 rounded-lg border border-[#DDD] appearance-none font-bold text-[#333] bg-white cursor-pointer">{[...Array(maxFemale + 1)].map((_, i) => (<option key={i} value={i}>{i}{isEn ? '' : '명'}</option>))}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" size={20} /></div>
                             </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="p-8 pb-4">
                            <h4 className="text-[16px] font-bold text-[#111] mb-6 tracking-tight">{isEn ? 'Summary' : '주문 요약'}</h4>
                            <div className="space-y-4 text-[14px]">
                                <div className="flex justify-between items-center py-2"><span className="text-[#666] font-bold">{isEn ? 'Product' : '선택 상품'}</span><span className="font-bold text-[#333]">{selectedProduct === 'basic' ? 'Basic' : 'Premium'}</span></div>
                                <div className="flex justify-between items-center py-2 border-b border-[#F5F5F5]"><span className="text-[#666] font-bold">{isEn ? 'Count' : '인원 수'}</span><span className="font-bold text-[#333]">{totalCount}{isEn ? '' : '명'}</span></div>
                                <div className="flex justify-between items-center py-2 border-b border-[#F5F5F5]"><span className="text-[#666] font-bold">{isEn ? 'Discount' : '할인율'}</span><span className="font-bold text-[#333] text-right">{discountRate}%</span></div>
                            </div>
                        </div>
                        <div className="bg-white px-8 py-6 flex justify-between items-center mt-2"><span className="font-bold text-[#111] text-[15px]">{isEn ? 'Total' : '총 결제금액'}</span><span className="text-[28px] font-black text-[#FF4D4D] tracking-[-0.02em]">₩{finalPrice.toLocaleString()}</span></div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3">
                         <button onClick={handlePaymentClick} className={`w-full py-4 rounded-lg font-bold text-[16px] flex items-center justify-center gap-2 shadow-md transition-all text-white ${totalCount > 0 ? 'bg-[#00B57F] hover:bg-[#009E6F]' : 'bg-[#E0E0E0] text-[#AAA] cursor-not-allowed'}`}><CreditCard size={20} />{isEn ? 'Pay Deposit' : '예약금 결제하고 참여하기'}</button>
                         <button onClick={() => setStep(1)} className="text-[#888] hover:text-[#333] text-sm font-medium underline underline-offset-4 py-2">{isEn ? 'Back' : '이전 단계로 돌아가기'}</button>
                    </div>
                </div>
            )}
        </div>

        {/* Process Section */}
        <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
                <MessageCircle size={28} className="text-[#0070F0] fill-[#0070F0] text-white" />
                <h3 className="text-[22px] font-bold text-[#111] tracking-[-0.03em]">{isEn ? 'How It Works' : '공동구매 진행 방식'}</h3>
            </div>
        </div>
        
        {/* Process Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {/* Public Process */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[#6A75E6] rounded-xl flex items-center justify-center text-white shadow-md">
                        <Users size={24} fill="white" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-[18px] font-bold text-[#111] tracking-tight">{isEn ? 'Public Group' : '공개 그룹 모집'}</h4>
                        <p className="text-[12px] text-[#888] font-medium tracking-tight">{isEn ? 'Recruit with others' : '다른 사람들과 함께 모집'}</p>
                    </div>
                </div>

                <div className="space-y-8 relative pl-2">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-[#F0F0F0] -z-0"></div>

                    {[
                        { title: isEn ? 'Deposit Payment' : '예약금 결제', desc: isEn ? 'Pay deposit to join' : '참여 신청 시 예약금 ₩100,000 결제' },
                        { title: isEn ? '7-Day Recruitment' : '7일간 모집', desc: isEn ? 'Up to 10 people can join' : '최대 10명까지 참여 가능하며, 인원이 많을수록 할인율 증가 (10~50%)' },
                        { title: isEn ? 'Recruitment End' : '모집 마감', desc: isEn ? 'Final discount fixed after 7 days' : '7일 후 모집 마감, 최종 인원 확정' },
                        { title: isEn ? 'Balance Payment' : '잔금 결제', desc: isEn ? 'Pay remaining balance' : '최종 인원에 따른 할인가로 잔금 결제 안내 (이메일/문자)' },
                        { title: isEn ? 'Confirmation' : '예약 확정', desc: isEn ? 'Reservation confirmed' : '잔금 결제 완료 후 최종 예약 확정' },
                    ].map((step, i) => (
                        <div key={i} className="flex gap-4 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-[#FF4D6D] text-white text-[13px] font-bold flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                                {i + 1}
                            </div>
                            <div className="pt-1">
                                <h5 className="text-[14px] font-bold text-[#333] mb-1 tracking-tight">{step.title}</h5>
                                <p className="text-[12px] text-[#777] leading-relaxed font-medium tracking-tight">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 bg-[#F0F8FF] rounded-lg p-4 text-center">
                    <span className="text-[12px] font-bold text-[#0070F0] block mb-1">💡 TIP</span>
                    <p className="text-[13px] text-[#333] font-bold tracking-tight">{isEn ? 'Cheaper with friends!' : '친구들과 함께 참여하면 더 큰 할인 혜택!'}</p>
                </div>
            </div>

            {/* Private Process */}
            <div className="bg-[#FFF5F7] rounded-2xl p-8 border border-[#FFE0E5] shadow-sm h-full">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[#FF6B9B] rounded-xl flex items-center justify-center text-white shadow-md">
                        <User size={24} fill="white" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-[18px] font-bold text-[#111] tracking-tight">{isEn ? 'Private Group' : '비공개 그룹 모집'}</h4>
                        <p className="text-[12px] text-[#888] font-medium tracking-tight">{isEn ? 'With friends only' : '친구, 가족끼리만'}</p>
                    </div>
                </div>

                <div className="space-y-8 relative pl-2">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-[#FFE0E5] -z-0"></div>

                    {[
                        { title: isEn ? 'Select Headcount' : '인원 선택', desc: isEn ? 'Choose current number (1-10)' : '현재 함께할 인원 선택 (남성/여성 각각 선택)' },
                        { title: isEn ? 'Check Discount' : '할인가 확인', desc: isEn ? 'Instant discount applied' : '선택한 인원에 따른 할인율 자동 적용 (10~50%)' },
                        { title: isEn ? 'Full Payment' : '전액 결제', desc: isEn ? 'Pay discounted total amount' : '할인된 금액 전액 즉시 결제 (추가 모집 없음)' },
                        { title: isEn ? 'Confirmation' : '즉시 확정', desc: isEn ? 'Reservation confirmed immediately' : '결제 완료 즉시 예약 확정 및 확인 메일 발송' },
                    ].map((step, i) => (
                        <div key={i} className="flex gap-4 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-[#A855F7] text-white text-[13px] font-bold flex items-center justify-center shrink-0 border-4 border-[#FFF5F7] shadow-sm">
                                {i + 1}
                            </div>
                            <div className="pt-1">
                                <h5 className="text-[14px] font-bold text-[#333] mb-1 tracking-tight">{step.title}</h5>
                                <p className="text-[12px] text-[#777] leading-relaxed font-medium tracking-tight">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-14 bg-[#FFF9E6] rounded-lg p-4 text-center border border-[#FFE082]">
                    <span className="text-[12px] font-bold text-[#F59E0B] block mb-1 flex justify-center items-center gap-1"><Zap size={12} fill="#F59E0B"/> FAST</span>
                    <p className="text-[13px] text-[#333] font-bold tracking-tight">{isEn ? 'Confirm immediately without waiting!' : '대기 없이 바로 예약 확정!'}</p>
                </div>
            </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="w-full rounded-[24px] overflow-hidden relative mb-20 shadow-xl group">
             <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"></div>
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
             
             <div className="relative z-10 p-10 md:p-16 text-center text-white">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                     <Users size={32} fill="white" />
                 </div>
                 <h2 className="text-[28px] md:text-[36px] font-[900] mb-4 tracking-[-0.03em] leading-tight drop-shadow-sm">
                     {isEn ? 'Start Your Special K-Experience Now!' : '지금 바로 친구들과 함께\n특별한 K-체험을 시작하세요!'}
                 </h2>
                 <p className="text-[15px] md:text-[16px] text-indigo-100 mb-10 font-medium tracking-tight">
                     {isEn ? 'More friends, bigger benefits!' : '더 많은 친구들과 함께할수록 더 큰 혜택!\n최대 50% 할인으로 K-뷰티, 건강검진, K-IDOL 체험을 즐겨보세요.'}
                 </p>
                 
                 <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-white text-[#6366F1] px-8 py-4 rounded-xl font-bold text-[15px] hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center gap-2"
                     >
                         <Flame size={18} fill="#6366F1" />
                         {isEn ? 'Join Ongoing Group' : '진행중인 공구 참여하기'}
                     </button>
                     <button 
                        onClick={() => document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-indigo-600 border border-indigo-400/30 text-white px-8 py-4 rounded-xl font-bold text-[15px] hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                     >
                         <Plus size={18} />
                         {isEn ? 'Create New Group' : '새 공구 만들기'}
                     </button>
                 </div>
             </div>
        </div>

      </div>

      {/* --- CREATE PAYMENT MODAL --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
             <div className="bg-white rounded-[24px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
                 <div className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                     <div><h2 className="text-[22px] font-black text-[#111]">{isEn ? 'Payment Info' : '결제 정보 입력'}</h2></div>
                     <button onClick={() => setIsPaymentModalOpen(false)}><X size={24} /></button>
                 </div>
                 <div className="p-8 space-y-5">
                      <div className="bg-[#FAFAFA] p-6 rounded-xl text-sm space-y-2">
                          <p className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">₩{selectedType === 'public' ? DEPOSIT_AMOUNT.toLocaleString() : finalPrice.toLocaleString()}</span></p>
                      </div>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" className="w-full h-12 border rounded-lg px-4"/>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full h-12 border rounded-lg px-4"/>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="w-full h-12 border rounded-lg px-4"/>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-12 border rounded-lg px-4"/>
                 </div>
                 <div className="p-8 pt-0 flex gap-3">
                     <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 h-[56px] border rounded-[10px] font-bold text-gray-500">Close</button>
                     <button onClick={handlePaymentSubmit} className="flex-[2] h-[56px] bg-[#00C7AE] text-white rounded-[10px] font-bold">Pay Now</button>
                 </div>
             </div>
        </div>
      )}

      {/* --- JOIN GROUP MODAL (New Request) --- */}
      {joiningGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
              <div className="bg-white rounded-[16px] w-full max-w-[500px] max-h-[95vh] overflow-y-auto relative shadow-2xl no-scrollbar">
                  
                  {/* Header */}
                  <div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                      <div>
                          <h2 className="text-[18px] font-bold text-[#111] leading-tight">{isEn ? 'Join Group Buy' : '공동구매 참여 신청'}</h2>
                          <p className="text-[12px] text-[#888] mt-1">{isEn ? 'Enter info to join' : '아래 정보를 입력하여 공동구매에 참여하세요'}</p>
                      </div>
                      <button onClick={() => setJoiningGroup(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} className="text-[#333]" /></button>
                  </div>

                  <div className="p-6">
                      
                      {/* 1. Participation Info (Gray Box) */}
                      <div className="bg-[#F8F9FA] rounded-xl p-5 mb-4">
                          <h3 className="text-[14px] font-bold text-[#111] mb-3">{isEn ? 'Participation Info' : '참여 정보'}</h3>
                          <div className="space-y-2 text-[13px]">
                              <div className="flex justify-between">
                                  <span className="text-[#666] font-medium">{isEn ? 'Product' : '선택 상품'}</span>
                                  <span className="font-bold text-[#333]">
                                      {joiningGroup.product === 'basic' 
                                        ? (isEn ? 'All-in-One Package - Basic' : '올인원 패키지 - 베이직')
                                        : (isEn ? 'All-in-One Package - Premium' : '올인원 패키지 - 프리미엄')}
                                  </span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-2">
                                  <span className="text-[#666] font-medium">{isEn ? 'Current Participants' : '현재 참여 인원'}</span>
                                  <span className="font-bold text-[#333]">{joiningGroup.currentCount}/{joiningGroup.maxCount}{isEn ? '' : '명'}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-2">
                                  <span className="text-[#666] font-medium">{isEn ? 'Discount' : '할인율'}</span>
                                  <span className="font-bold text-[#FF4D4D]">{joinCalcs.discount}%</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                                  <span className="text-[#111] font-bold">{isEn ? 'Est. Final Price' : '최종 참여 가격 (예상)'}</span>
                                  <span className="font-black text-[#0070F0] text-[15px]">₩{joinCalcs.finalPrice.toLocaleString()}</span>
                              </div>
                          </div>
                      </div>

                      {/* 2. Payment Guide (Blue Box) */}
                      <div className="bg-[#EAF6FF] border border-[#D6EBFF] rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-1.5 mb-2 text-[#0070F0] font-bold text-[13px]">
                              <Info size={14} /> {isEn ? 'Payment Guide' : '결제 진행 안내'}
                          </div>
                          <div className="space-y-1 text-[12px] text-[#444] font-medium pl-1">
                              <p><span className="text-[#0070F0] font-bold">1단계:</span> {isEn ? 'Pay Deposit ₩100,000 now' : '참여 신청 시 예약금 ₩100,000 결제'}</p>
                              <p><span className="text-[#00B57F] font-bold">2단계:</span> {isEn ? 'Pay balance after 7 days' : '7일 모집 마감 후 최종 인원에 따른 잔금 결제 안내'}</p>
                          </div>
                      </div>

                      {/* 3. Deposit Payment (Yellow Box) */}
                      <div className="bg-[#FFF9E6] border border-[#FFE082] rounded-xl p-5 mb-6">
                           <div className="flex items-center gap-1.5 mb-3 text-[#F59E0B] font-bold text-[14px]">
                              <CreditCard size={16} /> {isEn ? 'Deposit Payment' : '예약금 결제'}
                          </div>
                          <div className="flex justify-between items-center mb-2 text-[14px]">
                              <span className="font-bold text-[#333]">{isEn ? 'Deposit' : '예약금'}</span>
                              <span className="font-black text-[#F59E0B] text-[16px]">₩{joinCalcs.deposit.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-[#FFE082] border-dashed my-2"></div>
                          <div className="flex justify-between items-center text-[13px] text-[#666]">
                              <span>{isEn ? 'Balance (Post-deadline)' : '잔금 (모집 마감 후)'}</span>
                              <span className="font-bold">₩{joinCalcs.balance.toLocaleString()}</span>
                          </div>
                      </div>

                      {/* 4. Form Fields */}
                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="block text-[13px] font-bold text-[#333] mb-1.5">{isEn ? 'Name *' : '이름 *'}</label>
                              <input 
                                type="text" 
                                value={joinFormData.name}
                                onChange={(e) => setJoinFormData({...joinFormData, name: e.target.value})}
                                placeholder={isEn ? 'John Doe' : '홍길동'}
                                className="w-full h-[42px] px-3 rounded-lg border border-[#DDD] focus:outline-none focus:border-[#0070F0] text-[14px] bg-white text-[#333]"
                              />
                          </div>
                          <div>
                              <label className="block text-[13px] font-bold text-[#333] mb-1.5">{isEn ? 'Email *' : '이메일 *'}</label>
                              <input 
                                type="email" 
                                value={joinFormData.email}
                                onChange={(e) => setJoinFormData({...joinFormData, email: e.target.value})}
                                placeholder="example@email.com"
                                className="w-full h-[42px] px-3 rounded-lg border border-[#DDD] focus:outline-none focus:border-[#0070F0] text-[14px] bg-white text-[#333]"
                              />
                          </div>
                          <div>
                              <label className="block text-[13px] font-bold text-[#333] mb-1.5">{isEn ? 'Phone Number *' : '전화번호 *'}</label>
                              <input 
                                type="tel" 
                                value={joinFormData.phone}
                                onChange={(e) => setJoinFormData({...joinFormData, phone: e.target.value})}
                                placeholder="010-0000-0000"
                                className="w-full h-[42px] px-3 rounded-lg border border-[#DDD] focus:outline-none focus:border-[#0070F0] text-[14px] bg-white text-[#333]"
                              />
                          </div>
                          <div>
                              <label className="block text-[13px] font-bold text-[#333] mb-1.5">{isEn ? 'Gender *' : '성별 *'}</label>
                              <div className="relative">
                                <select 
                                    value={joinFormData.gender}
                                    onChange={(e) => setJoinFormData({...joinFormData, gender: e.target.value})}
                                    className="w-full h-[42px] px-3 rounded-lg border border-[#DDD] appearance-none focus:outline-none focus:border-[#0070F0] text-[14px] font-medium bg-white text-[#333]"
                                >
                                    <option value="male">{isEn ? 'Male' : '남성'}</option>
                                    <option value="female">{isEn ? 'Female' : '여성'}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" size={16} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[13px] font-bold text-[#333] mb-1.5">{isEn ? 'Visit Start Date *' : '방문 시작일 *'}</label>
                              <div className="relative">
                                <input 
                                    type="date" 
                                    value={joinFormData.date}
                                    onChange={(e) => setJoinFormData({...joinFormData, date: e.target.value})}
                                    className="w-full h-[42px] px-3 rounded-lg border border-[#DDD] focus:outline-none focus:border-[#0070F0] text-[14px] bg-white text-[#333]"
                                />
                              </div>
                              <p className="text-[11px] text-[#888] mt-1">{isEn ? 'Select arrival date in Korea (2-day itinerary)' : '한국 도착일을 선택하세요 (총 2일 일정)'}</p>
                          </div>
                      </div>
                      
                      {/* Checkbox */}
                      <div className="flex items-start gap-2 mb-2">
                          <input 
                            type="checkbox" 
                            id="agreeTerms" 
                            checked={joinFormData.agreed}
                            onChange={(e) => setJoinFormData({...joinFormData, agreed: e.target.checked})}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0070F0] focus:ring-[#0070F0]"
                          />
                          <label htmlFor="agreeTerms" className="text-[12px] text-[#555] cursor-pointer leading-snug">
                              {isEn ? 'I agree to the Group Buy terms and refund policy. Deposit is 100% refundable if group fails.' : '공동구매 약관 및 환불 정책에 동의합니다. 예약금은 모집 실패 시 100% 환불됩니다.'}
                          </label>
                      </div>

                  </div>

                  {/* Footer Buttons */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex gap-3">
                      <button 
                        onClick={() => setJoiningGroup(null)}
                        className="flex-1 h-[48px] bg-white border border-[#DDD] rounded-[8px] font-bold text-[14px] text-[#555] hover:bg-gray-50 transition-colors"
                      >
                         {isEn ? 'Close' : '닫기'}
                      </button>
                      <button 
                        onClick={handleJoinSubmit}
                        className="flex-[2] h-[48px] bg-[#00C7AE] text-white rounded-[8px] font-bold text-[14px] flex items-center justify-center gap-1.5 hover:bg-[#00B59E] shadow-md transition-all"
                      >
                         <CreditCard size={16} />
                         {isEn ? `Pay Deposit ₩${joinCalcs.deposit.toLocaleString()}` : `예약금 ₩${joinCalcs.deposit.toLocaleString()} 결제`}
                      </button>
                  </div>

              </div>
          </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-[#888] pt-12 pb-4 text-[12px] tracking-tight">
          <p className="mb-1 flex items-center justify-center gap-2">
              <span className="text-[#F59E0B]">💡</span>
              {isEn ? 'Contact us if you have questions' : '공동구매 관련 문의사항이 있으시면 언제든지 연락주세요'}
          </p>
          <p className="flex items-center justify-center gap-2">
              <span><span className="font-bold">support@k-experience.com</span></span>
              <span className="text-gray-300">|</span>
              <span><span className="font-bold">02-1234-5678</span></span>
          </p>
      </div>

      <style>{`
        @keyframes wiggle {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
        }
        .animate-wiggle {
            animation: wiggle 1s ease-in-out infinite;
        }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>

    </div>
  );
};
