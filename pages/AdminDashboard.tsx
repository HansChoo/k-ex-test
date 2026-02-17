
import React, { useEffect, useState, useMemo } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, RefreshCw, Lock, CheckCircle2, List, Calendar as CalendarIcon, MoreHorizontal, Mail, Key
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User, signInWithEmailAndPassword } from 'firebase/auth';
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
  const [isAdminVerified, setIsAdminVerified] = useState(false); // 관리자 인증 여부
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries'>('dashboard');
  
  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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

  // 초기 로드 시 현재 사용자가 관리자인지 확인 (세션 유지용)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email === "admin@k-experience.com") {
          setIsAdminVerified(true);
      } else {
          setIsAdminVerified(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 관리자 전용 로그인 처리
  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginLoading(true);
      try {
          const result = await signInWithEmailAndPassword(auth, loginId, loginPw);
          if (result.user.email === "admin@k-experience.com") {
              setIsAdminVerified(true);
              showToast("관리자로 로그인되었습니다.");
          } else {
              alert("관리자 권한이 없는 계정입니다.");
              await logoutUser();
          }
      } catch (err) {
          alert("로그인 정보가 올바르지 않습니다.");
      } finally {
          setLoginLoading(false);
      }
  };

  useEffect(() => {
    if (!isAdminVerified) return;
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
  }, [isAdminVerified]);

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
      else if (modalType === 'groupbuy') col = "group_bu_ys";

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

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setUploadingImg(true);
          try {
              const url = await uploadImage(file, 'admin_images');
              setEditingItem((prev: any) => ({ ...prev, image: url }));
          } finally { setUploadingImg(false); }
      }
  };

  if (loading) return <div className="p-20 text-center">Loading Admin...</div>;

  // 관리자 로그인이 되어 있지 않은 경우 로그인 폼 출력
  if (!isAdminVerified) {
      return (
          <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                  <div className="bg-[#0070F0] p-8 text-white text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                          <Lock size={32} />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">K-EXPERIENCE</h2>
                      <p className="text-white/70 font-bold text-sm">Administrator Login</p>
                  </div>
                  <form onSubmit={handleAdminLogin} className="p-8 space-y-4">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Admin Email</label>
                          <input 
                            type="email" 
                            className="w-full border border-gray-200 p-4 rounded-xl font-bold text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0070F0] outline-none transition-all"
                            placeholder="admin@k-experience.com"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Password</label>
                          <input 
                            type="password" 
                            className="w-full border border-gray-200 p-4 rounded-xl font-bold text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#0070F0] outline-none transition-all"
                            placeholder="••••••••"
                            value={loginPw}
                            onChange={(e) => setLoginPw(e.target.value)}
                            required
                          />
                      </div>
                      <button 
                        type="submit" 
                        disabled={loginLoading}
                        className="w-full bg-black text-white py-4 rounded-xl font-black shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                      >
                          {loginLoading ? <RefreshCw className="animate-spin" size={18}/> : <Key size={18}/>}
                          LOGIN TO DASHBOARD
                      </button>
                      <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase">© K-Experience Management System</p>
                  </form>
              </div>
          </div>
      );
  }

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
                    {id:'magazine', label:'매거진 관리', icon:BookOpen},
                    {id:'coupons', label:'쿠폰 관리', icon:Ticket},
                    {id:'inquiries', label:'문의 관리', icon:MessageCircle},
                ].map(item => (
                    <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab===item.id ? 'bg-[#0070F0] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <item.icon size={18}/> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t">
                <button 
                    onClick={async () => { await logoutUser(); setIsAdminVerified(false); }} 
                    className="flex items-center gap-2 text-gray-500 font-bold text-sm w-full p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                >
                    <LogOut size={16}/> 로그아웃
                </button>
            </div>
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
                    <div className="p-4 border-b bg-gray-50 font-bold text-sm">최근 예약 리스트</div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b"><tr><th className="p-4">날짜</th><th className="p-4">상품명</th><th className="p-4">예약자</th><th className="p-4">인원</th><th className="p-4">금액</th><th className="p-4">상태</th></tr></thead>
                        <tbody>
                            {reservations.map(res => (
                                <tr key={res.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-xs">{res.date}</td>
                                    <td className="p-4 font-bold">{res.productName}</td>
                                    <td className="p-4">{res.options?.guests?.[0]?.name || 'N/A'}</td>
                                    <td className="p-4">{res.peopleCount}명</td>
                                    <td className="p-4 font-black">₩{Number(res.totalPrice).toLocaleString()}</td>
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
                        <button onClick={() => setProductSubTab('packages')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'packages' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>올인원 패키지</button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <button onClick={()=>{setEditingItem({title:'', priceMale:0, priceFemale:0, category:'건강검진'}); setModalType(productSubTab === 'items' ? 'product' : 'package');}} className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 hover:bg-white transition-all"><Plus size={32}/><span className="font-bold">신규 등록</span></button>
                        {(productSubTab === 'items' ? products : packages).map(p => (
                            <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm group">
                                <div className="h-32 bg-gray-100 relative"><img src={p.image} className="w-full h-full object-cover"/></div>
                                <div className="p-4">
                                    <h4 className="font-bold truncate">{p.title}</h4>
                                    <div className="text-[10px] text-gray-500 mb-2">M: {Number(p.priceMale||0).toLocaleString()} / F: {Number(p.priceFemale||0).toLocaleString()}</div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={()=>{setEditingItem(p); setModalType(productSubTab === 'items' ? 'product' : 'package');}} className="text-blue-500"><Edit2 size={16}/></button>
                                        <button onClick={()=>deleteItem(productSubTab === 'items' ? 'products' : 'cms_packages', p.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'magazine' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-black">매거진 관리</h2><button onClick={() => { setEditingItem({ title: '', category: 'Trend', excerpt: '', content: '' }); setModalType('magazine'); }} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 포스트 작성</button></div>
                    <div className="grid grid-cols-3 gap-6">
                        {magazinePosts.map(post => (
                            <div key={post.id} className="bg-white rounded-xl border overflow-hidden shadow-sm">
                                <img src={post.image} className="h-40 w-full object-cover" />
                                <div className="p-4"><h4 className="font-bold truncate mb-2">{post.title}</h4><div className="flex justify-end gap-2"><button onClick={() => { setEditingItem(post); setModalType('magazine'); }} className="text-blue-500"><Edit2 size={16}/></button><button onClick={() => deleteItem('cms_magazine', post.id)} className="text-red-500"><Trash2 size={16}/></button></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'inquiries' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">1:1 문의 관리</h2>
                    {inquiries.map(inq => (
                        <div key={inq.id} className="bg-white p-6 rounded-xl border border-gray-100">
                            <div className="flex justify-between mb-4"><div><h4 className="font-bold text-lg">{inq.title}</h4><p className="text-xs text-gray-400">{inq.userName}님 ({inq.userId})</p></div><StatusBadge status={inq.status} /></div>
                            <p className="bg-gray-50 p-4 rounded text-sm mb-4">{inq.content}</p>
                            <textarea className="w-full border p-3 rounded text-sm h-24 mb-2" placeholder="답변 내용을 입력하세요..." value={inq.tempAnswer || inq.answer || ''} onChange={e => {
                                setInquiries(inquiries.map(item => item.id === inq.id ? {...item, tempAnswer: e.target.value} : item));
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
                        {(modalType === 'product' || modalType === 'package') && (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2"><label className="block text-xs font-bold mb-1">명칭</label><input className="w-full border p-3 rounded-lg" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                <div className="bg-blue-50 p-4 rounded-xl"><label className="block text-xs font-bold mb-1 text-blue-600 font-black">남성 가격 (KRW)</label><input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})} /></div>
                                <div className="bg-pink-50 p-4 rounded-xl"><label className="block text-xs font-bold mb-1 text-pink-600 font-black">여성 가격 (KRW)</label><input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})} /></div>
                                <div className="col-span-2"><label className="block text-xs font-bold mb-1">대표 이미지</label><input type="file" className="block w-full text-sm" onChange={handleMainImageUpload} /></div>
                                <div className="col-span-2"><label className="block text-xs font-bold mb-2">상세 본문</label><RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} /></div>
                            </div>
                        )}
                        {modalType === 'magazine' && (
                            <div className="space-y-6">
                                <input className="w-full border p-3 rounded-lg font-bold" placeholder="제목" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                                <RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} />
                            </div>
                        )}
                        {modalType === 'coupon' && (
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-3 rounded" placeholder="쿠폰명" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/>
                                <input className="border p-3 rounded" placeholder="코드" value={editingItem.code} onChange={e=>setEditingItem({...editingItem, code:e.target.value})}/>
                                <input className="border p-3 rounded" type="number" placeholder="할인값" value={editingItem.value} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})}/>
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
