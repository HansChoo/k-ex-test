import React, { useEffect, useState, useMemo } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, Globe, CheckCircle, AlertCircle, RefreshCw, DollarSign, Search, Copy
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, setDoc, getDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { RichTextEditor } from '../components/RichTextEditor';
import { uploadImage } from '../services/imageService';
import { fetchExchangeRates } from '../services/currencyService';

// --- Components ---
const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-green-100 text-green-800',
        'completed': 'bg-gray-100 text-gray-800',
        'cancelled': 'bg-red-100 text-red-800',
        'waiting': 'bg-orange-100 text-orange-800',
        'answered': 'bg-blue-100 text-blue-800'
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
            {status.toUpperCase()}
        </span>
    );
};

export const AdminDashboard: React.FC<any> = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates' | 'users' | 'settings'>('dashboard');
  
  // Data States
  const [reservations, setReservations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [packages, setPackages] = useState<any[]>([]); 
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<any>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  
  // Settings Sub-tabs
  const [settingsTab, setSettingsTab] = useState<'basic'|'payment'|'email'|'receipt'|'survey'>('basic');

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI States
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'}|null>(null);

  // Images for Editor
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // --- Effects ---
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

  useEffect(() => {
    if (!isAdmin) return;

    // Real-time listeners
    const unsubs = [
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (s) => setReservations(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "products"), (s) => setProducts(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "cms_packages"), (s) => setPackages(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(query(collection(db, "group_buys"), orderBy("createdAt", "desc")), (s) => setGroupBuys(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "coupons"), (s) => setCoupons(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "affiliates"), (s) => setAffiliates(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), (s) => setMagazinePosts(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), (s) => setInquiries(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({id:d.id, ...d.data()})))),
        onSnapshot(collection(db, "settings"), (s) => {
            const temp: any = {};
            s.docs.forEach(d => temp[d.id] = d.data());
            setSettings(temp);
        })
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  // --- Logic Helpers ---

  const parsePrice = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return Number(val.replace(/[^0-9]/g, '')) || 0;
      return 0;
  };

  const allProducts = useMemo(() => {
      const p = products.map(item => ({ ...item, type: 'product', _coll: 'products', price: parsePrice(item.price || item.priceVal) }));
      const pkg = packages.map(item => ({ ...item, type: 'package', category: '올인원패키지', _coll: 'cms_packages', price: parsePrice(item.price) }));
      return [...p, ...pkg];
  }, [products, packages]);

  const filteredProducts = useMemo(() => {
      let data = allProducts;
      // Filter by Category
      if (productCategoryFilter !== 'all') {
          data = data.filter(p => {
              if (!p.category) return false;
              // Check if category includes keyword (e.g. 'K-IDOL' matches 'K-IDOL Premium')
              return p.category.includes(productCategoryFilter);
          });
      }
      return data;
  }, [allProducts, productCategoryFilter]);

  // Statistics Calculation
  const stats = useMemo(() => {
      const revenue = reservations.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
      return {
          revenue,
          orders: reservations.length,
          users: users.length
      };
  }, [reservations, users]);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } 
      catch (e) { alert("로그인 실패"); }
  };

  const cleanupDuplicates = async () => {
      if (!window.confirm("중복된 상품을 정리하시겠습니까? (이름이 같은 상품은 하나만 남기고 삭제됩니다)")) return;
      
      const batch = writeBatch(db);
      const seenTitles = new Set();
      let deleteCount = 0;

      // Process Products
      products.forEach(p => {
          if (seenTitles.has(p.title)) {
              batch.delete(doc(db, "products", p.id));
              deleteCount++;
          } else {
              seenTitles.add(p.title);
          }
      });
      // Process Packages
      const seenPkg = new Set();
      packages.forEach(p => {
          if (seenPkg.has(p.title)) {
              batch.delete(doc(db, "cms_packages", p.id));
              deleteCount++;
          } else {
              seenPkg.add(p.title);
          }
      });

      if (deleteCount > 0) {
          await batch.commit();
          showToast(`${deleteCount}개의 중복 상품을 삭제했습니다.`);
      } else {
          showToast("중복된 상품이 없습니다.");
      }
  };

  const deleteItem = async (col: string, id: string) => {
      if(!window.confirm("삭제하시겠습니까?")) return;
      await deleteDoc(doc(db, col, id));
      showToast("삭제되었습니다.");
  };

  const saveItem = async () => {
      let col = "";
      if (modalType === 'magazine') col = "cms_magazine";
      else if (modalType === 'product') {
          col = (editingItem.category === '올인원패키지' || editingItem.type === 'package') ? "cms_packages" : "products";
      } else if (modalType === 'coupon') col = "coupons";
      else if (modalType === 'affiliate') col = "affiliates";

      const payload = { ...editingItem };
      if (modalType === 'product' || modalType === 'magazine') {
          payload.images = galleryImages;
          payload.price = parsePrice(editingItem.price);
      }
      
      // Remove internal fields
      delete payload._coll;
      delete payload.type;

      try {
          if (editingItem.id) await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
          else await addDoc(collection(db, col), { ...payload, createdAt: serverTimestamp() });
          
          setModalType(null);
          showToast("저장되었습니다.");
      } catch(e) { showToast("저장 실패", 'error'); }
  };

  const saveSettings = async (docId: string, data: any) => {
      await setDoc(doc(db, "settings", docId), data, { merge: true });
      showToast("설정이 저장되었습니다.");
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setUploadingImg(true);
          const url = await uploadImage(e.target.files[0], 'main_images');
          setEditingItem((prev: any) => ({ ...prev, image: url }));
          setUploadingImg(false);
      }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setUploadingImg(true);
          const newUrls = [];
          for (let i = 0; i < Math.min(e.target.files.length, 10 - galleryImages.length); i++) {
              const url = await uploadImage(e.target.files[i], 'gallery_images');
              newUrls.push(url);
          }
          setGalleryImages([...galleryImages, ...newUrls]);
          setUploadingImg(false);
      }
  };

  const replyToInquiry = async (id: string) => {
      const answer = prompt("답변 내용을 입력하세요:");
      if (!answer) return;
      await updateDoc(doc(db, "inquiries", id), {
          answer,
          status: 'answered',
          answeredAt: serverTimestamp()
      });
      showToast("답변이 등록되었습니다.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500"/></div>;
  
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
              <h2 className="text-2xl font-bold mb-6">관리자 로그인</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                  <input className="w-full border p-3 rounded" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
                  <input className="w-full border p-3 rounded" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
                  <button className="w-full bg-black text-white py-3 rounded font-bold">로그인</button>
              </form>
          </div>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold flex items-center gap-2 ${toast.type==='success'?'bg-black':'bg-red-500'}`}>{toast.type==='success'?<CheckCircle size={16}/>:<AlertCircle size={16}/>} {toast.msg}</div>}

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0]">K-ADMIN</div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                    {id:'dashboard', label:'대시보드', icon:LayoutDashboard},
                    {id:'reservations', label:'예약 관리', icon:ShoppingCart},
                    {id:'products', label:'상품/패키지', icon:Package},
                    {id:'groupbuys', label:'공동구매', icon:Megaphone},
                    {id:'coupons', label:'쿠폰 관리', icon:Ticket},
                    {id:'magazine', label:'매거진', icon:BookOpen},
                    {id:'inquiries', label:'1:1 문의', icon:MessageCircle},
                    {id:'users', label:'회원 관리', icon:Users},
                    {id:'affiliates', label:'제휴 파트너', icon:LinkIcon},
                    {id:'settings', label:'환경 설정', icon:SettingsIcon},
                ].map(item => (
                    <button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold ${activeTab===item.id ? 'bg-[#0070F0] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <item.icon size={18}/> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t"><button onClick={logoutUser} className="flex items-center gap-2 text-gray-500 font-bold text-sm"><LogOut size={16}/> 로그아웃</button></div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-64 p-8 min-w-[1000px]">
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black">대시보드</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold mb-2">총 매출</h3>
                            <p className="text-2xl font-black">₩ {stats.revenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold mb-2">예약 건수</h3>
                            <p className="text-2xl font-black">{stats.orders}건</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold mb-2">회원 수</h3>
                            <p className="text-2xl font-black">{stats.users}명</p>
                        </div>
                    </div>
                </div>
            )}

            {/* RESERVATIONS (Simple Table) */}
            {activeTab === 'reservations' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black mb-4">예약 관리</h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 font-bold border-b">
                                <tr><th className="p-4">날짜</th><th className="p-4">상품명</th><th className="p-4">예약자</th><th className="p-4">인원</th><th className="p-4">금액</th><th className="p-4">상태</th><th className="p-4">관리</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {reservations.map(r => (
                                    <tr key={r.id}>
                                        <td className="p-4">{r.date}</td>
                                        <td className="p-4">{r.productName}</td>
                                        <td className="p-4">{r.options?.guestEmail || r.userId}</td>
                                        <td className="p-4">{r.peopleCount}명</td>
                                        <td className="p-4 font-bold">₩ {Number(r.totalPrice).toLocaleString()}</td>
                                        <td className="p-4"><StatusBadge status={r.status}/></td>
                                        <td className="p-4">
                                            <button onClick={()=>deleteItem('reservations', r.id)} className="text-red-500"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">상품/패키지 관리</h2>
                        <div className="flex gap-2">
                             <button onClick={cleanupDuplicates} className="bg-red-50 text-red-600 px-4 py-2 rounded font-bold text-xs flex items-center gap-2"><Trash2 size={14}/> 중복 제거</button>
                             <button onClick={()=>{setEditingItem({category:'건강검진', price:0}); setGalleryImages([]); setModalType('product');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Plus size={16}/> 상품 등록</button>
                        </div>
                    </div>
                    {/* Category Filter */}
                    <div className="flex gap-2 mb-4">
                        {['all', '건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(cat => (
                            <button key={cat} onClick={()=>setProductCategoryFilter(cat)} className={`px-3 py-1 rounded border text-xs font-bold ${productCategoryFilter===cat?'bg-black text-white':'bg-white text-gray-600'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm group">
                                <div className="h-40 bg-gray-100 relative">
                                    <img src={p.image} className="w-full h-full object-cover"/>
                                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-bold">{p.category}</span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold truncate mb-1">{p.title}</h4>
                                    <p className="text-gray-500 text-xs mb-3 truncate">{p.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">₩ {p.price.toLocaleString()}</span>
                                        <div className="flex gap-2">
                                            <button onClick={()=>{setEditingItem(p); setGalleryImages(p.images||[]); setModalType('product');}} className="text-blue-500"><Edit2 size={16}/></button>
                                            <button onClick={()=>deleteItem(p._coll, p.id)} className="text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GROUP BUYS (Reverted to Table) */}
            {activeTab === 'groupbuys' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black">공동구매 관리</h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-4">제목</th><th className="p-4">날짜</th><th className="p-4">참여현황</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {groupBuys.map(g => (
                                    <tr key={g.id}>
                                        <td className="p-4 font-bold">{g.title}</td>
                                        <td className="p-4">{g.visitDate}</td>
                                        <td className="p-4">{g.currentCount} / {g.maxCount}명</td>
                                        <td className="p-4"><button onClick={()=>deleteItem('group_buys', g.id)} className="text-red-500 bg-red-50 px-3 py-1 rounded text-xs font-bold">삭제</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* COUPONS (Reverted to Table) */}
            {activeTab === 'coupons' && (
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <h2 className="text-2xl font-black">쿠폰 관리</h2>
                        <button onClick={()=>{setEditingItem({type:'percent', value:10, maxUsage:100}); setModalType('coupon');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 쿠폰 발행</button>
                    </div>
                    <div className="bg-white rounded-xl border shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">쿠폰명</th><th className="p-4">코드</th><th className="p-4">할인</th><th className="p-4">사용량</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {coupons.map(c => (
                                    <tr key={c.id}>
                                        <td className="p-4">{c.name}</td>
                                        <td className="p-4 font-mono font-bold text-blue-600">{c.code}</td>
                                        <td className="p-4">{c.type==='percent' ? `${c.value}%` : `₩${c.value}`}</td>
                                        <td className="p-4">{c.currentUsage||0} / {c.maxUsage}</td>
                                        <td className="p-4"><button onClick={()=>deleteItem('coupons', c.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AFFILIATES (Reverted to Table) */}
            {activeTab === 'affiliates' && (
                <div className="space-y-4">
                     <div className="flex justify-between">
                        <h2 className="text-2xl font-black">제휴 파트너</h2>
                        <button onClick={()=>{setEditingItem({commissionRate:10}); setModalType('affiliate');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 파트너 추가</button>
                    </div>
                    <div className="bg-white rounded-xl border shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">파트너명</th><th className="p-4">코드</th><th className="p-4">유입/매출</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {affiliates.map(a => (
                                    <tr key={a.id}>
                                        <td className="p-4 font-bold">{a.name}</td>
                                        <td className="p-4 font-mono">{a.code}</td>
                                        <td className="p-4">Click: {a.clicks||0} / Sales: {a.sales||0}</td>
                                        <td className="p-4"><button onClick={()=>deleteItem('affiliates', a.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MAGAZINE */}
            {activeTab === 'magazine' && (
                <div className="space-y-4">
                     <div className="flex justify-between">
                        <h2 className="text-2xl font-black">매거진 관리</h2>
                        <button onClick={()=>{setEditingItem({category:'K-Trend'}); setGalleryImages([]); setModalType('magazine');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 포스트 작성</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {magazinePosts.map(p => (
                             <div key={p.id} className="bg-white p-4 rounded-xl border flex gap-4 items-center">
                                 <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden"><img src={p.image} className="w-full h-full object-cover"/></div>
                                 <div className="flex-1">
                                     <h4 className="font-bold">{p.title}</h4>
                                     <p className="text-xs text-gray-500 line-clamp-1">{p.excerpt}</p>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={()=>{setEditingItem(p); setGalleryImages(p.images||[]); setModalType('magazine');}} className="text-blue-500"><Edit2 size={16}/></button>
                                     <button onClick={()=>deleteItem('cms_magazine', p.id)} className="text-red-500"><Trash2 size={16}/></button>
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {/* INQUIRIES */}
            {activeTab === 'inquiries' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black">1:1 문의</h2>
                    <div className="bg-white rounded-xl border shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">상태</th><th className="p-4">제목</th><th className="p-4">작성자</th><th className="p-4">날짜</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {inquiries.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-400">문의 내역이 없습니다.</td></tr> : inquiries.map(q => (
                                    <tr key={q.id}>
                                        <td className="p-4"><StatusBadge status={q.status}/></td>
                                        <td className="p-4 font-bold">{q.title}</td>
                                        <td className="p-4">{q.userName}</td>
                                        <td className="p-4 text-gray-500">{q.createdAt?.seconds?new Date(q.createdAt.seconds*1000).toLocaleDateString():'-'}</td>
                                        <td className="p-4"><button onClick={()=>replyToInquiry(q.id)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-bold">답변</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black">회원 리스트 ({users.length}명)</h2>
                    <div className="bg-white rounded-xl border shadow-sm">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">연락처</th><th className="p-4">국적</th><th className="p-4">가입일</th></tr></thead>
                            <tbody className="divide-y">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="p-4 font-bold">{u.name}</td>
                                        <td className="p-4">{u.email}</td>
                                        <td className="p-4">{u.phone || '-'}</td>
                                        <td className="p-4">{u.nationality || 'Unknown'}</td>
                                        <td className="p-4 text-gray-500">{u.createdAt?.seconds?new Date(u.createdAt.seconds*1000).toLocaleDateString():'-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>
            )}

            {/* SETTINGS (Expanded) */}
            {activeTab === 'settings' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-black mb-4">환경 설정</h2>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="flex border-b">
                            {['basic', 'payment', 'email', 'receipt', 'survey'].map(tab => (
                                <button key={tab} onClick={()=>setSettingsTab(tab as any)} className={`flex-1 py-4 font-bold text-sm ${settingsTab===tab?'bg-blue-50 text-blue-600 border-b-2 border-blue-600':'text-gray-500'}`}>
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="p-8 max-w-2xl">
                            {settingsTab === 'basic' && (
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">사이트명</label><input className="w-full border p-2 rounded" value={settings.global?.siteTitle||''} onChange={e=>setSettings({...settings, global:{...settings.global, siteTitle:e.target.value}})}/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">관리자 이메일</label><input className="w-full border p-2 rounded" value={settings.global?.adminEmail||''} onChange={e=>setSettings({...settings, global:{...settings.global, adminEmail:e.target.value}})}/></div>
                                    <button onClick={()=>saveSettings('global', settings.global)} className="bg-black text-white px-4 py-2 rounded text-sm font-bold">저장</button>
                                </div>
                            )}
                            {settingsTab === 'payment' && (
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">PortOne 가맹점 코드</label><input className="w-full border p-2 rounded" value={settings.global?.impCode||''} onChange={e=>setSettings({...settings, global:{...settings.global, impCode:e.target.value}})}/></div>
                                    <button onClick={()=>saveSettings('global', settings.global)} className="bg-black text-white px-4 py-2 rounded text-sm font-bold">저장</button>
                                </div>
                            )}
                            {settingsTab === 'email' && (
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">예약 확정 메일 제목</label><input className="w-full border p-2 rounded" value={settings.email_config?.confirmSubject||''} onChange={e=>setSettings({...settings, email_config:{...settings.email_config, confirmSubject:e.target.value}})}/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">메일 본문 (인사말)</label><textarea className="w-full border p-2 rounded h-24" value={settings.email_config?.confirmBody||''} onChange={e=>setSettings({...settings, email_config:{...settings.email_config, confirmBody:e.target.value}})}/></div>
                                    <button onClick={()=>saveSettings('email_config', settings.email_config)} className="bg-black text-white px-4 py-2 rounded text-sm font-bold">템플릿 저장</button>
                                </div>
                            )}
                            {settingsTab === 'receipt' && (
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">영수증 회사명 (영문)</label><input className="w-full border p-2 rounded" value={settings.receipt_config?.companyName||''} onChange={e=>setSettings({...settings, receipt_config:{...settings.receipt_config, companyName:e.target.value}})}/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">대표자명</label><input className="w-full border p-2 rounded" value={settings.receipt_config?.ceo||''} onChange={e=>setSettings({...settings, receipt_config:{...settings.receipt_config, ceo:e.target.value}})}/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">주소</label><input className="w-full border p-2 rounded" value={settings.receipt_config?.address||''} onChange={e=>setSettings({...settings, receipt_config:{...settings.receipt_config, address:e.target.value}})}/></div>
                                    <button onClick={()=>saveSettings('receipt_config', settings.receipt_config)} className="bg-black text-white px-4 py-2 rounded text-sm font-bold">영수증 설정 저장</button>
                                </div>
                            )}
                             {settingsTab === 'survey' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">사전 문진표 질문을 JSON 형태로 관리합니다.</p>
                                    <textarea className="w-full border p-4 rounded font-mono text-xs h-40 bg-gray-50" value={JSON.stringify(settings.survey_config?.questions||{}, null, 2)} onChange={e=>{try{const p=JSON.parse(e.target.value);setSettings({...settings, survey_config:{questions:p}})}catch(err){}}}/>
                                    <button onClick={()=>saveSettings('survey_config', settings.survey_config)} className="bg-black text-white px-4 py-2 rounded text-sm font-bold">문진표 저장</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* MODAL */}
        {modalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg">{modalType.toUpperCase()} EDITOR</h3>
                        <button onClick={()=>setModalType(null)}><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 space-y-6">
                        {/* PRODUCT & MAGAZINE EDITOR */}
                        {(modalType === 'product' || modalType === 'magazine') && (
                            <>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2">대표 이미지 (1장)</label>
                                        <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl relative flex items-center justify-center overflow-hidden">
                                            {editingItem.image ? <img src={editingItem.image} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300"/>}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMainImageUpload}/>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {modalType === 'product' && <div><label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label><select className="w-full border p-2 rounded" value={editingItem.category} onChange={e=>setEditingItem({...editingItem, category:e.target.value})}>{['건강검진','뷰티시술','K-IDOL','뷰티컨설팅','올인원패키지'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>}
                                        {modalType === 'magazine' && <div><label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label><input className="w-full border p-2 rounded" value={editingItem.category||''} onChange={e=>setEditingItem({...editingItem, category:e.target.value})}/></div>}
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">제목</label><input className="w-full border p-2 rounded font-bold" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})}/></div>
                                        {modalType === 'product' && <div><label className="block text-xs font-bold text-gray-500 mb-1">가격 (숫자)</label><input type="number" className="w-full border p-2 rounded" value={editingItem.price||0} onChange={e=>setEditingItem({...editingItem, price:Number(e.target.value)})}/></div>}
                                        {modalType === 'magazine' && <div><label className="block text-xs font-bold text-gray-500 mb-1">요약</label><textarea className="w-full border p-2 rounded h-20" value={editingItem.excerpt||''} onChange={e=>setEditingItem({...editingItem, excerpt:e.target.value})}/></div>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">추가 이미지 (최대 10장)</label>
                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {galleryImages.map((img, i) => (
                                            <div key={i} className="w-20 h-20 relative flex-shrink-0 rounded-lg overflow-hidden border">
                                                <img src={img} className="w-full h-full object-cover"/>
                                                <button onClick={()=>setGalleryImages(galleryImages.filter((_, idx)=>idx!==i))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={12}/></button>
                                            </div>
                                        ))}
                                        {galleryImages.length < 10 && (
                                            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer relative hover:bg-gray-50">
                                                <Plus size={20} className="text-gray-400"/>
                                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleGalleryUpload} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-[400px]">
                                    <label className="block text-xs font-bold text-gray-500 mb-2">상세 내용 (에디터)</label>
                                    <RichTextEditor value={editingItem.content||''} onChange={h=>setEditingItem({...editingItem, content:h})}/>
                                </div>
                            </>
                        )}
                        {/* COUPON EDITOR */}
                        {modalType === 'coupon' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold mb-1">쿠폰명</label><input className="w-full border p-2 rounded" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold mb-1">코드</label><input className="w-full border p-2 rounded bg-gray-50" value={editingItem.code || Math.random().toString(36).substr(2,8).toUpperCase()} onChange={e=>setEditingItem({...editingItem, code:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold mb-1">타입</label><select className="w-full border p-2 rounded" value={editingItem.type} onChange={e=>setEditingItem({...editingItem, type:e.target.value})}><option value="percent">% 할인</option><option value="fixed">정액 할인</option></select></div>
                                <div><label className="block text-xs font-bold mb-1">값</label><input type="number" className="w-full border p-2 rounded" value={editingItem.value} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})}/></div>
                                <div><label className="block text-xs font-bold mb-1">최대 수량</label><input type="number" className="w-full border p-2 rounded" value={editingItem.maxUsage} onChange={e=>setEditingItem({...editingItem, maxUsage:Number(e.target.value)})}/></div>
                            </div>
                        )}
                        {/* AFFILIATE EDITOR */}
                         {modalType === 'affiliate' && (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold mb-1">파트너명</label><input className="w-full border p-2 rounded" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold mb-1">수수료율 (%)</label><input type="number" className="w-full border p-2 rounded" value={editingItem.commissionRate} onChange={e=>setEditingItem({...editingItem, commissionRate:Number(e.target.value)})}/></div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                        <button onClick={()=>setModalType(null)} className="px-4 py-2 font-bold text-gray-500">취소</button>
                        <button onClick={saveItem} className="bg-black text-white px-6 py-2 rounded font-bold flex items-center gap-2">{uploadingImg?<RefreshCw className="animate-spin" size={16}/>:<Save size={16}/>} 저장하기</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
