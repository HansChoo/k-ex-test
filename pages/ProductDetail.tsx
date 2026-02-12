
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Check, Heart, Calendar as CalendarIcon, MapPin, ChevronRight, Share2 } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
import { createReservation, checkAvailability } from '../services/reservationService';
import { initializePayment, requestPayment } from '../services/paymentService';
import { loginWithGoogle, handleAuthError } from '../services/authService';
import { useGlobal } from '../contexts/GlobalContext';

interface ProductDetailProps {
  language: 'ko' | 'en';
  product: any;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const { language, t, convertPrice, wishlist, toggleWishlist } = useGlobal();
  const isEn = language !== 'ko';
  
  // States
  const [activeTab, setActiveTab] = useState<'detail' | 'info' | 'faq'>('detail');
  const [openSection, setOpenSection] = useState<'date' | 'options' | null>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  
  // Initialize Payment
  useEffect(() => {
    initializePayment('imp19424728');
    window.scrollTo(0,0);
  }, [product]);

  const handleReservation = async () => {
    if (!auth.currentUser) {
        if (window.confirm(isEn ? "Login required. Login with Google?" : "로그인이 필요합니다. 구글로 로그인하시겠습니까?")) {
            try { await loginWithGoogle(); } catch (e) { handleAuthError(e, isEn); }
        }
        return;
    }
    if (!selectedDate) return alert(t('select_date'));

    const { available } = await checkAvailability(selectedDate);
    if (available < peopleCount) return alert("Sold Out");

    // Parse Price
    const numericPrice = typeof product.price === 'string' 
        ? Number(product.price.replace(/[^0-9]/g, '')) 
        : product.price;
    const basePrice = isNaN(numericPrice) ? 100000 : numericPrice;
    
    const totalAmount = basePrice * peopleCount;
    const merchant_uid = `mid_${new Date().getTime()}`;

    try {
        const paymentResult = await requestPayment({
            merchant_uid,
            name: product.title,
            amount: totalAmount,
            buyer_email: auth.currentUser.email || '',
            buyer_name: auth.currentUser.displayName || ''
        });

        if (paymentResult.success) {
            await createReservation({
                userId: auth.currentUser.uid,
                productName: product.title,
                date: selectedDate,
                peopleCount: peopleCount,
                totalPrice: totalAmount,
                options: { type: 'general_product' }
            });
            alert(isEn ? "Confirmed!" : "예약이 확정되었습니다!");
            window.location.href = "/";
        }
    } catch (e: any) {
        alert(e);
    }
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(`2026-02-${day.toString().padStart(2, '0')}`);
    setOpenSection('options');
  };

