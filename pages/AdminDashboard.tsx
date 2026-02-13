
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, Globe, Calendar as CalendarIcon, FileText, Monitor, Check, DollarSign, RefreshCw
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { useGlobal } from '../contexts/GlobalContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { uploadImage } from '../services/imageService';

// --- Type Definitions ---
interface ItemType { id: string; [key: string]: any; }

const RATES = { USD: 0.00075, JPY: 0.11, CNY: 0.0054 }; // 환율 상수 (실제 앱에선 API 연동 가능)

export const AdminDashboard: React.FC<any> = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates' | 'users' | 'settings'>('dashboard');
  
  // Data States
  const [reservations, setReservations] = useState<ItemType[]>([]);
  const [products, setProducts] = useState<ItemType[]>([]); // General Products
  const [packages, setPackages] = useState<ItemType[]>([]); // Packages
  const [groupBuys, setGroupBuys] = useState<ItemType[]>([]);
  const [coupons, setCoupons] = useState<ItemType[]>([]);
  const [affiliates, setAffiliates] = useState<ItemType[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<ItemType[]>([]);
  const [inquiries, setInquiries] = useState<ItemType[]>([]);
  const [users, setUsers] = useState<ItemType[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  // Filter States for Product Management
  // Categories: 'all', 'health', 'beauty', 'idol', 'consulting', 'package'
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<any>(null);

  // Check Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          if (user.email === "admin@k-experience.com") setIsAdmin(true);
          else {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              if (userDoc.exists() && userDoc.data().role === 'admin') setIsAdmin(true);
          }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Data Realtime
  useEffect(() => {
    if (!isAdmin) return;

    const unsubs = [
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            const totalRev = snap.docs.reduce((acc, curr) => acc + (Number(curr.data().totalPrice) || 0), 0);
            setStats(prev => ({ ...prev, revenue: totalRev, orders: snap.size }));
        }),
        onSnapshot(collection(db, "products"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "cms_packages"), (snap) => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(query(collection(db, "group_buys"), orderBy("visitDate", "asc")), (snap) => setGroupBuys(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "coupons"), (snap) => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "affiliates"), (snap) => setAffiliates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), (snap) => setMagazinePosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), (snap) => setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)))),
        onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStats(prev => ({ ...prev, users: snap.size }));
        }),
        onSnapshot(doc(db, "settings", "global"), (snap) => {
            if (snap.exists()) setSettings(snap.data());
        })
    ];

    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } catch (e) { alert("로그인 실패"); }
  };

  const deleteItem = async (collectionName: string, id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까? 복구할 수 없습니다.")) return;
      await deleteDoc(doc(db, collectionName, id));
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
          } catch (error) {
              alert("이미지 업로드 오류");
          } finally {
              setUploadingImg(false);
          }
      }
  };

  // --- SAVE HANDLERS ---
  const saveProductOrPackage = async () => {
      if(!editingItem.title) return alert("상품명을 입력해주세요.");
      
      const isPackage = editingItem.category === '올인원패키지' || editingItem.type === 'package';
      // If category is '올인원패키지', ensure type is package
      const finalType = isPackage ? 'package' : 'product';
      const colName = isPackage ? "cms_packages" : "products";
      
      const data = { 
          ...editingItem, 
          type: finalType,
          price: Number(editingItem.price),
          updatedAt: serverTimestamp() 
      };

      try {
          if(editingItem.id) {
             await updateDoc(doc(db, colName, editingItem.id), data);
          } else {
             await addDoc(collection(db, colName), data);
          }
          setModalType(null);
          alert("저장되었습니다.");
      } catch (e) {
          console.error(e);
          alert("저장 중 오류 발생");
      }
  };

  // Generic Save Handlers
  const saveGeneric = async (col: string, data: any) => {
      try {
          const payload = { ...data, updatedAt: serverTimestamp() };
          if(data.id) await updateDoc(doc(db, col, data.id), payload);
          else await addDoc(collection(db, col), payload);
          setModalType(null);
          alert("저장되었습니다.");
      } catch(e) { alert("오류 발생"); }
  };

  const saveInquiryAnswer = async () => { 
      if(!editingItem.answer) return; 
      await updateDoc(doc(db, "inquiries", editingItem.id), { answer: editingItem.answer, answeredAt: serverTimestamp(), status: 'answered' }); 
      setModalType(null); 
  };
  
  const saveSettings = async () => { 
      await setDoc(doc(db, "settings", "global"), { ...settings, updatedAt: serverTimestamp() }); 
      alert("설정이 저장되었습니다."); 
  };

  // --- Filtering Logic ---
  const getFilteredItems = () => {
      if (productCategoryFilter === 'all') return [...products, ...packages];
      if (productCategoryFilter === '올인원패키지') return packages;
      return products.filter(p => p.category === productCategoryFilter || (productCategoryFilter === 'K-IDOL' && p.category.includes('IDOL')));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500 mr-2"/> 로딩중...</div>;
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
              <h2 className="text-2xl font-bold mb-6 text-center">관리자 로그인</h2>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full mb-4 border p-2 rounded" placeholder="이메일"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full mb-6 border p-2 rounded" placeholder="비밀번호"/>
              <button className="w-full bg-[#0070F0] text-white py-3 rounded font-bold hover:bg-blue-600 transition">로그인</button>
          </form>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        {/* SIDEBAR */}
        <aside className="w-64 bg-[#1a1a1a] text-white flex-shrink-0 flex flex-col h-screen overflow-y-auto">
            <div className="h-16 flex items-center px-6 font-bold text-lg border-b border-gray-800 tracking-wider">K-EXPERIENCE</div>
            <nav className="flex-1 py-6 px-3 space-y-1">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                    { id: 'products', icon: Package, label: '상품/패키지 관리' },
                    { id: 'reservations', icon: ShoppingCart, label: '예약/주문 관리' },
                    { id: 'groupbuys', icon: Megaphone, label: '공동구매(핫딜)' },
                    { id: 'coupons', icon: Ticket, label: '쿠폰 관리' },
                    { id: 'magazine', icon: BookOpen, label: '매거진(블로그)' },
                    { id: 'affiliates', icon: LinkIcon, label: '제휴 파트너' },
                    { id: 'inquiries', icon: MessageCircle, label: '1:1 문의' },
                    { id: 'users', icon: Users, label: '회원 관리' },
                    { id: 'settings', icon: SettingsIcon, label: '환경 설정' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-[#0070F0] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button onClick={() => logoutUser()} className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors flex items-center justify-center gap-2">
                    <LogOut size={16}/> 로그아웃
                </button>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-16 bg-white border-b flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="bg-gray-100 p-1.5 rounded text-gray-600">
                        {activeTab === 'dashboard' && <LayoutDashboard size={18}/>}
                        {activeTab === 'products' && <Package size={18}/>}
                        {activeTab === 'reservations' && <ShoppingCart size={18}/>}
                        {activeTab === 'groupbuys' && <Megaphone size={18}/>}
                    </span>
                    {activeTab === 'groupbuys' ? '공동구매 관리' : activeTab.toUpperCase()}
                </h2>
                <button onClick={() => window.open('/', '_blank')} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-bold transition-colors flex items-center gap-2">
                    <Globe size={16}/> 쇼핑몰 바로가기
                </button>
            </header>

            <div className="flex-1 overflow-auto p-8 bg-[#F4F6F8]">
                
                {/* --- DASHBOARD --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">총 매출액</h3>
                                <p className="text-3xl font-black text-[#111]">₩ {stats.revenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">총 예약 건수</h3>
                                <p className="text-3xl font-black text-[#111]">{stats.orders}건</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">회원 수</h3>
                                <p className="text-3xl font-black text-[#111]">{stats.users}명</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">운영 상품</h3>
                                <p className="text-3xl font-black text-[#111]">{products.length + packages.length}개</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PRODUCTS (Categorized) --- */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                             <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                                {['all', '건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setProductCategoryFilter(cat)} 
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${productCategoryFilter === cat ? 'bg-[#111] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {cat === 'all' ? '전체' : cat}
                                    </button>
                                ))}
                             </div>
                             <button onClick={() => { setEditingItem({ price: 0, category: productCategoryFilter === 'all' ? '건강검진' : productCategoryFilter }); setModalType('product'); }} className="bg-[#0070F0] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center gap-2 flex-shrink-0">
                                 <Plus size={18}/> 상품 등록
                             </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                             {getFilteredItems().map((item: any) => (
                                 <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-lg transition-all relative">
                                     <div className="relative aspect-video bg-gray-100">
                                         {item.image ? (
                                             <img src={item.image} className="w-full h-full object-cover" alt={item.title}/>
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={32}/></div>
                                         )}
                                         <span className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-bold text-white ${item.type === 'package' || item.category === '올인원패키지' ? 'bg-purple-500' : 'bg-black'}`}>
                                             {item.category}
                                         </span>
                                     </div>
                                     <div className="p-4">
                                         <h4 className="font-bold text-[#111] mb-1 line-clamp-1 text-sm">{item.title}</h4>
                                         <p className="text-gray-500 text-xs mb-3 line-clamp-2 min-h-[32px]">{item.description}</p>
                                         <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                             <span className="font-black text-md">₩ {Number(item.price).toLocaleString()}</span>
                                             <div className="flex gap-1">
                                                 <button onClick={() => { setEditingItem(item); setModalType('product'); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Edit2 size={14}/></button>
                                                 <button onClick={() => deleteItem(item.type === 'package' ? "cms_packages" : "products", item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={14}/></button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                {/* --- RESERVATIONS --- */}
                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-lg">전체 예약 현황</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">예약일</th><th className="p-4">방문일</th><th className="p-4">상품명</th><th className="p-4">고객명 (이메일)</th><th className="p-4">인원</th><th className="p-4">결제금액</th><th className="p-4">설문</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
                                <tbody>
                                    {reservations.map(res => (
                                        <tr key={res.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 text-gray-500">{res.createdAt ? new Date(res.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                            <td className="p-4 font-bold text-blue-600">{res.date}</td>
                                            <td className="p-4 font-bold">{res.productName}</td>
                                            <td className="p-4">{res.options?.guestEmail || res.userId}</td>
                                            <td className="p-4 text-center">{res.peopleCount}명</td>
                                            <td className="p-4 font-bold">₩ {Number(res.totalPrice).toLocaleString()}</td>
                                            <td className="p-4">{res.surveyAnswers ? <button onClick={() => setViewingSurvey(res.surveyAnswers)} className="text-blue-600 underline text-xs">보기</button> : '-'}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${res.status==='confirmed'?'bg-green-100 text-green-700': res.status==='cancelled'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{res.status}</span></td>
                                            <td className="p-4">
                                                <select 
                                                    value={res.status} 
                                                    onChange={(e) => updateDoc(doc(db, "reservations", res.id), { status: e.target.value })}
                                                    className="border rounded px-2 py-1 text-xs"
                                                >
                                                    <option value="pending">대기</option>
                                                    <option value="confirmed">확정</option>
                                                    <option value="cancelled">취소</option>
                                                    <option value="completed">완료</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- GROUP BUYING (HOT DEAL) --- */}
                {activeTab === 'groupbuys' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">진행중인 공동구매</h3>
                            <button onClick={() => { setEditingItem({ productType: 'basic', maxCount: 10, currentCount: 0 }); setModalType('groupbuy'); }} className="bg-[#FF6B6B] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-red-200 hover:bg-[#ff5252] transition-all flex items-center gap-2">
                                <Plus size={18}/> 핫딜 생성
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupBuys.map(gb => (
                                <div key={gb.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group hover:border-[#FF6B6B] transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold text-white ${gb.productType === 'basic' ? 'bg-[#00C7AE]' : 'bg-[#FFD700]'}`}>{gb.productType === 'basic' ? 'BASIC' : 'PREMIUM'}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingItem(gb); setModalType('groupbuy'); }} className="text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem("group_buys", gb.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-lg mb-1">{gb.title}</h4>
                                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-1"><CalendarIcon size={14}/> 방문일: {gb.visitDate}</p>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs text-gray-400 line-through">₩ {Number(gb.originalPrice || 0).toLocaleString()}</span>
                                        <span className="font-black text-lg text-[#FF6B6B]">₩ {Number(gb.discountedPrice || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- COUPONS --- */}
                {activeTab === 'coupons' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">쿠폰 발급 현황</h3>
                            <button onClick={() => { setEditingItem({ type: 'percent', isActive: true, maxUsage: 100 }); setModalType('coupon'); }} className="bg-[#111] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2">
                                <Ticket size={18}/> 쿠폰 생성
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">쿠폰코드</th><th className="p-4">할인혜택</th><th className="p-4">사용현황 (사용/전체)</th><th className="p-4">만료일</th><th className="p-4">상태</th><th className="p-4">삭제</th></tr></thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-bold font-mono text-blue-600">{c.code}</td>
                                            <td className="p-4 font-bold">{Number(c.value).toLocaleString()}{c.type === 'percent' ? '%' : '원'} 할인</td>
                                            <td className="p-4">{c.currentUsage || 0} / {c.maxUsage}</td>
                                            <td className="p-4 text-gray-500">{c.expiryDate || '무제한'}</td>
                                            <td className="p-4">{c.isActive ? <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">활성</span> : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">비활성</span>}</td>
                                            <td className="p-4"><button onClick={()=>deleteItem("coupons", c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- MAGAZINE --- */}
                {activeTab === 'magazine' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">매거진 관리</h3>
                            <button onClick={() => { setEditingItem({}); setModalType('magazine'); }} className="bg-[#0070F0] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center gap-2">
                                <Plus size={18}/> 포스트 작성
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {magazinePosts.map(post => (
                                <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 group">
                                    <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {post.image ? <img src={post.image} className="w-full h-full object-cover" alt="thumb" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon/></div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg mb-1">{post.title}</h4>
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mr-2">{post.category}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingItem(post); setModalType('magazine'); }} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-full"><Edit2 size={16}/></button>
                                                <button onClick={() => deleteItem("cms_magazine", post.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-full"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm mt-2 line-clamp-1">{post.excerpt}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- AFFILIATES --- */}
                {activeTab === 'affiliates' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">제휴 파트너 관리</h3>
                            <button onClick={() => { setEditingItem({ commission: 10 }); setModalType('affiliate'); }} className="bg-[#111] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2">
                                <LinkIcon size={18}/> 파트너 등록
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">파트너명</th><th className="p-4">코드</th><th className="p-4">유입(클릭)</th><th className="p-4">판매발생</th><th className="p-4">수수료율</th><th className="p-4">관리</th></tr></thead>
                                <tbody>
                                    {affiliates.map(aff => (
                                        <tr key={aff.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-bold">{aff.name}</td>
                                            <td className="p-4 font-mono text-blue-600">{aff.code}</td>
                                            <td className="p-4">{aff.clicks || 0}</td>
                                            <td className="p-4">{aff.sales || 0}건</td>
                                            <td className="p-4">{aff.commission}%</td>
                                            <td className="p-4"><button onClick={()=>deleteItem("affiliates", aff.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- INQUIRIES --- */}
                {activeTab === 'inquiries' && (
                    <div className="space-y-6">
                         <h3 className="font-bold text-lg">1:1 문의 관리</h3>
                         <div className="grid grid-cols-1 gap-4">
                            {inquiries.map(inq => (
                                <div key={inq.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between mb-4">
                                        <div>
                                            <h4 className="font-bold text-[#111] flex items-center gap-2">
                                                {inq.title}
                                                <span className={`text-[10px] px-2 py-1 rounded font-bold ${inq.status==='answered'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inq.status === 'answered' ? '답변완료' : '대기중'}</span>
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1">작성자: {inq.userName} ({inq.userId}) | {inq.createdAt ? new Date(inq.createdAt.seconds*1000).toLocaleString() : ''}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 mb-4 whitespace-pre-wrap">
                                        {inq.content}
                                    </div>
                                    {inq.status === 'answered' ? (
                                        <div className="pl-4 border-l-4 border-blue-500">
                                            <p className="text-xs font-bold text-blue-600 mb-1">관리자 답변</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inq.answer}</p>
                                            <div className="mt-2 text-right"><button onClick={() => { setEditingItem(inq); setModalType('inquiry'); }} className="text-xs text-gray-400 underline">답변 수정</button></div>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setEditingItem(inq); setModalType('inquiry'); }} className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">답변하기</button>
                                    )}
                                </div>
                            ))}
                         </div>
                    </div>
                )}

                {/* --- USERS --- */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-lg">가입 회원 목록 ({users.length}명)</h3></div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">전화번호</th><th className="p-4">국적</th><th className="p-4">가입일</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-bold">{u.name}</td>
                                        <td className="p-4">{u.email}</td>
                                        <td className="p-4">{u.phone}</td>
                                        <td className="p-4">{u.nationality}</td>
                                        <td className="p-4 text-gray-400">{u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- SETTINGS --- */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-6 border-b pb-4">사이트 기본 설정</h3>
                        <div className="space-y-6">
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">사이트 타이틀</label><input type="text" value={settings.siteTitle || ''} onChange={e => setSettings({...settings, siteTitle: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3"/></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">대표 연락처</label><input type="text" value={settings.contactPhone || ''} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3"/></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">관리자 이메일</label><input type="email" value={settings.adminEmail || ''} onChange={e => setSettings({...settings, adminEmail: e.target.value})} className="w-full border border-gray-300 rounded-lg p-3"/></div>
                            <div className="pt-4"><button onClick={saveSettings} className="bg-[#111] text-white px-8 py-3 rounded-lg font-bold hover:bg-black transition-colors w-full">설정 저장하기</button></div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {modalType && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in-up">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-[#111]">
                                {modalType === 'product' ? '상품 등록/수정' : 
                                 modalType === 'groupbuy' ? '공동구매 설정' : 
                                 modalType === 'coupon' ? '쿠폰 생성' : 
                                 modalType === 'affiliate' ? '파트너 등록' : '작성/수정'}
                            </h3>
                            <button onClick={()=>setModalType(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white">
                            
                            {/* PRODUCT EDITOR */}
                            {modalType === 'product' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리 분류</label>
                                            <select 
                                                className="w-full border border-gray-300 p-3 rounded-lg"
                                                value={editingItem.category || '건강검진'} 
                                                onChange={e => setEditingItem({...editingItem, category: e.target.value, type: e.target.value === '올인원패키지' ? 'package' : 'product'})}
                                            >
                                                {['건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        {/* Drag & Drop Thumbnail Area */}
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">대표 이미지 (썸네일)</label>
                                            <div 
                                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors relative overflow-hidden"
                                                onDragOver={e => e.preventDefault()}
                                                onDrop={e => { e.preventDefault(); handleImageUpload(e, 'image'); }}
                                            >
                                                {editingItem.image ? (
                                                    <img src={editingItem.image} className="w-full h-full object-cover absolute inset-0" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="text-gray-300 mb-2" size={32}/>
                                                        <span className="text-xs text-gray-400 font-bold">이미지를 드래그하거나 클릭하세요</span>
                                                    </>
                                                )}
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} />
                                                {uploadingImg && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500"/></div>}
                                            </div>
                                        </div>

                                        <div className="col-span-2 md:col-span-1 space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">상품명</label>
                                                <input className="w-full border border-gray-300 p-3 rounded-lg" placeholder="상품명 입력" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">가격 설정 (KRW)</label>
                                                <input type="number" className="w-full border border-gray-300 p-3 rounded-lg font-mono font-bold" value={editingItem.price||0} onChange={e=>setEditingItem({...editingItem, price:Number(e.target.value)})} />
                                                
                                                {/* Live Currency Converter */}
                                                <div className="mt-2 bg-blue-50 p-3 rounded-lg text-xs space-y-1">
                                                    <div className="font-bold text-blue-800 mb-1 flex items-center gap-1"><Monitor size={12}/> 실시간 예상 가격</div>
                                                    <div className="flex justify-between"><span>USD ($)</span><span className="font-mono">{((editingItem.price||0) * RATES.USD).toLocaleString(undefined, {style:'currency', currency:'USD'})}</span></div>
                                                    <div className="flex justify-between"><span>JPY (¥)</span><span className="font-mono">{((editingItem.price||0) * RATES.JPY).toLocaleString(undefined, {style:'currency', currency:'JPY'})}</span></div>
                                                    <div className="flex justify-between"><span>CNY (¥)</span><span className="font-mono">{((editingItem.price||0) * RATES.CNY).toLocaleString(undefined, {style:'currency', currency:'CNY'})}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Package Theme Color */}
                                        {editingItem.category === '올인원패키지' && (
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-sm font-bold text-gray-700 mb-1">테마 컬러</label>
                                                <select className="w-full border border-gray-300 p-3 rounded-lg" value={editingItem.theme||'mint'} onChange={e=>setEditingItem({...editingItem, theme:e.target.value})}>
                                                    <option value="mint">민트 (Basic)</option>
                                                    <option value="yellow">옐로우 (Premium)</option>
                                                    <option value="orange">오렌지 (VIP)</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">간단 설명 (리스트 노출용)</label>
                                            <textarea className="w-full border border-gray-300 p-3 rounded-lg h-20 resize-none" value={editingItem.description||''} onChange={e=>setEditingItem({...editingItem, description:e.target.value})} />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">상세 페이지 내용 (이미지/텍스트)</label>
                                            {/* RichTextEditor populated with existing content */}
                                            <RichTextEditor value={editingItem.content || ''} onChange={(html)=>setEditingItem({...editingItem, content: html})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* COUPON EDITOR */}
                            {modalType === 'coupon' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">쿠폰 코드</label>
                                        <input className="w-full border border-gray-300 p-3 rounded-lg uppercase font-mono" placeholder="예: SUMMER2026" value={editingItem.code||''} onChange={e=>setEditingItem({...editingItem, code:e.target.value.toUpperCase()})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">할인 방식</label>
                                        <select className="w-full border border-gray-300 p-3 rounded-lg" value={editingItem.type||'percent'} onChange={e=>setEditingItem({...editingItem, type:e.target.value})}>
                                            <option value="percent">퍼센트 (%)</option>
                                            <option value="fixed">정액 (원)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">할인 값</label>
                                        <input type="number" className="w-full border border-gray-300 p-3 rounded-lg" value={editingItem.value||0} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">최대 발행 매수</label>
                                        <input type="number" className="w-full border border-gray-300 p-3 rounded-lg" value={editingItem.maxUsage||100} onChange={e=>setEditingItem({...editingItem, maxUsage:Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">만료일</label>
                                        <input type="date" className="w-full border border-gray-300 p-3 rounded-lg" value={editingItem.expiryDate||''} onChange={e=>setEditingItem({...editingItem, expiryDate:e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={editingItem.isActive||false} onChange={e=>setEditingItem({...editingItem, isActive:e.target.checked})} className="w-5 h-5 accent-blue-600"/>
                                            <span className="font-bold">쿠폰 활성화</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* AFFILIATE EDITOR */}
                            {modalType === 'affiliate' && (
                                <div className="grid grid-cols-1 gap-6">
                                    <div><label className="block font-bold mb-1">파트너/업체명</label><input className="w-full border p-3 rounded" value={editingItem.name||''} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/></div>
                                    <div><label className="block font-bold mb-1">파트너 코드 (유니크)</label><input className="w-full border p-3 rounded" value={editingItem.code||''} onChange={e=>setEditingItem({...editingItem, code:e.target.value})}/></div>
                                    <div><label className="block font-bold mb-1">수수료율 (%)</label><input type="number" className="w-full border p-3 rounded" value={editingItem.commission||10} onChange={e=>setEditingItem({...editingItem, commission:Number(e.target.value)})}/></div>
                                </div>
                            )}

                            {/* GROUP BUY EDITOR */}
                            {modalType === 'groupbuy' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2"><label className="block font-bold mb-1">제목</label><input className="w-full border p-3 rounded" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/></div>
                                    <div><label className="block font-bold mb-1">방문일</label><input type="date" className="w-full border p-3 rounded" value={editingItem.visitDate||''} onChange={e=>setEditingItem({...editingItem, visitDate:e.target.value})}/></div>
                                    <div><label className="block font-bold mb-1">목표 인원</label><input type="number" className="w-full border p-3 rounded" value={editingItem.maxCount||5} onChange={e=>setEditingItem({...editingItem, maxCount:Number(e.target.value)})}/></div>
                                    <div><label className="block font-bold mb-1">정상가</label><input type="number" className="w-full border p-3 rounded" value={editingItem.originalPrice||0} onChange={e=>setEditingItem({...editingItem, originalPrice:Number(e.target.value)})}/></div>
                                    <div><label className="block font-bold mb-1">할인가</label><input type="number" className="w-full border p-3 rounded font-bold text-red-500" value={editingItem.discountedPrice||0} onChange={e=>setEditingItem({...editingItem, discountedPrice:Number(e.target.value)})}/></div>
                                </div>
                            )}

                            {/* MAGAZINE EDITOR */}
                            {modalType === 'magazine' && (
                                <div className="space-y-4">
                                    <div><label className="block font-bold mb-1">제목</label><input className="w-full border p-3 rounded" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/></div>
                                    <div><label className="block font-bold mb-1">요약</label><input className="w-full border p-3 rounded" value={editingItem.excerpt||''} onChange={e=>setEditingItem({...editingItem, excerpt:e.target.value})}/></div>
                                    <div><label className="block font-bold mb-1">대표 이미지</label><input type="file" onChange={e => handleImageUpload(e, 'image')}/></div>
                                    <div><label className="block font-bold mb-1">본문</label><RichTextEditor value={editingItem.content||''} onChange={(h)=>setEditingItem({...editingItem, content:h})}/></div>
                                </div>
                            )}

                            {/* INQUIRY ANSWER */}
                            {modalType === 'inquiry' && (
                                <textarea className="w-full border p-4 h-40 rounded" placeholder="답변 내용..." value={editingItem.answer||''} onChange={e=>setEditingItem({...editingItem, answer:e.target.value})}/>
                            )}
                        </div>
                        
                        <div className="p-5 border-t bg-gray-50 text-right flex justify-end gap-3">
                            <button onClick={()=>setModalType(null)} className="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                            <button 
                                onClick={
                                    modalType === 'product' ? saveProductOrPackage : 
                                    modalType === 'groupbuy' ? () => saveGeneric('group_buys', editingItem) :
                                    modalType === 'coupon' ? () => saveGeneric('coupons', editingItem) :
                                    modalType === 'affiliate' ? () => saveGeneric('affiliates', editingItem) :
                                    modalType === 'magazine' ? () => saveGeneric('cms_magazine', editingItem) :
                                    modalType === 'inquiry' ? saveInquiryAnswer :
                                    saveSettings
                                } 
                                className="bg-[#111] text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg"
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SURVEY VIEW MODAL */}
            {viewingSurvey && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-[#111] flex items-center gap-2"><FileText size={20}/> 사전 문진표 답변</h3>
                            <button onClick={()=>setViewingSurvey(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-4">
                            {Object.entries(viewingSurvey).map(([key, value]) => (
                                <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">{key}</h4>
                                    {typeof value === 'string' && value.startsWith('http') ? (
                                        <a href={value} target="_blank" rel="noreferrer"><img src={value} alt="Answer" className="max-w-full h-32 object-cover rounded-lg border border-gray-200" /></a>
                                    ) : (
                                        <p className="text-sm font-medium text-[#111] whitespace-pre-wrap">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 text-right">
                            <button onClick={()=>setViewingSurvey(null)} className="bg-black text-white px-6 py-2 rounded-lg font-bold text-sm">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};
