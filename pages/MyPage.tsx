
import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ticket, XCircle, Download, Edit2, Save, User as UserIcon, Printer, MessageCircle, ChevronDown, ChevronUp, Plus, Send } from 'lucide-react';
import { useGlobal } from '../contexts/GlobalContext';
import { printReceipt } from '../services/receiptService';

export const MyPage: React.FC<any> = () => {
  const { t, language } = useGlobal();
  const isEn = language !== 'ko';
  const [reservations, setReservations] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'reservations' | 'inquiries'>('reservations');
  
  // Edit Profile Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', nationality: '' });

  // Inquiry Form
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '' });
  const [openInquiryId, setOpenInquiryId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeReservations: (() => void) | undefined;
    let unsubscribeInquiries: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. Reservations Sync
        const qRes = query(collection(db, "reservations"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        unsubscribeReservations = onSnapshot(qRes, (snapshot) => {
             setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. Inquiries Sync
        const qInq = query(collection(db, "inquiries"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        unsubscribeInquiries = onSnapshot(qInq, (snapshot) => {
            setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. User Data
        try {
            const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
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
    };
  }, []);

  const handleUpdateProfile = async () => {
      if (!user) return;
      try {
          await updateDoc(doc(db, "users", user.uid), {
              phone: editForm.phone,
              nationality: editForm.nationality
          });
          setUserData({ ...userData, phone: editForm.phone, nationality: editForm.nationality });
          setIsEditing(false);
          alert(isEn ? "Profile updated." : "회원정보가 수정되었습니다.");
      } catch (e) { alert("Error updating profile"); }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!inquiryForm.title || !inquiryForm.content) return;
      try {
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
          alert(isEn ? "Inquiry submitted." : "문의가 접수되었습니다.");
      } catch(e) { alert("Error"); }
  };

  const handlePrint = (res: any) => {
      printReceipt(res, { ...user, ...userData });
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <div className="p-20 text-center">{t('login')}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-8 text-[#111] border-b pb-4 flex items-center justify-between">
          {t('mypage')}
          <div className="flex gap-4 text-base font-normal">
              <button onClick={() => setActiveTab('reservations')} className={`pb-1 ${activeTab === 'reservations' ? 'text-[#0070F0] font-bold border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>Reservations</button>
              <button onClick={() => setActiveTab('inquiries')} className={`pb-1 ${activeTab === 'inquiries' ? 'text-[#0070F0] font-bold border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>1:1 Inquiries</button>
          </div>
      </h1>
      
      {/* Profile Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10 shadow-sm relative">
          <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><UserIcon size={20} /> {isEn ? "My Profile" : "내 정보"}</h2>
              <button onClick={() => { if(isEditing) handleUpdateProfile(); else setIsEditing(true); }} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  {isEditing ? <><Save size={14}/> {isEn ? 'Save' : '저장'}</> : <><Edit2 size={14}/> {isEn ? 'Edit' : '수정'}</>}
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
            <h2 className="text-xl font-bold mb-4">{isEn ? "My Reservations" : "예약 내역"}</h2>
            {reservations.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl"><p className="text-gray-500">No Reservations.</p></div>
            ) : (
                <div className="space-y-6">
                    {reservations.map((res) => (
                        <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all hover:shadow-md">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-[#111] mb-1">{res.productName}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {res.status === 'confirmed' ? (isEn ? 'Confirmed' : '예약확정') : res.status === 'cancelled' ? (isEn ? 'Cancelled' : '취소됨') : (isEn ? 'Pending' : '예약대기')}
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
                            <input type="text" value={inquiryForm.title} onChange={e => setInquiryForm({...inquiryForm, title: e.target.value})} className="w-full border p-2 rounded bg-white" placeholder="제목을 입력하세요" required/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('inquiry_content')}</label>
                            <textarea value={inquiryForm.content} onChange={e => setInquiryForm({...inquiryForm, content: e.target.value})} className="w-full border p-2 rounded bg-white h-32" placeholder="문의 내용을 자세히 적어주세요. (비공개 처리됩니다)" required/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowInquiryForm(false)} className="px-4 py-2 text-gray-500 text-sm font-bold">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-[#0070F0] text-white rounded text-sm font-bold flex items-center gap-2"><Send size={14}/> Submit</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {inquiries.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500">No inquiries yet.</div>
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
                                                    <span className="font-bold text-blue-600">Admin</span>
                                                    <span className="text-xs text-gray-400">{inq.answeredAt ? new Date(inq.answeredAt.seconds*1000).toLocaleDateString() : ''}</span>
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
