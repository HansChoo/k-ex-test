
import React, { useState, useEffect } from 'react';
import { Users, Flame, Info, Crown, CheckCircle2, ChevronRight, Timer, Lock, Search, Plus, X, Calendar, CreditCard, UserPlus, Mail, Globe, Phone, Archive } from 'lucide-react';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, addDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { useGlobal } from '../contexts/GlobalContext';
import { requestPayment } from '../services/paymentService';
import { COUNTRY_CODES } from '../constants';

interface GroupBuyingPageProps { language: 'ko' | 'en'; }

interface GroupBuyItem { 
    id: string; 
    productId?: string;
    productName?: string;
    productImage?: string;
    priceMale?: number;
    priceFemale?: number;
    originalPrice?: number; // Legacy
    currentCount?: number; 
    maxCount?: number; 
    visitDate?: string; 
    leaderName?: string;
    participants?: string[];
    description?: string;
    items?: string[];
    isSecret?: boolean;
    secretCode?: string;
    status?: string;
    [key: string]: any; 
}

const CARD_THEMES = [
    { bg: 'bg-gradient-to-r from-blue-500 to-cyan-400', text: 'text-blue-600' },
    { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-purple-600' },
    { bg: 'bg-gradient-to-r from-orange-400 to-red-500', text: 'text-orange-600' },
    { bg: 'bg-gradient-to-r from-emerald-400 to-teal-500', text: 'text-emerald-600' }
];

export const GroupBuyingPage: React.FC<GroupBuyingPageProps> = () => {
  const { t, convertPrice, language, products, packages } = useGlobal();
  const isEn = language !== 'ko';

  const [activeTab, setActiveTab] = useState<'public' | 'secret' | 'completed'>('public');
  const [groupList, setGroupList] = useState<GroupBuyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "group_buys"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) => {
        setGroupList(s.docs.map(d => ({ id: d.id, ...d.data() } as GroupBuyItem)));
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleJoin = async (group: GroupBuyItem) => {
      if (!auth.currentUser) return alert(isEn ? "Login first" : "로그인 필수");
      
      const gender = prompt(isEn ? "Gender? (M/F)" : "성별을 입력하세요 (M/F)")?.toUpperCase();
      if (gender !== 'M' && gender !== 'F') return alert("Invalid Input");

      const basePrice = gender === 'M' ? (group.priceMale || group.originalPrice) : (group.priceFemale || group.originalPrice);
      const discountRate = Math.min(0.5, (group.currentCount || 0) * 0.05);
      const deposit = Math.round(basePrice * (1 - discountRate) * 0.2);

      if (confirm(`Join? Deposit: ${convertPrice(deposit)}`)) {
          const payment = await requestPayment({ merchant_uid: `gb_${Date.now()}`, name: group.productName || 'GB', amount: deposit });
          if (payment.success) {
              await updateDoc(doc(db, "group_buys", group.id), {
                  currentCount: increment(1),
                  participants: arrayUnion(auth.currentUser.uid)
              });
              alert("Joined!");
          }
      }
  };

  const renderDiscountTable = (pm: number, pf: number, currentCount: number) => {
      const tiers = [1, 2, 3, 5, 10];
      return (
          <div className="w-full bg-white rounded-lg border text-[11px] mb-4 overflow-hidden">
              <div className="flex bg-gray-50 font-bold py-2 px-2 border-b">
                  <div className="w-16">인원</div>
                  <div className="flex-1">남성 가격</div>
                  <div className="flex-1">여성 가격</div>
                  <div className="w-12">할인</div>
              </div>
              {tiers.map(tier => {
                  const rate = tier * 5;
                  const priceM = Math.round(pm * (1 - rate/100));
                  const priceF = Math.round(pf * (1 - rate/100));
                  return (
                      <div key={tier} className={`flex py-2 px-2 border-b last:border-0 ${currentCount === tier ? 'bg-blue-50' : ''}`}>
                          <div className="w-16 font-bold">{tier}명+</div>
                          <div className="flex-1 font-bold text-blue-600">{convertPrice(priceM)}</div>
                          <div className="flex-1 font-bold text-pink-600">{convertPrice(priceF)}</div>
                          <div className="w-12 text-right text-red-500">{rate}%</div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="w-full bg-[#F5F7FB] pb-24 min-h-screen">
      <section className="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white pt-28 pb-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-2">More People, Lower Price!</h1>
          <p className="opacity-90 font-bold">친구들과 함께하면 최대 50% 할인 혜택!</p>
      </section>

      <div className="max-w-[600px] mx-auto px-4 space-y-6 pt-10">
        {groupList.filter(g => g.status !== 'completed').map((group, idx) => (
            <div key={group.id} className="bg-white rounded-[24px] shadow-lg overflow-hidden border">
                <div className={`h-12 bg-gray-100 px-6 flex items-center justify-between font-bold`}>
                    <span>GROUP #{idx+1}</span>
                    <span className="text-xs text-gray-400">{group.visitDate}</span>
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{group.productName}</h2>
                    <p className="text-xs text-gray-400 mb-4">{group.description}</p>
                    
                    <div className="mb-4 bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span>모집 현황</span>
                            <span className="text-blue-600">{group.currentCount}명 참여 중</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{width: `${(group.currentCount/10)*100}%`}}></div>
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">💰 인원별 할인표 (성별 기준)</h4>
                    {renderDiscountTable(group.priceMale || group.originalPrice || 0, group.priceFemale || group.originalPrice || 0, group.currentCount || 0)}

                    <button onClick={() => handleJoin(group)} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all">
                        공동구매 참여하기
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
