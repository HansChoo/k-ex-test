
import React, { useState, useEffect } from 'react';
import { Calendar, Info, Users, Lock, CheckCircle2, User, Zap, MessageCircle, Flame, Ban, CreditCard, ChevronDown, X, Share2, Check, Sparkles, Megaphone, Timer, Plus, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
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
    startDate: number; // timestamp (Creation Date)
    endDate: number;   // timestamp (Recruitment Deadline)
    visitDate: string; // YYYY-MM-DD (Scheduled Visit Date)
    creatorName: string;
}

// Pricing Constants
const PRICES = {
    basic: { male: 2205000, female: 2322000 },
    premium: { male: 6012000, female: 6282000 }
};

const DEPOSIT_AMOUNT_PER_PERSON = 100000; // Fixed Deposit

// Custom Hook for Real-time Countdown based on Visit Date
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            // Target is the Visit Date (Midnight)
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft('EXPIRED');
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
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
      agreed: false
  });
  // Join Counters
  const [joinMaleCount, setJoinMaleCount] = useState(1);
  const [joinFemaleCount, setJoinFemaleCount] = useState(0);

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
    date: '', // Creator Selects Date
    request: ''
  });

  // 1. [REAL-TIME LISTENER] Load groups from Firestore
  useEffect(() => {
    // Listen to 'group_buys' collection, ordered by visitDate
    const q = query(collection(db, "group_buys"), orderBy("visitDate", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as GroupBuyItem));
        
        // Filter out expired groups if needed (client side for now)
        const activeGroups = groups.filter(g => new Date(g.visitDate).getTime() > new Date().getTime());

        setPublicGroups(activeGroups);
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

  // --- Calculations for CREATOR ---
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
      if (!auth.currentUser) {
          alert(isEn ? "Please login first." : "로그인이 필요합니다.");
          return;
      }
      setIsPaymentModalOpen(true);
  };

  // --- [CREATE] Payment & DB Update ---
  const handlePaymentSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.date) {
        alert(isEn ? "Please fill in all fields." : "필수 정보를 모두 입력해주세요.");
        return;
    }

    const productName = selectedProduct === 'basic' 
        ? (isEn ? 'All-in-One Basic (Group Leader)' : '올인원 패키지 - 베이직 (리더)')
        : (isEn ? 'All-in-One Premium (Group Leader)' : '올인원 패키지 - 프리미엄 (리더)');
    
    // Deposit calculation
    const amountToPay = selectedType === 'public' ? (DEPOSIT_AMOUNT_PER_PERSON * totalCount) : finalPrice;

    try {
        const response = { success: true }; // Simulated Payment

        if (response.success) {
             // 1. If Public, Create a new Group Document in Firestore
             let newGroupId = '';
             if (selectedType === 'public' && selectedProduct) {
                 const docRef = await addDoc(collection(db, "group_buys"), {
                     type: 'public',
                     product: selectedProduct,
                     currentCount: totalCount,
                     maxCount: 10,
                     startDate: new Date().getTime(),
                     endDate: new Date().getTime() + (7 * 24 * 60 * 60 * 1000), // Legacy field
                     visitDate: formData.date, // KEY: Storing the Visit Date
                     creatorName: formData.name,
                     createdAt: serverTimestamp()
                 });
                 newGroupId = docRef.id;
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
                    groupId: newGroupId,
                    discountRate,
                    maleCount,
                    femaleCount
                }
             });

             alert(isEn ? "Group Created!" : "그룹이 생성되었습니다! 상단 리스트에서 확인해보세요.");
             setIsPaymentModalOpen(false);
             
             // Reset
             if (selectedType === 'private') {
                 setStep(0);
                 setSelectedType(null);
             }
        }
    } catch (error) {
        console.error("Payment Error", error);
        alert(isEn ? "Payment Failed." : "결제에 실패했습니다.");
    }
  };

  // --- [JOIN] Logic ---
  const handleJoinClick = (group: GroupBuyItem) => {
      if (!auth.currentUser) {
          alert(isEn ? "Please login first to join." : "참여하려면 로그인이 필요합니다.");
          return;
      }
      setJoiningGroup(group);
      // Reset Join Form
      setJoinFormData(prev => ({
          ...prev,
          name: auth.currentUser?.displayName || prev.name,
          email: auth.currentUser?.email || prev.email,
          agreed: false
      }));
      setJoinMaleCount(1);
      setJoinFemaleCount(0);
  };

  const joinCalcs = (() => {
      if (!joiningGroup) return { discount: 0, finalPrice: 0, deposit: 0, balance: 0, totalJoin: 0 };
      
      const totalJoin = joinMaleCount + joinFemaleCount;
      const newTotalGroupCount = joiningGroup.currentCount + totalJoin;

      // Calculate Discount based on projected total
      let currentDiscount = 0;
      if (newTotalGroupCount <= 2) currentDiscount = 10;
      else currentDiscount = Math.min(50, 15 + (newTotalGroupCount - 3) * 5);
      
      // Base Prices
      const malePrice = PRICES[joiningGroup.product].male;
      const femalePrice = PRICES[joiningGroup.product].female;
      
      const totalPriceRaw = (joinMaleCount * malePrice) + (joinFemaleCount * femalePrice);
      const finalPrice = totalPriceRaw * (1 - currentDiscount / 100);
      
      const totalDeposit = DEPOSIT_AMOUNT_PER_PERSON * totalJoin;
      const balance = finalPrice - totalDeposit;

      return { discount: currentDiscount, finalPrice, deposit: totalDeposit, balance, totalJoin };
  })();

  const handleJoinSubmit = async () => {
      if (!joiningGroup) return;
      if (!joinFormData.name || !joinFormData.email || !joinFormData.phone) {
          alert(isEn ? "Please fill in all fields." : "모든 정보를 입력해주세요.");
          return;
      }
      if (!joinFormData.agreed) {
          alert(isEn ? "Please agree to the terms." : "약관에 동의해주세요.");
          return;
      }
      if (joinCalcs.totalJoin === 0) {
          alert(isEn ? "Please select at least 1 person." : "최소 1명 이상 선택해주세요.");
          return;
      }

      try {
          // 1. Simulate Payment
          const response = { success: true };

          if (response.success) {
              // 2. [CORE LOGIC] Update Firestore: Increment Count
              const groupRef = doc(db, "group_buys", joiningGroup.id);
              
              await updateDoc(groupRef, {
                  currentCount: increment(joinCalcs.totalJoin)
              });

              // 3. Save Reservation Record
              await createReservation({
                  userId: auth.currentUser?.uid!, // Assumed logged in
                  productName: `Join: ${joiningGroup.product} (${joinCalcs.totalJoin} ppl)`,
                  date: joiningGroup.visitDate, // LOCKED DATE
                  peopleCount: joinCalcs.totalJoin,
                  totalPrice: joinCalcs.deposit, // Deposit paid
                  options: {
                      groupId: joiningGroup.id,
                      role: 'member',
                      maleCount: joinMaleCount,
                      femaleCount: joinFemaleCount,
                      visitDate: joiningGroup.visitDate
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
    <div className="w-full font-sans text-[#1a1a1a] bg-[#F5F9FC] pb-0">
      
      {/* 1. Hero Section */}
      <div className="pt-20 pb-16 text-center bg-[#F0F8FF] px-4">
        {/* ... (Hero content same as before) ... */}
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
        </p>
      </div>

      {/* Container */}
      <div className="max-w-[1000px] mx-auto px-4 -mt-6">
        
        {/* Section Title */}
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
                <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center animate-fade-in relative overflow-hidden group">
                    <Megaphone size={32} className="animate-wiggle text-blue-500 mb-4" />
                    <h4 className="text-[20px] font-bold text-[#333] mb-2">{isEn ? 'No active groups yet!' : '진행중인 공개 모집이 없습니다!'}</h4>
                    <p className="text-[#666] text-sm mb-8">{isEn ? 'Be the first leader and get huge discounts!' : '첫 번째 리더가 되어 최대 50% 할인을 받아보세요!'}</p>
                    <button 
                        onClick={() => {
                            document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' });
                            handleTypeSelect('public');
                        }}
                        className="bg-[#0070F0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                        <Sparkles size={16} fill="white" />
                        {isEn ? 'Create Group Buy Now' : '지금 바로 공동구매 생성하기'}
                    </button>
                </div>
            ) : (
                publicGroups.map((group) => {
                    const isBasic = group.product === 'basic';
                    let currentDiscount = 0;
                    if (group.currentCount <= 2) currentDiscount = 10;
                    else currentDiscount = Math.min(50, 15 + (group.currentCount - 3) * 5);
                    
                    const neededForNext = group.currentCount < 3 ? 3 : group.currentCount + 1;
                    const accentColor = isBasic ? '#0070F0' : '#00C7AE';
                    const imgUrl = isBasic 
                        ? "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/ff52ffbd8b074f22f92879af29f72de4.png"
                        : "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/38201343997edc3482db1092fb6f6d44.png";

                    return (
                        <div key={group.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 animate-slide-up hover:shadow-lg transition-all">
                            {/* Left Image */}
                            <div className="w-full md:w-[340px] shrink-0">
                                <div className="rounded-xl overflow-hidden bg-gray-100 h-[240px] md:h-full relative group/img">
                                    <img src={imgUrl} alt={group.product} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"/>
                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div> LIVE
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-[12px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                                        📅 Visit: {group.visitDate}
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
                                        <span className="text-[#111] text-[12px] font-bold px-3 py-1.5 rounded-full bg-gray-100 flex items-center gap-1 tracking-tight">
                                            Leader: {group.creatorName}
                                        </span>
                                    </div>
                                    
                                    <p className="text-[14px] text-[#0070F0] font-bold mb-4 tracking-tight flex items-center gap-2">
                                        <Calendar size={16} /> Visit Date: <span className="text-xl underline decoration-2 underline-offset-4">{group.visitDate}</span>
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
                                                <CountdownTimer targetDate={group.visitDate} />
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
                                <div className="bg-[#fff] pt-4 flex gap-2.5">
                                    <button onClick={() => handleJoinClick(group)} className="w-full bg-[#0070F0] text-white py-3.5 rounded-[10px] text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-600 shadow-md transition-all transform hover:-translate-y-0.5 tracking-tight">
                                        <Users size={16} fill="white" /> {isEn ? 'Join this Group' : '이 그룹 참여하기'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* --- Create Group Section --- */}
        <div id="create-group-section" className="bg-[#EAF8FF] rounded-[24px] p-6 md:p-14 mb-20 mx-auto max-w-[1200px] scroll-mt-20">
            {/* Header */}
            <div className="text-center mb-10">
                <h3 className="text-[28px] font-black text-[#111] mb-2 flex items-center justify-center gap-2 tracking-[-0.03em]">
                    <Plus size={24} strokeWidth={3} /> {isEn ? 'Create Group Buy' : '공동구매 생성하기'}
                </h3>
                <p className="text-gray-600 text-[15px] font-medium">
                    {isEn 
                        ? 'Select headcount and buy at a discounted price! The more people join, the bigger the discount.' 
                        : '인원을 선택하고 할인된 가격으로 구매하세요! 더 많은 인원이 모일수록 할인율이 커집니다.'}
                </p>
            </div>
            
            {/* Steps (Step Indicator remains if user proceeds, but step 0 is redesigned) */}
            {step > 0 && <StepIndicator />}

            {/* Step 0: Type Selection (Replaced with Detailed Process View) */}
            {step === 0 && (
                <div className="animate-fade-in max-w-[1100px] mx-auto">
                    {/* Header for Selection */}
                    <div className="text-center mb-8 flex items-center justify-center gap-2">
                        <MapPin size={24} className="text-[#0070F0]" fill="#0070F0" />
                        <span className="text-[20px] font-black text-[#111] tracking-tight">{isEn ? 'Group Buying Process' : '공동구매 진행 방식'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Public Card (Detailed Process) */}
                        <div 
                            onClick={() => handleTypeSelect('public')} 
                            className="bg-[#F0F8FF] rounded-[20px] p-8 cursor-pointer border border-[#D0E6F9] hover:border-blue-500 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                        >
                             {/* Header */}
                             <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-[#6A75E6] rounded-[16px] flex items-center justify-center text-white shadow-md">
                                    <Users size={32} fill="white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-[22px] font-black text-[#111] mb-1 tracking-tight">{isEn ? 'Public Group Recruitment' : '공개 그룹 모집'}</h4>
                                    <p className="text-[14px] text-[#666] font-medium tracking-tight">{isEn ? 'Recruit with others' : '다른 사람들과 함께 모집'}</p>
                                </div>
                             </div>
                             
                             {/* Steps List */}
                             <div className="space-y-6 flex-grow">
                                {[
                                    { num: 1, title: isEn ? 'Pay Deposit' : '예약금 결제', desc: isEn ? 'Pay ₩100,000 deposit when joining' : '참여 신청 시 예약금 ₩100,000 결제' },
                                    { num: 2, title: isEn ? 'Recruitment (7 Days)' : '7일간 모집', desc: isEn ? 'Max 10 people, discount increases with more people (10~50%)' : '최대 10명까지 참여 가능하며, 인원이 많을수록 할인율 증가 (10~50%)' },
                                    { num: 3, title: isEn ? 'Recruitment Closed' : '모집 마감', desc: isEn ? 'Closes after 7 days, final headcount confirmed' : '7일 후 모집 마감, 최종 인원 확정' },
                                    { num: 4, title: isEn ? 'Balance Payment' : '잔금 결제', desc: isEn ? 'Pay balance with final discount rate' : '최종 인원에 따른 할인가로 잔금 결제 안내 (이메일/문자)' },
                                    { num: 5, title: isEn ? 'Reservation Confirmed' : '예약 확정', desc: isEn ? 'Reservation confirmed after full payment' : '잔금 결제 완료 후 최종 예약 확정' }
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-7 h-7 rounded-full bg-[#FF4D6D] text-white flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5 shadow-sm">
                                            {s.num}
                                        </div>
                                        <div>
                                            <h5 className="text-[15px] font-bold text-[#333] mb-1">{s.title}</h5>
                                            <p className="text-[13px] text-[#666] leading-snug">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             {/* Bottom Tip */}
                             <div className="mt-8 bg-[#EBF8FF] rounded-xl p-4 flex items-center justify-center gap-2 text-center border border-[#BCE0FD]">
                                <Sparkles size={16} className="text-[#0070F0] fill-[#0070F0]" />
                                <span className="text-[13px] font-bold text-[#333]">{isEn ? 'Bigger discount if you join with friends!' : 'TIP : 친구들과 함께 참여하면 더 큰 할인 혜택!'}</span>
                             </div>
                        </div>

                        {/* Private Card (Detailed Process) */}
                        <div 
                            onClick={() => handleTypeSelect('private')} 
                            className="bg-[#FFF5F5] rounded-[20px] p-8 cursor-pointer border border-[#F9D0D0] hover:border-red-400 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                        >
                             {/* Header */}
                             <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-[#FF6B9B] rounded-[16px] flex items-center justify-center text-white shadow-md relative">
                                    <User size={32} fill="white" />
                                    <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5">
                                        <Lock size={10} className="text-[#FF6B9B]" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-[22px] font-black text-[#111] mb-1 tracking-tight">{isEn ? 'Private Group Recruitment' : '비공개 그룹 모집'}</h4>
                                    <p className="text-[14px] text-[#666] font-medium tracking-tight">{isEn ? 'With friends & family only' : '친구, 가족끼리만'}</p>
                                </div>
                             </div>
                             
                             {/* Steps List */}
                             <div className="space-y-6 flex-grow">
                                {[
                                    { num: 1, title: isEn ? 'Select People' : '인원 선택', desc: isEn ? 'Select headcount (Male/Female)' : '현재 함께할 인원 선택 (남성/여성 각각 선택)' },
                                    { num: 2, title: isEn ? 'Check Discount' : '할인가 확인', desc: isEn ? 'Instant discount based on headcount (10~50%)' : '선택한 인원에 따른 할인율 자동 적용 (10~50%)' },
                                    { num: 3, title: isEn ? 'Full Payment' : '전액 결제', desc: isEn ? 'Pay full discounted price immediately' : '할인된 금액 전액 즉시 결제 (추가 모집 없음)' },
                                    { num: 4, title: isEn ? 'Instant Confirm' : '즉시 확정', desc: isEn ? 'Instant confirmation upon payment' : '결제 완료 즉시 예약 확정 및 확인 메일 발송' }
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-7 h-7 rounded-full bg-[#AF52DE] text-white flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5 shadow-sm">
                                            {s.num}
                                        </div>
                                        <div>
                                            <h5 className="text-[15px] font-bold text-[#333] mb-1">{s.title}</h5>
                                            <p className="text-[13px] text-[#666] leading-snug">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             {/* Bottom Tip */}
                             <div className="mt-8 bg-[#FFF9C4] rounded-xl p-4 flex items-center justify-center gap-2 text-center border border-[#FFF176]">
                                <Zap size={16} className="text-[#F57F17] fill-[#F57F17]" />
                                <span className="text-[13px] font-bold text-[#333]">{isEn ? 'FAST: No wait, instant confirmation!' : 'FAST : 대기 없이 바로 예약 확정!'}</span>
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {step === 1 && (
                <div className="animate-fade-in max-w-[1000px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => handleProductSelect('basic')} className="bg-white rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0070F0] shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
                            <h4 className="text-[20px] font-extrabold text-[#111] mb-2">{isEn ? 'Basic Package' : '올인원 패키지 - 베이직'}</h4>
                            <p className="text-[14px] text-[#555] mb-4">₩2,205,000</p>
                        </div>
                        <div onClick={() => handleProductSelect('premium')} className="bg-white rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0070F0] shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
                            <h4 className="text-[20px] font-extrabold text-[#111] mb-2">{isEn ? 'Premium Package' : '올인원 패키지 - 프리미엄'}</h4>
                            <p className="text-[14px] text-[#555] mb-4">₩6,012,000</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && selectedProduct && (
                 <div className="animate-fade-in max-w-[800px] mx-auto">
                    <div className="bg-white rounded-[20px] p-8 md:p-10 shadow-sm border border-gray-100 mb-6">
                        {/* Date Selection for Creator */}
                        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <label className="block text-[14px] font-bold text-[#0070F0] mb-2">{isEn ? 'Visit Date (Required)' : '방문 예정일 (필수)'}</label>
                            <input 
                                type="date" 
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full h-[50px] px-4 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500 font-bold text-[#111] bg-white"
                            />
                            <p className="text-[12px] text-gray-500 mt-2">{isEn ? 'This date will be locked for all members joining your group.' : '이 날짜는 그룹에 참여하는 모든 멤버들에게 고정됩니다.'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[14px] font-bold text-[#333] mb-2">♂ {isEn ? 'Male' : '남성 인원'}</label>
                                <select value={maleCount} onChange={(e) => setMaleCount(Number(e.target.value))} className="w-full h-[50px] px-4 rounded-lg border border-[#DDD] appearance-none font-bold text-[#333] bg-white cursor-pointer">{[...Array(maxMale + 1)].map((_, i) => (<option key={i} value={i}>{i}{isEn ? '' : '명'}</option>))}</select>
                             </div>
                             <div>
                                <label className="block text-[14px] font-bold text-[#333] mb-2">♀ {isEn ? 'Female' : '여성 인원'}</label>
                                <select value={femaleCount} onChange={(e) => setFemaleCount(Number(e.target.value))} className="w-full h-[50px] px-4 rounded-lg border border-[#DDD] appearance-none font-bold text-[#333] bg-white cursor-pointer">{[...Array(maxFemale + 1)].map((_, i) => (<option key={i} value={i}>{i}{isEn ? '' : '명'}</option>))}</select>
                             </div>
                        </div>
                    </div>
                    {/* Summary & Pay Button */}
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="bg-white px-8 py-6 flex justify-between items-center"><span className="font-bold text-[#111] text-[15px]">{isEn ? 'Est. Total' : '예상 총액'}</span><span className="text-[28px] font-black text-[#FF4D4D] tracking-[-0.02em]">₩{finalPrice.toLocaleString()}</span></div>
                    </div>
                    <button onClick={handlePaymentClick} className={`w-full py-4 rounded-lg font-bold text-[16px] text-white shadow-md ${totalCount > 0 ? 'bg-[#00B57F]' : 'bg-gray-300'}`}>{isEn ? 'Create & Pay Deposit' : '예약금 결제하고 그룹 생성'}</button>
                </div>
            )}
        </div>

      </div>

      {/* --- PURPLE CTA BANNER (NEW) --- */}
      <div className="w-full bg-gradient-to-r from-[#6A75E6] to-[#8E54E9] py-16 md:py-20 text-center relative overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-xl"></div>
          
          <div className="max-w-[1000px] mx-auto px-4 relative z-10 flex flex-col items-center">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 text-white shadow-lg">
                   <Users size={32} fill="white" />
               </div>
               
               <h2 className="text-[28px] md:text-[36px] font-black text-white mb-4 leading-tight tracking-[-0.03em] whitespace-pre-wrap keep-all drop-shadow-md">
                   {isEn ? 'Start special K-Experience\nwith friends right now!' : '지금 바로 친구들과 함께\n특별한 K-체험을 시작하세요!'}
               </h2>
               
               <p className="text-[15px] md:text-[16px] text-white/90 mb-10 font-medium leading-relaxed max-w-[600px] whitespace-pre-wrap keep-all">
                   {isEn 
                    ? 'More friends, bigger benefits!\nEnjoy K-Beauty, Checkup, K-IDOL with up to 50% off.' 
                    : '더 많은 친구들과 함께할수록 더 큰 혜택!\n최대 50% 할인으로 K-뷰티, 건강검진, K-IDOL 체험을 즐겨보세요.'}
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-[500px]">
                   <button 
                       onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                       className="flex-1 bg-white text-[#6A75E6] py-4 rounded-lg font-bold text-[16px] hover:bg-gray-50 shadow-lg transition-all flex items-center justify-center gap-2"
                   >
                       <Flame size={18} fill="#6A75E6" />
                       {isEn ? 'Join Ongoing Group' : '진행중인 공구 참여하기'}
                   </button>
                   <button 
                       onClick={() => document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' })}
                       className="flex-1 bg-white/20 text-white border border-white/40 py-4 rounded-lg font-bold text-[16px] hover:bg-white/30 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
                   >
                       <Plus size={18} />
                       {isEn ? 'Create New Group' : '새 공구 만들기'}
                   </button>
               </div>
          </div>
      </div>
      
      {/* Footer Support Info (Small) */}
      <div className="text-center py-10 bg-white">
          <div className="flex flex-col items-center justify-center gap-2 text-[13px] text-[#888]">
             <div className="flex items-center gap-2 mb-1">
                 <Zap size={16} className="text-[#FFC107] fill-[#FFC107]" />
                 <span className="font-bold">{isEn ? 'Contact us anytime for inquiries' : '공동구매 관련 문의사항이 있으시면 언제든지 연락주세요'}</span>
             </div>
             <div className="flex items-center gap-4 text-[#666]">
                 <span className="flex items-center gap-1.5"><Mail size={14}/> support@k-experience.com</span>
                 <span className="w-px h-3 bg-gray-300"></span>
                 <span className="flex items-center gap-1.5"><Phone size={14}/> 02-1234-5678</span>
             </div>
          </div>
      </div>

      {/* --- CREATE PAYMENT MODAL --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
             <div className="bg-white rounded-[24px] w-full max-w-[520px] shadow-2xl relative p-8">
                 <h2 className="text-[22px] font-black text-[#111] mb-6">{isEn ? 'Confirm Creation' : '생성 확인'}</h2>
                 <p className="mb-4 text-sm text-gray-600">{isEn ? 'Deposit to pay:' : '결제할 예약금:'} <span className="font-bold text-black">₩{(DEPOSIT_AMOUNT_PER_PERSON * totalCount).toLocaleString()}</span></p>
                 <div className="flex gap-3">
                     <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 h-[56px] border rounded-[10px] font-bold text-gray-500">Cancel</button>
                     <button onClick={handlePaymentSubmit} className="flex-[2] h-[56px] bg-[#00C7AE] text-white rounded-[10px] font-bold">Confirm & Pay</button>
                 </div>
             </div>
        </div>
      )}

      {/* --- JOIN GROUP MODAL (UPDATED) --- */}
      {joiningGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
              <div className="bg-white rounded-[16px] w-full max-w-[500px] max-h-[95vh] overflow-y-auto relative shadow-2xl no-scrollbar">
                  
                  <div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-[18px] font-bold text-[#111]">{isEn ? 'Join Group' : '그룹 참여하기'}</h2>
                      <button onClick={() => setJoiningGroup(null)}><X size={20} /></button>
                  </div>

                  <div className="p-6">
                      
                      {/* Fixed Date Info */}
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-center">
                          <span className="block text-xs font-bold text-blue-600 mb-1">{isEn ? 'FIXED VISIT DATE' : '방문 예정일 (고정)'}</span>
                          <span className="text-xl font-black text-[#111]">{joiningGroup.visitDate}</span>
                      </div>

                      {/* Headcount Selection for Joiners */}
                      <div className="mb-6">
                          <label className="block text-[13px] font-bold text-[#333] mb-2">{isEn ? 'Select Participants' : '참여 인원 선택'}</label>
                          <div className="flex gap-4">
                              <div className="flex-1">
                                  <span className="text-xs text-gray-500 block mb-1">Male</span>
                                  <select 
                                    value={joinMaleCount} 
                                    onChange={(e) => setJoinMaleCount(Number(e.target.value))}
                                    className="w-full h-10 border rounded-md px-2 bg-white"
                                  >
                                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                              </div>
                              <div className="flex-1">
                                  <span className="text-xs text-gray-500 block mb-1">Female</span>
                                  <select 
                                    value={joinFemaleCount} 
                                    onChange={(e) => setJoinFemaleCount(Number(e.target.value))}
                                    className="w-full h-10 border rounded-md px-2 bg-white"
                                  >
                                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                              </div>
                          </div>
                      </div>

                      {/* Calculations Display */}
                      <div className="bg-[#F8F9FA] rounded-xl p-5 mb-4 space-y-2 text-[13px]">
                          <div className="flex justify-between">
                                <span className="text-[#666]">Participants</span>
                                <span className="font-bold">{joinCalcs.totalJoin} ppl</span>
                          </div>
                          <div className="flex justify-between">
                                <span className="text-[#666]">Discount Tier</span>
                                <span className="font-bold text-[#FF4D4D]">{joinCalcs.discount}%</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                                <span className="text-[#111] font-bold">Deposit to Pay</span>
                                <span className="font-black text-[#0070F0]">₩{joinCalcs.deposit.toLocaleString()}</span>
                          </div>
                      </div>

                      {/* User Info Form */}
                      <div className="space-y-4 mb-6">
                          <input type="text" value={joinFormData.name} onChange={(e) => setJoinFormData({...joinFormData, name: e.target.value})} placeholder="Name" className="w-full h-10 border rounded px-3 bg-white"/>
                          <input type="tel" value={joinFormData.phone} onChange={(e) => setJoinFormData({...joinFormData, phone: e.target.value})} placeholder="Phone" className="w-full h-10 border rounded px-3 bg-white"/>
                          <div className="flex items-center gap-2">
                              <input type="checkbox" checked={joinFormData.agreed} onChange={e => setJoinFormData({...joinFormData, agreed: e.target.checked})} />
                              <span className="text-xs text-gray-500">I agree to the terms.</span>
                          </div>
                      </div>
                  </div>

                  <div className="p-5 border-t flex gap-3">
                      <button onClick={handleJoinSubmit} className="w-full h-[48px] bg-[#00C7AE] text-white rounded-[8px] font-bold">
                         Pay Deposit ₩{joinCalcs.deposit.toLocaleString()}
                      </button>
                  </div>

              </div>
          </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
