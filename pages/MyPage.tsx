
import React, { useEffect, useState } from 'react';
import { auth, db, isFirebaseConfigured } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, increment, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ticket, XCircle, Download, Edit2, Save, User as UserIcon, Printer, MessageCircle, ChevronDown, ChevronUp, Plus, Send, Users, TrendingDown, Heart, ShoppingCart, Trash2, Minus, ArrowRight, CheckSquare, Square, CreditCard } from 'lucide-react';
import { useGlobal } from '../contexts/GlobalContext';
import { printReceipt } from '../services/receiptService';

export const MyPage: React.FC<any> = () => {
  const { t, convertPrice, wishlist, toggleWishlist, products, getLocalizedValue, cart, addToCart, removeFromCart, updateCartQuantity } = useGlobal();
  const [reservations, setReservations] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [myGroupBuys, setMyGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'reservations' | 'inquiries' | 'wishlist' | 'cart'>('reservations');
  
  // Edit Profile Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', nationality: '' });

  // Selection states
  const [selectedWishlistItems, setSelectedWishlistItems] = useState<string[]>([]);
  const [selectedCartItems, setSelectedCartItems] = useState<string[]>([]);

  // Inquiry Form
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '' });
  const [openInquiryId, setOpenInquiryId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;
    let unsubscribeInquiries: (() => void) | undefined;
    let unsubscribeGroupBuys: (() => void) | undefined;

    if (!auth || !db) { setLoading(false); return; }
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. Reservations Sync
        const qRes = query(collection(db!, "reservations"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        unsubscribeReservations = onSnapshot(qRes, (snapshot) => {
             setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. Inquiries Sync
        const qInq = query(collection(db!, "inquiries"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        unsubscribeInquiries = onSnapshot(qInq, (snapshot) => {
            setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. Group Buys Sync
        const qGb = query(collection(db!, "group_buys"), where("participants", "array-contains", currentUser.uid));
        unsubscribeGroupBuys = onSnapshot(qGb, (snapshot) => {
            setMyGroupBuys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. User Data
        try {
            const userSnap = await getDocs(query(collection(db!, "users"), where("uid", "==", currentUser.uid)));
            if (!userSnap.empty) {
                const data = userSnap.docs[0].data();
                setUserData(data);
                setEditForm({ phone: data.phone || '', nationality: data.nationality || '' });
            }
        } catch(e) { console.error(e); }
        setLoading(false);
      } else {
          setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeReservations) unsubscribeReservations();
        if (unsubscribeInquiries) unsubscribeInquiries();
        if (unsubscribeGroupBuys) unsubscribeGroupBuys();
    };
  }, []);

  const handleUpdateProfile = async () => {
      if (!user) return;
      try {
          if (!db) return;
          await updateDoc(doc(db, "users", user.uid), {
              phone: editForm.phone,
              nationality: editForm.nationality
          });
          setUserData({ ...userData, phone: editForm.phone, nationality: editForm.nationality });
          setIsEditing(false);
          alert(t('profile_updated'));
      } catch (e) { alert("Error updating profile"); }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!inquiryForm.title || !inquiryForm.content) return;
      try {
          if (!db) return;
          await addDoc(collection(db, "inquiries"), {
              userId: user.uid,
              userName: userData?.name || user.displayName,
              title: inquiryForm.title,
              content: inquiryForm.content,
              status: 'waiting',
              createdAt: serverTimestamp(),
              isPrivate: true
          });
          setInquiryForm({ title: '', content: '' });
          setShowInquiryForm(false);
          alert(t('inquiry_submitted'));
      } catch(e) { alert("Error"); }
  };

  const handlePrint = (res: any) => {
      printReceipt(res, { ...user, ...userData });
  };

  const handleCancelGroupBuy = async (gb: any) => {
      if (!user || !db) return;

      const visitDate = gb.visitDate ? new Date(gb.visitDate) : null;
      const now = new Date();
      const daysUntilVisit = visitDate ? Math.ceil((visitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      if (daysUntilVisit <= 3) {
          alert(t('cancel_3day_alert'));
          return;
      }

      const confirmed = window.confirm(t('cancel_confirm'));
      if (!confirmed) return;

      try {
          const gbRef = doc(db, "group_buys", gb.id);
          await updateDoc(gbRef, {
              participants: arrayRemove(user.uid),
              currentCount: increment(-1)
          });
          alert(t('cancel_success'));
      } catch (e) {
          console.error(e);
          alert(t('cancel_error'));
      }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <div className="p-20 text-center">{t('login')}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-8 text-[#111] border-b pb-4 flex items-center justify-between">
          {t('mypage')}
          <div className="flex gap-3 text-sm font-normal flex-wrap">
              <button onClick={() => setActiveTab('reservations')} className={`pb-1 ${activeTab === 'reservations' ? 'text-[#0070F0] font-bold border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>{t('my_reservations')}</button>
              <button onClick={() => setActiveTab('wishlist')} className={`pb-1 flex items-center gap-1 ${activeTab === 'wishlist' ? 'text-[#0070F0] font-bold border-b-2 border-[#0070F0]' : 'text-gray-400'}`}><Heart size={14}/> {t('wishlist')}{wishlist.length > 0 && ` (${wishlist.length})`}</button>
              <button onClick={() => setActiveTab('cart')} className={`pb-1 flex items-center gap-1 ${activeTab === 'cart' ? 'text-[#0070F0] font-bold border-b-2 border-[#0070F0]' : 'text-gray-400'}`}><ShoppingCart size={14}/> {t('cart')}{cart.length > 0 && ` (${cart.length})`}</button>
              <button onClick={() => setActiveTab('inquiries')} className={`pb-1 ${activeTab === 'inquiries' ? 'text-[#0070F0] font-bold border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>{t('inquiry')}</button>
          </div>
      </h1>
      
      {/* Profile Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10 shadow-sm relative">
          <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><UserIcon size={20} /> {t('my_profile')}</h2>
              <button onClick={() => { if(isEditing) handleUpdateProfile(); else setIsEditing(true); }} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  {isEditing ? <><Save size={14}/> {t('save')}</> : <><Edit2 size={14}/> {t('edit')}</>}
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                  <span className="block text-gray-400 text-xs font-bold mb-1">NAME</span>
                  <span className="font-bold text-gray-800">{userData?.name || user.displayName}</span>
              </div>
              <div>
                  <span className="block text-gray-400 text-xs font-bold mb-1">EMAIL</span>
                  <span className="font-bold text-gray-800">{user.email}</span>
              </div>
              <div>
                  <span className="block text-gray-400 text-xs font-bold mb-1">PHONE</span>
                  {isEditing ? (
                      <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="border rounded px-2 py-1 w-full font-bold" />
                  ) : <span className="font-bold text-gray-800">{userData?.phone}</span>}
              </div>
              <div>
                  <span className="block text-gray-400 text-xs font-bold mb-1">NATIONALITY</span>
                   {isEditing ? (
                      <input type="text" value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="border rounded px-2 py-1 w-full font-bold" />
                  ) : <span className="font-bold text-gray-800">{userData?.nationality}</span>}
              </div>
          </div>
      </div>

      {activeTab === 'reservations' && (
          <>
            <h2 className="text-xl font-bold mb-4">{t('my_reservations')}</h2>
            {reservations.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl"><p className="text-gray-500">{t('no_reservations')}</p></div>
            ) : (
                <div className="space-y-6">
                    {reservations.map((res) => (
                        <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all hover:shadow-md">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-[#111] mb-1">{res.productName}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {res.status === 'confirmed' ? t('status_confirmed_label') : res.status === 'cancelled' ? t('status_cancelled_label') : t('status_pending_label')}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">Date: <strong>{res.date}</strong> | People: <strong>{res.peopleCount}</strong></p>
                                <div className="flex gap-2">
                                    {res.status === 'confirmed' && (
                                        <>
                                            <button onClick={() => setSelectedVoucher(res)} className="text-xs flex items-center gap-1 bg-[#0070F0] text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"><Ticket size={14} /> Voucher</button>
                                            <button onClick={() => handlePrint(res)} className="text-xs flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"><Printer size={14} /> Invoice</button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                                <span className="text-xs text-gray-400 mb-1">{t('total')}</span>
                                <span className="text-xl font-black text-[#111]">₩ {Number(res.totalPrice).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 참여 공동구매 현황 */}
            <div className="mt-12">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={20} className="text-[#0070F0]"/> {t('my_group_buys')}</h2>
                {myGroupBuys.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl"><p className="text-gray-500">{t('no_group_buys')}</p></div>
                ) : (
                    <div className="space-y-4">
                        {myGroupBuys.map((gb) => {
                            const safeCurrent = gb.currentCount || 0;
                            const safeMax = gb.maxCount || 10;
                            const safeOriginalPrice = gb.originalPrice || 0;
                            const progress = Math.min(100, (safeCurrent / safeMax) * 100);
                            const discountRate = Math.min(0.3, safeCurrent * 0.03);
                            const discountedPrice = safeOriginalPrice * (1 - discountRate);
                            const isCompleted = gb.status === 'completed';

                            return (
                                <div key={gb.id} className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isCompleted ? 'opacity-70' : ''}`}>
                                    <div className={`h-2 ${isCompleted ? 'bg-gray-300' : 'bg-gradient-to-r from-[#0070F0] to-[#00C7AE]'}`}></div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#111] mb-1">{gb.productName || 'Unknown'}</h3>
                                                <p className="text-xs text-gray-500">{gb.description || ''}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                                                {isCompleted ? t('status_closed') : t('status_active')}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-600">{t('recruitment_status')}</span>
                                                <span className="text-xs font-bold text-gray-800">{safeCurrent}{t('people_unit')} / {safeMax}{t('people_unit')}</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-gray-400' : 'bg-gradient-to-r from-[#0070F0] to-[#00C7AE]'}`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                <p className="text-[10px] text-gray-400 font-bold mb-0.5">{t('original_price')}</p>
                                                <p className="text-xs font-bold text-gray-500 line-through">{convertPrice(safeOriginalPrice)}</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                                <p className="text-[10px] text-blue-500 font-bold mb-0.5">{t('discounted_price')}</p>
                                                <p className="text-xs font-black text-blue-700">{convertPrice(discountedPrice)}</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                                                <p className="text-[10px] text-red-400 font-bold mb-0.5 flex items-center justify-center gap-1"><TrendingDown size={10}/> {t('discount_rate')}</p>
                                                <p className="text-xs font-black text-red-600">{(discountRate * 100).toFixed(0)}%</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                            {gb.visitDate && (
                                                <p className="text-xs text-gray-400">{t('visit_date')}: <strong>{gb.visitDate}</strong></p>
                                            )}
                                            {!isCompleted ? (() => {
                                                const visitD = gb.visitDate ? new Date(gb.visitDate) : null;
                                                const daysLeft = visitD ? Math.ceil((visitD.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
                                                const canCancel = daysLeft > 3;
                                                return (
                                                    <button 
                                                        onClick={() => handleCancelGroupBuy(gb)} 
                                                        disabled={!canCancel}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${canCancel ? 'text-red-500 hover:bg-red-50 border border-red-200' : 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200'}`}
                                                        title={!canCancel ? t('cancel_3day_limit') : ''}
                                                    >
                                                        <XCircle size={12}/> {t('cancel_participation')}
                                                    </button>
                                                );
                                            })() : (
                                                <span className="text-xs text-gray-400 font-bold">{t('status_closed')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
          </>
      )}

      {activeTab === 'inquiries' && (
          <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('my_inquiries')}</h2>
                <button onClick={() => setShowInquiryForm(!showInquiryForm)} className="bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors"><Plus size={16}/> {t('new_inquiry')}</button>
            </div>

            {showInquiryForm && (
                <div className="bg-gray-50 p-6 rounded-xl mb-8 animate-fade-in border border-gray-200">
                    <form onSubmit={handleSubmitInquiry} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('inquiry_title')}</label>
                            <input type="text" value={inquiryForm.title} onChange={e => setInquiryForm({...inquiryForm, title: e.target.value})} className="w-full border p-2 rounded bg-white" placeholder={t('enter_title_placeholder')} required/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('inquiry_content')}</label>
                            <textarea value={inquiryForm.content} onChange={e => setInquiryForm({...inquiryForm, content: e.target.value})} className="w-full border p-2 rounded bg-white h-32" placeholder={t('inquiry_detail_placeholder')} required/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowInquiryForm(false)} className="px-4 py-2 text-gray-500 text-sm font-bold">{t('cancel')}</button>
                            <button type="submit" className="px-6 py-2 bg-[#0070F0] text-white rounded text-sm font-bold flex items-center gap-2"><Send size={14}/> {t('submit_inquiry')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {inquiries.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500">{t('no_inquiries')}</div>
                ) : (
                    inquiries.map(inq => (
                        <div key={inq.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                            <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setOpenInquiryId(openInquiryId === inq.id ? null : inq.id)}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${inq.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {inq.status === 'answered' ? t('status_answered') : t('status_waiting')}
                                        </span>
                                        <span className="text-xs text-gray-400">{inq.createdAt?.seconds ? new Date(inq.createdAt.seconds*1000).toLocaleDateString() : ''}</span>
                                    </div>
                                    <h3 className="font-bold text-[#111]">{inq.title}</h3>
                                </div>
                                {openInquiryId === inq.id ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                            </div>
                            {openInquiryId === inq.id && (
                                <div className="bg-gray-50 p-5 border-t border-gray-100 text-sm">
                                    <div className="mb-4">
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{inq.content}</p>
                                    </div>
                                    {inq.answer && (
                                        <div className="bg-white border border-blue-100 rounded-lg p-4 relative">
                                            <div className="absolute top-4 left-4 w-1 h-full bg-blue-500 rounded-full h-[calc(100%-32px)]"></div>
                                            <div className="pl-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-bold text-blue-600">{t('admin_label')}</span>
                                                    <span className="text-xs text-gray-400">{inq.answeredAt?.seconds ? new Date(inq.answeredAt.seconds*1000).toLocaleDateString() : ''}</span>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{inq.answer}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
          </>
      )}

      {activeTab === 'wishlist' && (
          <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><Heart size={20} className="text-red-500"/> {t('wishlist')}</h2>
                {wishlist.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedWishlistItems(prev => prev.length === wishlist.length ? [] : wishlist.map(String))} className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors flex items-center gap-1">
                            {selectedWishlistItems.length === wishlist.length ? <CheckSquare size={14}/> : <Square size={14}/>} {t('select_all')}
                        </button>
                        {selectedWishlistItems.length > 0 && (
                            <button onClick={() => {
                                selectedWishlistItems.forEach(wId => {
                                    const product = products.find(p => String(p.id) === String(wId));
                                    if (product) { addToCart(product); toggleWishlist(wId); }
                                });
                                setSelectedWishlistItems([]);
                                setActiveTab('cart');
                            }} className="bg-[#0070F0] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5">
                                <ShoppingCart size={14}/> {t('add_selected_cart') + ' (' + selectedWishlistItems.length + ')'} <ArrowRight size={14}/>
                            </button>
                        )}
                    </div>
                )}
            </div>
            {wishlist.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl"><p className="text-gray-500">{t('wishlist_empty')}</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map((wId) => {
                        const product = products.find(p => String(p.id) === String(wId));
                        if (!product) return null;
                        const title = getLocalizedValue(product, 'title');
                        const numericPrice = product.priceVal || (typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g,'')) : product.price);
                        const isSelected = selectedWishlistItems.includes(String(wId));
                        return (
                            <div key={String(wId)} className={`bg-white border rounded-xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-all ${isSelected ? 'border-[#0070F0] ring-2 ring-blue-100' : ''}`}>
                                <button onClick={() => setSelectedWishlistItems(prev => isSelected ? prev.filter(id => id !== String(wId)) : [...prev, String(wId)])} className="flex-shrink-0">
                                    {isSelected ? <CheckSquare size={20} className="text-[#0070F0]"/> : <Square size={20} className="text-gray-300"/>}
                                </button>
                                <img src={product.image} alt={title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }))}/>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-[#111] truncate">{title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                                    <p className="font-black text-sm mt-1">{convertPrice(numericPrice)}</p>
                                </div>
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    <button onClick={() => { addToCart(product); toggleWishlist(wId); }} className="bg-[#0070F0] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 flex items-center gap-1"><ShoppingCart size={12}/> {t('add_to_cart')}</button>
                                    <button onClick={() => { toggleWishlist(wId); setSelectedWishlistItems(prev => prev.filter(id => id !== String(wId))); }} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={12}/> {t('remove')}</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </>
      )}

      {activeTab === 'cart' && (
          <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={20} className="text-blue-500"/> {t('shopping_cart')}</h2>
                {cart.length > 0 && (
                    <button onClick={() => setSelectedCartItems(prev => prev.length === cart.length ? [] : cart.map(i => i.productId))} className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors flex items-center gap-1">
                        {selectedCartItems.length === cart.length ? <CheckSquare size={14}/> : <Square size={14}/>} {t('select_all')}
                    </button>
                )}
            </div>
            {cart.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl"><p className="text-gray-500">{t('cart_empty')}</p></div>
            ) : (
                <>
                    <div className="space-y-4 mb-6">
                        {cart.map((item) => {
                            const isSelected = selectedCartItems.includes(item.productId);
                            const cartProduct = products.find(p => String(p.id) === item.productId);
                            const cartTitle = cartProduct ? getLocalizedValue(cartProduct, 'title') : item.title;
                            const cartImage = cartProduct ? (getLocalizedValue(cartProduct, 'image') || cartProduct.image || item.image) : item.image;
                            return (
                                <div key={item.productId} className={`bg-white border rounded-xl p-4 flex gap-4 items-center shadow-sm transition-all ${isSelected ? 'border-[#0070F0] ring-2 ring-blue-100' : ''}`}>
                                    <button onClick={() => setSelectedCartItems(prev => isSelected ? prev.filter(id => id !== item.productId) : [...prev, item.productId])} className="flex-shrink-0">
                                        {isSelected ? <CheckSquare size={20} className="text-[#0070F0]"/> : <Square size={20} className="text-gray-300"/>}
                                    </button>
                                    <img src={cartImage} alt={cartTitle} className="w-20 h-20 object-cover rounded-lg flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-[#111] truncate">{cartTitle}</h3>
                                        <p className="font-black text-sm mt-1">{convertPrice(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-100"><Minus size={14}/></button>
                                        <span className="font-bold text-sm w-8 text-center">{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-100"><Plus size={14}/></button>
                                    </div>
                                    <button onClick={() => { removeFromCart(item.productId); setSelectedCartItems(prev => prev.filter(id => id !== item.productId)); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex-shrink-0"><Trash2 size={16}/></button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-gray-50 border rounded-xl p-6">
                        {selectedCartItems.length > 0 ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">{t('selected_items')}</span>
                                    <span className="font-bold text-sm">{cart.filter(i => selectedCartItems.includes(i.productId)).reduce((a, b) => a + b.quantity, 0)}{t('items_unit')}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 border-b pb-4">
                                    <span className="font-black text-lg">{t('selected_total')}</span>
                                    <span className="font-black text-xl text-[#0070F0]">{convertPrice(cart.filter(i => selectedCartItems.includes(i.productId)).reduce((a, b) => a + b.price * b.quantity, 0))}</span>
                                </div>
                                {selectedCartItems.length === 1 ? (
                                    <button onClick={() => {
                                        const item = cart.find(i => i.productId === selectedCartItems[0]);
                                        if (item) {
                                            const product = products.find(p => String(p.id) === item.productId);
                                            if (product) window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
                                        }
                                    }} className="w-full bg-[#0070F0] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                                        <CreditCard size={18}/> {t('proceed_payment')} <ArrowRight size={16}/>
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 text-center mb-3">{t('individual_payment_note')}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {cart.filter(i => selectedCartItems.includes(i.productId)).map(item => {
                                                const product = products.find(p => String(p.id) === item.productId);
                                                const btnTitle = product ? getLocalizedValue(product, 'title') : item.title;
                                                return (
                                                    <button key={item.productId} onClick={() => {
                                                        if (product) window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
                                                    }} className="bg-[#0070F0] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-600 transition-colors truncate">
                                                        <CreditCard size={14}/> {btnTitle}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-600">{t('total_items')}</span>
                                    <span className="font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}{t('items_unit')}</span>
                                </div>
                                <div className="flex justify-between items-center border-t pt-4 mb-4">
                                    <span className="font-black text-lg">{t('total')}</span>
                                    <span className="font-black text-xl text-[#0070F0]">{convertPrice(cart.reduce((a, b) => a + b.price * b.quantity, 0))}</span>
                                </div>
                                <p className="text-center text-xs text-gray-400">{t('select_items_to_pay')}</p>
                            </>
                        )}
                    </div>
                </>
            )}
          </>
      )}

      {selectedVoucher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-sm" onClick={() => setSelectedVoucher(null)}>
              <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden relative shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="bg-[#0070F0] p-6 text-white text-center relative"><h3 className="font-black text-2xl tracking-widest">E-VOUCHER</h3></div>
                  <div className="px-8 pt-2 pb-8 text-center"><h4 className="text-lg font-bold text-gray-900 mb-1">{selectedVoucher.productName}</h4><p className="text-sm text-gray-500 mb-6">{selectedVoucher.id.slice(0,8).toUpperCase()}</p><button className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800"><Download size={16}/> Save</button></div>
              </div>
          </div>
      )}
    </div>
  );
};
