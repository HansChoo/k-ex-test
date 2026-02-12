
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Heart, MapPin, Copy, Camera, UserPlus, Loader2, Info } from 'lucide-react';
import { auth, db } from '../services/firebaseConfig';
import { createReservation, checkAvailability } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { loginWithGoogle, handleAuthError } from '../services/authService';
import { useGlobal } from '../contexts/GlobalContext';
import { doc, onSnapshot } from 'firebase/firestore';

interface ReservationPremiumProps {
  language: 'ko' | 'en';
}

export const ReservationPremium: React.FC<ReservationPremiumProps> = () => {
  const { t, convertPrice, language, getLocalizedValue } = useGlobal();
  const isEn = language !== 'ko';
  
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews' | 'info' | 'map'>('detail');
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [guestList, setGuestList] = useState([{ name: '', dob: '', nationality: '' }]);
  const [loading, setLoading] = useState(true);
  
  // CMS Data (Strictly from DB)
  const [cmsData, setCmsData] = useState<any>(null);

  useEffect(() => { 
      initializePayment('imp19424728'); 
      const unsub = onSnapshot(doc(db, "cms_packages", "package_premium"), (doc) => {
          if (doc.exists()) {
              setCmsData(doc.data());
          } else {
              setCmsData(null);
          }
          setLoading(false);
      });
      return () => unsub();
  }, []);

  const updateGuest = (idx: number, field: string, val: string) => {
      const newList = [...guestList];
      newList[idx] = { ...newList[idx], [field]: val };
      setGuestList(newList);
  };

  const handleReservation = async () => {
    if (!selectedDate || !selectedGender || !selectedPayment) { alert(t('select_options')); return; }
    if (!agreedToPolicy) { alert(isEn ? "Please agree to the policy." : "규정에 동의해주세요."); return; }

    let buyerEmail = auth.currentUser?.email || '';
    let buyerName = auth.currentUser?.displayName || '';
    if (!auth.currentUser) {
        const guestEmail = prompt(isEn ? "Enter your email for voucher:" : "예약 확인용 이메일을 입력해주세요:");
        if(!guestEmail) return;
        buyerEmail = guestEmail;
        buyerName = guestList[0].name || "Guest";
    }

    try {
        const { available } = await checkAvailability(selectedDate);
        if (available <= 0) { alert(t('sold_out')); return; }

        let priceNum = cmsData?.price || 0;
        if (selectedGender === 'Female') priceNum += 270000;
        if (selectedPayment === 'deposit') priceNum = 1503000;

        const productName = `Premium Package (${selectedDate})`;
        const merchant_uid = `mid_${new Date().getTime()}`;
        
        const paymentResult = await requestPayment({
            merchant_uid, name: productName, amount: priceNum,
            buyer_email: buyerEmail, buyer_name: buyerName
        });

        if (paymentResult.success) {
            await createReservation({
                userId: auth.currentUser?.uid || 'guest', productName, date: selectedDate, peopleCount: 1, totalPrice: priceNum,
                options: { gender: selectedGender, payment: selectedPayment, guests: guestList, guestEmail: buyerEmail }
            });
            alert(t('confirm_msg'));
            window.location.href = "/";
        }
    } catch (e: any) { alert(e); }
  };

  const handleCopyAddress = () => {
      navigator.clipboard.writeText("서울 강남구 학동로3길 27 메리디엠타워 101");
      alert(isEn ? "Address copied in Korean" : "주소가 복사되었습니다.");
  };

  const getPrice = () => {
    let price = cmsData?.price || 0;
    if (selectedGender === 'Female') price += 270000;
    if (selectedPayment === 'deposit') price = 1503000;
    return convertPrice(price);
  };

  const REVIEWS = [
      { user: "Michael T.", rating: 5, date: "2024-02-10", text: "Truly VIP service. The translator stayed with us the whole time." },
      { user: "Elena", rating: 5, date: "2024-01-25", text: "Rejuran treatment was painless and effective. Highly recommend." }
  ];

  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  // Dynamic values
  const title = getLocalizedValue(cmsData, 'title');
  const description = getLocalizedValue(cmsData, 'description');
  const content = getLocalizedValue(cmsData, 'content');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (!cmsData) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
          <Info size={48} className="text-gray-300 mb-4"/>
          <h2 className="text-xl font-bold text-gray-600 mb-2">Content Not Available</h2>
          <p className="text-gray-500 mb-4">관리자 페이지에서 [기본 패키지 복구]를 실행하거나 내용을 입력해주세요.</p>
          <button onClick={() => window.location.href='/'} className="px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100">홈으로 돌아가기</button>
      </div>
  );

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <div className="text-sm font-bold text-[#C8A32B] mb-1">PREMIUM VIP</div>
                <h1 className="text-[24px] lg:text-[32px] font-[900] text-[#111] mb-2 leading-snug">{title}</h1>
                <p className="text-[15px] text-[#888] mb-6 font-medium border-b border-gray-100 pb-5">{description}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-black text-[#C8A32B]">{convertPrice(cmsData?.price || 0)} ~</span>
                </div>
            </div>

            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8">
                <div className="flex text-center">
                    {['detail', 'reviews', 'info', 'map'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 font-bold relative transition-colors ${activeTab === tab ? 'text-[#111]' : 'text-[#888] hover:text-[#555]'}`}>
                            {tab === 'detail' ? (isEn ? 'Detail' : '상세정보') : tab === 'reviews' ? (isEn ? 'Reviews(2)' : '리뷰(2)') : tab === 'info' ? (isEn ? 'Notice' : '안내사항') : (t('map'))}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#111]"></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 lg:px-0 min-h-[600px] pb-20">
                {activeTab === 'detail' && (
                    <div className="space-y-12">
                         {content ? (
                            <div className="prose max-w-none text-sm leading-7 text-gray-600" dangerouslySetInnerHTML={{ __html: content }} />
                        ) : (
                            <div className="p-8 bg-gray-50 text-center rounded-xl text-gray-400">
                                상세 내용이 없습니다. 관리자 페이지에서 내용을 입력해주세요.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl">
                            <div><div className="text-3xl font-black text-[#111]">5.0</div><div className="flex text-yellow-400 text-sm mt-1">★★★★★</div></div>
                        </div>
                        {REVIEWS.map((rev, i) => (
                            <div key={i} className="border-b border-gray-100 pb-6">
                                <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><span className="font-bold">{rev.user}</span><span className="text-yellow-400 text-xs">★★★★★</span></div><span className="text-xs text-gray-400">{rev.date}</span></div>
                                <p className="text-sm text-gray-600">{rev.text}</p>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'map' && (
                    <div>
                        <div className="w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-md mb-4">
                            <iframe width="100%" height="100%" frameBorder="0" style={{border:0}} src={`https://maps.google.com/maps?q=Gangnam-gu, Seoul&t=&z=14&ie=UTF8&iwloc=&output=embed`} allowFullScreen></iframe>
                        </div>
                        <button onClick={handleCopyAddress} className="w-full py-3 border border-gray-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 text-sm"><Copy size={16}/> {isEn ? "Copy Address (Korean)" : "한국어 주소 복사"}</button>
                    </div>
                )}
                {activeTab === 'info' && <div className="bg-white p-6 rounded-xl border border-gray-200 text-sm text-[#555] leading-7"><h3 className="font-bold text-lg text-[#111] mb-3">{t('res_guide')}</h3>{t('res_guide_desc')}</div>}
            </div>
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className={`border-b border-[#eee] ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} className="w-full flex items-center justify-between p-5 text-left">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step1')}</span><span className={`text-[15px] font-bold ${selectedDate ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedDate || t('step1_label')}</span></div>
                            <ChevronDown size={20} className="text-[#888]"/>
                        </button>
                        {openSection === 'date' && <div className="px-5 pb-6 bg-white"><div className="grid grid-cols-7 gap-1">{CALENDAR_DAYS.map(day => (<button key={day} onClick={() => { setSelectedDate(`2026-02-${day.toString().padStart(2,'0')}`); setOpenSection('options'); }} className={`h-9 text-[13px] rounded hover:bg-gray-50 flex items-center justify-center ${selectedDate?.includes(day.toString().padStart(2,'0')) ? 'bg-[#0070F0] text-white font-bold' : 'text-[#333]'}`}>{day}</button>))}</div></div>}
                    </div>

                    <div className={`border-b border-[#eee] ${openSection === 'options' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'options' ? null : 'options')} disabled={!selectedDate} className={`w-full flex items-center justify-between p-5 text-left ${!selectedDate ? 'opacity-50' : ''}`}>
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step2')}</span><span className={`text-[15px] font-bold ${selectedGender ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedGender || t('step2_label')}</span></div>
                            <ChevronDown size={20} />
                        </button>
                        {openSection === 'options' && selectedDate && (
                            <div className="px-5 pb-6 bg-white space-y-5 animate-fade-in">
                                <div><p className="text-[13px] font-bold text-[#333] mb-2">{t('gender')}</p><div className="flex gap-2">{['Male', 'Female'].map(g => (<button key={g} onClick={() => setSelectedGender(g)} className={`flex-1 py-2.5 border rounded text-[13px] ${selectedGender === g ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' : 'border-[#ddd]'}`}>{g === 'Male' ? t('male') : t('female')}</button>))}</div></div>
                                
                                {/* Guest Form - Persona 3 */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center mb-2"><p className="text-[13px] font-bold text-[#333] flex items-center gap-1"><UserPlus size={14}/> {isEn ? "Visitor Details" : "방문자 정보"}</p></div>
                                    {guestList.map((guest, i) => (
                                        <div key={i} className="space-y-2 mb-2">
                                            <input type="text" placeholder={isEn ? "Full Name (Passport)" : "실명 (여권상 영문)"} value={guest.name} onChange={e => updateGuest(i, 'name', e.target.value)} className="w-full border p-2 rounded text-xs"/>
                                            <input type="date" value={guest.dob} onChange={e => updateGuest(i, 'dob', e.target.value)} className="w-full border p-2 rounded text-xs text-gray-500"/>
                                        </div>
                                    ))}
                                </div>

                                <div><p className="text-[13px] font-bold text-[#333] mb-2">{t('payment_type')}</p><div className="flex flex-col gap-2">{['deposit', 'full'].map(p => (<button key={p} onClick={() => setSelectedPayment(p)} className={`w-full py-2.5 px-3 border rounded text-[13px] text-left flex justify-between ${selectedPayment === p ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' : 'border-[#ddd]'}`}>{p === 'deposit' ? t('pay_deposit') : t('pay_full')}{selectedPayment === p && <Check size={14} />}</button>))}</div></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#f9f9f9] p-5">
                    <div className="bg-white p-3 rounded-lg border border-red-100 mb-4 shadow-sm">
                        <div onClick={() => setAgreedToPolicy(!agreedToPolicy)} className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${agreedToPolicy ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>{agreedToPolicy && <Check size={12} className="text-white"/>}</div>
                            <span className={`text-xs font-bold ${agreedToPolicy ? 'text-red-600' : 'text-gray-400'}`}>{isEn ? 'I agree to the policy' : '위 규정에 동의합니다'}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4"><span className="text-[14px] font-bold text-[#555]">{t('total')}</span><div className="text-right"><span className="text-[20px] font-black text-[#111]">{selectedDate && selectedGender && selectedPayment ? getPrice() : '0'}</span></div></div>
                    <button onClick={handleReservation} className={`w-full py-4 rounded-lg font-bold text-[16px] text-white transition-colors ${selectedDate && selectedGender && agreedToPolicy ? 'bg-[#C8A32B] hover:bg-[#B38F20]' : 'bg-[#999] cursor-not-allowed'}`}>{t('book_now')}</button>
                    {!auth.currentUser && <div className="text-center mt-2"><span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-1 rounded">Guest Checkout Enabled</span></div>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
