
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, Heart, Calendar as CalendarIcon, MapPin, AlertCircle } from 'lucide-react';
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
  const { t, convertPrice, language } = useGlobal();
  const isEn = language !== 'ko';
  
  const [activeTab, setActiveTab] = useState<'detail' | 'info' | 'faq'>('detail');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  
  // CMS Data
  const [cmsData, setCmsData] = useState<any>(null);

  useEffect(() => { 
      initializePayment('imp19424728'); 
      const unsub = onSnapshot(doc(db, "cms_packages", "package_premium"), (doc) => {
          if (doc.exists()) setCmsData(doc.data());
      });
      return () => unsub();
  }, []);

  const handleReservation = async () => {
    if (!auth.currentUser) {
        if (window.confirm(isEn ? "Login required." : "로그인이 필요합니다.")) {
            try { await loginWithGoogle(); } catch (e) { handleAuthError(e, isEn); }
        }
        return;
    }
    if (!selectedDate || !selectedGender || !selectedPayment) { alert(t('select_options')); return; }
    
    if (!agreedToPolicy) {
        alert(isEn ? "Please agree to the cancellation policy." : "취소 및 환불 규정에 동의해주세요.");
        return;
    }

    try {
        const { available } = await checkAvailability(selectedDate);
        if (available <= 0) { alert(t('sold_out')); return; }

        let priceNum = 7515000;
        if (selectedGender === 'Female') priceNum = 7785000;
        if (selectedPayment === 'deposit') priceNum = 1503000; 
        
        // Use CMS price if available and full payment
        if (selectedPayment === 'full' && cmsData?.price) {
             const baseDbPrice = cmsData.price;
             priceNum = selectedGender === 'Female' ? (baseDbPrice + 270000) : baseDbPrice;
        }

        const productName = `Premium Package (${selectedDate})`;
        const merchant_uid = `mid_${new Date().getTime()}`;
        
        const paymentResult = await requestPayment({
            merchant_uid, name: productName, amount: priceNum,
            buyer_email: auth.currentUser.email || '', buyer_name: auth.currentUser.displayName || ''
        });

        if (paymentResult.success) {
            await createReservation({
                userId: auth.currentUser.uid, productName, date: selectedDate, peopleCount: 1, totalPrice: priceNum,
                options: { gender: selectedGender, payment: selectedPayment }
            });
            alert(t('confirm_msg'));
            window.location.href = "/";
        }
    } catch (e: any) { alert(e); }
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  const IMAGES = ["https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/big/20260105/7014f4a482dbc5af8d684c63b849f70b.png"];
  const DETAIL_IMAGES = {
    topBanner: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/ad40f10cb05262e34595b3d2d79aa055.png",
    intro: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/adeff0e5f865af8bfb9273381ab4b296.png",
    healthCheck: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/b354b41ad399d23b59c8b7476aa3f884.png",
    idolMain: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/13ada9aafbca4b183122c2395d78ef79.png",
    rejuranMain: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/NNEditor/20260123/9c1296c05c003793087dffe5e67613c4.png"
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(`2026-02-${day.toString().padStart(2, '0')}`);
    setOpenSection('options');
  };

  const getPrice = () => {
    let price = cmsData?.price || 7515000;
    if (selectedGender === 'Female') price += 270000;
    if (selectedPayment === 'deposit') price = 1503000;
    return convertPrice(price);
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="lg:hidden flex items-center px-4 py-3 border-b border-gray-100 sticky top-[50px] bg-white z-40">
         <button onClick={() => window.history.back()} className="mr-4"><ChevronLeft size={24} /></button>
         <span className="font-bold text-lg truncate">{cmsData?.title || t('pkg_prem')}</span>
      </div>

      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <h1 className="text-[24px] lg:text-[32px] font-[900] text-[#111] mb-2 leading-snug tracking-[-0.03em] keep-all">{cmsData?.title || t('pkg_prem')}</h1>
                <p className="text-[14px] lg:text-[15px] text-[#888] mb-6 font-medium tracking-tight keep-all border-b border-gray-100 pb-5">
                    {cmsData?.description || `${t('tab_health')} (Premium) + ${t('tab_idol')} (Premium) + REJURAN BOOST`}
                </p>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[26px] lg:text-[32px] font-black text-[#111]">{convertPrice(cmsData?.price || 7515000)} ~</span>
                        <span className="text-[#FF4D4D] text-sm lg:text-base font-bold ml-1">10% OFF</span>
                    </div>
                </div>
            </div>

            <div className="mb-12">
                <div className="relative w-full bg-gray-50 rounded-none lg:rounded-2xl overflow-hidden mb-3 group aspect-square lg:aspect-[1.2/1]">
                    <img src={IMAGES[currentImageIndex]} alt="Product Main" className="w-full h-full object-cover"/>
                </div>
            </div>

            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8">
                <div className="flex text-center">
                    {['detail', 'info', 'faq'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-[15px] lg:text-[16px] font-bold transition-all relative ${activeTab === tab ? 'text-[#111]' : 'text-[#888] hover:text-[#555]'}`}>
                            {t(tab)}{activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#111]"></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 lg:px-0 min-h-[600px] pb-20">
                {activeTab === 'detail' && (
                    <div className="flex flex-col space-y-12">
                         {/* Dynamic Content from CMS */}
                         {cmsData?.content ? (
                            <div className="prose max-w-none text-sm leading-7 text-gray-600" dangerouslySetInnerHTML={{ __html: cmsData.content }} />
                        ) : (
                            /* Fallback to original hardcoded content */
                            <>
                                <img src={DETAIL_IMAGES.topBanner} alt="Top Banner" className="w-full max-w-[850px] mx-auto mb-4" />
                                <div className="bg-[#F9FAFB] p-6 rounded-xl border border-gray-100 text-left space-y-3 max-w-[850px] mx-auto">
                                    <h3 className="text-lg font-bold text-[#111] mb-2">🔳 {t('pkg_prem')}</h3>
                                    <div className="space-y-3 text-[14px] text-[#555] leading-relaxed">
                                        <p>🔶 {t('tab_health')} (Premium)</p>
                                        <p>🔶 {t('tab_idol')} (Premium)</p>
                                        <p>🔶 REJURAN BOOST Package</p>
                                    </div>
                                </div>
                                <img src={DETAIL_IMAGES.healthCheck} className="w-full max-w-[850px] mx-auto" />
                                <img src={DETAIL_IMAGES.idolMain} className="w-full max-w-[850px] mx-auto" />
                                <img src={DETAIL_IMAGES.rejuranMain} className="w-full max-w-[850px] mx-auto" />
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'info' && <div className="bg-white p-6 rounded-xl border border-gray-200 text-sm text-[#555] leading-7"><h3 className="font-bold text-lg text-[#111] mb-3">{t('res_guide')}</h3>{t('res_guide_desc')}</div>}
                {activeTab === 'faq' && <div className="space-y-4"><div className="border border-gray-200 rounded-lg p-5"><p className="font-bold text-[#111] mb-2 text-sm">Q. {isEn ? 'Cancellation?' : '취소/변경은?'}</p><p className="text-gray-600 text-sm">A. {isEn ? '3 days prior.' : '3일 전까지 가능합니다.'}</p></div></div>}
            </div>
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div className={`border-b border-[#eee] transition-all ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} className="w-full flex items-center justify-between p-5 text-left group">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step1')}</span><span className={`text-[15px] font-bold ${selectedDate ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedDate || t('step1_label')}</span></div>
                            <ChevronDown size={20} className={`text-[#888] transition-transform ${openSection === 'date' ? 'rotate-180' : ''}`} />
                        </button>
                        {openSection === 'date' && <div className="px-5 pb-6 animate-fade-in"><div className="border border-[#eee] rounded-lg p-4 bg-white"><div className="grid grid-cols-7 gap-1">{CALENDAR_DAYS.map(day => (<button key={day} onClick={() => handleDateSelect(day)} className={`h-9 text-[13px] rounded hover:bg-gray-50 flex items-center justify-center ${selectedDate?.includes(day.toString().padStart(2,'0')) ? 'bg-[#0070F0] text-white font-bold' : 'text-[#333]'}`}>{day}</button>))}</div></div></div>}
                    </div>

                    <div className={`border-b border-[#eee] transition-all ${openSection === 'options' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'options' ? null : 'options')} disabled={!selectedDate} className={`w-full flex items-center justify-between p-5 text-left ${!selectedDate ? 'opacity-50' : ''}`}>
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step2')}</span><span className={`text-[15px] font-bold ${selectedGender ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedGender || t('step2_label')}</span></div>
                            <ChevronDown size={20} />
                        </button>
                        {openSection === 'options' && selectedDate && (
                            <div className="px-5 pb-6 animate-fade-in bg-white">
                                <div className="mb-4"><p className="text-[13px] font-bold text-[#333] mb-2">{t('gender')}</p><div className="flex gap-2">{['Male', 'Female'].map(g => (<button key={g} onClick={() => setSelectedGender(g)} className={`flex-1 py-2.5 border rounded text-[13px] ${selectedGender === g ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' : 'border-[#ddd]'}`}>{g === 'Male' ? t('male') : t('female')}</button>))}</div></div>
                                <div><p className="text-[13px] font-bold text-[#333] mb-2">{t('payment_type')}</p><div className="flex flex-col gap-2">{['deposit', 'full'].map(p => (<button key={p} onClick={() => setSelectedPayment(p)} className={`w-full py-2.5 px-3 border rounded text-[13px] text-left flex justify-between ${selectedPayment === p ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' : 'border-[#ddd]'}`}>{p === 'deposit' ? t('pay_deposit') : t('pay_full')}{selectedPayment === p && <Check size={14} />}</button>))}</div></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#f9f9f9] p-5">
                    {/* Cancellation Policy Checkbox */}
                    <div className="bg-white p-3 rounded-lg border border-red-100 mb-4 shadow-sm">
                        <div className="flex items-start gap-2 mb-2">
                             <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0"/>
                             <div className="text-[11px] text-[#666] leading-tight">
                                 <strong className="block text-[#111] mb-1">{isEn ? 'Cancellation Policy' : '취소 및 환불 규정'}</strong>
                                 <p>{isEn ? '• 3 days prior: 100% Refund' : '• 이용 3일 전: 100% 환불'}</p>
                                 <p>{isEn ? '• On the day: Non-refundable' : '• 이용 당일: 환불 불가'}</p>
                             </div>
                        </div>
                        <div onClick={() => setAgreedToPolicy(!agreedToPolicy)} className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-100 mt-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${agreedToPolicy ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>
                                {agreedToPolicy && <Check size={12} className="text-white"/>}
                            </div>
                            <span className={`text-xs font-bold ${agreedToPolicy ? 'text-red-600' : 'text-gray-400'}`}>{isEn ? 'I agree to the policy' : '위 규정에 동의합니다'}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[14px] font-bold text-[#555]">{t('total')}</span>
                        <div className="text-right"><span className="text-[20px] font-black text-[#111]">{selectedDate && selectedGender && selectedPayment ? getPrice() : '0'}</span></div>
                    </div>
                    <button onClick={handleReservation} className={`w-full py-4 rounded-lg font-bold text-[16px] text-white transition-colors ${selectedDate && selectedGender && agreedToPolicy ? 'bg-[#0070F0] hover:bg-blue-600' : 'bg-[#999] cursor-not-allowed'}`}>{t('book_now')}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
