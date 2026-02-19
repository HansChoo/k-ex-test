
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Check, Heart, Calendar as CalendarIcon, MapPin, ChevronRight, Share2, Star, Copy, Camera, UserPlus, Info, MessageCircle, Trash2, Plus, Box } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
import { createReservation, checkAvailability, validateCoupon } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { loginWithGoogle, handleAuthError } from '../services/authService';
import { useGlobal } from '../contexts/GlobalContext';
import { generateMockReviews } from '../constants';

interface ProductDetailProps {
  language: 'ko' | 'en' | 'ja' | 'zh';
  product: any;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { language, t, convertPrice, wishlist, toggleWishlist, getLocalizedValue, products } = useGlobal();
  const isEn = language !== 'ko';
  
  const [activeTab, setActiveTab] = useState<'detail' | 'info' | 'faq' | 'reviews'>('detail');
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit'>('full');
  
  // Multi-Guest
  const [guestList, setGuestList] = useState([
      { id: Date.now(), name: '', dob: '', nationality: '', gender: 'Female', messengerApp: 'WhatsApp', messengerId: '' }
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);

  const title = getLocalizedValue(product, 'title');
  const description = getLocalizedValue(product, 'description');
  const introContent = getLocalizedValue(product, 'content');
  const infoText = getLocalizedValue(product, 'infoText');
  const faqText = getLocalizedValue(product, 'faqText');

  // Logic to merge content for Packages
  const isPackage = product.type === 'package' || (product.selectedProductIds && product.selectedProductIds.length > 0);
  
  const renderCombinedContent = () => {
      // 1. Package Intro
      let html = introContent ? `<div class="mb-10 text-lg leading-relaxed">${introContent}</div>` : '';
      
      // 2. Append Child Products
      if (isPackage && product.selectedProductIds) {
          html += `<div class="package-break mb-8 text-center"><span class="bg-gray-100 px-4 py-1 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">Included Items</span></div>`;
          
          product.selectedProductIds.forEach((pid: string) => {
              const childProd = products.find(p => p.id === pid);
              if (childProd) {
                  const childTitle = getLocalizedValue(childProd, 'title');
                  const childContent = getLocalizedValue(childProd, 'content');
                  const childImg = childProd.image;
                  
                  html += `
                    <div class="mb-12 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div class="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <span class="text-xl">📦</span>
                            <h3 class="font-bold text-lg">${childTitle}</h3>
                        </div>
                        <div class="p-6 bg-white">
                            ${childContent ? childContent : `<img src="${childImg}" class="w-full rounded-lg" />`}
                        </div>
                    </div>
                  `;
              }
          });
      } else if (!introContent) {
          // Fallback for normal products if no content
          return <img src={product.detailTopImage || product.image} className="w-full rounded-xl" />;
      }

      return <div className="prose max-w-none text-sm leading-7 text-gray-600" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  useEffect(() => {
    initializePayment('imp19424728');
    window.scrollTo(0,0);
    setReviews(generateMockReviews(50));
  }, [product]);

  const handleWishlistToggle = () => toggleWishlist(product.id || 999);

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      const res = await validateCoupon(couponCode);
      if (res.valid) { setAppliedCoupon(res); setCouponMessage(t('discount_applied')); }
      else { setAppliedCoupon(null); setCouponMessage(t('invalid_coupon')); }
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
      const numericPrice = typeof product.price === 'string' 
        ? Number(product.price.replace(/[^0-9]/g, '')) 
        : product.price;
      const basePrice = isNaN(numericPrice) ? 100000 : numericPrice;
      
      let total = 0;
      guestList.forEach(guest => {
          let p = basePrice;
          if (guest.gender === 'Female' && product.category === '건강검진') p *= 1.05; // Mock logic
          total += p;
      });

      if (appliedCoupon) {
          if (appliedCoupon.type === 'percent') total = total * (1 - appliedCoupon.value / 100);
          else total = Math.max(0, total - appliedCoupon.value);
      }

      if (selectedPayment === 'deposit') total = total * 0.2;

      return Math.round(total);
  };

  const handleReservation = async () => {
    if (!selectedDate) return alert(t('select_date'));
    if (!guestList[0].name || !guestList[0].messengerId) return alert("Please enter name and messenger ID.");

    const { available } = await checkAvailability(selectedDate);
    if (available < guestList.length) return alert("Sold Out");

    const totalAmount = getPrice();
    const merchant_uid = `mid_${new Date().getTime()}`;

    let buyerEmail = auth?.currentUser?.email || '';
    let buyerName = auth?.currentUser?.displayName || '';

    if (!auth?.currentUser) {
        const guestEmail = prompt(isEn ? "Please enter your email for voucher:" : "바우처를 받을 이메일을 입력해주세요:");
        if (!guestEmail) return;
        buyerEmail = guestEmail;
        buyerName = guestList[0].name;
    }

    try {
        const paymentResult = await requestPayment({
            merchant_uid, name: title, amount: totalAmount, buyer_email: buyerEmail, buyer_name: buyerName
        });

        if (paymentResult.success) {
            await createReservation({
                userId: auth?.currentUser?.uid || 'guest',
                productName: title, date: selectedDate, peopleCount: guestList.length, totalPrice: totalAmount,
                options: { 
                    type: 'general_product', paymentType: selectedPayment, category: product.category,
                    guests: guestList, guestEmail: buyerEmail
                }
            });
            alert(isEn ? "Confirmed! Survey sent." : "예약이 확정되었습니다!");
            window.location.href = "/";
        }
    } catch (e: any) { alert(e); }
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(`2026-02-${day.toString().padStart(2, '0')}`);
    setOpenSection('options');
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            {/* Same Left Column as before */}
            <div className="px-4 lg:px-0 mb-8">
                <button onClick={() => window.location.href='/'} className="text-gray-400 mb-2 flex items-center gap-1 text-sm hover:text-black transition-colors"><ChevronLeft size={14}/> Back to list</button>
                <div className="text-sm font-bold text-blue-600 mb-1 flex items-center gap-1">
                    {isPackage ? <Box size={14}/> : null}
                    {isPackage ? 'All-in-One Package' : product.category}
                </div>
                <h1 className="text-[24px] lg:text-[32px] font-[900] text-[#111] mb-2 leading-snug">{title}</h1>
                <p className="text-[15px] text-[#888] mb-6 font-medium border-b border-gray-100 pb-5">{description}</p>
                <div className="flex items-center justify-between"><div className="flex items-baseline gap-2"><span className="text-[32px] font-black text-[#111]">{convertPrice(getPrice() / (selectedPayment === 'deposit' ? 0.2 : 1))}</span></div><div className="flex gap-4"><button onClick={handleWishlistToggle} className="flex items-center gap-1.5 hover:text-red-500 transition-colors text-sm font-bold text-gray-500 group"><Heart size={20} className={`transition-all duration-300 ${wishlist.some(w => String(w) === String(product.id || 999)) ? "fill-red-500 text-red-500" : "group-hover:text-red-400"}`} /><span>Wishlist</span></button><button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors text-sm font-bold text-gray-500 active:scale-95"><Share2 size={20} /><span>{t('share')}</span></button></div></div>
            </div>
            {/* Package uses default image or specific hero image */}
            <div className="mb-12 overflow-x-auto no-scrollbar flex gap-4 px-4 lg:px-0 snap-x"><div className="relative w-[80vw] lg:w-full bg-gray-50 rounded-2xl overflow-hidden aspect-[1.5/1] shadow-lg shrink-0 snap-center"><img src={product.image} className="w-full h-full object-cover" alt={title} /></div></div>
            
            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8"><div className="flex text-center">{['detail', 'reviews', 'info', 'faq', 'map'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 font-bold relative transition-colors ${activeTab === tab ? 'text-[#111]' : 'text-[#888] hover:text-[#555]'}`}>{tab.toUpperCase()}{activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#111]"></div>}</button>))}</div></div>
            
            <div className="px-4 lg:px-0 min-h-[400px] pb-20 animate-fade-in">
                {activeTab === 'detail' && renderCombinedContent()}
                {activeTab === 'reviews' && (<div className="space-y-6">{reviews.map((rev, i) => (<div key={i} className="border-b border-gray-100 pb-6"><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs">{rev.user.charAt(0)}</div><div><div className="font-bold text-sm">{rev.user}</div><div className="text-yellow-400 text-xs">★★★★★</div></div></div><span className="text-xs text-gray-400">{rev.date}</span></div><p className="text-sm text-gray-600">{rev.text}</p></div>))}</div>)}
                {activeTab === 'info' && <div className="bg-gray-50 p-6 rounded-xl text-sm leading-7">{infoText}</div>}
                {activeTab === 'faq' && <div className="bg-gray-50 p-6 rounded-xl text-sm leading-7">{faqText}</div>}
            </div>
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className={`border-b border-[#eee] ${openSection === 'date' ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                        <button onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} className="w-full flex items-center justify-between p-5 text-left">
                            <div><span className="block text-xs text-[#888] font-bold mb-1">{t('step1')}</span><span className={`text-[15px] font-bold ${selectedDate ? 'text-[#0070F0]' : 'text-[#111]'}`}>{selectedDate || t('step1_label')}</span></div>
                            <ChevronDown size={20} className="text-[#888]" />
                        </button>
                        {openSection === 'date' && (<div className="px-5 pb-6 bg-white"><div className="grid grid-cols-7 gap-1">{CALENDAR_DAYS.map(day => (<button key={day} onClick={() => handleDateSelect(day)} className={`h-9 text-sm rounded hover:bg-gray-100 transition-colors ${selectedDate?.endsWith(day.toString().padStart(2,'0')) ? 'bg-black text-white hover:bg-black font-bold' : ''}`}>{day}</button>))}</div></div>)}
                    </div>

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
                                            <input type="text" placeholder="Passport Name" value={guest.name} onChange={e => updateGuest(idx, 'name', e.target.value)} className="w-full border p-2 rounded text-xs bg-white uppercase"/>
                                            <div className="flex gap-2">
                                                <input type="date" value={guest.dob} onChange={e => updateGuest(idx, 'dob', e.target.value)} className="w-full border p-2 rounded text-xs text-gray-500 bg-white"/>
                                                <input type="text" placeholder="Nationality" value={guest.nationality} onChange={e => updateGuest(idx, 'nationality', e.target.value)} className="w-full border p-2 rounded text-xs bg-white"/>
                                            </div>
                                            {idx === 0 && (
                                                <div className="pt-2 border-t border-gray-200 mt-2">
                                                    <label className="text-[10px] font-bold text-blue-600 block mb-1">Representative Contact</label>
                                                    <input type="text" placeholder="Messenger ID (WhatsApp/Line)" value={guest.messengerId} onChange={e => updateGuest(idx, 'messengerId', e.target.value)} className="w-full border p-2 rounded text-xs bg-white"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                <button onClick={addGuest} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold text-xs flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-colors">
                                    <Plus size={16}/> Add Guest
                                </button>

                                <div><p className="text-[13px] font-bold text-[#333] mb-2">{t('payment_type')}</p><div className="flex flex-col gap-2">{['deposit', 'full'].map(p => (<button key={p} onClick={() => setSelectedPayment(p as any)} className={`w-full py-2.5 px-3 border rounded text-[13px] text-left flex justify-between bg-white ${selectedPayment === p ? 'border-[#0070F0] bg-[#F0F8FF] text-[#0070F0]' : 'border-[#ddd]'}`}>{p === 'deposit' ? t('pay_deposit') : t('pay_full')}{selectedPayment === p && <Check size={14} />}</button>))}</div></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#f9f9f9] p-5">
                    {/* Coupon */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 shadow-sm"><label className="block text-xs font-bold text-gray-500 mb-1">{t('coupon_code')}</label><div className="flex gap-2"><input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 border border-gray-200 rounded px-2 text-sm uppercase bg-white" placeholder="CODE"/><button onClick={handleApplyCoupon} className="bg-black text-white px-3 py-1 rounded text-xs font-bold">{t('apply')}</button></div>{couponMessage && <p className={`text-[10px] mt-1 font-bold ${appliedCoupon ? 'text-green-600' : 'text-red-500'}`}>{couponMessage}</p>}</div>
                    <div className="flex justify-between items-center mb-4"><span className="text-[14px] font-bold text-[#555]">{t('total')}</span><div className="text-right"><span className="text-[20px] font-black text-[#111]">{convertPrice(getPrice())}</span></div></div>
                    <button onClick={handleReservation} className="w-full bg-[#0070F0] text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all">{t('book_now')}</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
