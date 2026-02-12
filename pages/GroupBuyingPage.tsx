
import React, { useState, useEffect } from 'react';
import { Calendar, Info, Users, Lock, CheckCircle2, User, Zap, MessageCircle, Flame, Ban, CreditCard, ChevronDown, X, Share2, Check, Sparkles, Megaphone, Timer, Plus, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import { initializePayment } from '../services/paymentService';
import { auth, db } from '../services/firebaseConfig';
import { createReservation } from '../services/reservationService';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { useGlobal } from '../contexts/GlobalContext';

interface GroupBuyingPageProps {
  language: 'ko' | 'en';
}

interface GroupBuyItem {
    id: string; type: 'public'; product: 'basic' | 'premium'; currentCount: number; maxCount: number;
    startDate: number; endDate: number; visitDate: string; creatorName: string;
}

const PRICES = { basic: { male: 2205000, female: 2322000 }, premium: { male: 6012000, female: 6282000 } };
const DEPOSIT_AMOUNT_PER_PERSON = 100000;

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date(); const target = new Date(targetDate); target.setHours(23, 59, 59, 999);
            const distance = target.getTime() - now.getTime();
            if (distance < 0) { setTimeLeft('CLOSED'); clearInterval(interval); return; }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            setTimeLeft(`${days}d ${hours}h`);
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return <span className="font-mono tabular-nums tracking-tight">{timeLeft}</span>;
};

