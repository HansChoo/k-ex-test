
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, MessageCircle, LogOut, RefreshCw, Lock, CheckCircle2, 
    ImageIcon, DollarSign, Calendar as CalendarIcon
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logoutUser } from '../services/authService';
import { RichTextEditor } from '../components/RichTextEditor';
import { uploadImage } from '../services/imageService';

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-green-100 text-green-800',
        'completed': 'bg-gray-100 text-gray-800',
        'cancelled': 'bg-red-100 text-red-800',
        'waiting': 'bg-orange-100 text-orange-800',
        'answered': 'bg-blue-100 text-blue-800'
    };
    const labels: any = {
        'pending': '대기중', 'confirmed': '확정됨', 'completed': '이용완료', 
        'cancelled': '취소됨', 'waiting': '답변대기', 'answered': '답변완료'
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status.toUpperCase()}
        </span>
    );
};

export const AdminDashboard: React.FC<any> = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries'>('dashboard');
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [packages, setPackages] = useState<any[]>([]); 
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [productSubTab, setProductSubTab] = useState<'items' | 'packages'>('items'); 
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (user.email === "admin@k-experience.com" || (userDoc.exists() && userDoc.data().role === 'admin')) {
              setIsAdmin(true);
          }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubs = [
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (s) => setReservations(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "products"), (s) => setProducts(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "cms_packages"), (s) => setPackages(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(query(collection(db, "group_buys"), orderBy("createdAt", "desc")), (s) => setGroupBuys(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "coupons"), (s) => setCoupons(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), (s) => setMagazinePosts(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), (s) => setInquiries(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({id:d.id, ...d.data()})))),
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  const showToast = (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
  };

  const deleteItem = async (col: string, id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까?")) return;
      await deleteDoc(doc(db, col, id));
      showToast("삭제되었습니다.");
  };

  const saveItem = async () => {
      let col = "";
      if (modalType === 'magazine') col = "cms_magazine";
      else if (modalType === 'product') col = "products";
      else if (modalType === 'package') col = "cms_packages";
      else if (modalType === 'coupon') col = "coupons";
      else if (modalType === 'groupbuy') col = "group_buys";

      const payload = { ...editingItem };
      try {
          if (editingItem.id) {
              await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
          } else {
              await addDoc(collection(db, col), { ...payload, createdAt: serverTimestamp() });
          }
          showToast("성공적으로 저장되었습니다.");
          setModalType(null);
      } catch(e: any) { alert("저장 실패: " + e.message); }
  };

  const getPackageTotal = (gender: 'male' | 'female') => {
      if (!editingItem?.selectedProductIds) return 0;
      return editingItem.selectedProductIds.reduce((sum: number, id: string) => {
          const p = products.find(prod => prod.id === id);
          const price = gender === 'male' ? (p?.priceMale || p?.price || 0) : (p?.priceFemale || p?.price || 0);
          return sum + Number(price);
      }, 0);
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!isAdmin) return <div className="p-20 text-center flex flex-col items-center"><Lock className="mb-4" /> Admin Access Denied</div>;

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold bg-black">{toast}</div>}

        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0]">K-ADMIN</div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                    {id:'dashboard', label:'대시보드', icon:LayoutDashboard},
                    {id:'reservations', label:'예약 관리', icon:ShoppingCart},
                    {id:'products', label:'상품/패키지', icon:Package},
                    {id:'groupbuys', label:'공동구매', icon:Megaphone},
                    {id:'coupons', label:'쿠폰 관리', icon:Ticket},
                    {id:'magazine', label:'매거진 관리', icon:BookOpen},
                    {id:'inquiries', label:'문의 관리', icon:MessageCircle},
                ].map(item => (
                    <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab===item.id ? 'bg-[#0070F0] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <item.icon size={18}/> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t"><button onClick={logoutUser} className="flex items-center gap-2 text-gray-500 font-bold text-sm"><LogOut size={16}/> 로그아웃</button></div>
        </aside>

        <main className="flex-1 ml-64 p-8 min-w-[1000px]">
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black">Admin Overview</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2">총 매출</h3><p className="text-2xl font-black">₩ {reservations.reduce((s,r)=>s+Number(r.totalPrice||0),0).toLocaleString()}</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2">예약 건수</h3><p className="text-2xl font-black">{reservations.length}건</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2">회원수</h3><p className="text-2xl font-black">{users.length}명</p></div>
                    </div>
                </div>
            )}

            {activeTab === 'reservations' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h2 className="font-bold">최근 예약 내역</h2></div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-400 font-bold">
                            <tr><th className="p-4 text-left">날짜</th><th className="p-4 text-left">상품명</th><th className="p-4 text-left">고객명</th><th className="p-4 text-left">결제금액</th><th className="p-4 text-left">상태</th></tr>
                        </thead>
                        <tbody>
                            {reservations.map(res => (
                                <tr key={res.id} className="border-t hover:bg-gray-50">
                                    <td className="p-4 text-xs">{res.date}</td>
                                    <td className="p-4 font-bold">{res.productName}</td>
                                    <td className="p-4">{res.options?.guests?.[0]?.name || 'N/A'}</td>
                                    <td className="p-4 font-black text-blue-600">₩{Number(res.totalPrice).toLocaleString()}</td>
                                    <td className="p-4"><StatusBadge status={res.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="flex gap-4 border-b pb-1">
                        <button onClick={() => setProductSubTab('items')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'items' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>일반 상품</button>
                        <button onClick={() => setProductSubTab('packages')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'packages' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>패키지</button>
                    </div>
                    {productSubTab === 'items' ? (
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={()=>{setEditingItem({title:'', priceMale:0, priceFemale:0, category:'건강검진'}); setModalType('product');}} className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 hover:bg-white transition-all"><Plus size={32}/><span className="font-bold">상품 등록</span></button>
                            {products.map(p => (
                                <div key={p.id} className="bg-white border rounded-xl overflow-hidden group hover:shadow-lg transition-all">
                                    <div className="h-32 bg-gray-100"><img src={p.image} className="w-full h-full object-cover"/></div>
                                    <div className="p-4">
                                        <h4 className="font-bold truncate">{p.title}</h4>
                                        <div className="text-[10px] text-gray-500 mb-2">M: {Number(p.priceMale||0).toLocaleString()} / F: {Number(p.priceFemale||0).toLocaleString()}</div>
                                        <div className="flex justify-end gap-2"><button onClick={()=>{setEditingItem(p); setModalType('product');}} className="text-blue-500"><Edit2 size={16}/></button><button onClick={()=>deleteItem('products', p.id)} className="text-red-500"><Trash2 size={16}/></button></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-6">
                            <button onClick={() => { setEditingItem({ title: '', items: [], theme: 'mint', priceMale: 0, priceFemale: 0, selectedProductIds: [] }); setModalType('package'); }} className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center text-gray-400 hover:bg-white transition-all"><Plus size={32}/><span className="font-bold">패키지 생성</span></button>
                            {packages.map(pkg => (
                                <div key={pkg.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-all">
                                    <h3 className="font-black text-lg mb-2">{pkg.title}</h3>
                                    <div className="text-xs text-gray-500 mb-4">M: ₩{(pkg.priceMale || 0).toLocaleString()} / F: ₩{(pkg.priceFemale || 0).toLocaleString()}</div>
                                    <div className="flex justify-end gap-2"><button onClick={() => { setEditingItem(pkg); setModalType('package'); }} className="text-blue-500"><Edit2 size={16}/></button><button onClick={() => deleteItem('cms_packages', pkg.id)} className="text-red-500"><Trash2 size={16}/></button></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'inquiries' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">1:1 문의 관리</h2>
                    {inquiries.map(inq => (
                        <div key={inq.id} className="bg-white p-6 rounded-xl border border-gray-100">
                            <div className="flex justify-between mb-4">
                                <div><h4 className="font-bold text-lg">{inq.title}</h4><p className="text-xs text-gray-400">{inq.userName}님 ({inq.userId})</p></div>
                                <StatusBadge status={inq.status} />
                            </div>
                            <p className="bg-gray-50 p-4 rounded text-sm mb-4">{inq.content}</p>
                            <textarea className="w-full border p-3 rounded text-sm h-24 mb-2" placeholder="답변 내용을 입력하세요..." value={inq.tempAnswer || inq.answer || ''} onChange={e => {
                                const newList = inquiries.map(item => item.id === inq.id ? {...item, tempAnswer: e.target.value} : item);
                                setInquiries(newList);
                            }} />
                            <button onClick={async () => {
                                await updateDoc(doc(db, "inquiries", inq.id), { answer: inq.tempAnswer || inq.answer, status: 'answered', answeredAt: serverTimestamp() });
                                showToast("답변이 등록되었습니다.");
                            }} className="bg-[#0070F0] text-white px-6 py-2 rounded text-sm font-bold">답변 저장</button>
                        </div>
                    ))}
                </div>
            )}
        </main>

        {modalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold">{modalType.toUpperCase()} EDITOR</h3><button onClick={()=>setModalType(null)}><X/></button></div>
                    <div className="p-8 overflow-y-auto flex-1 space-y-6">
                        {modalType === 'product' && (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2"><label className="block text-xs font-bold mb-1">상품명</label><input className="w-full border p-3 rounded-lg" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                <div className="bg-blue-50 p-4 rounded-xl"><label className="block text-xs font-bold mb-1 text-blue-600">남성 가격</label><input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})} /></div>
                                <div className="bg-pink-50 p-4 rounded-xl"><label className="block text-xs font-bold mb-1 text-pink-600">여성 가격</label><input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})} /></div>
                                <div className="col-span-2"><label className="block text-xs font-bold mb-2">상세 본문</label><RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} /></div>
                            </div>
                        )}
                        {modalType === 'package' && (
                             <div className="flex gap-8 h-[500px]">
                                 <div className="w-1/2 space-y-4">
                                     <div><label className="block text-xs font-bold mb-1">패키지명</label><input className="w-full border p-3 rounded-lg" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                     <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-xl">
                                         <div><label className="block text-[10px] font-bold text-blue-600">M 할인가</label><input type="number" className="w-full border p-2 rounded font-black mt-1" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})}/></div>
                                         <div><label className="block text-[10px] font-bold text-pink-600">F 할인가</label><input type="number" className="w-full border p-2 rounded font-black mt-1" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})}/></div>
                                     </div>
                                 </div>
                                 <div className="w-1/2 border rounded-xl flex flex-col overflow-hidden">
                                     <div className="bg-gray-50 p-3 text-xs font-bold border-b">상품 선택</div>
                                     <div className="flex-1 overflow-y-auto p-2">
                                         {products.map(prod => (
                                             <div key={prod.id} onClick={() => {
                                                const currentIds = editingItem.selectedProductIds || [];
                                                const newIds = currentIds.includes(prod.id) ? currentIds.filter((id:any)=>id!==prod.id) : [...currentIds, prod.id];
                                                const newItems = products.filter(p => newIds.includes(p.id)).map(p => p.title);
                                                setEditingItem({...editingItem, selectedProductIds: newIds, items: newItems});
                                             }} className={`p-2 rounded cursor-pointer border mb-1 flex justify-between items-center ${(editingItem.selectedProductIds || []).includes(prod.id) ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}><span className="text-xs font-bold">{prod.title}</span>{(editingItem.selectedProductIds || []).includes(prod.id) && <CheckCircle2 size={14} className="text-blue-500" />}</div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                         )}
                         {modalType === 'magazine' && (
                            <div className="space-y-6">
                                <input className="w-full border p-3 rounded-lg font-bold" placeholder="제목" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                                <RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} />
                            </div>
                         )}
                    </div>
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={()=>setModalType(null)} className="px-6 py-2 font-bold text-gray-500">취소</button><button onClick={saveItem} className="bg-[#0070F0] text-white px-8 py-2 rounded-lg font-bold">저장</button></div>
                </div>
            </div>
        )}
    </div>
  );
};
