
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Heart, MapPin, Copy, Star, Camera, UserPlus, Info, Loader2, MessageCircle, Trash2, Plus } from 'lucide-react';
import { auth, db } from '../services/firebaseConfig';
import { createReservation, checkAvailability, validateCoupon } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { useGlobal } from '../contexts/GlobalContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { generateMockReviews } from '../constants';

interface ReservationBasicProps {
  language: 'ko' | 'en'; 
}

export const ReservationBasic: React.FC<ReservationBasicProps> = () => {
  const { t, convertPrice, language, getLocalizedValue } = useGlobal();
  const isEn = language !== 'ko';
  
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews' | 'info' | 'faq' | 'map'>('detail');
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit'>('full');
  
  const [guestList, setGuestList] = useState([
      { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }
  ]);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState('');

  const [reviews, setReviews] = useState<any[]>([]);
  const [cmsData, setCmsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePayment('imp19424728');
    setReviews(generateMockReviews(50));
    const unsub = onSnapshot(doc(db, "cms_packages", "package_basic"), (doc) => {
        if (doc.exists()) setCmsData(doc.data());
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const getPrice = () => {
    let total = 0;
    const priceMale = cmsData?.priceMale || cmsData?.price || 0;
    const priceFemale = cmsData?.priceFemale || cmsData?.price || 0;
    
    guestList.forEach(guest => {
        total += guest.gender === 'Male' ? priceMale : priceFemale;
    });

    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') total = total * (1 - appliedCoupon.value / 100);
        else total = Math.max(0, total - appliedCoupon.value);
    }

    if (selectedPayment === 'deposit') total = total * 0.2; 

    return Math.round(total);
  };

  const handleReservation = async () => {
    if (!selectedDate) { alert(t('select_options')); return; }
    
    for (let i = 0; i < guestList.length; i++) {
        if (!guestList[i].name || !guestList[i].dob) {
            alert(isEn ? `Please fill in details for Guest ${i+1}` : `방문자 ${i+1}의 정보를 모두 입력해주세요.`);
            return;
        }
    }
    if (!guestList[0].messengerId) {
        alert(isEn ? "Please enter a messenger ID." : "연락처(메신저 ID)를 입력해주세요.");
        return;
    }

    const { available } = await checkAvailability(selectedDate);
    if (available < guestList.length) { alert(t('sold_out')); return; }

    const priceNum = getPrice();
    const productName = `${getLocalizedValue(cmsData, 'title')} (${selectedDate}) x${guestList.length}`;
    const merchant_uid = `mid_${new Date().getTime()}`;

    let buyerEmail = auth.currentUser?.email || '';
    let buyerName = auth.currentUser?.displayName || '';
    
    if (!auth.currentUser) {
        const guestEmail = prompt(isEn ? "Enter email for voucher:" : "바우처를 수령할 이메일을 입력하세요:");
        if(!guestEmail) return;
        buyerEmail = guestEmail;
        buyerName = guestList[0].name; 
    }

    const paymentResult = await requestPayment({
        merchant_uid, name: productName, amount: priceNum,
        buyer_email: buyerEmail, buyer_name: buyerName
    });

    if (paymentResult.success) {
        await createReservation({
            userId: auth.currentUser?.uid || 'guest', 
            productName, date: selectedDate, peopleCount: guestList.length, totalPrice: priceNum,
            options: { 
                payment: selectedPayment, coupon: appliedCoupon?.code,
                guests: guestList,
                guestEmail: buyerEmail
            }
        });
        alert(isEn ? "Confirmed!" : "예약 확정!");
        window.location.href = "/";
    }
  };

  const title = getLocalizedValue(cmsData, 'title');
  const description = getLocalizedValue(cmsData, 'description');
  const content = getLocalizedValue(cmsData, 'content');
  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <h1 className="text-[24px] lg:text-[32px] font-[900] mb-2">{title}</h1>
                <p className="text-[15px] text-[#888] mb-6">{description}</p>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-12 uppercase">Male</span>
                        <span className="text-xl font-black">{convertPrice(cmsData?.priceMale || 0)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-12 uppercase">Female</span>
                        <span className="text-xl font-black">{convertPrice(cmsData?.priceFemale || 0)}</span>
                    </div>
                </div>
            </div>

            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8">
                <div className="flex text-center">
                    {['detail', 'reviews', 'info', 'map'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 font-bold ${activeTab === tab ? 'text-[#111] border-b-2 border-black' : 'text-[#888]'}`}>
                            {tab === 'reviews' ? `Reviews(${reviews.length})` : tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 lg:px-0 min-h-[400px] pb-20" dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className={`border-b border-[#eee] ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} className="w-full flex items-center justify-between p-5 text-left">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step1')}</span><span className={`text-[15px] font-bold ${selectedDate ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedDate || t('step1_label')}</span></div>
                            <ChevronDown size={20} className="text-[#888]" />
                        </button>
                        {openSection === 'date' && <div className="px-5 pb-6 bg-white"><div className="grid grid-cols-7 gap-1">{CALENDAR_DAYS.map(day => (<button key={day} onClick={() => { setSelectedDate(`2026-02-${day.toString().padStart(2,'0')}`); setOpenSection('options'); }} className={`h-9 text-[13px] rounded hover:bg-gray-50 flex items-center justify-center ${selectedDate?.includes(day.toString().padStart(2,'0')) ? 'bg-black text-white font-bold' : 'text-[#333]'}`}>{day}</button>))}</div></div>}
                    </div>

                    <div className={`border-b border-[#eee] ${openSection === 'options' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'options' ? null : 'options')} disabled={!selectedDate} className={`w-full flex items-center justify-between p-5 text-left ${!selectedDate ? 'opacity-50' : ''}`}>
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step2')}</span><span className={`text-[15px] font-bold`}>{t('step2_label')} ({guestList.length} Guests)</span></div>
                            <ChevronDown size={20} />
                        </button>
                        {openSection === 'options' && selectedDate && (
                            <div className="px-5 pb-6 bg-white space-y-5">
                                {guestList.map((guest, idx) => (
                                    <div key={guest.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-gray-500">Guest {idx + 1}</span>
                                            {idx > 0 && <button onClick={() => { const nl = [...guestList]; nl.splice(idx,1); setGuestList(nl); }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="Full Name" value={guest.name} onChange={e => { const nl = [...guestList]; nl[idx].name = e.target.value; setGuestList(nl); }} className="border p-2 rounded text-xs bg-white uppercase"/>
                                                <select value={guest.gender} onChange={e => { const nl = [...guestList]; nl[idx].gender = e.target.value; setGuestList(nl); }} className="border p-2 rounded text-xs bg-white font-bold">
                                                    <option value="Male">Male ({convertPrice(cmsData?.priceMale || 0)})</option>
                                                    <option value="Female">Female ({convertPrice(cmsData?.priceFemale || 0)})</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="date" value={guest.dob} onChange={e => { const nl = [...guestList]; nl[idx].dob = e.target.value; setGuestList(nl); }} className="border p-2 rounded text-xs bg-white text-gray-500"/>
                                                <input type="text" placeholder="Nationality" value={guest.nationality} onChange={e => { const nl = [...guestList]; nl[idx].nationality = e.target.value; setGuestList(nl); }} className="border p-2 rounded text-xs bg-white"/>
                                            </div>
                                            {idx === 0 && (
                                                <input type="text" placeholder="Messenger ID (WhatsApp/Line)" value={guest.messengerId} onChange={e => { const nl = [...guestList]; nl[idx].messengerId = e.target.value; setGuestList(nl); }} className="w-full border p-2 rounded text-xs bg-white mt-2"/>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setGuestList([...guestList, { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold text-xs flex items-center justify-center gap-2"><Plus size={14}/> Add Guest</button>
                                <div><p className="text-[13px] font-bold text-[#333] mb-2">{t('payment_type')}</p><div className="flex flex-col gap-2">{['deposit', 'full'].map(p => (<button key={p} onClick={() => setSelectedPayment(p as any)} className={`w-full py-2.5 px-3 border rounded text-[13px] text-left flex justify-between bg-white ${selectedPayment === p ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' : 'border-[#ddd]'}`}>{p === 'deposit' ? t('pay_deposit') : t('pay_full')}{selectedPayment === p && <Check size={14} />}</button>))}</div></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-[#f9f9f9] p-5">
                    <div className="flex justify-between items-center mb-4"><span className="text-[14px] font-bold text-[#555]">{t('total')} ({guestList.length} Person)</span><div className="text-right"><span className="text-[20px] font-black text-[#111]">{convertPrice(getPrice())}</span></div></div>
                    <button onClick={handleReservation} className={`w-full py-4 rounded-lg font-bold text-[16px] text-white transition-colors bg-[#0070F0] hover:bg-blue-600`}>{t('book_now')}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
