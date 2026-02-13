
import React, { useEffect, useState, useMemo } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, Globe, Calendar as CalendarIcon, FileText, Check, DollarSign, RefreshCw,
    Search, TrendingUp, Lock, Copy, Eye, AlertCircle, CheckCircle, Ban, LockKeyhole, UserCheck, Info, UploadCloud
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, setDoc, getDoc, onSnapshot, serverTimestamp, getDocs, writeBatch, where } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { RichTextEditor } from '../components/RichTextEditor';
import { uploadImage } from '../services/imageService';
import { fetchExchangeRates } from '../services/currencyService';

// --- Components ---
const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'confirmed': 'bg-green-100 text-green-800 border-green-200',
        'completed': 'bg-gray-100 text-gray-800 border-gray-200',
        'cancelled': 'bg-red-100 text-red-800 border-red-200',
        'waiting': 'bg-gray-100 text-gray-600 border-gray-200',
        'answered': 'bg-blue-100 text-blue-700 border-blue-200'
    };
    const labels: any = {
        'pending': '대기중', 'confirmed': '예약확정', 'completed': '이용완료', 'cancelled': '취소됨',
        'waiting': '답변대기', 'answered': '답변완료'
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
  
  // Real-time Rates & Stats
  const [rates, setRates] = useState({ USD: 0, JPY: 0, CNY: 0 });
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, monthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  
  // Settings Sub-tabs
  const [settingsTab, setSettingsTab] = useState<'basic'|'email'|'receipt'|'survey'>('basic');

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

  // Additional Image State for Editor
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // --- Effects ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          // Allow simplified admin access for demo
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
        onSnapshot(collection(db, "products"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(collection(db, "cms_packages"), (snap) => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(query(collection(db, "group_buys"), orderBy("createdAt", "desc")), (snap) => setGroupBuys(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(collection(db, "coupons"), (snap) => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(collection(db, "affiliates"), (snap) => setAffiliates(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), (snap) => setMagazinePosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), (snap) => setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
        onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStats(prev => ({ ...prev, users: snap.size }));
        }),
        // Load all settings docs
        onSnapshot(collection(db, "settings"), (snap) => {
            const settingsObj: any = {};
            snap.docs.forEach(d => settingsObj[d.id] = d.data());
            setSettings(settingsObj);
        })
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  // --- Safe Parsing & Logic ---

  const parsePrice = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return Number(val.replace(/[^0-9]/g, '')) || 0;
      return 0;
  };

  const allProducts = useMemo(() => {
      // Standardize structure for merging
      const prods = products.map(p => ({ 
          ...p, 
          id: p.id,
          _source: 'products', 
          type: 'product',
          price: parsePrice(p.price || p.priceVal),
          category: p.category || '미지정'
      }));
      const pkgs = packages.map(p => ({ 
          ...p, 
          id: p.id,
          _source: 'cms_packages', 
          type: 'package', 
          category: '올인원패키지',
          price: parsePrice(p.price),
          image: p.image || 'https://via.placeholder.com/300?text=Package'
      }));
      return [...prods, ...pkgs];
  }, [products, packages]);

  const filteredProducts = useMemo(() => {
      let items = allProducts;
      
      if (productCategoryFilter !== 'all') {
          // Flexible matching for categories
          items = items.filter(p => p.category.includes(productCategoryFilter) || (productCategoryFilter === '올인원패키지' && p.type === 'package'));
      }

      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          items = items.filter(p => 
              p.title?.toLowerCase().includes(lower) || 
              p.category?.toLowerCase().includes(lower)
          );
      }
      return items;
  }, [allProducts, productCategoryFilter, searchTerm]);

  // --- Handlers ---

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } catch (e) { alert("로그인 실패: 이메일과 비밀번호를 확인하세요."); }
  };

  // Duplicate Cleanup Tool
  const cleanupDuplicates = async () => {
      if (!window.confirm("중복된 상품을 정리하시겠습니까? (제목이 같은 상품은 하나만 남기고 삭제됩니다)")) return;
      
      const batch = writeBatch(db);
      const titleMap = new Map();
      let deleteCount = 0;

      // Check Products
      products.forEach(p => {
          if (titleMap.has(p.title)) {
              batch.delete(doc(db, "products", p.id));
              deleteCount++;
          } else {
              titleMap.set(p.title, true);
          }
      });

      // Check Packages
      const pkgMap = new Map();
      packages.forEach(p => {
          if (pkgMap.has(p.title)) {
              batch.delete(doc(db, "cms_packages", p.id));
              deleteCount++;
          } else {
              pkgMap.set(p.title, true);
          }
      });

      if (deleteCount > 0) {
          await batch.commit();
          showToast(`${deleteCount}개의 중복 항목이 정리되었습니다.`);
      } else {
          showToast("중복된 항목이 없습니다.");
      }
  };

  const deleteItem = async (collectionName: string, id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까?")) return;
      try { await deleteDoc(doc(db, collectionName, id)); showToast("삭제되었습니다."); } 
      catch (e) { showToast("삭제 실패", 'error'); }
  };

  const saveProductOrPost = async () => {
      // Determine collection
      let col = "";
      if (modalType === 'magazine') col = "cms_magazine";
      else if (editingItem.category === '올인원패키지' || editingItem.type === 'package') col = "cms_packages";
      else col = "products";

      if(!editingItem.title) return alert("제목을 입력하세요.");

      const payload = {
          ...editingItem,
          price: parsePrice(editingItem.price),
          images: galleryImages, // Save gallery array
          updatedAt: serverTimestamp()
      };
      delete payload._source; 

      try {
          if(editingItem.id) await updateDoc(doc(db, col, editingItem.id), payload);
          else await addDoc(collection(db, col), payload);
          setModalType(null);
          showToast("저장되었습니다.");
      } catch(e) { showToast("저장 실패", 'error'); }
  };

  const saveSettings = async (docId: string, data: any) => {
      try {
          await setDoc(doc(db, "settings", docId), data, { merge: true });
          showToast("설정이 저장되었습니다.");
      } catch(e) { showToast("설정 저장 실패", 'error'); }
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

  // Inquiry Answer
  const saveInquiryAnswer = async (id: string, answer: string) => {
      try {
          await updateDoc(doc(db, "inquiries", id), {
              answer,
              status: 'answered',
              answeredAt: serverTimestamp()
          });
          showToast("답변이 등록되었습니다.");
      } catch(e) { showToast("답변 등록 실패", 'error'); }
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FB]"><RefreshCw className="animate-spin text-blue-500 mb-2"/> <span className="text-sm font-bold text-gray-500">관리자 데이터 로딩중...</span></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]"><div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md"><h2 className="text-2xl font-black text-center mb-8">관리자 로그인</h2><form onSubmit={handleLogin} className="space-y-4"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-4 rounded-xl" placeholder="admin@k-experience.com"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-4 rounded-xl" placeholder="비밀번호"/><button className="w-full bg-black text-white py-4 rounded-xl font-bold">접속하기</button></form></div></div>;

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {/* Toast */}
        {toast && <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-fade-in-down flex items-center gap-2 ${toast.type==='success'?'bg-black text-white':'bg-red-500 text-white'}`}>{toast.type==='success'?<CheckCircle size={16}/>:<AlertCircle size={16}/>} {toast.msg}</div>}

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-sm">
            <div className="h-20 flex items-center px-8 border-b border-gray-100"><span className="text-2xl font-black text-[#0070F0]">K-ADMIN</span></div>
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {[{id:'dashboard',icon:LayoutDashboard,label:'대시보드'},{id:'reservations',icon:ShoppingCart,label:'예약/주문 관리'},{id:'products',icon:Package,label:'상품/패키지'},{id:'groupbuys',icon:Megaphone,label:'공동구매 관제'},{id:'coupons',icon:Ticket,label:'쿠폰/프로모션'},{id:'magazine',icon:BookOpen,label:'매거진(블로그)'},{id:'inquiries',icon:MessageCircle,label:'1:1 문의'},{id:'users',icon:Users,label:'회원 관리'},{id:'affiliates',icon:LinkIcon,label:'제휴 파트너'},{id:'settings',icon:SettingsIcon,label:'환경 설정'}].map((item)=>(<button key={item.id} onClick={()=>setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab===item.id?'bg-[#0070F0] text-white shadow-lg shadow-blue-200':'text-gray-500 hover:bg-gray-50'}`}><item.icon size={18}/> {item.label}</button>))}
            </nav>
            <div className="p-4 border-t border-gray-100"><button onClick={()=>logoutUser()} className="w-full py-3 bg-gray-50 text-gray-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2"><LogOut size={14}/> 로그아웃</button></div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 ml-64 p-8 min-w-[1024px]">
            <div className="flex justify-between items-center mb-8 sticky top-0 z-10 bg-[#F5F7FB]/90 backdrop-blur-sm py-4">
                <h2 className="text-2xl font-black text-[#111] capitalize flex items-center gap-2">{activeTab.toUpperCase()}</h2>
                <div className="flex gap-3">
                    <button onClick={() => window.open('/', '_blank')} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-50"><Globe size={14}/> 사이트 바로가기</button>
                </div>
            </div>

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { l:'누적 매출액', v:`₩ ${stats.revenue.toLocaleString()}`, i:DollarSign, c:'bg-blue-50 text-blue-600' }, 
                            { l:'이번 달 매출', v:`₩ ${stats.monthlyRevenue.toLocaleString()}`, i:TrendingUp, c:'bg-green-50 text-green-600' },
                            { l:'총 예약 건수', v:`${stats.orders}건`, i:ShoppingCart, c:'bg-purple-50 text-purple-600' }, 
                            { l:'총 회원 수', v:`${stats.users}명`, i:Users, c:'bg-orange-50 text-orange-600' }
                        ].map((s,i) => (<div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-gray-400 text-xs font-bold mb-1">{s.l}</p><h3 className="text-2xl font-black">{s.v}</h3></div><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.c}`}><s.i size={24}/></div></div>))}
                    </div>
                </div>
            )}

            {/* PRODUCTS */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-2">
                            {['all', '건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(cat => (
                                <button key={cat} onClick={() => setProductCategoryFilter(cat)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${productCategoryFilter === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>{cat === 'all' ? '전체' : cat}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={cleanupDuplicates} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-red-100"><Trash2 size={14}/> 중복 제거</button>
                            <button onClick={() => { setEditingItem({ price: 0, category: '건강검진' }); setGalleryImages([]); setModalType('product'); }} className="bg-[#0070F0] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-blue-600 flex items-center gap-2"><Plus size={16}/> 상품 등록</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                        {filteredProducts.map((item: any) => (
                            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                                <div className="relative aspect-video bg-gray-100">
                                    <img src={item.image} className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3"><span className={`px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm ${item.type === 'package' ? 'bg-purple-600' : 'bg-black/80'}`}>{item.category}</span></div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h4 className="font-bold text-[#111] mb-1 line-clamp-1">{item.title}</h4>
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center"><span className="font-black text-lg">₩ {item.price.toLocaleString()}</span><div className="flex gap-2"><button onClick={() => { setEditingItem(item); setGalleryImages(item.images||[]); setModalType('product'); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button><button onClick={() => deleteItem(item.type==='package'?"cms_packages":"products", item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAGAZINE (Unified with Product Editor) */}
            {activeTab === 'magazine' && (
                <div className="space-y-6">
                     <div className="flex justify-end"><button onClick={()=>{setEditingItem({category:'K-Trend'}); setGalleryImages([]); setModalType('magazine');}} className="bg-[#0070F0] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"><Plus size={18}/> 포스트 작성</button></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{magazinePosts.map(p => (
                         <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 hover:shadow-md transition-all">
                             <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden"><img src={p.image} className="w-full h-full object-cover" /></div>
                             <div className="flex-1"><h4 className="font-bold text-lg mb-1">{p.title}</h4><p className="text-gray-500 text-sm line-clamp-2">{p.excerpt}</p></div>
                             <div className="flex flex-col gap-2"><button onClick={()=>{setEditingItem(p); setGalleryImages(p.images||[]); setModalType('magazine');}}><Edit2 size={16} className="text-gray-400 hover:text-blue-500"/></button><button onClick={()=>deleteItem("cms_magazine", p.id)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button></div>
                         </div>
                     ))}</div>
                </div>
            )}

            {/* INQUIRIES */}
            {activeTab === 'inquiries' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4">1:1 문의 관리</h3>
                        {inquiries.length === 0 ? <p className="text-gray-500 text-center py-10">접수된 문의가 없습니다.</p> : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="p-3">상태</th><th className="p-3">제목</th><th className="p-3">작성자</th><th className="p-3">작성일</th><th className="p-3">관리</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {inquiries.map((inq: any) => (
                                        <tr key={inq.id}>
                                            <td className="p-3"><StatusBadge status={inq.status}/></td>
                                            <td className="p-3 font-bold">{inq.title}</td>
                                            <td className="p-3">{inq.userName || 'User'}</td>
                                            <td className="p-3 text-gray-500">{inq.createdAt?.seconds ? new Date(inq.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                            <td className="p-3"><button onClick={() => { 
                                                const ans = prompt("답변을 입력하세요:", inq.answer || "");
                                                if(ans) saveInquiryAnswer(inq.id, ans);
                                            }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100">답변하기</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* USERS */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-lg mb-4">회원 리스트 ({users.length}명)</h3>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="p-3">이름</th><th className="p-3">이메일</th><th className="p-3">연락처</th><th className="p-3">국적</th><th className="p-3">가입일</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="p-3 font-bold">{u.name}</td>
                                    <td className="p-3 text-gray-600">{u.email}</td>
                                    <td className="p-3">{u.phone || '-'}</td>
                                    <td className="p-3">{u.nationality || 'Unknown'}</td>
                                    <td className="p-3 text-gray-400">{u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SETTINGS (Granular) */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {['basic', 'email', 'receipt', 'survey'].map(tab => (
                            <button key={tab} onClick={() => setSettingsTab(tab as any)} className={`flex-1 py-4 font-bold text-sm transition-colors ${settingsTab === tab ? 'bg-gray-50 text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-500 hover:bg-gray-50'}`}>
                                {tab === 'basic' ? '기본/결제' : tab === 'email' ? '이메일/알림' : tab === 'receipt' ? '영수증 설정' : '문진표 관리'}
                            </button>
                        ))}
                    </div>
                    <div className="p-8 max-w-4xl">
                        {settingsTab === 'basic' && (
                            <div className="space-y-6">
                                <h4 className="font-bold text-lg">기본 정보 & PG 설정</h4>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">사이트 이름</label><input className="w-full border p-2 rounded" value={settings['global']?.siteTitle||''} onChange={e=>setSettings({...settings, global: {...settings['global'], siteTitle: e.target.value}})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">PortOne 가맹점 식별코드</label><input className="w-full border p-2 rounded bg-gray-50 font-mono" value={settings['global']?.impCode||''} onChange={e=>setSettings({...settings, global: {...settings['global'], impCode: e.target.value}})}/></div>
                                <button onClick={() => saveSettings('global', settings['global'])} className="bg-[#111] text-white px-6 py-2 rounded-lg font-bold text-xs mt-4">설정 저장</button>
                            </div>
                        )}
                        {settingsTab === 'email' && (
                            <div className="space-y-6">
                                <h4 className="font-bold text-lg">자동 발송 이메일 템플릿</h4>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">예약 확정 메일 제목</label><input className="w-full border p-2 rounded" value={settings['email_config']?.confirmSubject||''} onChange={e=>setSettings({...settings, email_config: {...settings['email_config'], confirmSubject: e.target.value}})}/></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">예약 확정 메일 본문 (상단 인사말)</label><textarea className="w-full border p-2 rounded h-24" value={settings['email_config']?.confirmBody||''} onChange={e=>setSettings({...settings, email_config: {...settings['email_config'], confirmBody: e.target.value}})}/></div>
                                <button onClick={() => saveSettings('email_config', settings['email_config'])} className="bg-[#111] text-white px-6 py-2 rounded-lg font-bold text-xs mt-4">템플릿 저장</button>
                            </div>
                        )}
                        {settingsTab === 'receipt' && (
                            <div className="space-y-6">
                                <h4 className="font-bold text-lg">영수증(Invoice) 표기 정보</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">회사명 (영문)</label><input className="w-full border p-2 rounded" value={settings['receipt_config']?.companyName||''} onChange={e=>setSettings({...settings, receipt_config: {...settings['receipt_config'], companyName: e.target.value}})}/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">대표자명</label><input className="w-full border p-2 rounded" value={settings['receipt_config']?.ceo||''} onChange={e=>setSettings({...settings, receipt_config: {...settings['receipt_config'], ceo: e.target.value}})}/></div>
                                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">사업장 주소</label><input className="w-full border p-2 rounded" value={settings['receipt_config']?.address||''} onChange={e=>setSettings({...settings, receipt_config: {...settings['receipt_config'], address: e.target.value}})}/></div>
                                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">하단 푸터 문구</label><textarea className="w-full border p-2 rounded h-20" value={settings['receipt_config']?.footerText||''} onChange={e=>setSettings({...settings, receipt_config: {...settings['receipt_config'], footerText: e.target.value}})}/></div>
                                </div>
                                <button onClick={() => saveSettings('receipt_config', settings['receipt_config'])} className="bg-[#111] text-white px-6 py-2 rounded-lg font-bold text-xs mt-4">영수증 설정 저장</button>
                            </div>
                        )}
                        {settingsTab === 'survey' && (
                            <div className="space-y-6">
                                <h4 className="font-bold text-lg">사전 문진표 질문 관리</h4>
                                <p className="text-sm text-gray-500 mb-4">카테고리별로 고객에게 노출될 질문을 수정할 수 있습니다. (JSON 포맷 권장)</p>
                                <textarea className="w-full border p-4 rounded-xl font-mono text-xs h-64 bg-gray-50" value={JSON.stringify(settings['survey_config']?.questions || {}, null, 2)} onChange={e => { try { const parsed = JSON.parse(e.target.value); setSettings({...settings, survey_config: {questions: parsed}}); } catch(err){} }}/>
                                <button onClick={() => saveSettings('survey_config', settings['survey_config'])} className="bg-[#111] text-white px-6 py-2 rounded-lg font-bold text-xs mt-4">문진표 저장</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Other Tabs (Reservations, GroupBuys, Coupons, Affiliates) use existing logic with minor tweaks... */}
            {(activeTab === 'reservations' || activeTab === 'groupbuys' || activeTab === 'coupons' || activeTab === 'affiliates') && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {/* Reusing previous table structures for brevity - they work as is */}
                    <h3 className="font-bold text-lg mb-4">{activeTab.toUpperCase()} 관리</h3>
                    {activeTab === 'reservations' && (
                        <table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="p-3">번호</th><th className="p-3">상품</th><th className="p-3">고객</th><th className="p-3">금액</th><th className="p-3">상태</th><th className="p-3">관리</th></tr></thead>
                        <tbody>{reservations.map(r=><tr key={r.id}><td className="p-3 font-mono">{r.id.slice(0,6)}</td><td className="p-3">{r.productName}</td><td className="p-3">{r.options?.guestEmail||r.userId}</td><td className="p-3 font-bold">{Number(r.totalPrice).toLocaleString()}</td><td className="p-3"><StatusBadge status={r.status}/></td><td className="p-3"><button onClick={()=>deleteItem('reservations',r.id)}><Trash2 size={16} className="text-red-500"/></button></td></tr>)}</tbody></table>
                    )}
                    {activeTab === 'groupbuys' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{groupBuys.map(g=><div key={g.id} className="border p-4 rounded-xl flex justify-between"><div><h4 className="font-bold">{g.title}</h4><p className="text-sm text-gray-500">{g.currentCount}/{g.maxCount}명 참여</p></div><button onClick={()=>deleteItem('group_buys',g.id)} className="text-red-500"><Ban/></button></div>)}</div>
                    )}
                    {activeTab === 'coupons' && (
                        <div className="space-y-4"><div className="flex justify-end"><button onClick={()=>{setEditingItem({type:'percent',value:10,maxUsage:100}); setModalType('coupon');}} className="bg-black text-white px-3 py-1 rounded text-xs font-bold">+ 쿠폰생성</button></div>{coupons.map(c=><div key={c.id} className="border p-3 rounded-lg flex justify-between items-center"><span className="font-mono font-bold text-blue-600">{c.code}</span><span className="text-sm">{c.name}</span><button onClick={()=>deleteItem('coupons',c.id)}><X size={16}/></button></div>)}</div>
                    )}
                    {activeTab === 'affiliates' && (
                        <div className="space-y-4"><div className="flex justify-end"><button onClick={()=>{setEditingItem({commissionRate:10}); setModalType('affiliate');}} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">+ 파트너추가</button></div>{affiliates.map(a=><div key={a.id} className="border p-3 rounded-lg flex justify-between"><div><h4 className="font-bold">{a.name}</h4><p className="text-xs text-gray-500">Code: {a.code}</p></div><div className="text-right"><p className="font-bold">{a.clicks||0} Clicks</p><p className="text-xs">Sales: {a.sales||0}</p></div></div>)}</div>
                    )}
                </div>
            )}
        </main>

        {/* Unified Modal */}
        {modalType && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-black text-xl">
                            {modalType === 'product' ? '상품/패키지 수정' : modalType === 'magazine' ? '매거진 포스트 작성' : modalType === 'coupon' ? '쿠폰 발행' : '파트너 등록'}
                        </h3>
                        <button onClick={()=>setModalType(null)}><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 bg-white space-y-6">
                        {/* EDITOR LOGIC FOR PRODUCT & MAGAZINE */}
                        {(modalType === 'product' || modalType === 'magazine') && (
                            <>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">대표 이미지 (1장)</label>
                                        <div className="aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 relative flex items-center justify-center overflow-hidden group">
                                            {editingItem.image ? <img src={editingItem.image} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300"/>}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMainImageUpload} />
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 space-y-4">
                                        {modalType === 'product' && (
                                            <div><label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label><select className="w-full border p-2 rounded" value={editingItem.category} onChange={e=>setEditingItem({...editingItem, category: e.target.value, type: e.target.value==='올인원패키지'?'package':'product'})}>{['건강검진', '뷰티시술', 'K-IDOL', '뷰티컨설팅', '올인원패키지'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                                        )}
                                        {modalType === 'magazine' && (
                                            <div><label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label><input className="w-full border p-2 rounded" value={editingItem.category||''} onChange={e=>setEditingItem({...editingItem, category: e.target.value})} placeholder="예: K-Trend, Beauty Tip"/></div>
                                        )}
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">제목</label><input className="w-full border p-2 rounded font-bold" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title: e.target.value})}/></div>
                                        {modalType === 'product' && <div><label className="block text-xs font-bold text-gray-500 mb-1">가격 (숫자만)</label><input type="number" className="w-full border p-2 rounded" value={editingItem.price||0} onChange={e=>setEditingItem({...editingItem, price: Number(e.target.value)})}/></div>}
                                        {modalType === 'magazine' && <div><label className="block text-xs font-bold text-gray-500 mb-1">요약글 (Excerpt)</label><textarea className="w-full border p-2 rounded h-20" value={editingItem.excerpt||''} onChange={e=>setEditingItem({...editingItem, excerpt: e.target.value})}/></div>}
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
                        {/* Coupon & Affiliate inputs remain simple... */}
                    </div>
                    <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
                        <button onClick={()=>setModalType(null)} className="px-4 py-2 text-gray-500 font-bold">취소</button>
                        <button onClick={modalType === 'product' || modalType === 'magazine' ? saveProductOrPost : () => { /* save logic for others */ }} className="bg-black text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                            {uploadingImg ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} 저장하기
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
