
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Check, Heart, Calendar as CalendarIcon, MapPin, ChevronRight, Share2, Star, Copy, Camera, UserPlus, Info, MessageCircle, Trash2, Plus, Box } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
import { createReservation, checkAvailability, validateCoupon } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { useGlobal } from '../contexts/GlobalContext';
import { generateMockReviews } from '../constants';

interface ProductDetailProps {
  language: 'ko' | 'en';
  product: any;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { language, t, convertPrice, wishlist, toggleWishlist, getLocalizedValue, products } = useGlobal();
  const isEn = language !== 'ko';
  
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews'>('detail');
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit'>('full');
  
  const [guestList, setGuestList] = useState([
      { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }
  ]);

  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    initializePayment('imp19424728');
    window.scrollTo(0,0);
    setReviews(generateMockReviews(50));
  }, [product]);

  const getPrice = () => {
      const priceMale = Number(product.priceMale || product.price || product.priceVal || 0);
      const priceFemale = Number(product.priceFemale || product.price || product.priceVal || 0);
      
      let total = 0;
      guestList.forEach(guest => {
          total += guest.gender === 'Male' ? priceMale : priceFemale;
      });

      if (selectedPayment === 'deposit') total = total * 0.2;
      return Math.round(total);
  };

  const handleReservation = async () => {
    if (!selectedDate) return alert(t('select_date'));
    if (!guestList[0].name || !guestList[0].messengerId) return alert("Please enter details for the representative.");

    const { available } = await checkAvailability(selectedDate);
    if (available < guestList.length) return alert("Sold Out");

    const totalAmount = getPrice();
    const merchant_uid = `mid_${new Date().getTime()}`;

    let buyerEmail = auth.currentUser?.email || '';
    if (!auth.currentUser) {
        const guestEmail = prompt(isEn ? "Enter email for voucher:" : "바우처를 수령할 이메일을 입력하세요:");
        if (!guestEmail) return;
        buyerEmail = guestEmail;
    }

    const paymentResult = await requestPayment({
        merchant_uid, name: getLocalizedValue(product, 'title'), amount: totalAmount, buyer_email: buyerEmail
    });

    if (paymentResult.success) {
        await createReservation({
            userId: auth.currentUser?.uid || 'guest',
            productName: getLocalizedValue(product, 'title'), date: selectedDate, peopleCount: guestList.length, totalPrice: totalAmount,
            options: { paymentType: selectedPayment, guests: guestList, guestEmail: buyerEmail }
        });
        alert(isEn ? "Confirmed!" : "예약이 완료되었습니다!");
        window.location.href = "/";
    }
  };

  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <button onClick={() => window.location.href='/'} className="text-gray-400 mb-2 flex items-center gap-1 text-sm"><ChevronLeft size={14}/> Back</button>
                <h1 className="text-[24px] lg:text-[32px] font-[900] text-[#111] mb-2">{getLocalizedValue(product, 'title')}</h1>
                <p className="text-[15px] text-[#888] mb-6">{getLocalizedValue(product, 'description')}</p>
                <div className="flex gap-4">
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-blue-500">MALE</span><span className="text-xl font-black">{convertPrice(product.priceMale || product.price || 0)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-pink-500">FEMALE</span><span className="text-xl font-black">{convertPrice(product.priceFemale || product.price || 0)}</span></div>
                </div>
            </div>
            
            <div className="mb-12 rounded-2xl overflow-hidden aspect-[1.5/1] bg-gray-100"><img src={product.image} className="w-full h-full object-cover" /></div>
            
            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8"><div className="flex text-center">{['detail', 'reviews'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 font-bold ${activeTab === tab ? 'text-[#111] border-b-2 border-black' : 'text-[#888]'}`}>{tab.toUpperCase()}</button>))}</div></div>
            
            <div className="px-4 lg:px-0 min-h-[400px] pb-20">
                {activeTab === 'detail' && <div className="prose max-w-none text-sm leading-7 text-gray-600" dangerouslySetInnerHTML={{ __html: getLocalizedValue(product, 'content') }} />}
            </div>
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className={`border-b border-[#eee] ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} className="w-full flex items-center justify-between p-5 text-left">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">DATE</span><span className="text-[15px] font-bold">{selectedDate || 'Select Date'}</span></div>
                            <ChevronDown size={20}/>
                        </button>
                        {openSection === 'date' && (<div className="px-5 pb-6 bg-white"><div className="grid grid-cols-7 gap-1">{CALENDAR_DAYS.map(day => (<button key={day} onClick={() => { setSelectedDate(`2026-02-${day.toString().padStart(2,'0')}`); setOpenSection('options'); }} className={`h-9 text-sm rounded hover:bg-gray-100 ${selectedDate?.includes(day.toString().padStart(2,'0')) ? 'bg-black text-white' : ''}`}>{day}</button>))}</div></div>)}
                    </div>

                    <div className={`border-b border-[#eee] ${openSection === 'options' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'options' ? null : 'options')} disabled={!selectedDate} className="w-full flex items-center justify-between p-5 text-left">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">GUESTS</span><span className="text-[15px] font-bold">{guestList.length} Person(s)</span></div>
                            <ChevronDown size={20} />
                        </button>
                        {openSection === 'options' && selectedDate && (
                            <div className="px-5 pb-6 bg-white space-y-5">
                                {guestList.map((guest, idx) => (
                                    <div key={guest.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-gray-500">Guest {idx+1}</span>
                                            {idx > 0 && <button onClick={() => { const nl = [...guestList]; nl.splice(idx,1); setGuestList(nl); }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>}
                                        </div>
                                        <div className="space-y-2">
                                            <input type="text" placeholder="Name" value={guest.name} onChange={e => { const nl = [...guestList]; nl[idx].name = e.target.value; setGuestList(nl); }} className="w-full border p-2 rounded text-xs uppercase bg-white"/>
                                            <select value={guest.gender} onChange={e => { const nl = [...guestList]; nl[idx].gender = e.target.value; setGuestList(nl); }} className="w-full border p-2 rounded text-xs bg-white font-bold">
                                                <option value="Male">Male ({convertPrice(product.priceMale || product.price || 0)})</option>
                                                <option value="Female">Female ({convertPrice(product.priceFemale || product.price || 0)})</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setGuestList([...guestList, { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold text-xs">+ Add Guest</button>
                                <div><p className="text-[13px] font-bold text-[#333] mb-2">{t('payment_type')}</p><div className="flex flex-col gap-2">{['deposit', 'full'].map(p => (<button key={p} onClick={() => setSelectedPayment(p as any)} className={`w-full py-2.5 px-3 border rounded text-[13px] text-left flex justify-between bg-white ${selectedPayment === p ? 'border-[#0070F0] bg-blue-50 text-[#0070F0]' : ''}`}>{p === 'deposit' ? t('pay_deposit') : t('pay_full')}{selectedPayment === p && <Check size={14} />}</button>))}</div></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-[#f9f9f9] p-5">
                    <div className="flex justify-between items-center mb-4"><span className="text-[14px] font-bold text-[#555]">{t('total')}</span><div className="text-right"><span className="text-[20px] font-black text-[#111]">{convertPrice(getPrice())}</span></div></div>
                    <button onClick={handleReservation} className="w-full bg-[#0070F0] text-white py-4 rounded-xl font-bold shadow-lg">Book Now</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
