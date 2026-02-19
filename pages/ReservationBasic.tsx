
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Heart, MapPin, Copy, Star, Camera, UserPlus, Info, Loader2, MessageCircle, Trash2, Plus } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../services/firebaseConfig';
import { createReservation, checkAvailability, validateCoupon } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { useGlobal } from '../contexts/GlobalContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { generateMockReviews } from '../constants';

interface ReservationBasicProps {
  language: 'ko' | 'en' | 'ja' | 'zh'; 
}

export const ReservationBasic: React.FC<ReservationBasicProps> = () => {
  const { t, convertPrice, language, getLocalizedValue } = useGlobal();
  const isEn = language !== 'ko';
  
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews' | 'info' | 'faq' | 'map'>('detail');
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit'>('full');
  
  // Multi-Guest State
  const [guestList, setGuestList] = useState([
      { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }
  ]);
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState('');

  const [reviews, setReviews] = useState<any[]>([]);
  const [cmsData, setCmsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePayment('imp19424728');
    setReviews(generateMockReviews(50));
    if (!db) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, "cms_packages", "package_basic"), (doc) => {
        if (doc.exists()) setCmsData(doc.data());
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      const res = await validateCoupon(couponCode);
      if (res.valid) {
          setAppliedCoupon(res);
          setCouponMessage(t('discount_applied'));
      } else {
          setAppliedCoupon(null);
          setCouponMessage(t('invalid_coupon'));
      }
  };

  const addGuest = () => {
      setGuestList([...guestList, { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }]);
  };

  const removeGuest = (index: number) => {
      if (guestList.length > 1) {
          const newList = [...guestList];
          newList.splice(index, 1);
          setGuestList(newList);
      }
  };

  const updateGuest = (index: number, field: string, val: string) => {
      const newList = [...guestList];
      newList[index] = { ...newList[index], [field]: val };
      setGuestList(newList);
  };

  const getPrice = () => {
    let total = 0;
    const basePrice = cmsData?.price || 0;
    
    guestList.forEach(guest => {
        let p = basePrice;
        if (guest.gender === 'Female') p += 117000;
        total += p;
    });

    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') total = total * (1 - appliedCoupon.value / 100);
        else total = Math.max(0, total - appliedCoupon.value);
    }

    if (selectedPayment === 'deposit') total = total * 0.2; // 20% Deposit (Calculated on total)

    return Math.round(total);
  };

  const handleReservation = async () => {
    if (!selectedDate) { alert(t('select_options')); return; }
    
    // Validation
    for (let i = 0; i < guestList.length; i++) {
        if (!guestList[i].name || !guestList[i].dob) {
            alert(isEn ? `Please fill in details for Guest ${i+1}` : `방문자 ${i+1}의 정보를 모두 입력해주세요.`);
            return;
        }
    }
    // Check Messenger ID only for the first guest (Representative)
    if (!guestList[0].messengerId) {
        alert(isEn ? "Please enter a messenger ID for the main contact." : "대표 연락처(메신저 ID)를 입력해주세요.");
        return;
    }

    const { available } = await checkAvailability(selectedDate);
    if (available < guestList.length) { alert(t('sold_out')); return; }

    const priceNum = getPrice();
    const productName = `Basic Package (${selectedDate}) x${guestList.length}`;
    const merchant_uid = `mid_${new Date().getTime()}`;

    let buyerEmail = auth?.currentUser?.email || '';
    let buyerName = auth?.currentUser?.displayName || '';
    
    if (!auth?.currentUser) {
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
            userId: auth?.currentUser?.uid || 'guest', 
            productName, date: selectedDate, peopleCount: guestList.length, totalPrice: priceNum,
            options: { 
                payment: selectedPayment, coupon: appliedCoupon?.code,
                guests: guestList,
                guestEmail: buyerEmail
            }
        });
        alert(isEn ? "Confirmed! Survey sent to email." : "예약 확정! 사전 설문지가 이메일로 발송되었습니다.");
        window.location.href = "/";
    }
  };

  const title = getLocalizedValue(cmsData, 'title');
  const description = getLocalizedValue(cmsData, 'description');
  const content = getLocalizedValue(cmsData, 'content');
  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!cmsData) return <div className="p-20 text-center">No Content</div>;

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <h1 className="text-[24px] lg:text-[32px] font-[900] mb-2">{title}</h1>
                <p className="text-[15px] text-[#888] mb-6">{description}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-black">{convertPrice(getPrice() / (selectedPayment==='deposit'?0.2:1))}</span>
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

            <div className="px-4 lg:px-0 min-h-[400px] pb-20">
                {activeTab === 'detail' && <div className="prose max-w-none text-sm leading-7 text-gray-600" dangerouslySetInnerHTML={{ __html: content }} />}
                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        {reviews.map((rev, i) => (
                            <div key={i} className="border-b border-gray-100 pb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs">{rev.user.charAt(0)}</div><div><div className="font-bold text-sm">{rev.user}</div><div className="text-yellow-400 text-xs">★★★★★</div></div></div>
                                    <span className="text-xs text-gray-400">{rev.date}</span>
                                </div>
                                <p className="text-sm text-gray-600">{rev.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    {/* Date */}
                    <div className={`border-b border-[#eee] ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} className="w-full flex items-center justify-between p-5 text-left">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step1')}</span><span className={`text-[15px] font-bold ${selectedDate ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedDate || t('step1_label')}</span></div>
                            <ChevronDown size={20} className="text-[#888]" />
                        </button>
                        {openSection === 'date' && <div className="px-5 pb-6 bg-white"><div className="grid grid-cols-7 gap-1">{CALENDAR_DAYS.map(day => (<button key={day} onClick={() => { setSelectedDate(`2026-02-${day.toString().padStart(2,'0')}`); setOpenSection('options'); }} className={`h-9 text-[13px] rounded hover:bg-gray-50 flex items-center justify-center ${selectedDate?.includes(day.toString().padStart(2,'0')) ? 'bg-black text-white font-bold' : 'text-[#333]'}`}>{day}</button>))}</div></div>}
                    </div>

                    {/* Guest Options */}
                    <div className={`border-b border-[#eee] ${openSection === 'options' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'options' ? null : 'options')} disabled={!selectedDate} className={`w-full flex items-center justify-between p-5 text-left ${!selectedDate ? 'opacity-50' : ''}`}>
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step2')}</span><span className={`text-[15px] font-bold`}>{t('step2_label')} ({guestList.length} Guests)</span></div>
                            <ChevronDown size={20} />
                        </button>
                        {openSection === 'options' && selectedDate && (
                            <div className="px-5 pb-6 bg-white space-y-5 animate-fade-in">
                                {guestList.map((guest, idx) => (
                                    <div key={guest.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-gray-500 flex items-center gap-1"><UserPlus size={12}/> Guest {idx + 1}</span>
                                            {idx > 0 && <button onClick={() => removeGuest(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="Surname GivenName" value={guest.name} onChange={e => updateGuest(idx, 'name', e.target.value)} className="border p-2 rounded text-xs bg-white uppercase"/>
                                                <select value={guest.gender} onChange={e => updateGuest(idx, 'gender', e.target.value)} className="border p-2 rounded text-xs bg-white font-bold">
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female (+₩117,000)</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="date" value={guest.dob} onChange={e => updateGuest(idx, 'dob', e.target.value)} className="border p-2 rounded text-xs bg-white text-gray-500"/>
                                                <input type="text" placeholder="Nationality" value={guest.nationality} onChange={e => updateGuest(idx, 'nationality', e.target.value)} className="border p-2 rounded text-xs bg-white"/>
                                            </div>
                                            {idx === 0 && (
                                                <div className="pt-2 border-t border-gray-200 mt-2">
                                                    <label className="text-[10px] font-bold text-blue-600 block mb-1 flex items-center gap-1"><MessageCircle size={10}/> Representative Contact</label>
                                                    <div className="flex gap-2">
                                                        <select value={guest.messengerApp} onChange={e => updateGuest(idx, 'messengerApp', e.target.value)} className="border p-1.5 rounded text-xs bg-white font-bold w-1/3">
                                                            <option value="WhatsApp">WhatsApp</option>
                                                            <option value="KakaoTalk">Kakao</option>
                                                            <option value="Line">Line</option>
                                                            <option value="WeChat">WeChat</option>
                                                        </select>
                                                        <input type="text" placeholder="ID or Phone" value={guest.messengerId} onChange={e => updateGuest(idx, 'messengerId', e.target.value)} className="w-2/3 border p-2 rounded text-xs bg-white"/>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                <button onClick={addGuest} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold text-xs flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-colors">
                                    <Plus size={16}/> Add Guest / 대리인 추가
                                </button>

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
