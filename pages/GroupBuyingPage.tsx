
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
    originalPriceMale?: number;
    originalPriceFemale?: number;
    currentCount?: number; 
    maxCount?: number; 
    visitDate?: string; 
    leaderName?: string;
    participants?: string[];
    [key: string]: any; 
}

const CARD_THEMES = [
    { bg: 'bg-gradient-to-r from-blue-500 to-cyan-400', text: 'text-blue-600' },
    { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-purple-600' },
    { bg: 'bg-gradient-to-r from-orange-400 to-red-500', text: 'text-orange-600' },
    { bg: 'bg-gradient-to-r from-emerald-400 to-teal-500', text: 'text-emerald-600' }
];

export const GroupBuyingPage: React.FC<GroupBuyingPageProps> = () => {
  const { t, convertPrice, language, products } = useGlobal();
  const isEn = language !== 'ko';

  const [activeTab, setActiveTab] = useState<'public' | 'secret' | 'completed'>('public');
  const [groupList, setGroupList] = useState<GroupBuyItem[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newGroupData, setNewGroupData] = useState<any>({ productId: '', visitDate: '', participants: [] });

  useEffect(() => {
    const q = query(collection(db, "group_buys"), orderBy("createdAt", "desc"));
    const unsubGroup = onSnapshot(q, (snapshot) => {
        setGroupList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupBuyItem)));
        setLoading(false);
    });
    const fetchPkgs = async () => {
        const snap = await getDocs(collection(db, "cms_packages"));
        setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchPkgs();
    return () => unsubGroup();
  }, []);

  const handleJoin = async (group: GroupBuyItem) => {
      if (!auth.currentUser) return alert("Please login first.");
      
      const gender = prompt(isEn ? "Your Gender? (M/F)" : "성별을 입력하세요 (남/여)") === (isEn ? 'M' : '남') ? 'Male' : 'Female';
      const originalPrice = gender === 'Male' ? (group.originalPriceMale || group.originalPrice) : (group.originalPriceFemale || group.originalPrice);
      
      const discountRate = Math.min(0.3, (group.currentCount || 0) * 0.03);
      const currentPrice = originalPrice * (1 - discountRate);
      const deposit = Math.round(currentPrice * 0.2);

      if (!confirm(`${gender} - Deposit: ${convertPrice(deposit)}. Join?`)) return;

      const payment = await requestPayment({
          merchant_uid: `gb_${group.id}_${Date.now()}`,
          name: `GB Join: ${group.productName}`,
          amount: deposit,
          buyer_email: auth.currentUser.email || '',
      });

      if (payment.success) {
          await updateDoc(doc(db, "group_buys", group.id), {
              currentCount: increment(1),
              participants: arrayUnion(auth.currentUser.uid)
          });
          alert("Joined!");
      }
  };

  const renderDiscountTable = (group: GroupBuyItem) => {
      const tiers = [1, 2, 3, 5, 10];
      const pM = group.originalPriceMale || group.originalPrice || 0;
      const pF = group.originalPriceFemale || group.originalPrice || 0;

      return (
          <div className="w-full bg-white rounded-lg border border-gray-100 overflow-hidden text-[11px] mb-4 shadow-sm">
              <div className="flex bg-gray-800 text-white font-bold py-2 px-3 text-center">
                  <div className="flex-1">인원</div>
                  <div className="flex-1">남성 (할인가)</div>
                  <div className="flex-1">여성 (할인가)</div>
                  <div className="flex-1">할인율</div>
              </div>
              {tiers.map((tier) => {
                  const rate = tier * 0.03;
                  return (
                      <div key={tier} className="flex py-2 px-3 text-center border-b last:border-0 items-center">
                          <div className="flex-1 font-bold">{tier}명</div>
                          <div className="flex-1 text-blue-600 font-bold">{convertPrice(pM * (1-rate))}</div>
                          <div className="flex-1 text-pink-600 font-bold">{convertPrice(pF * (1-rate))}</div>
                          <div className="flex-1 text-gray-400">{(rate*100).toFixed(0)}%</div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="w-full font-sans bg-[#F5F7FB] pb-24 min-h-screen">
      <section className="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white pt-28 pb-16 px-6 text-center">
          <h1 className="text-4xl font-black mb-2">Together is Cheaper!</h1>
          <p className="font-bold opacity-90">인원수가 늘어날수록 최대 30%까지 할인이 적용됩니다.</p>
      </section>

      <div className="max-w-[600px] mx-auto px-4 space-y-6 pt-10">
        {groupList.filter(g => g.status !== 'completed').map((group, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            const pM = group.originalPriceMale || group.originalPrice || 0;
            const pF = group.originalPriceFemale || group.originalPrice || 0;
            const rate = Math.min(0.3, (group.currentCount || 0) * 0.03);

            return (
                <div key={group.id} className="bg-white rounded-[24px] shadow-xl overflow-hidden border border-gray-100">
                    <div className={`h-12 ${theme.bg} px-6 flex items-center justify-between text-white font-black uppercase text-xs tracking-widest`}>
                        <span>Group #{index+1}</span>
                        <span className="bg-black/20 px-2 py-1 rounded">D-7</span>
                    </div>
                    <div className="p-6">
                        <h2 className="text-xl font-black mb-1">{group.productName}</h2>
                        <p className="text-sm text-gray-500 mb-6">{group.visitDate} 이용 예정</p>
                        
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold mb-1"><span>모집 현황</span><span>{group.currentCount} / {group.maxCount}명</span></div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${theme.bg}`} style={{width: `${(group.currentCount/group.maxCount)*100}%`}}></div></div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">인원별 가격 안내</h4>
                            {renderDiscountTable(group)}
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-xl text-center mb-6 border border-yellow-100">
                            <p className="text-xs font-bold text-yellow-700 mb-1">현재 적용가 (예약금 20% 별도)</p>
                            <div className="flex justify-center gap-4 text-sm font-black">
                                <span className="text-blue-600">M: {convertPrice(pM * (1-rate))}</span>
                                <span className="text-pink-600">F: {convertPrice(pF * (1-rate))}</span>
                            </div>
                        </div>

                        <button onClick={() => handleJoin(group)} className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                            <Users size={18}/> 참여하기
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
