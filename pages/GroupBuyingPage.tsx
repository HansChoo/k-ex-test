
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Flame, ChevronRight, Clock, MapPin, Search, Info } from 'lucide-react';
import { initializePayment } from '../services/paymentService';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useGlobal } from '../contexts/GlobalContext';

interface GroupBuyingPageProps { language: 'ko' | 'en'; }
interface GroupBuyItem { 
    id: string; 
    productType: 'basic' | 'premium'; 
    currentCount: number; 
    maxCount: number; 
    visitDate: string; 
    title: string;
    originalPrice: number;
    discountedPrice: number;
    [key: string]: any; 
}

export const GroupBuyingPage: React.FC<GroupBuyingPageProps> = () => {
  const { t, convertPrice, language } = useGlobal();
  const isEn = language !== 'ko';

  const [publicGroups, setPublicGroups] = useState<GroupBuyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "group_buys"), orderBy("visitDate", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupBuyItem));
        setPublicGroups(activeGroups);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full font-sans text-[#1a1a1a] bg-white pb-20">
      
      {/* Header Gradient */}
      <div className="bg-gradient-to-b from-[#FF8878] to-[#FF6B6B] pt-24 pb-12 px-6 text-white text-center rounded-b-[40px] shadow-lg mb-8">
          <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4">🔥 {t('hot_group')}</div>
          <h1 className="text-[32px] font-black mb-2 leading-tight">Your BEST K-experience<br/><span className="text-[#FFEB3B]">More People, Lower Price!</span></h1>
          <p className="text-white/90 text-sm font-medium leading-relaxed max-w-md mx-auto">{t('gb_desc')}</p>
      </div>

      <div className="max-w-[1000px] mx-auto px-4">
        
        {/* Search / Filter (Visual Only) */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar py-2">
            <button className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold whitespace-nowrap">전체 보기</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-xs font-bold whitespace-nowrap">공개 공구</button>
            <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-xs font-bold whitespace-nowrap">비밀 공구</button>
        </div>

        {/* Public Groups List */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 px-1">
                <Flame className="w-5 h-5 text-[#FF6B6B] fill-[#FF6B6B]" />
                <h3 className="text-[18px] font-bold text-[#111]">{t('ongoing_public')}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 px-1">{t('ongoing_public_desc')}</p>

            <div className="space-y-4">
                {publicGroups.length > 0 ? publicGroups.map((group) => {
                    // Safe Number Conversion to prevent NaN
                    const originalPrice = Number(group.originalPrice) || 0;
                    const discountedPrice = Number(group.discountedPrice) || 0;
                    const currentCount = Number(group.currentCount) || 0;
                    const maxCount = Number(group.maxCount) || 1; // Prevent div by zero
                    
                    const progress = (currentCount / maxCount) * 100;
                    
                    return (
                        <div key={group.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-md flex flex-col relative overflow-hidden">
                            {/* Product Badge */}
                            <div className={`absolute top-0 left-0 px-3 py-1 text-[10px] font-bold text-white rounded-br-xl ${group.productType === 'basic' ? 'bg-[#00C7AE]' : 'bg-[#FFD700]'}`}>
                                {group.productType === 'basic' ? 'BASIC' : 'PREMIUM'}
                            </div>

                            <div className="mt-4 flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-[16px] font-bold text-[#111] mb-1">{group.title}</h4>
                                    <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12}/> {group.visitDate}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[18px] font-black text-[#FF6B6B]">HOT DEAL</span>
                                    <span className="text-[10px] text-gray-400 line-through">₩ {originalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-gray-100 h-2 rounded-full mb-2 overflow-hidden">
                                <div className="h-full bg-[#FF6B6B] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-4">
                                <span>{currentCount}명 참여중</span>
                                <span className="text-[#FF6B6B]">{maxCount}명 모집 시 마감</span>
                            </div>

                            {/* Price Table (Simplified logic for UI) */}
                            <div className="bg-[#FFF5F5] rounded-xl p-3 mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">2명</span>
                                    <span className="font-bold text-[#111]">{convertPrice(originalPrice * 0.9)} <span className="text-green-500 bg-green-100 px-1 rounded">10%</span></span>
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">3명</span>
                                    <span className="font-bold text-[#111]">{convertPrice(originalPrice * 0.85)} <span className="text-green-500 bg-green-100 px-1 rounded">15%</span></span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-[#FF6B6B]">
                                    <span>현재가격</span>
                                    <span>{convertPrice(discountedPrice)} <span className="text-white bg-[#FF6B6B] px-1 rounded">SALE</span></span>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-[#FF6B6B] text-white font-bold rounded-xl text-sm hover:bg-[#ff5252] transition-colors flex items-center justify-center gap-1 shadow-lg shadow-red-100">
                                <Users size={16}/> {t('join_group')}
                            </button>
                        </div>
                    );
                }) : (
                    <div className="bg-gray-50 rounded-2xl p-10 text-center text-gray-400 border border-dashed border-gray-200">
                        <Info className="mx-auto mb-2 opacity-50"/>
                        <p>{t('no_active')}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Info Box */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Info size={16}/> 공동구매 안내</h4>
            <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                <li>목표 인원이 모집되면 자동으로 공동구매가 성사됩니다.</li>
                <li>모집 기간 내 목표 인원이 달성되지 않으면 예약금이 전액 환불됩니다.</li>
                <li>공동구매 성사 시 10% 추가 할인 혜택이 자동 적용됩니다.</li>
                <li>예약금 결제 후 마이페이지에서 진행 상황을 확인할 수 있습니다.</li>
            </ul>
        </div>

        {/* Create Button Fixed */}
        <div className="fixed bottom-24 left-0 w-full px-4 z-40 md:static md:mt-8 md:p-0">
            <button 
                onClick={() => document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full bg-[#FFD700] text-[#111] py-4 rounded-xl font-black text-[16px] shadow-xl hover:bg-[#FFC107] transition-all flex items-center justify-center gap-2"
            >
                <Users size={20}/> {t('create_group')}
            </button>
        </div>

      </div>
    </div>
  );
};
