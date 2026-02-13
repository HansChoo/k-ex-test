
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, Globe, Calendar as CalendarIcon, FileText, Monitor, Check, DollarSign, RefreshCw,
    Search, Filter, MoreHorizontal, Shield, UserX, TrendingUp, CreditCard, Lock
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, setDoc, getDoc, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { RichTextEditor } from '../components/RichTextEditor';
import { uploadImage } from '../services/imageService';
import { fetchExchangeRates } from '../services/currencyService';

// --- Interfaces ---
interface ItemType { id: string; [key: string]: any; }

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
  
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [settingsTab, setSettingsTab] = useState<'basic'|'payment'|'seo'|'policy'>('basic');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<any>(null);
  const [groupParticipants, setGroupParticipants] = useState<any[] | null>(null); // For Group Buy details

  // 1. Initial Load & Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          // Check Admin Role
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (user.email === "admin@k-experience.com" || (userDoc.exists() && userDoc.data().role === 'admin')) {
              setIsAdmin(true);
          }
      }
      setLoading(false);
    });
    // Fetch Rates
    fetchExchangeRates().then(setRates);
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Sync (Only if Admin)
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
        onSnapshot(doc(db, "settings", "global"), (snap) => { if(snap.exists()) setSettings(snap.data()); })
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } catch (e) { alert("로그인 실패"); }
  };

  const deleteItem = async (collectionName: string, id: string) => {
      if(!window.confirm("삭제하시겠습니까? (복구 불가)")) return;
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
          } catch (error) { alert("업로드 실패"); } finally { setUploadingImg(false); }
      }
  };

  // --- Logic Fix: Product Filtering ---
  const getFilteredProducts = () => {
      const allItems = [...products, ...packages];
      if (productCategoryFilter === 'all') return allItems;
      return allItems.filter(item => {
          if (productCategoryFilter === '올인원패키지') return item.type === 'package';
          return item.category === productCategoryFilter;
      });
  };

  // --- Logic Fix: Save Product with Number Type ---
  const saveProduct = async () => {
      if(!editingItem.title) return alert("상품명을 입력하세요.");
      const isPackage = editingItem.category === '올인원패키지' || editingItem.type === 'package';
      const col = isPackage ? "cms_packages" : "products";
      
      const payload = {
          ...editingItem,
          price: Number(editingItem.price) || 0, // Force Number
          updatedAt: serverTimestamp()
      };

      try {
          if(editingItem.id) await updateDoc(doc(db, col, editingItem.id), payload);
          else await addDoc(collection(db, col), payload);
          setModalType(null);
      } catch(e) { alert("저장 실패"); }
  };

  // --- Logic: User Role Management ---
  const toggleUserAdmin = async (uid: string, currentRole: string) => {
      if(!window.confirm(`관리자 권한을 ${currentRole === 'admin' ? '해제' : '부여'}하시겠습니까?`)) return;
      await updateDoc(doc(db, "users", uid), { role: currentRole === 'admin' ? 'user' : 'admin' });
  };

  // --- Logic: Group Buy Participants ---
  const openGroupParticipants = async (group: any) => {
      // Find reservations linked to this group (Assuming reservation stores groupId or productName matches)
      // For this demo, we mock fetching reservations that match the group buy title or ID
      // In a real app, `reservations` should have a `groupBuyId` field.
      const participants = reservations.filter(r => r.productName.includes(group.title));
      setGroupParticipants(participants);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin mr-2"/> Loading Admin...</div>;
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl w-96">
              <h2 className="text-2xl font-black mb-6 text-center text-[#111]">관리자 접속</h2>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full mb-4 border p-3 rounded-lg" placeholder="admin@k-experience.com"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full mb-6 border p-3 rounded-lg" placeholder="Password"/>
              <button className="w-full bg-[#111] text-white py-3 rounded-lg font-bold hover:bg-black transition">Login</button>
          </form>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-20">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0] tracking-tighter">K-ADMIN</div>
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                    { id: 'products', icon: Package, label: '상품/패키지 관리' },
                    { id: 'reservations', icon: ShoppingCart, label: '예약/주문 관리' },
                    { id: 'groupbuys', icon: Megaphone, label: '공동구매 관리' },
                    { id: 'coupons', icon: Ticket, label: '쿠폰 관리' },
                    { id: 'magazine', icon: BookOpen, label: '매거진(블로그)' },
                    { id: 'affiliates', icon: LinkIcon, label: '제휴 파트너' },
                    { id: 'inquiries', icon: MessageCircle, label: '1:1 문의' },
                    { id: 'users', icon: Users, label: '회원 관리' },
                    { id: 'settings', icon: SettingsIcon, label: '환경 설정' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-[#0070F0] text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
                <button onClick={() => logoutUser()} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-600 transition-colors flex items-center justify-center gap-2">
                    <LogOut size={16}/> 로그아웃
                </button>
            </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 ml-64 p-8 min-w-[1000px]">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#111]">{activeTab === 'groupbuys' ? '공동구매 현황' : activeTab.toUpperCase()}</h2>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2">
                        <RefreshCw size={12} className="text-green-500"/>
                        USD {rates.USD} / JPY {rates.JPY}
                    </div>
                    <button onClick={() => window.open('/', '_blank')} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Globe size={14}/> 사이트 바로가기
                    </button>
                </div>
            </div>

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-4 gap-6">
                    {[{l:'총 매출', v:`₩ ${stats.revenue.toLocaleString()}`, i:DollarSign}, {l:'총 예약', v:`${stats.orders}건`, i:ShoppingCart}, {l:'회원수', v:`${stats.users}명`, i:Users}, {l:'운영 상품', v:`${products.length+packages.length}개`, i:Package}].map((s,i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div><p className="text-gray-400 text-xs font-bold mb-1">{s.l}</p><h3 className="text-2xl font-black">{s.v}</h3></div>
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#0070F0]"><s.i size={20}/></div>
                        </div>
                    ))}
                </div>
            )}

            {/* PRODUCT MANAGEMENT */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex justify-between">
                        <div className="flex gap-1">
                            {['all', '건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(cat => (
                                <button key={cat} onClick={() => setProductCategoryFilter(cat)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${productCategoryFilter === cat ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {cat === 'all' ? '전체' : cat}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setEditingItem({ price: 0, category: '건강검진' }); setModalType('product'); }} className="bg-[#0070F0] text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> 상품 등록</button>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        {getFilteredProducts().map((item: any) => (
                            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                                <div className="relative aspect-video bg-gray-100">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon/></div>}
                                    <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">{item.category}</span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-[#111] mb-1 truncate">{item.title}</h4>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                        <span className="font-black text-lg">₩ {item.price?.toLocaleString()}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingItem(item); setModalType('product'); }} className="text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem(item.type==='package'?"cms_packages":"products", item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GROUP BUY DASHBOARD (Refined) */}
            {activeTab === 'groupbuys' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {groupBuys.map(gb => {
                            const progress = (gb.currentCount / gb.maxCount) * 100;
                            const revenue = gb.currentCount * (gb.discountedPrice || 0);
                            return (
                                <div key={gb.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${gb.productType === 'basic' ? 'bg-[#00C7AE]' : 'bg-[#FFD700]'}`}>{gb.productType.toUpperCase()}</span>
                                            <span className="text-xs text-gray-400 font-bold">{gb.visitDate} 방문예정</span>
                                        </div>
                                        <h3 className="text-lg font-black text-[#111] mb-2">{gb.title}</h3>
                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <span>리더: <strong>{gb.leaderName || '익명'}</strong></span>
                                            <span>예상매출: <strong>₩ {revenue.toLocaleString()}</strong></span>
                                            <span>할인율: <strong className="text-red-500">{(100 - (gb.discountedPrice/gb.originalPrice)*100).toFixed(0)}%</strong></span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-64 px-6 border-l border-r border-gray-100">
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span>모집 현황</span>
                                            <span className="text-[#0070F0]">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div className="bg-[#0070F0] h-full" style={{width: `${progress}%`}}></div>
                                        </div>
                                        <p className="text-xs text-center mt-2 text-gray-500">{gb.currentCount} / {gb.maxCount} 명</p>
                                    </div>

                                    <div className="pl-6 flex flex-col gap-2">
                                        <button onClick={() => openGroupParticipants(gb)} className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800">참여자 관리</button>
                                        <button onClick={() => deleteItem("group_buys", gb.id)} className="px-4 py-2 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50">강제 종료</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* USERS MANAGEMENT (Refined) */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">전화번호</th><th className="p-4">권한</th><th className="p-4">관리</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold">{u.name}</td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4">{u.phone || '-'}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role === 'admin' ? '관리자' : '일반회원'}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => toggleUserAdmin(u.id, u.role)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold">{u.role==='admin' ? '권한해제' : '관리자지정'}</button>
                                        <button onClick={() => deleteItem("users", u.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 font-bold">삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SETTINGS (Advanced) */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {['basic', 'payment', 'seo', 'policy'].map(tab => (
                            <button key={tab} onClick={() => setSettingsTab(tab as any)} className={`flex-1 py-4 font-bold text-sm ${settingsTab === tab ? 'bg-gray-50 text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-500'}`}>
                                {tab === 'basic' ? '기본 설정' : tab === 'payment' ? '결제/PG 설정' : tab === 'seo' ? 'SEO/메타' : '약관 관리'}
                            </button>
                        ))}
                    </div>
                    <div className="p-8 max-w-2xl">
                        {settingsTab === 'basic' && (
                            <div className="space-y-6">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">사이트 이름</label><input className="w-full border p-3 rounded-lg" value={settings.siteTitle||''} onChange={e=>setSettings({...settings, siteTitle:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">관리자 이메일</label><input className="w-full border p-3 rounded-lg" value={settings.adminEmail||''} onChange={e=>setSettings({...settings, adminEmail:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">고객센터 번호</label><input className="w-full border p-3 rounded-lg" value={settings.contactPhone||''} onChange={e=>setSettings({...settings, contactPhone:e.target.value})}/></div>
                            </div>
                        )}
                        {settingsTab === 'payment' && (
                            <div className="space-y-6">
                                <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-700 font-bold mb-4">⚠️ API Key는 보안에 유의하세요.</div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">PortOne 가맹점 식별코드</label><input className="w-full border p-3 rounded-lg font-mono" value={settings.impCode||''} onChange={e=>setSettings({...settings, impCode:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">PG사 설정</label><select className="w-full border p-3 rounded-lg"><option>KG이니시스</option><option>토스페이먼츠</option><option>카카오페이</option></select></div>
                            </div>
                        )}
                        {settingsTab === 'seo' && (
                            <div className="space-y-6">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Meta Description</label><textarea className="w-full border p-3 rounded-lg h-24" value={settings.metaDesc||''} onChange={e=>setSettings({...settings, metaDesc:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">Keywords</label><input className="w-full border p-3 rounded-lg" placeholder="k-pop, medical tour, korea..." value={settings.keywords||''} onChange={e=>setSettings({...settings, keywords:e.target.value})}/></div>
                            </div>
                        )}
                        <div className="mt-8 pt-6 border-t border-gray-100 text-right">
                            <button onClick={async () => { await setDoc(doc(db, "settings", "global"), settings); alert("저장됨"); }} className="bg-[#111] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-gray-800">변경사항 저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other tabs (Reservations, Magazine, etc.) remain similar but cleaner */}
            {activeTab === 'reservations' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">날짜</th><th className="p-4">상품</th><th className="p-4">예약자</th><th className="p-4">금액</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
                        <tbody>{reservations.map(r => (<tr key={r.id} className="border-b"><td className="p-4">{r.date}</td><td className="p-4 font-bold">{r.productName}</td><td className="p-4">{r.options?.guestEmail}</td><td className="p-4">₩{Number(r.totalPrice).toLocaleString()}</td><td className="p-4">{r.status}</td><td className="p-4"><button className="text-blue-600 font-bold">상세</button></td></tr>))}</tbody>
                    </table>
                </div>
            )}
            {activeTab === 'magazine' && (
                <div className="space-y-4">
                    <div className="flex justify-end"><button onClick={()=>{setEditingItem({}); setModalType('magazine');}} className="bg-black text-white px-4 py-2 rounded-lg font-bold">포스트 작성</button></div>
                    <div className="grid grid-cols-1 gap-4">{magazinePosts.map(p => (<div key={p.id} className="bg-white p-4 rounded-xl border flex justify-between"><div><h4 className="font-bold">{p.title}</h4><p className="text-sm text-gray-500">{p.category}</p></div><button onClick={()=>deleteItem("cms_magazine", p.id)} className="text-red-500">삭제</button></div>))}</div>
                </div>
            )}
        </main>

        {/* MODALS */}
        {modalType && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg">{modalType.toUpperCase()}</h3>
                        <button onClick={()=>setModalType(null)}><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 bg-white">
                        {modalType === 'product' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">카테고리 (필수)</label>
                                        <select className="w-full border p-3 rounded-lg font-bold" value={editingItem.category || '건강검진'} onChange={e => setEditingItem({...editingItem, category: e.target.value, type: e.target.value==='올인원패키지'?'package':'product'})}>
                                            {['건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(c=><option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">상품명</label><input className="w-full border p-3 rounded-lg" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">가격 (KRW, 숫자만 입력)</label>
                                        <input type="number" className="w-full border p-3 rounded-lg font-mono font-bold" value={editingItem.price||0} onChange={e=>setEditingItem({...editingItem, price:Number(e.target.value)||0})} placeholder="0"/>
                                        <div className="mt-2 bg-blue-50 p-2 rounded text-xs text-blue-700 font-mono">
                                            ≈ ${((editingItem.price||0)*rates.USD).toFixed(2)} / ¥{((editingItem.price||0)*rates.JPY).toFixed(0)}
                                        </div>
                                    </div>
                                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">상세설명</label><RichTextEditor value={editingItem.content||''} onChange={h=>setEditingItem({...editingItem, content:h})}/></div>
                                </div>
                            </div>
                        )}
                        {modalType === 'magazine' && (
                            <div className="space-y-4">
                                <input className="w-full border p-3 rounded-lg font-bold text-lg" placeholder="제목을 입력하세요" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/>
                                <input className="w-full border p-3 rounded-lg" placeholder="요약글" value={editingItem.excerpt||''} onChange={e=>setEditingItem({...editingItem, excerpt:e.target.value})}/>
                                <label className="block p-4 border-2 border-dashed rounded-lg text-center cursor-pointer text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
                                    <ImageIcon className="mx-auto mb-2"/> 대표 이미지 업로드
                                    <input type="file" className="hidden" onChange={handleImageUpload}/>
                                </label>
                                <RichTextEditor value={editingItem.content||''} onChange={h=>setEditingItem({...editingItem, content:h})}/>
                            </div>
                        )}
                    </div>
                    <div className="p-5 border-t bg-gray-50 text-right">
                        <button onClick={modalType === 'product' ? saveProduct : () => { /* Magazine Save logic */ }} className="bg-black text-white px-8 py-3 rounded-lg font-bold">저장하기</button>
                    </div>
                </div>
            </div>
        )}

        {/* GROUP PARTICIPANTS MODAL */}
        {groupParticipants && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Users size={20}/> 참여자 목록</h3>
                        <button onClick={()=>setGroupParticipants(null)}><X/></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {groupParticipants.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">아직 참여자가 없습니다.</p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-500"><tr><th className="p-3">이름 (이메일)</th><th className="p-3">예약일</th><th className="p-3">상태</th><th className="p-3">문진표</th></tr></thead>
                                <tbody>
                                    {groupParticipants.map((p, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-3 font-bold">{p.options?.guestEmail || p.userId}</td>
                                            <td className="p-3">{p.createdAt ? new Date(p.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                            <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{p.status}</span></td>
                                            <td className="p-3">
                                                {p.surveyAnswers ? <span className="text-blue-600 font-bold text-xs flex items-center gap-1"><Check size={12}/> 제출완료</span> : <span className="text-gray-400 text-xs">미제출</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
