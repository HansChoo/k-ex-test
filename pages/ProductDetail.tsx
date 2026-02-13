
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
  
  const [activeTab, setActiveTab] = useState<'detail' | 'info' | 'faq' | 'reviews'>('detail');
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

  const title = getLocalizedValue(product, 'title');
  const description = getLocalizedValue(product, 'description');
  const introContent = getLocalizedValue(product, 'content');
  const infoText = getLocalizedValue(product, 'infoText');
  const faqText = getLocalizedValue(product, 'faqText');

  const isPackage = product.type === 'package' || (product.selectedProductIds && product.selectedProductIds.length > 0);
  
  const renderCombinedContent = () => {
      let html = introContent ? `<div class="mb-10 text-lg leading-relaxed">${introContent}</div>` : '';
      if (isPackage && product.selectedProductIds) {
          html += `<div class="package-break mb-8 text-center"><span class="bg-gray-100 px-4 py-1 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">Included Items</span></div>`;
          product.selectedProductIds.forEach((pid: string) => {
              const childProd = products.find(p => p.id === pid);
              if (childProd) {
                  html += `<div class="mb-12 border border-gray-100 rounded-xl overflow-hidden shadow-sm"><div class="bg-gray-50 p-4 border-b border-gray-100 font-bold">${getLocalizedValue(childProd, 'title')}</div><div class="p-6 bg-white">${getLocalizedValue(childProd, 'content') || `<img src="${childProd.image}" className="w-full" />`}</div></div>`;
              }
          });
      }
      return <div className="prose max-w-none text-sm leading-7 text-gray-600" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  useEffect(() => {
    initializePayment('imp19424728');
    window.scrollTo(0,0);
    setReviews(generateMockReviews(50));
  }, [product]);

  const handleWishlistToggle = () => toggleWishlist(product.id || 999);

  const getPrice = () => {
      let total = 0;
      guestList.forEach(guest => {
          const genderPrice = guest.gender === 'Male' ? (product.priceMale || product.priceVal) : (product.priceFemale || product.priceVal);
          total += Number(genderPrice || 0);
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
    const { available } = await checkAvailability(selectedDate);
    if (available < guestList.length) return alert("Sold Out");

    const totalAmount = getPrice();
    const merchant_uid = `mid_${new Date().getTime()}`;
    let buyerEmail = auth.currentUser?.email || prompt(isEn ? "Email:" : "이메일:");
    if (!buyerEmail) return;

    try {
        const paymentResult = await requestPayment({ merchant_uid, name: title, amount: totalAmount, buyer_email: buyerEmail, buyer_name: guestList[0].name });
        if (paymentResult.success) {
            await createReservation({
                userId: auth.currentUser?.uid || 'guest', productName: title, date: selectedDate, peopleCount: guestList.length, totalPrice: totalAmount,
                options: { paymentType: selectedPayment, category: product.category, guests: guestList, guestEmail: buyerEmail }
            });
            alert(isEn ? "Confirmed!" : "예약이 확정되었습니다!");
            window.location.href = "/";
        }
    } catch (e: any) { alert(e); }
  };

  const hasPriceDiff = product.priceMale !== product.priceFemale && product.priceMale && product.priceFemale;

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <button onClick={() => window.location.href='/'} className="text-gray-400 mb-2 flex items-center gap-1 text-sm"><ChevronLeft size={14}/> Back</button>
                <div className="text-sm font-bold text-blue-600 mb-1">{isPackage ? 'Package' : product.category}</div>
                <h1 className="text-[24px] lg:text-[32px] font-[900] mb-2">{title}</h1>
                <p className="text-[15px] text-[#888] mb-6 border-b pb-5">{description}</p>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        {hasPriceDiff ? (
                            <div className="flex gap-4 items-center">
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-blue-500 uppercase">MALE</span><span className="text-xl font-black">{convertPrice(product.priceMale)}</span></div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div className="flex flex-col"><span className="text-[10px] font-bold text-pink-500 uppercase">FEMALE</span><span className="text-xl font-black">{convertPrice(product.priceFemale)}</span></div>
                            </div>
                        ) : (
                            <span className="text-[32px] font-black">{convertPrice(product.priceMale || product.priceVal)}</span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleWishlistToggle} className="flex items-center gap-1.5 text-sm font-bold text-gray-500"><Heart size={20} className={wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""} /><span>Wish</span></button>
                        <button className="flex items-center gap-1.5 text-sm font-bold text-gray-500"><Share2 size={20} /></button>
                    </div>
                </div>
            </div>
            
            <div className="mb-12 overflow-x-auto no-scrollbar flex gap-4 px-4 lg:px-0"><div className="w-full bg-gray-50 rounded-2xl overflow-hidden aspect-[1.5/1]"><img src={product.image} className="w-full h-full object-cover" /></div></div>
            
            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8"><div className="flex text-center">{['detail', 'reviews', 'info', 'faq'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 font-bold relative ${activeTab === tab ? 'text-[#111]' : 'text-[#888]'}`}>{tab.toUpperCase()}{activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#111]"></div>}</button>))}</div></div>
            
            <div className="px-4 lg:px-0 min-h-[400px] pb-20">
                {activeTab === 'detail' && renderCombinedContent()}
                {activeTab === 'reviews' && (<div className="space-y-6">{reviews.map((rev, i) => (<div key={i} className="border-b pb-6"><div className="font-bold text-sm">{rev.user} ★★★★★</div><p className="text-sm text-gray-600">{rev.text}</p></div>))}</div>)}
            </div>
        </div>

        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg p-5">
                <div className="space-y-4">
                    <div className="border rounded-lg p-3">
                        <span className="block text-xs text-gray-400 font-bold mb-1">DATE</span>
                        <div className="grid grid-cols-7 gap-1">{Array.from({length: 28}, (_,i)=>i+1).map(d => (<button key={d} onClick={()=>setSelectedDate(`2026-02-${d.toString().padStart(2,'0')}`)} className={`h-8 text-xs rounded ${selectedDate?.endsWith(d.toString().padStart(2,'0')) ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{d}</button>))}</div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold">GUESTS</span><button onClick={()=>setGuestList([...guestList, {id:Date.now(), name:'', dob:'', nationality:'', gender:'Female', messengerApp:'WhatsApp', messengerId:''}])} className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold">+ Add</button></div>
                        {guestList.map((guest, idx) => (
                            <div key={guest.id} className="p-3 bg-gray-50 rounded-lg border relative">
                                {idx > 0 && <button onClick={()=>setGuestList(guestList.filter(g=>g.id!==guest.id))} className="absolute top-1 right-1 text-gray-400"><Trash2 size={12}/></button>}
                                <input type="text" placeholder="Name" className="w-full text-xs p-1.5 border rounded mb-2" onChange={e => {const n=[...guestList]; n[idx].name=e.target.value; setGuestList(n);}} />
                                <select className="w-full text-xs p-1.5 border rounded bg-white font-bold" value={guest.gender} onChange={e => {const n=[...guestList]; n[idx].gender=e.target.value; setGuestList(n);}}>
                                    <option value="Male">Male (₩{(product.priceMale||product.priceVal).toLocaleString()})</option>
                                    <option value="Female">Female (₩{(product.priceFemale||product.priceVal).toLocaleString()})</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-4"><span className="text-sm font-bold">Total</span><span className="text-xl font-black">{convertPrice(getPrice())}</span></div>
                        <button onClick={handleReservation} className="w-full bg-[#0070F0] text-white py-4 rounded-xl font-bold">Book Now</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