export const GroupBuyingPage: React.FC<GroupBuyingPageProps> = () => {
  const { t, convertPrice, language } = useGlobal();
  const isEn = language !== 'ko';

  const [publicGroups, setPublicGroups] = useState<GroupBuyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningGroup, setJoiningGroup] = useState<GroupBuyItem | null>(null);
  const [joinFormData, setJoinFormData] = useState({ name: '', email: '', phone: '', agreed: false });
  const [joinMaleCount, setJoinMaleCount] = useState(1);
  const [joinFemaleCount, setJoinFemaleCount] = useState(0);
  const [step, setStep] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<'public' | 'private' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<'basic' | 'premium' | null>(null);
  const [maleCount, setMaleCount] = useState<number>(0);
  const [femaleCount, setFemaleCount] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', request: '' });

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

  useEffect(() => {
    const q = query(collection(db, "group_buys"), orderBy("visitDate", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupBuyItem))
            .filter(g => new Date(g.visitDate).getTime() > new Date().getTime());
        setPublicGroups(activeGroups);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
        setFormData(prev => ({ ...prev, name: auth.currentUser?.displayName || '', email: auth.currentUser?.email || '' }));
        setJoinFormData(prev => ({ ...prev, name: auth.currentUser?.displayName || '', email: auth.currentUser?.email || '' }));
    }
  }, [auth.currentUser]);

  useEffect(() => { initializePayment('imp19424728'); }, []);
  
  const handleTypeSelect = (type: 'public' | 'private') => { setSelectedType(type); setStep(1); };
  const handleProductSelect = (product: 'basic' | 'premium') => { setSelectedProduct(product); setStep(2); setMaleCount(1); setFemaleCount(0); };

  const totalCount = maleCount + femaleCount;
  let discountRate = totalCount > 0 ? (totalCount <= 2 ? 10 : Math.min(50, 15 + (totalCount - 3) * 5)) : 0;
  const baseMalePrice = selectedProduct ? PRICES[selectedProduct].male : 0;
  const baseFemalePrice = selectedProduct ? PRICES[selectedProduct].female : 0;
  const finalPrice = (maleCount * baseMalePrice * (1 - discountRate/100)) + (femaleCount * baseFemalePrice * (1 - discountRate/100));

  const handlePaymentClick = () => {
      if (totalCount === 0 || !auth.currentUser || formData.date < today) { alert("Error"); return; }
      setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    const productName = `${t('create_group')} (${selectedProduct})`;
    const amountToPay = selectedType === 'public' ? (DEPOSIT_AMOUNT_PER_PERSON * totalCount) : finalPrice;
    
    try {
        let newGroupId = '';
        if (selectedType === 'public' && selectedProduct) {
             const docRef = await addDoc(collection(db, "group_buys"), {
                 type: 'public', product: selectedProduct, currentCount: totalCount, maxCount: 10,
                 visitDate: formData.date, creatorName: formData.name, createdAt: serverTimestamp()
             });
             newGroupId = docRef.id;
        }
        await createReservation({
            userId: auth.currentUser?.uid!, productName, date: formData.date, peopleCount: totalCount, totalPrice: amountToPay,
            options: { type: selectedType, role: 'leader', groupId: newGroupId }
        });
        alert("Success"); setIsPaymentModalOpen(false);
    } catch (e) { alert("Fail"); }
  };

  const handleJoinClick = (group: GroupBuyItem) => {
      if (!auth.currentUser) return;
      setJoiningGroup(group); setJoinMaleCount(1);
  };

  const joinCalcs = (() => {
      if (!joiningGroup) return { discount: 0, deposit: 0, totalJoin: 0 };
      const totalJoin = joinMaleCount + joinFemaleCount;
      const newTotal = joiningGroup.currentCount + totalJoin;
      const discount = newTotal <= 2 ? 10 : Math.min(50, 15 + (newTotal - 3) * 5);
      return { discount, deposit: DEPOSIT_AMOUNT_PER_PERSON * totalJoin, totalJoin };
  })();

  const handleJoinSubmit = async () => {
      if (!joiningGroup || joinCalcs.totalJoin === 0) return;
      try {
          await updateDoc(doc(db, "group_buys", joiningGroup.id), { currentCount: increment(joinCalcs.totalJoin) });
          await createReservation({
              userId: auth.currentUser?.uid!, productName: `Join: ${joiningGroup.product}`,
              date: joiningGroup.visitDate, peopleCount: joinCalcs.totalJoin, totalPrice: joinCalcs.deposit,
              options: { groupId: joiningGroup.id, role: 'member' }
          });
          alert("Success"); setJoiningGroup(null);
      } catch (e) { alert("Error"); }
  };

  return (
    <div className="w-full font-sans text-[#1a1a1a] bg-[#F5F9FC] pb-0">
      <div className="pt-20 pb-16 text-center bg-[#F0F8FF] px-4">
        <div className="inline-flex items-center gap-1.5 bg-white px-5 py-2 rounded-full border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] mb-8">
            <span className="text-[#FF4D4D] text-lg leading-none animate-pulse">🔥</span>
            <span className="text-[#333] text-[13px] font-bold tracking-tight">{t('hot_group')}</span>
        </div>
        <h1 className="text-[34px] md:text-[44px] font-[900] text-[#111] mb-2">{t('gb_title')}</h1>
        <h2 className="text-[38px] md:text-[54px] font-[900] text-[#FF4D6D] mb-8">{t('gb_sub')}</h2>
        <p className="text-[#555] text-[15px] md:text-[16px] font-medium leading-relaxed">{t('gb_desc')}</p>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 -mt-6">
        <div className="flex items-center justify-between mb-6 ml-1">
            <div className="flex items-center gap-2"><Flame className="w-6 h-6 text-[#FF8800] fill-[#FF8800]" /><h3 className="text-[20px] font-bold text-[#111]">{t('ongoing_public')}</h3></div>
            {publicGroups.length > 0 && (<div className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse"><span className="w-2 h-2 bg-red-600 rounded-full"></span>LIVE</div>)}
        </div>

        <div className="space-y-6 mb-20 min-h-[200px]">
            {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : publicGroups.length === 0 ? (
                <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center animate-fade-in relative overflow-hidden group">
                    <Megaphone size={32} className="animate-wiggle text-blue-500 mb-4" />
                    <h4 className="text-[20px] font-bold text-[#333] mb-2">{t('no_active')}</h4>
                    <p className="text-[#666] text-sm mb-8">{t('be_leader')}</p>
                    <button onClick={() => { document.getElementById('create-group-section')?.scrollIntoView({ behavior: 'smooth' }); handleTypeSelect('public'); }} className="bg-[#0070F0] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2"><Sparkles size={16} fill="white" />{t('create_group')}</button>
                </div>
            ) : (
                publicGroups.map((group) => {
                    const isBasic = group.product === 'basic';
                    let currentDiscount = 0;
                    if (group.currentCount <= 2) currentDiscount = 10;
                    else currentDiscount = Math.min(50, 15 + (group.currentCount - 3) * 5);
                    return (
                        <div key={group.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 animate-slide-up hover:shadow-lg transition-all">
                            <div className="w-full md:w-[340px] shrink-0">
                                <div className="rounded-xl overflow-hidden bg-gray-100 h-[240px] md:h-full relative group/img">
                                    <img src={isBasic ? "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/ff52ffbd8b074f22f92879af29f72de4.png" : "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/38201343997edc3482db1092fb6f6d44.png"} alt={group.product} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"/>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3"><h3 className="text-[24px] font-[800] text-[#111]">{isBasic ? t('pkg_basic') : t('pkg_prem')}</h3><span className="text-[#111] text-[12px] font-bold px-3 py-1.5 rounded-full bg-gray-100">Leader: {group.creatorName}</span></div>
                                    <p className="text-[14px] text-[#0070F0] font-bold mb-4 flex items-center gap-2"><Calendar size={16} /> {group.visitDate}</p>
                                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                                        <div className="bg-[#F8F9FA] rounded-lg py-3"><span className="block text-[12px] text-[#888] mb-1">{t('current')}</span><span className="block text-[20px] font-[800]" style={{ color: '#0070F0' }}>{group.currentCount}</span></div>
                                        <div className="bg-[#F8F9FA] rounded-lg py-3"><span className="block text-[12px] text-[#888] mb-1">{t('discount')}</span><span className="block text-[20px] font-[800] text-[#111]">{currentDiscount}%</span></div>
                                        <div className="bg-[#FFF0F0] border border-[#FFD6D6] rounded-lg py-3 relative"><span className="block text-[12px] text-[#FF4D4D] mb-1 font-bold">{t('time_left')}</span><div className="text-[16px] font-black text-[#FF4D4D] flex items-center justify-center gap-1"><Timer size={14} /><CountdownTimer targetDate={group.visitDate} /></div></div>
                                    </div>
                                </div>
                                <div className="bg-[#fff] pt-4 flex gap-2.5"><button onClick={() => handleJoinClick(group)} className="w-full bg-[#0070F0] text-white py-3.5 rounded-[10px] text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-600 shadow-md transition-all"><Users size={16} fill="white" /> {t('join_group')}</button></div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        <div id="create-group-section" className="bg-[#EAF8FF] rounded-[24px] p-6 md:p-14 mb-20 mx-auto max-w-[1200px] scroll-mt-20">
            <div className="text-center mb-10"><h3 className="text-[28px] font-black text-[#111] mb-2 flex items-center justify-center gap-2"><Plus size={24} /> {t('create_group')}</h3></div>
            {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div onClick={() => handleTypeSelect('public')} className="bg-[#F0F8FF] rounded-[20px] p-8 cursor-pointer border border-[#D0E6F9] hover:border-blue-500 hover:shadow-xl transition-all">
                        <h4 className="text-[22px] font-black text-[#111] mb-1">{t('ongoing_public')}</h4>
                    </div>
                    <div onClick={() => handleTypeSelect('private')} className="bg-[#FFF5F5] rounded-[20px] p-8 cursor-pointer border border-[#F9D0D0] hover:border-red-400 hover:shadow-xl transition-all">
                        <h4 className="text-[22px] font-black text-[#111] mb-1">Private Group</h4>
                    </div>
                </div>
            )}
            {step === 1 && (<div className="animate-fade-in max-w-[1000px] mx-auto"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div onClick={() => handleProductSelect('basic')} className="bg-white rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0070F0] shadow-sm hover:shadow-xl transition-all flex flex-col h-full"><h4 className="text-[20px] font-extrabold text-[#111] mb-2">{t('pkg_basic')}</h4></div><div onClick={() => handleProductSelect('premium')} className="bg-white rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-[#0070F0] shadow-sm hover:shadow-xl transition-all flex flex-col h-full"><h4 className="text-[20px] font-extrabold text-[#111] mb-2">{t('pkg_prem')}</h4></div></div></div>)}
            {step === 2 && selectedProduct && (
                 <div className="animate-fade-in max-w-[800px] mx-auto">
                    <div className="bg-white rounded-[20px] p-8 md:p-10 shadow-sm border border-gray-100 mb-6">
                        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <label className="block text-[14px] font-bold text-[#0070F0] mb-2">{t('visit_date_req')}</label>
                            <input type="date" value={formData.date} min={today} max={maxDate} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full h-[50px] px-4 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500 font-bold text-[#111] bg-white"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><label className="block text-[14px] font-bold text-[#333] mb-2">{t('male_cnt')}</label><select value={maleCount} onChange={(e) => setMaleCount(Number(e.target.value))} className="w-full h-[50px] px-4 rounded-lg border border-[#DDD] appearance-none font-bold text-[#333] bg-white cursor-pointer">{[...Array(10)].map((_, i) => (<option key={i} value={i}>{i}</option>))}</select></div><div><label className="block text-[14px] font-bold text-[#333] mb-2">{t('female_cnt')}</label><select value={femaleCount} onChange={(e) => setFemaleCount(Number(e.target.value))} className="w-full h-[50px] px-4 rounded-lg border border-[#DDD] appearance-none font-bold text-[#333] bg-white cursor-pointer">{[...Array(10)].map((_, i) => (<option key={i} value={i}>{i}</option>))}</select></div></div>
                    </div>
                    <button onClick={handlePaymentClick} className={`w-full py-4 rounded-lg font-bold text-[16px] text-white shadow-md ${totalCount > 0 ? 'bg-[#00B57F]' : 'bg-gray-300'}`}>{t('create_pay')}</button>
                </div>
            )}
        </div>
      </div>
      {isPaymentModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"><div className="bg-white rounded-[24px] w-full max-w-[520px] shadow-2xl relative p-8"><h2 className="text-[22px] font-black text-[#111] mb-6">Confirm Creation</h2><div className="flex gap-3"><button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 h-[56px] border rounded-[10px] font-bold text-gray-500">Cancel</button><button onClick={handlePaymentSubmit} className="flex-[2] h-[56px] bg-[#00C7AE] text-white rounded-[10px] font-bold">Confirm & Pay</button></div></div></div>)}
      {joiningGroup && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"><div className="bg-white rounded-[16px] w-full max-w-[500px] max-h-[95vh] overflow-y-auto relative shadow-2xl no-scrollbar"><div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-gray-100 flex justify-between items-center"><h2 className="text-[18px] font-bold text-[#111]">{t('join_group')}</h2><button onClick={() => setJoiningGroup(null)}><X size={20} /></button></div><div className="p-6"><div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-center"><span className="block text-xs font-bold text-blue-600 mb-1">FIXED VISIT DATE</span><span className="text-xl font-black text-[#111]">{joiningGroup.visitDate}</span></div><div className="mb-6"><label className="block text-[13px] font-bold text-[#333] mb-2">Participants</label><div className="flex gap-4"><div className="flex-1"><span className="text-xs text-gray-500 block mb-1">Male</span><select value={joinMaleCount} onChange={(e) => setJoinMaleCount(Number(e.target.value))} className="w-full h-10 border rounded-md px-2 bg-white">{[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></div><div className="flex-1"><span className="text-xs text-gray-500 block mb-1">Female</span><select value={joinFemaleCount} onChange={(e) => setJoinFemaleCount(Number(e.target.value))} className="w-full h-10 border rounded-md px-2 bg-white">{[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></div></div></div><div className="p-5 border-t flex gap-3"><button onClick={handleJoinSubmit} className="w-full h-[48px] bg-[#00C7AE] text-white rounded-[8px] font-bold">Pay Deposit ₩{joinCalcs.deposit.toLocaleString()}</button></div></div></div></div>)}
    </div>
  );
};
