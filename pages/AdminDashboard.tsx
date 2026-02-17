
import React, { useEffect, useState, useMemo } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, RefreshCw, Lock, CheckCircle2, Phone, Archive, Grid, Layers, FolderTree, 
    Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, MoreHorizontal, Mail, DollarSign, ExternalLink
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, getDoc, setDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
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
        'answered': 'bg-blue-100 text-blue-800',
        'active': 'bg-blue-100 text-blue-800'
    };
    const labels: any = {
        'pending': '대기중', 'confirmed': '확정됨', 'completed': '이용완료', 
        'cancelled': '취소됨', 'waiting': '답변대기', 'answered': '답변완료', 'active': '활성'
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status.toUpperCase()}
        </span>
    );
};

export const AdminDashboard: React.FC<any> = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates' | 'users' | 'settings'>('dashboard');
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [packages, setPackages] = useState<any[]>([]); 
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [productSubTab, setProductSubTab] = useState<'categories' | 'items' | 'packages'>('categories'); 
  const [reservationView, setReservationView] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          // 보고 및 시연을 위해 로그인이 되어있다면 우선 관리자 권한을 부여합니다.
          // 실제 운영 환경에서는 Firestore의 role 필드나 특정 이메일을 체크하게 됩니다.
          setIsAdmin(true);
          
          // 백그라운드에서 실제 권한 정보 업데이트 (DB 연동 시)
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
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
        onSnapshot(collection(db, "affiliates"), (s) => setAffiliates(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "cms_categories"), (s) => setCategories(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "settings"), (s) => {
            const temp: any = {};
            s.docs.forEach(d => temp[d.id] = d.data());
            setSettings(temp);
        })
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
      else if (modalType === 'affiliate') col = "affiliates";
      else if (modalType === 'category') col = "cms_categories";
      else if (modalType === 'inquiry_answer') col = "inquiries";

      const payload = { ...editingItem };
      try {
          if (editingItem.id) {
              if (modalType === 'inquiry_answer') {
                  await updateDoc(doc(db, col, editingItem.id), { 
                      answer: editingItem.answer, 
                      status: 'answered', 
                      answeredAt: serverTimestamp() 
                  });
              } else {
                  await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
              }
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

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="h-24 bg-gray-50/50 border-r border-b"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayRes = reservations.filter(r => r.date === dateStr);
        days.push(
            <div key={d} className="h-24 border-r border-b p-1 relative hover:bg-blue-50/50 transition-colors group">
                <span className="text-[10px] font-bold text-gray-400">{d}</span>
                <div className="mt-1 space-y-1 overflow-hidden">
                    {dayRes.slice(0, 3).map(res => (
                        <div key={res.id} onClick={() => { setEditingItem(res); setModalType('reservation_detail'); }} className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded truncate cursor-pointer font-bold">
                            {res.productName}
                        </div>
                    ))}
                    {dayRes.length > 3 && <div className="text-[8px] text-gray-400 text-center font-bold">+{dayRes.length-3} more</div>}
                </div>
            </div>
        );
    }
    return days;
  };

  if (loading) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto text-blue-500" /></div>;
  if (!isAdmin) return <div className="p-20 text-center flex flex-col items-center"><Lock className="mb-4" /> 로그인이 필요하거나 권한이 없습니다.</div>;

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {toast && <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold bg-black animate-fade-in">{toast}</div>}

        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0]">K-ADMIN</div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
                {[
                    {id:'dashboard', label:'대시보드', icon:LayoutDashboard},
                    {id:'reservations', label:'예약 관리', icon:ShoppingCart},
                    {id:'products', label:'상품/패키지', icon:Package},
                    {id:'groupbuys', label:'공동구매', icon:Megaphone},
                    {id:'magazine', label:'매거진 관리', icon:BookOpen},
                    {id:'coupons', label:'쿠폰 관리', icon:Ticket},
                    {id:'inquiries', label:'문의 관리', icon:MessageCircle},
                    {id:'users', label:'회원 관리', icon:Users},
                    {id:'affiliates', label:'제휴 파트너', icon:LinkIcon},
                    {id:'settings', label:'환경 설정', icon:SettingsIcon},
                ].map(item => (
                    <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab===item.id ? 'bg-[#0070F0] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <item.icon size={18}/> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t"><button onClick={logoutUser} className="flex items-center gap-2 text-gray-500 font-bold text-sm"><LogOut size={16}/> 로그아웃</button></div>
        </aside>

        <main className="flex-1 ml-64 p-8 min-w-[1000px]">
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-black">Admin Overview</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">총 매출</h3><p className="text-2xl font-black">₩ {reservations.reduce((s,r)=>s+Number(r.totalPrice||0),0).toLocaleString()}</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">누적 예약</h3><p className="text-2xl font-black">{reservations.length}건</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">활성 회원</h3><p className="text-2xl font-black">{users.length}명</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">등록 상품</h3><p className="text-2xl font-black">{products.length + packages.length}개</p></div>
                    </div>
                </div>
            )}

            {activeTab === 'reservations' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">예약 관리</h2>
                        <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                            <button onClick={()=>setReservationView('list')} className={`px-4 py-2 rounded text-xs font-bold ${reservationView==='list'?'bg-white shadow':'text-gray-500'}`}>리스트</button>
                            <button onClick={()=>setReservationView('calendar')} className={`px-4 py-2 rounded text-xs font-bold ${reservationView==='calendar'?'bg-white shadow':'text-gray-500'}`}>캘린더</button>
                        </div>
                    </div>
                    {reservationView === 'list' ? (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b font-bold text-gray-500"><tr><th className="p-4">날짜</th><th className="p-4">상품명</th><th className="p-4">예약자</th><th className="p-4">인원</th><th className="p-4">금액</th><th className="p-4">상태</th><th className="p-4">조작</th></tr></thead>
                                <tbody className="divide-y">
                                    {reservations.map(res => (
                                        <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-mono text-xs">{res.date}</td>
                                            <td className="p-4 font-bold truncate max-w-[200px]">{res.productName}</td>
                                            <td className="p-4">{res.options?.guests?.[0]?.name || 'N/A'}</td>
                                            <td className="p-4">{res.peopleCount}명</td>
                                            <td className="p-4 font-black">₩{Number(res.totalPrice).toLocaleString()}</td>
                                            <td className="p-4"><StatusBadge status={res.status} /></td>
                                            <td className="p-4"><button onClick={()=>{setEditingItem(res); setModalType('reservation_detail');}} className="text-blue-500 hover:underline font-bold text-xs">상세</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b bg-gray-50">
                                <button onClick={()=>setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()-1)))} className="p-1"><ChevronLeft size={16}/></button>
                                <span className="font-black text-sm">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                                <button onClick={()=>setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth()+1)))} className="p-1"><ChevronRight size={16}/></button>
                            </div>
                            <div className="grid grid-cols-7 text-center py-2 bg-gray-100 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 min-h-[400px]">
                                {renderCalendar()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'coupons' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">쿠폰 관리</h2>
                        <button onClick={()=>{setEditingItem({code:'', value:0, type:'percent', isActive:true, maxUsage:100, currentUsage:0}); setModalType('coupon');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 쿠폰 생성</button>
                    </div>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b font-bold text-gray-500"><tr><th className="p-4">코드</th><th className="p-4">할인 내용</th><th className="p-4">사용수/한도</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {coupons.map(cp => (
                                    <tr key={cp.id}>
                                        <td className="p-4 font-mono font-bold text-blue-600 uppercase">{cp.code}</td>
                                        <td className="p-4 font-bold">{cp.value}{cp.type === 'percent' ? '%' : '원'} 할인</td>
                                        <td className="p-4">{cp.currentUsage || 0} / {cp.maxUsage}</td>
                                        <td className="p-4"><StatusBadge status={cp.isActive ? 'active' : 'cancelled'} /></td>
                                        <td className="p-4"><button onClick={()=>deleteItem('coupons', cp.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'magazine' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">매거진 관리</h2>
                        <button onClick={()=>{setEditingItem({title:'', excerpt:'', content:'', category:'K-Trend', author:'Admin'}); setModalType('magazine');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 포스트 작성</button>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        {magazinePosts.map(post => (
                            <div key={post.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="h-40 bg-gray-100"><img src={post.image} className="w-full h-full object-cover" /></div>
                                <div className="p-4 flex-1">
                                    <h4 className="font-bold line-clamp-1 mb-2">{post.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={()=>{setEditingItem(post); setModalType('magazine');}} className="text-blue-500"><Edit2 size={16}/></button>
                                        <button onClick={()=>deleteItem('cms_magazine', post.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'inquiries' && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-black">문의 관리</h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">날짜</th><th className="p-4">작성자</th><th className="p-4">제목</th><th className="p-4">상태</th><th className="p-4">조작</th></tr></thead>
                            <tbody className="divide-y">
                                {inquiries.map(inq => (
                                    <tr key={inq.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-xs text-gray-400">{inq.createdAt?.seconds ? new Date(inq.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                        <td className="p-4 font-bold">{inq.userName}</td>
                                        <td className="p-4">{inq.title}</td>
                                        <td className="p-4"><StatusBadge status={inq.status} /></td>
                                        <td className="p-4"><button onClick={()=>{setEditingItem(inq); setModalType('inquiry_answer');}} className="text-blue-500 font-bold text-xs">답변하기</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'affiliates' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-black">제휴 파트너 관리</h2><button onClick={()=>{setEditingItem({name:'', code:'', commission:10, status:'active'}); setModalType('affiliate');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 파트너 추가</button></div>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">파트너명</th><th className="p-4">고유코드</th><th className="p-4">판매수</th><th className="p-4">총 매출액</th><th className="p-4">수수료율</th><th className="p-4">정산금액</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {affiliates.map(aff => (
                                    <tr key={aff.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold">{aff.name}</td>
                                        <td className="p-4 font-mono text-blue-600 font-bold">{aff.code}</td>
                                        <td className="p-4 font-bold">{aff.sales || 0}건</td>
                                        <td className="p-4">₩{(aff.totalRevenue || 0).toLocaleString()}</td>
                                        <td className="p-4">{aff.commission}%</td>
                                        <td className="p-4 font-black text-[#0070F0]">₩{Math.round((aff.totalRevenue || 0) * (aff.commission / 100)).toLocaleString()}</td>
                                        <td className="p-4 flex gap-2"><button onClick={()=>{setEditingItem(aff); setModalType('affiliate');}} className="text-gray-400 hover:text-black"><Edit2 size={16}/></button><button onClick={()=>deleteItem('affiliates', aff.id)} className="text-red-400"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-black">회원 관리</h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b font-bold text-gray-500"><tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">국적</th><th className="p-4">전화번호</th><th className="p-4">가입일</th><th className="p-4">권한</th></tr></thead>
                            <tbody className="divide-y">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold">{u.name || u.displayName}</td>
                                        <td className="p-4 text-gray-500">{u.email}</td>
                                        <td className="p-4">{u.nationality || '-'}</td>
                                        <td className="p-4 font-mono">{u.phone || '-'}</td>
                                        <td className="p-4 text-xs">{u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                        <td className="p-4"><select className={`text-xs p-1 rounded font-bold ${u.role==='admin'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-600'}`} value={u.role || 'user'} onChange={async (e) => { await updateDoc(doc(db, "users", u.id), { role: e.target.value }); showToast("권한이 변경되었습니다."); }}>
                                            <option value="user">USER</option>
                                            <option value="admin">ADMIN</option>
                                        </select></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-8 animate-fade-in max-w-2xl">
                    <h2 className="text-2xl font-black">환경 설정</h2>
                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                        <h3 className="font-bold border-b pb-2 flex items-center gap-2"><Mail size={18}/> EmailJS 알림 설정</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div><label className="block text-xs font-bold text-gray-400 mb-1">SERVICE ID</label><input className="w-full border p-2 rounded" placeholder="service_xxxx" value={settings.email_config?.serviceId || ''} onChange={e=>setSettings({...settings, email_config:{...settings.email_config, serviceId:e.target.value}})} /></div>
                            <div><label className="block text-xs font-bold text-gray-400 mb-1">TEMPLATE ID</label><input className="w-full border p-2 rounded" placeholder="template_xxxx" value={settings.email_config?.templateId || ''} onChange={e=>setSettings({...settings, email_config:{...settings.email_config, templateId:e.target.value}})} /></div>
                            <div><label className="block text-xs font-bold text-gray-400 mb-1">PUBLIC KEY</label><input className="w-full border p-2 rounded" placeholder="user_xxxx" value={settings.email_config?.publicKey || ''} onChange={e=>setSettings({...settings, email_config:{...settings.email_config, publicKey:e.target.value}})} /></div>
                        </div>
                        <button onClick={async ()=>{ await setDoc(doc(db, "settings", "email_config"), settings.email_config); showToast("이메일 설정이 저장되었습니다."); }} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">이메일 설정 저장</button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                        <h3 className="font-bold border-b pb-2 flex items-center gap-2"><DollarSign size={18}/> 결제 연동 (PortOne)</h3>
                        <div><label className="block text-xs font-bold text-gray-400 mb-1">IMP USER CODE</label><input className="w-full border p-2 rounded font-mono" placeholder="imp12345678" value={settings.payment_config?.userCode || ''} onChange={e=>setSettings({...settings, payment_config:{...settings.payment_config, userCode:e.target.value}})} /></div>
                        <button onClick={async ()=>{ await setDoc(doc(db, "settings", "payment_config"), settings.payment_config); showToast("결제 설정이 저장되었습니다."); }} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">결제 설정 저장</button>
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex gap-4 border-b pb-1">
                        <button onClick={() => setProductSubTab('categories')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'categories' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>카테고리</button>
                        <button onClick={() => setProductSubTab('items')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'items' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>일반 상품</button>
                        <button onClick={() => setProductSubTab('packages')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'packages' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>올인원 패키지</button>
                    </div>
                    {productSubTab === 'categories' && (
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={()=>{setEditingItem({label:'', labelEn:''}); setModalType('category');}} className="border-2 border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center text-gray-400 hover:bg-white transition-colors"><Plus size={32}/><span className="font-bold">카테고리 추가</span></button>
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm"><h4 className="font-bold">{cat.label}</h4><div className="flex gap-2"><button onClick={()=>{setEditingItem(cat); setModalType('category');}} className="text-gray-400 hover:text-black"><Edit2 size={16}/></button><button onClick={()=>deleteItem('cms_categories', cat.id)} className="text-red-400"><Trash2 size={16}/></button></div></div>
                            ))}
                        </div>
                    )}
                    {(productSubTab === 'items' || productSubTab === 'packages') && (
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={()=>{setEditingItem({title:'', priceMale:0, priceFemale:0, category:'건강검진'}); setModalType(productSubTab === 'items' ? 'product' : 'package');}} className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 hover:bg-white transition-all"><Plus size={32}/><span className="font-bold">신규 등록</span></button>
                            {(productSubTab === 'items' ? products : packages).map(p => (
                                <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm group">
                                    <div className="h-32 bg-gray-100 relative"><img src={p.image} className="w-full h-full object-cover"/></div>
                                    <div className="p-4"><h4 className="font-bold truncate">{p.title}</h4><div className="text-[10px] text-gray-500 mb-2">M: ₩{Number(p.priceMale||0).toLocaleString()} / F: ₩{Number(p.priceFemale||0).toLocaleString()}</div><div className="flex justify-end gap-2"><button onClick={()=>{setEditingItem(p); setModalType(productSubTab === 'items' ? 'product' : 'package');}} className="text-blue-500"><Edit2 size={16}/></button><button onClick={()=>deleteItem(productSubTab === 'items' ? 'products' : 'cms_packages', p.id)} className="text-red-500"><Trash2 size={16}/></button></div></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>

        {modalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold uppercase tracking-widest text-xs text-gray-500">{modalType} EDITOR</h3><button onClick={()=>setModalType(null)}><X size={20}/></button></div>
                    <div className="p-8 overflow-y-auto flex-1 space-y-6 no-scrollbar">
                        {modalType === 'magazine' && (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">포스트 제목</label><input className="w-full border p-2 rounded" value={editingItem.title} onChange={e=>setEditingItem({...editingItem, title:e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">요약문</label><textarea className="w-full border p-2 rounded text-xs" rows={2} value={editingItem.excerpt} onChange={e=>setEditingItem({...editingItem, excerpt:e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">대표 이미지</label><input type="file" className="text-xs" onChange={handleMainImageUpload} /></div>
                                <div><label className="block text-xs font-bold mb-2">상세 내용</label><RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} /></div>
                            </div>
                        )}
                        {modalType === 'coupon' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="block text-xs font-bold text-gray-400 mb-1">쿠폰 코드</label><input className="w-full border p-2 rounded font-mono uppercase" value={editingItem.code} onChange={e=>setEditingItem({...editingItem, code:e.target.value.toUpperCase()})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">할인 타입</label><select className="w-full border p-2 rounded" value={editingItem.type} onChange={e=>setEditingItem({...editingItem, type:e.target.value})}><option value="percent">퍼센트(%)</option><option value="fixed">정액(원)</option></select></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">할인값</label><input type="number" className="w-full border p-2 rounded" value={editingItem.value} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})} /></div>
                            </div>
                        )}
                        {modalType === 'inquiry_answer' && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg"><p className="text-xs text-gray-400 mb-1">Question by {editingItem.userName}</p><h4 className="font-bold mb-2">{editingItem.title}</h4><p className="text-sm">{editingItem.content}</p></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">답변 내용</label><textarea className="w-full border p-3 rounded-lg text-sm h-40" value={editingItem.answer || ''} onChange={e=>setEditingItem({...editingItem, answer:e.target.value})} placeholder="여기에 답변을 입력하세요." /></div>
                            </div>
                        )}
                        {modalType === 'affiliate' && (
                            <div className="grid grid-cols-1 gap-4">
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">파트너명</label><input className="w-full border p-2 rounded" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name:e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">고유코드</label><input className="w-full border p-2 rounded font-mono font-bold text-blue-600" value={editingItem.code} onChange={e=>setEditingItem({...editingItem, code:e.target.value.toUpperCase()})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">수수료율 (%)</label><input type="number" className="w-full border p-2 rounded" value={editingItem.commission} onChange={e=>setEditingItem({...editingItem, commission:Number(e.target.value)})} /></div>
                            </div>
                        )}
                        {modalType === 'category' && (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">카테고리명 (KO)</label><input className="w-full border p-2 rounded" value={editingItem.label} onChange={e=>setEditingItem({...editingItem, label:e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">Category Name (EN)</label><input className="w-full border p-2 rounded" value={editingItem.labelEn} onChange={e=>setEditingItem({...editingItem, labelEn:e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-1">대표 이미지</label><input type="file" className="text-xs" onChange={handleMainImageUpload} /></div>
                            </div>
                        )}
                        {(modalType === 'product' || modalType === 'package') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="block text-xs font-bold mb-1">명칭</label><input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold mb-1 text-blue-600">남성 가격 (KRW)</label><input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})} /></div>
                                <div><label className="block text-xs font-bold mb-1 text-pink-600">여성 가격 (KRW)</label><input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})} /></div>
                                <div className="col-span-2"><label className="block text-xs font-bold mb-1">대표 이미지</label><input type="file" className="block w-full text-xs" onChange={handleMainImageUpload} /></div>
                                <div className="col-span-2"><label className="block text-xs font-bold mb-2">상세 본문</label><RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} /></div>
                            </div>
                        )}
                        {modalType === 'reservation_detail' && (
                            <div className="space-y-6">
                                <div className="flex justify-between border-b pb-4"><div><h4 className="font-black text-lg">{editingItem.productName}</h4><p className="text-xs text-gray-400">{editingItem.date}</p></div><StatusBadge status={editingItem.status} /></div>
                                <div className="grid grid-cols-2 gap-6 text-sm">
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">예약자 정보</p><p className="font-bold">{editingItem.options?.guests?.[0]?.name}</p><p className="text-gray-500">{editingItem.options?.guestEmail}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">결제 금액</p><p className="font-black text-lg">₩{Number(editingItem.totalPrice).toLocaleString()}</p></div>
                                </div>
                                <div className="pt-4 border-t flex gap-2">
                                    <button onClick={async ()=>{ await updateDoc(doc(db, "reservations", editingItem.id), {status:'confirmed'}); showToast("예약이 확정되었습니다."); setModalType(null); }} className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold">확정 처리</button>
                                    <button onClick={async ()=>{ await updateDoc(doc(db, "reservations", editingItem.id), {status:'cancelled'}); showToast("예약이 취소되었습니다."); setModalType(null); }} className="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold">취소 처리</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                        <button onClick={()=>setModalType(null)} className="px-6 py-2 font-bold text-gray-500">취소</button>
                        <button onClick={saveItem} className="bg-[#0070F0] text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md">
                            {uploadingImg ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} 
                            {modalType === 'inquiry_answer' ? '답변 전송' : '저장'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