  const handleShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: product.title,
                  text: product.description,
                  url: window.location.href,
              });
          } catch (error) { console.log('Error sharing', error); }
      } else {
          // Fallback
          navigator.clipboard.writeText(window.location.href);
          alert(isEn ? "Link copied to clipboard" : "링크가 복사되었습니다.");
      }
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CALENDAR_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

  // Price Calculation for Display
  const numericPrice = typeof product.price === 'string' 
        ? Number(product.price.replace(/[^0-9]/g, '')) 
        : product.price;
  const priceValue = isNaN(numericPrice) ? 0 : numericPrice;

  return (
    <div className="w-full bg-white relative font-sans tracking-tight text-[#111]">
      <div className="max-w-[1360px] mx-auto lg:px-4 lg:py-10 flex flex-col lg:flex-row gap-10 relative">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 w-full min-w-0">
            <div className="px-4 lg:px-0 mb-8">
                <button onClick={() => window.location.href='/'} className="text-gray-400 mb-2 flex items-center gap-1 text-sm"><ChevronLeft size={14}/> Back to list</button>
                <div className="text-sm font-bold text-blue-600 mb-1">{product.category}</div>
                <h1 className="text-[24px] lg:text-[32px] font-[900] text-[#111] mb-2 leading-snug tracking-[-0.03em]">{product.title}</h1>
                <p className="text-[15px] text-[#888] mb-6 font-medium border-b border-gray-100 pb-5">{product.description}</p>
                
                {/* Action Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[32px] font-black text-[#111]">{convertPrice(priceValue)}</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => toggleWishlist(product.id || 999)} className="flex items-center gap-1.5 hover:text-red-500 transition-colors text-sm font-bold text-gray-500">
                            <Heart size={20} className={wishlist.includes(product.id || 999) ? "fill-red-500 text-red-500" : ""} />
                            <span>Wishlist</span>
                        </button>
                        <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors text-sm font-bold text-gray-500">
                            <Share2 size={20} />
                            <span>{t('share')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Image */}
            <div className="mb-12">
                <div className="relative w-full bg-gray-50 rounded-2xl overflow-hidden aspect-[1.5/1]">
                    <img src={product.image} className="w-full h-full object-cover" alt="Product" />
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-[50px] lg:top-[90px] bg-white z-30 border-b border-gray-200 mb-8">
                <div className="flex text-center">
                    {['detail', 'info', 'faq', 'map'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 font-bold relative ${activeTab === tab ? 'text-[#111]' : 'text-[#888]'}`}>
                            {tab === 'detail' ? (isEn ? 'Detail' : '상세정보') : tab === 'info' ? (isEn ? 'Notice' : '안내사항') : tab === 'map' ? (t('map')) : 'FAQ'}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#111]"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-0 min-h-[400px] pb-20">
                {activeTab === 'detail' && (
                    <div className="space-y-6">
                        {product.detailTopImage && <img src={product.detailTopImage} className="w-full rounded-xl" />}
                        {product.detailContentImage && <img src={product.detailContentImage} className="w-full" />}
                        {!product.detailTopImage && !product.detailContentImage && <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-xl">상세 이미지가 등록되지 않았습니다.</div>}
                    </div>
                )}
                {activeTab === 'info' && (
                    <div className="bg-gray-50 p-6 rounded-xl whitespace-pre-line text-sm leading-7">
                        {product.infoText || "등록된 안내사항이 없습니다."}
                    </div>
                )}
                {activeTab === 'faq' && (
                    <div className="bg-gray-50 p-6 rounded-xl whitespace-pre-line text-sm leading-7">
                        {product.faqText || "등록된 FAQ가 없습니다."}
                    </div>
                )}
                {activeTab === 'map' && (
                    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200">
                        {/* Embed Google Maps (Gangnam Severance or generic Gangnam area as default) */}
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            style={{border:0}} 
                            src={`https://maps.google.com/maps?q=${product.category === '건강검진' ? 'Gangnam Severance Hospital' : 'Gangnam-gu, Seoul'}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN (Sticky) */}
        <div className="hidden lg:block w-[400px] min-w-[400px]">
            <div className="sticky top-[110px] border border-[#ddd] bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-5 border-b border-[#eee]">
                     <h3 className="font-bold text-lg mb-4">{t('select_date')}</h3>
                     <div className="grid grid-cols-7 text-center mb-2 text-xs font-bold text-gray-400">
                         {DAYS.map(d=> <span key={d}>{d}</span>)}
                     </div>
                     <div className="grid grid-cols-7 gap-1">
                         {CALENDAR_DAYS.map(day => (
                             <button 
                                key={day} 
                                onClick={() => handleDateSelect(day)}
                                className={`h-9 text-sm rounded hover:bg-gray-100 ${selectedDate?.endsWith(day.toString().padStart(2,'0')) ? 'bg-black text-white hover:bg-black font-bold' : ''}`}
                             >
                                 {day}
                             </button>
                         ))}
                     </div>
                </div>
                
                {selectedDate && (
                    <div className="p-5 bg-blue-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-sm">People</span>
                            <div className="flex items-center bg-white border rounded">
                                <button onClick={()=>setPeopleCount(Math.max(1, peopleCount-1))} className="px-3 py-1">-</button>
                                <span className="px-2 text-sm font-bold">{peopleCount}</span>
                                <button onClick={()=>setPeopleCount(peopleCount+1)} className="px-3 py-1">+</button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-blue-100">
                            <span className="font-bold">{t('total')}</span>
                            <span className="text-xl font-black text-[#0070F0]">{convertPrice(priceValue * peopleCount)}</span>
                        </div>
                    </div>
                )}

                <div className="p-5 bg-gray-50">
                    <button onClick={handleReservation} className="w-full bg-[#0070F0] text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all">
                        {t('book_now')}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
