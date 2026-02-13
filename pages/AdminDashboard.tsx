
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, Globe, Calendar as CalendarIcon, FileText, Monitor, Check, DollarSign, RefreshCw,
    Search, Filter, MoreHorizontal, Shield, UserX, TrendingUp, CreditCard, Lock, Copy, Eye, ExternalLink,
    AlertCircle, CheckCircle, Ban, LockKeyhole, UserCheck
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, setDoc, getDoc, onSnapshot, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { RichTextEditor } from '../components/RichTextEditor';
import { uploadImage } from '../services/imageService';
import { fetchExchangeRates } from '../services/currencyService';

// --- Interfaces ---
interface ItemType { id: string; [key: string]: any; }

// --- Components ---
const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'confirmed': 'bg-green-100 text-green-800 border-green-200',
        'completed': 'bg-gray-100 text-gray-800 border-gray-200',
        'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    const labels: any = {
        'pending': '대기중',
        'confirmed': '예약확정',
        'completed': '이용완료',
        'cancelled': '취소됨'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles['pending']}`}>
            {labels[status] || status}
        </span>
    );
};

export const AdminDashboard: React.FC<any> = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates' | 'users' | 'settings'>('dashboard');
  
  // Data States
  const [reservations, setReservations] = useState<ItemType[]>([]);
  const [products, setProducts] = useState<ItemType[]>([]); 
  const [packages, setPackages] = useState<ItemType[]>([]); 
  const [groupBuys, setGroupBuys] = useState<ItemType[]>([]);
  const [coupons, setCoupons] = useState<ItemType[]>([]);
  const [affiliates, setAffiliates] = useState<ItemType[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<ItemType[]>([]);
  const [inquiries, setInquiries] = useState<ItemType[]>([]);
  const [users, setUsers] = useState<ItemType[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  // Real-time Rates
  const [rates, setRates] = useState({ USD: 0, JPY: 0, CNY: 0 });
  
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, monthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [settingsTab, setSettingsTab] = useState<'basic'|'payment'|'seo'|'policy'>('basic');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals & UI States
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<any>(null);
  const [groupParticipants, setGroupParticipants] = useState<any[] | null>(null); 
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null);

  // --- Effects ---

  // 1. Initial Load & Auth
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
    fetchExchangeRates().then(setRates);
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Sync
  useEffect(() => {
    if (!isAdmin) return;

    const unsubs = [
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setReservations(data);
            
            const totalRev = data.reduce((acc, curr: any) => acc + (Number(curr.totalPrice) || 0), 0);
            const thisMonth = new Date().getMonth();
            const monthlyRev = data
                .filter((r: any) => r.createdAt && new Date(r.createdAt.seconds*1000).getMonth() === thisMonth)
                .reduce((acc, curr: any) => acc + (Number(curr.totalPrice) || 0), 0);

            setStats(prev => ({ ...prev, revenue: totalRev, monthlyRevenue: monthlyRev, orders: snap.size }));
        }),
        onSnapshot(collection(db, "products"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "cms_packages"), (snap) => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(query(collection(db, "group_buys"), orderBy("createdAt", "desc")), (snap) => setGroupBuys(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "coupons"), (snap) => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "affiliates"), (snap) => setAffiliates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), (snap) => setMagazinePosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), (snap) => setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStats(prev => ({ ...prev, users: snap.size }));
        }),
        onSnapshot(doc(db, "settings", "global"), (snap) => { if(snap.exists()) setSettings(snap.data()); })
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  // --- Handlers ---

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } catch (e) { alert("로그인 실패: 이메일과 비밀번호를 확인하세요."); }
  };

  const deleteItem = async (collectionName: string, id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까? (복구 불가능)")) return;
      try {
        await deleteDoc(doc(db, collectionName, id));
        showToast("성공적으로 삭제되었습니다.");
      } catch (e) { showToast("삭제 중 오류 발생", 'error'); }
  };

  const cloneProduct = async (item: any) => {
      if(!window.confirm(`'${item.title}' 상품을 복제하시겠습니까?`)) return;
      const { id, ...data } = item;
      try {
        await addDoc(collection(db, item.type === 'package' ? "cms_packages" : "products"), {
            ...data,
            title: `${data.title} (복사본)`,
            updatedAt: serverTimestamp()
        });
        showToast("상품이 복제되었습니다.");
      } catch(e) { showToast("복제 실패", 'error'); }
  };

  const handleStatusChange = async (collectionName: string, id: string, newStatus: string) => {
      try {
          await updateDoc(doc(db, collectionName, id), { status: newStatus });
          showToast("상태가 변경되었습니다.");
      } catch(e) { showToast("상태 변경 실패", 'error'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent, field: string = 'image') => {
      let file: File | null = null;
      if ('files' in e.target && e.target.files && e.target.files[0]) file = e.target.files[0];
      else if ('dataTransfer' in e && e.dataTransfer.files && e.dataTransfer.files[0]) file = e.dataTransfer.files[0];

      if (file) {
          setUploadingImg(true);
          try {
              const url = await uploadImage(file, 'admin_uploads');
              setEditingItem((prev: any) => ({ ...prev, [field]: url }));
          } catch (error) { showToast("이미지 업로드 실패", 'error'); } finally { setUploadingImg(false); }
      }
  };

  const saveProduct = async () => {
      if(!editingItem.title) return alert("상품명을 입력하세요.");
      const isPackage = editingItem.category === '올인원패키지' || editingItem.type === 'package';
      const col = isPackage ? "cms_packages" : "products";
      
      const payload = {
          ...editingItem,
          price: Number(editingItem.price) || 0,
          updatedAt: serverTimestamp()
      };

      try {
          if(editingItem.id) await updateDoc(doc(db, col, editingItem.id), payload);
          else await addDoc(collection(db, col), payload);
          setModalType(null);
          showToast("상품이 저장되었습니다.");
      } catch(e) { showToast("저장 실패", 'error'); }
  };

  const saveGeneric = async (col: string) => {
      try {
          const payload = { ...editingItem, updatedAt: serverTimestamp() };
          if(editingItem.id) await updateDoc(doc(db, col, editingItem.id), payload);
          else await addDoc(collection(db, col), payload);
          setModalType(null);
          showToast("저장되었습니다.");
      } catch(e) { showToast("저장 실패", 'error'); }
  };

  const toggleUserAdmin = async (uid: string, currentRole: string) => {
      if(!window.confirm(`관리자 권한을 ${currentRole === 'admin' ? '해제' : '부여'}하시겠습니까?`)) return;
      await updateDoc(doc(db, "users", uid), { role: currentRole === 'admin' ? 'user' : 'admin' });
      showToast("권한이 변경되었습니다.");
  };

  // --- Fixed Filtering Logic ---
  const getFilteredProducts = () => {
      // 1. Merge collections for viewing (if not strictly separated) or handle separately
      let allItems = [
          ...products.map(p => ({...p, _source: 'products'})), 
          ...packages.map(p => ({...p, _source: 'cms_packages', category: '올인원패키지', type: 'package'}))
      ];

      // 2. Apply Category Filter
      if (productCategoryFilter !== 'all') {
          allItems = allItems.filter(p => p.category === productCategoryFilter);
      }

      // 3. Apply Search Term
      if (searchTerm) {
          allItems = allItems.filter(item => 
              JSON.stringify(Object.values(item)).toLowerCase().includes(searchTerm.toLowerCase())
          );
      }

      return allItems;
  };

  const filterData = (data: any[]) => {
      if (!searchTerm) return data;
      return data.filter(item => 
          JSON.stringify(Object.values(item)).toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const openGroupParticipants = async (group: any) => {
      try {
          const snap = await getDocs(collection(db, `group_buys/${group.id}/entries`));
          setGroupParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch(e) { showToast("참여자 로딩 실패", 'error'); }
  };

  // Generate unique code for affiliates/coupons
  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FB]"><RefreshCw className="animate-spin text-blue-500 mb-2"/> <span className="text-sm font-bold text-gray-500">관리자 데이터 로딩중...</span></div>;
  
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="text-center mb-8">
                <Lock className="w-12 h-12 text-[#0070F0] mx-auto mb-4"/>
                <h2 className="text-2xl font-black text-[#111]">관리자 로그인</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-4 rounded-xl" placeholder="admin@k-experience.com"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-4 rounded-xl" placeholder="비밀번호"/>
              <button className="w-full bg-[#111] text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4">접속하기</button>
            </form>
          </div>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {/* Toast Notification */}
        {toast && (
            <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-fade-in-down flex items-center gap-2 ${toast.type==='success'?'bg-black text-white':'bg-red-500 text-white'}`}>
                {toast.type==='success'?<CheckCircle size={16}/>:<AlertCircle size={16}/>} {toast.msg}
            </div>
        )}

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="h-20 flex items-center px-8 border-b border-gray-100">
                <span className="text-2xl font-black text-[#0070F0] tracking-tighter">K-ADMIN</span>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                    { id: 'reservations', icon: ShoppingCart, label: '예약/주문 관리' },
                    { id: 'products', icon: Package, label: '상품/패키지' },
                    { id: 'groupbuys', icon: Megaphone, label: '공동구매 모니터링' },
                    { id: 'coupons', icon: Ticket, label: '쿠폰/프로모션' },
                    { id: 'magazine', icon: BookOpen, label: '매거진(블로그)' },
                    { id: 'inquiries', icon: MessageCircle, label: '1:1 문의' },
                    { id: 'users', icon: Users, label: '회원 관리' },
                    { id: 'affiliates', icon: LinkIcon, label: '제휴 파트너' },
                    { id: 'settings', icon: SettingsIcon, label: '환경 설정' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-[#0070F0] text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}>
                        <item.icon size={18} strokeWidth={2.5} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
                <button onClick={() => logoutUser()} className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-500 transition-colors flex items-center justify-center gap-2">
                    <LogOut size={14}/> 로그아웃
                </button>
            </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 ml-64 p-8 min-w-[1024px]">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8 sticky top-0 z-10 bg-[#F5F7FB]/90 backdrop-blur-sm py-4">
                <h2 className="text-2xl font-black text-[#111] capitalize">{activeTab.replace('groupbuys', 'Group Buy Monitoring')}</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="전체 데이터 검색..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium w-64 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                    <button onClick={() => window.open('/', '_blank')} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-50">
                        <Globe size={14}/> 사이트 바로가기
                    </button>
                </div>
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { l:'누적 매출액', v:`₩ ${stats.revenue.toLocaleString()}`, i:DollarSign, c:'bg-blue-50 text-blue-600' }, 
                            { l:'이번 달 매출', v:`₩ ${stats.monthlyRevenue.toLocaleString()}`, i:TrendingUp, c:'bg-green-50 text-green-600' },
                            { l:'총 예약 건수', v:`${stats.orders}건`, i:ShoppingCart, c:'bg-purple-50 text-purple-600' }, 
                            { l:'총 회원 수', v:`${stats.users}명`, i:Users, c:'bg-orange-50 text-orange-600' }
                        ].map((s,i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div><p className="text-gray-400 text-xs font-bold mb-1 uppercase">{s.l}</p><h3 className="text-2xl font-black">{s.v}</h3></div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.c}`}><s.i size={24}/></div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShoppingCart size={20}/> 최근 예약 내역</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-3">예약일</th><th className="p-3">고객명</th><th className="p-3">상품명</th><th className="p-3">상태</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {reservations.slice(0, 5).map((r: any) => (
                                    <tr key={r.id}>
                                        <td className="p-3 text-gray-500">{r.date}</td>
                                        <td className="p-3 font-bold">{r.options?.guestEmail || r.userId}</td>
                                        <td className="p-3 truncate max-w-[200px]">{r.productName}</td>
                                        <td className="p-3"><StatusBadge status={r.status}/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* RESERVATIONS TAB */}
            {activeTab === 'reservations' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-lg">전체 예약 리스트 ({reservations.length})</h3>
                        <div className="flex gap-2">
                             <button className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold hover:bg-gray-50">엑셀 다운로드</button>
                        </div>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">예약일 / 번호</th>
                                <th className="p-4">상품 정보</th>
                                <th className="p-4">예약자 / 연락처</th>
                                <th className="p-4 text-center">인원</th>
                                <th className="p-4">결제 금액</th>
                                <th className="p-4">진행 상태</th>
                                <th className="p-4">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reservations.map((r: any) => (
                                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold">{r.date}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{r.id.slice(0,8).toUpperCase()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800 line-clamp-1">{r.productName}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex gap-1">
                                            {r.options?.payment === 'deposit' && <span className="bg-yellow-100 text-yellow-700 px-1 rounded">예약금</span>}
                                            {r.options?.coupon && <span className="bg-blue-100 text-blue-700 px-1 rounded">쿠폰사용</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 font-bold">
                                            {r.options?.guestEmail || r.userId}
                                            <button onClick={() => { navigator.clipboard.writeText(r.options?.guestEmail); showToast("복사됨"); }} className="text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100"><Copy size={12}/></button>
                                        </div>
                                        {r.options?.guests?.[0]?.messengerId && <div className="text-xs text-gray-400 mt-0.5">{r.options.guests[0].messengerId}</div>}
                                    </td>
                                    <td className="p-4 text-center font-bold">{r.peopleCount}명</td>
                                    <td className="p-4 font-black">₩ {Number(r.totalPrice).toLocaleString()}</td>
                                    <td className="p-4">
                                        <select 
                                            value={r.status} 
                                            onChange={(e) => handleStatusChange("reservations", r.id, e.target.value)}
                                            className={`border-none text-xs font-bold rounded-full px-3 py-1 cursor-pointer focus:ring-2 focus:ring-blue-200 outline-none
                                                ${r.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                                  r.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                                  r.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}
                                        >
                                            <option value="pending">대기중</option>
                                            <option value="confirmed">예약확정</option>
                                            <option value="completed">이용완료</option>
                                            <option value="cancelled">취소됨</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {r.surveyAnswers ? (
                                                <button onClick={() => setViewingSurvey(r.surveyAnswers)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded" title="문진표 보기"><FileText size={16}/></button>
                                            ) : <span className="text-gray-300 p-1.5"><FileText size={16}/></span>}
                                            <button onClick={() => deleteItem("reservations", r.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="삭제"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                            {['all', '건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(cat => (
                                <button key={cat} onClick={() => setProductCategoryFilter(cat)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${productCategoryFilter === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                                    {cat === 'all' ? '전체 보기' : cat}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setEditingItem({ price: 0, category: '건강검진' }); setModalType('product'); }} className="bg-[#0070F0] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center gap-2 whitespace-nowrap">
                            <Plus size={18}/> 상품 등록
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        {getFilteredProducts().map((item: any) => (
                            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                                <div className="relative aspect-video bg-gray-100 group">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={item.title}/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon/></div>}
                                    <div className="absolute top-3 left-3 flex gap-1">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm ${item.type === 'package' ? 'bg-purple-600' : 'bg-black/80'}`}>{item.category}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                        <button onClick={() => cloneProduct(item)} className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 hover:scale-110 transition-all" title="복제"><Copy size={16}/></button>
                                        <button onClick={() => window.open(`/?mode=preview&id=${item.id}`, '_blank')} className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 hover:scale-110 transition-all" title="미리보기"><Eye size={16}/></button>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h4 className="font-bold text-[#111] mb-1 line-clamp-1">{item.title}</h4>
                                    <p className="text-gray-400 text-xs mb-4 line-clamp-2 h-8">{item.description}</p>
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <span className="font-black text-lg">₩ {Number(item.price).toLocaleString()}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingItem(item); setModalType('product'); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem(item.type==='package'?"cms_packages":"products", item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GROUP BUY MONITORING TAB */}
            {activeTab === 'groupbuys' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-orange-500 mt-0.5" size={20}/>
                        <div className="text-sm text-orange-800">
                            <strong>공동구매 관리자 가이드:</strong> 공동구매는 <u>이용자가 직접 생성</u>합니다. 관리자는 생성된 공구를 모니터링하고, 부적절한 공구를 삭제하거나 강제 종료할 수 있습니다.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterData(groupBuys).map((gb: any) => {
                             const progress = (gb.currentCount / gb.maxCount) * 100;
                             const dDay = Math.ceil((new Date(gb.visitDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                             return (
                                <div key={gb.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 transition-colors group relative">
                                    {gb.isPrivate && <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 p-1.5 rounded-full" title="비공개 공구"><LockKeyhole size={14}/></div>}
                                    
                                    <div className="flex gap-2 mb-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold text-white ${gb.productType === 'basic' ? 'bg-[#00C7AE]' : 'bg-[#FFD700]'}`}>{gb.productType === 'basic' ? 'BASIC' : 'PREMIUM'}</span>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${dDay > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>{dDay > 0 ? `D-${dDay}` : '마감됨'}</span>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg mb-1 truncate pr-8">{gb.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                        <span className="flex items-center gap-1"><UserCheck size={12}/> 리더: {gb.leaderName || 'Unknown'}</span>
                                        <span>|</span>
                                        <span className="flex items-center gap-1"><CalendarIcon size={12}/> {gb.visitDate}</span>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-gray-500">{gb.currentCount} / {gb.maxCount}명</span>
                                            <span className="text-red-500">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all" style={{width: `${progress}%`}}></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button onClick={() => openGroupParticipants(gb)} className="py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50">참여자 조회</button>
                                        <button onClick={() => deleteItem("group_buys", gb.id)} className="py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1"><Ban size={12}/> 강제 종료</button>
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
            )}

            {/* COUPONS TAB - FULLY IMPLEMENTED */}
            {activeTab === 'coupons' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">발행된 쿠폰 목록</h3>
                        <button onClick={() => { setEditingItem({ type: 'percent', value: 10, maxUsage: 100, code: generateCode() }); setModalType('coupon'); }} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"><Plus size={16}/> 쿠폰 생성</button>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">쿠폰명</th><th className="p-4">코드</th><th className="p-4">혜택</th><th className="p-4">사용현황</th><th className="p-4">만료일</th><th className="p-4">관리</th></tr></thead>
                            <tbody>
                                {coupons.map(c => (
                                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-bold">{c.name}</td>
                                        <td className="p-4 font-mono bg-gray-50 text-blue-600 rounded px-2 w-fit">{c.code}</td>
                                        <td className="p-4 font-bold text-green-600">{c.type === 'percent' ? `${c.value}% 할인` : `₩${c.value.toLocaleString()} 할인`}</td>
                                        <td className="p-4 text-xs">{c.currentUsage || 0} / {c.maxUsage}회</td>
                                        <td className="p-4 text-gray-500">{c.expiryDate}</td>
                                        <td className="p-4"><button onClick={() => deleteItem("coupons", c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                                {coupons.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">발행된 쿠폰이 없습니다.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AFFILIATES TAB - FULLY IMPLEMENTED */}
            {activeTab === 'affiliates' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">제휴 파트너 관리</h3>
                        <button onClick={() => { setEditingItem({ commissionRate: 10, code: generateCode(), clicks: 0, sales: 0 }); setModalType('affiliate'); }} className="bg-[#0070F0] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"><Plus size={16}/> 파트너 등록</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {affiliates.map(aff => (
                            <div key={aff.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><LinkIcon size={64}/></div>
                                <h4 className="font-bold text-lg mb-1">{aff.name}</h4>
                                <div className="text-xs font-mono text-gray-400 mb-4 bg-gray-50 inline-block px-2 py-1 rounded">CODE: {aff.code}</div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 p-3 rounded-xl">
                                        <span className="text-xs text-blue-500 font-bold block">유입(클릭)</span>
                                        <span className="text-xl font-black text-blue-700">{aff.clicks || 0}</span>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl">
                                        <span className="text-xs text-green-500 font-bold block">판매발생</span>
                                        <span className="text-xl font-black text-green-700">{aff.sales || 0}건</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-500 pt-4 border-t border-gray-100">
                                    <span>수수료율: {aff.commissionRate}%</span>
                                    <button onClick={() => deleteItem("affiliates", aff.id)} className="text-red-500 hover:underline">계약해지</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SETTINGS - FULLY IMPLEMENTED */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                    <div className="flex border-b border-gray-200">
                        {['basic', 'payment', 'seo', 'policy'].map(tab => (
                            <button key={tab} onClick={() => setSettingsTab(tab as any)} className={`flex-1 py-5 font-bold text-sm transition-colors ${settingsTab === tab ? 'bg-gray-50 text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-500 hover:bg-gray-50'}`}>
                                {tab === 'basic' ? '기본 설정' : tab === 'payment' ? '결제/PG 설정' : tab === 'seo' ? 'SEO/메타태그' : '이용약관 관리'}
                            </button>
                        ))}
                    </div>
                    <div className="p-10 max-w-3xl">
                        {settingsTab === 'basic' && (
                            <div className="space-y-6">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">사이트 이름</label><input className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white transition-colors" value={settings.siteTitle||''} onChange={e=>setSettings({...settings, siteTitle:e.target.value})}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">관리자 이메일 (알림 수신)</label><input className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white transition-colors" value={settings.adminEmail||''} onChange={e=>setSettings({...settings, adminEmail:e.target.value})}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">고객센터 연락처</label><input className="w-full border p-3 rounded-xl bg-gray-50 focus:bg-white transition-colors" value={settings.contactPhone||''} onChange={e=>setSettings({...settings, contactPhone:e.target.value})}/></div>
                            </div>
                        )}
                        {settingsTab === 'payment' && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4"><strong>Tip:</strong> 포트원(구 아임포트) 관리자 콘솔에서 발급받은 식별코드를 입력하세요.</div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">가맹점 식별코드 (User Code)</label><input className="w-full border p-3 rounded-xl font-mono" placeholder="imp00000000" value={settings.impCode||''} onChange={e=>setSettings({...settings, impCode:e.target.value})}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">PG사 선택</label><select className="w-full border p-3 rounded-xl" value={settings.pgProvider||'html5_inicis'} onChange={e=>setSettings({...settings, pgProvider:e.target.value})}><option value="html5_inicis">KG이니시스</option><option value="kakaopay">카카오페이</option><option value="tosspayments">토스페이먼츠</option><option value="paypal">페이팔 (해외)</option></select></div>
                            </div>
                        )}
                        {settingsTab === 'seo' && (
                            <div className="space-y-6">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">메타 타이틀 (Title)</label><input className="w-full border p-3 rounded-xl" value={settings.metaTitle||''} onChange={e=>setSettings({...settings, metaTitle:e.target.value})}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">메타 설명 (Description)</label><textarea className="w-full border p-3 rounded-xl h-24" value={settings.metaDesc||''} onChange={e=>setSettings({...settings, metaDesc:e.target.value})}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">대표 키워드</label><input className="w-full border p-3 rounded-xl" placeholder="K-POP, 한국여행, 건강검진..." value={settings.keywords||''} onChange={e=>setSettings({...settings, keywords:e.target.value})}/></div>
                            </div>
                        )}
                        {settingsTab === 'policy' && (
                            <div className="space-y-6">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">이용약관</label><textarea className="w-full border p-3 rounded-xl h-40 font-mono text-xs" value={settings.terms||''} onChange={e=>setSettings({...settings, terms:e.target.value})}/></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">개인정보처리방침</label><textarea className="w-full border p-3 rounded-xl h-40 font-mono text-xs" value={settings.privacy||''} onChange={e=>setSettings({...settings, privacy:e.target.value})}/></div>
                            </div>
                        )}
                        <div className="mt-10 pt-6 border-t border-gray-100 text-right">
                            <button onClick={async () => { await setDoc(doc(db, "settings", "global"), settings); showToast("설정이 저장되었습니다."); }} className="bg-[#111] text-white px-10 py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all">변경사항 저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other tabs follow same pattern... (Magazine, etc.) */}
            {activeTab === 'magazine' && (
                <div className="space-y-6 animate-fade-in-up">
                     <div className="flex justify-end"><button onClick={()=>{setEditingItem({}); setModalType('magazine');}} className="bg-[#0070F0] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"><Plus size={18}/> 포스트 작성</button></div>
                     <div className="grid grid-cols-1 gap-4">{magazinePosts.map(p => (
                         <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 hover:shadow-md transition-all group">
                             <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">{p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <ImageIcon className="m-auto mt-8 text-gray-300"/>}</div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-lg mb-1">{p.title}</h4>
                                 <p className="text-gray-500 text-sm line-clamp-2">{p.excerpt}</p>
                             </div>
                             <div className="flex flex-col gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={()=>{setEditingItem(p); setModalType('magazine');}} className="p-2 bg-gray-100 rounded text-blue-600"><Edit2 size={16}/></button>
                                 <button onClick={()=>deleteItem("cms_magazine", p.id)} className="p-2 bg-gray-100 rounded text-red-600"><Trash2 size={16}/></button>
                             </div>
                         </div>
                     ))}</div>
                </div>
            )}
        </main>

        {/* MODALS */}
        {modalType && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-black text-xl text-[#111]">
                            {modalType === 'product' ? '상품 정보 수정' : 
                             modalType === 'coupon' ? '쿠폰 발행' : 
                             modalType === 'affiliate' ? '파트너 등록' : '콘텐츠 작성'}
                        </h3>
                        <button onClick={()=>setModalType(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto flex-1 bg-white space-y-8">
                        {modalType === 'product' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 md:col-span-1">
                                     <label className="block text-sm font-bold text-gray-700 mb-2">대표 이미지</label>
                                     <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors relative overflow-hidden group">
                                        {editingItem.image ? <img src={editingItem.image} className="w-full h-full object-cover absolute inset-0"/> : <div className="text-gray-400 text-center"><ImageIcon size={32} className="mx-auto mb-2"/><span className="text-xs">클릭하여 업로드</span></div>}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload(e)}/>
                                        {uploadingImg && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500"/></div>}
                                     </div>
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-6">
                                    <div><label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label><select className="w-full border p-3 rounded-xl bg-white" value={editingItem.category || '건강검진'} onChange={e => setEditingItem({...editingItem, category: e.target.value, type: e.target.value==='올인원패키지'?'package':'product'})}>{['건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-2">상품명</label><input className="w-full border p-3 rounded-xl" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/></div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">가격 (KRW)</label>
                                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₩</span><input type="number" className="w-full border p-3 pl-8 rounded-xl font-mono font-bold" value={editingItem.price||0} onChange={e=>setEditingItem({...editingItem, price:Number(e.target.value)||0})}/></div>
                                        <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">≈ ${((editingItem.price||0)*rates.USD).toFixed(2)} USD</div>
                                    </div>
                                </div>
                                <div className="col-span-2"><label className="block text-sm font-bold text-gray-700 mb-2">상세 페이지 디자인 (에디터)</label><RichTextEditor value={editingItem.content||''} onChange={h=>setEditingItem({...editingItem, content:h})}/></div>
                            </div>
                        )}
                        {modalType === 'magazine' && (
                            <div className="space-y-4">
                                <input className="w-full border p-4 rounded-xl text-lg font-bold" placeholder="제목을 입력하세요" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/>
                                <div className="flex gap-4">
                                    <div className="w-32 h-24 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0 border-2 border-dashed border-gray-200 hover:border-blue-400">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e)}/>
                                        {editingItem.image ? <img src={editingItem.image} className="w-full h-full object-cover"/> : <ImageIcon className="m-auto mt-8 text-gray-300"/>}
                                    </div>
                                    <textarea className="flex-1 border p-3 rounded-xl resize-none" placeholder="요약글 (리스트 노출용)" value={editingItem.excerpt||''} onChange={e=>setEditingItem({...editingItem, excerpt:e.target.value})}/>
                                </div>
                                <RichTextEditor value={editingItem.content||''} onChange={h=>setEditingItem({...editingItem, content:h})}/>
                            </div>
                        )}
                        {modalType === 'coupon' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-bold block mb-2">쿠폰명</label><input className="w-full border p-3 rounded-xl" value={editingItem.name||''} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/></div>
                                    <div><label className="font-bold block mb-2">코드 (자동생성)</label><input className="w-full border p-3 rounded-xl bg-gray-50" value={editingItem.code} readOnly/></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-bold block mb-2">할인 타입</label><select className="w-full border p-3 rounded-xl" value={editingItem.type} onChange={e=>setEditingItem({...editingItem, type:e.target.value})}><option value="percent">퍼센트(%)</option><option value="fixed">정액(원)</option></select></div>
                                    <div><label className="font-bold block mb-2">할인값</label><input type="number" className="w-full border p-3 rounded-xl" value={editingItem.value} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})}/></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-bold block mb-2">만료일</label><input type="date" className="w-full border p-3 rounded-xl" value={editingItem.expiryDate||''} onChange={e=>setEditingItem({...editingItem, expiryDate:e.target.value})}/></div>
                                    <div><label className="font-bold block mb-2">발행 수량 제한</label><input type="number" className="w-full border p-3 rounded-xl" value={editingItem.maxUsage} onChange={e=>setEditingItem({...editingItem, maxUsage:Number(e.target.value)})}/></div>
                                </div>
                            </div>
                        )}
                        {modalType === 'affiliate' && (
                            <div className="space-y-4">
                                <div><label className="font-bold block mb-2">파트너 이름/업체명</label><input className="w-full border p-3 rounded-xl" value={editingItem.name||''} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-bold block mb-2">파트너 코드</label><input className="w-full border p-3 rounded-xl bg-gray-50" value={editingItem.code} readOnly/></div>
                                    <div><label className="font-bold block mb-2">수수료율 (%)</label><input type="number" className="w-full border p-3 rounded-xl" value={editingItem.commissionRate} onChange={e=>setEditingItem({...editingItem, commissionRate:Number(e.target.value)})}/></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                        <button onClick={()=>setModalType(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                        <button onClick={modalType === 'product' ? saveProduct : () => saveGeneric(modalType === 'coupon' ? 'coupons' : modalType === 'affiliate' ? 'affiliates' : 'cms_magazine')} className="bg-[#111] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg">저장하기</button>
                    </div>
                </div>
            </div>
        )}

        {/* SURVEY MODAL */}
        {viewingSurvey && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                     <div className="p-5 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold">사전 문진표 답변</h3><button onClick={()=>setViewingSurvey(null)}><X/></button></div>
                     <div className="p-6 overflow-y-auto space-y-4">
                        {Object.entries(viewingSurvey).map(([k,v]:any) => (
                            <div key={k} className="border-b pb-4 last:border-0">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">{k}</h4>
                                {typeof v === 'string' && v.startsWith('http') ? <a href={v} target="_blank" rel="noreferrer"><img src={v} className="h-32 rounded border"/></a> : <p className="font-medium text-gray-800">{v}</p>}
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        )}

        {/* PARTICIPANTS MODAL */}
        {groupParticipants && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                     <div className="p-5 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold">공동구매 참여자 목록</h3><button onClick={()=>setGroupParticipants(null)}><X/></button></div>
                     <div className="p-6 overflow-y-auto space-y-2">
                        {groupParticipants.length === 0 ? <p className="text-gray-500 text-center">참여자가 없습니다.</p> :
                        groupParticipants.map((p:any, i) => (
                            <div key={i} className="border-b pb-2 last:border-0 flex justify-between">
                                <span className="font-bold">{p.userId || 'Unknown User'}</span>
                                <span className="text-xs text-gray-400">{p.joinedAt?.seconds ? new Date(p.joinedAt.seconds*1000).toLocaleDateString() : ''}</span>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};
