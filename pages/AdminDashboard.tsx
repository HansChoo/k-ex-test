
import React, { useEffect, useState, useMemo } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Plus, Edit2, Trash2, Megaphone, X, Save, 
    Ticket, BookOpen, Link as LinkIcon, Settings as SettingsIcon, MessageCircle, Image as ImageIcon, 
    LogOut, Globe, CheckCircle, AlertCircle, RefreshCw, DollarSign, Search, Copy, Crown, ListPlus,
    Timer, Lock, CheckCircle2, Phone, Archive, Grid, Layers, FolderTree, Box, Calendar as CalendarIcon, 
    List, ChevronLeft, ChevronRight, MoreHorizontal, Mail
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
        'answered': 'bg-blue-100 text-blue-800',
        'active': 'bg-blue-100 text-blue-800'
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

// Card Themes for Variety
const CARD_THEMES = [
    { bg: 'bg-gradient-to-r from-blue-500 to-cyan-400', text: 'text-blue-600', sub: 'bg-blue-50' },
    { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-purple-600', sub: 'bg-purple-50' },
    { bg: 'bg-gradient-to-r from-orange-400 to-red-500', text: 'text-orange-600', sub: 'bg-orange-50' },
    { bg: 'bg-gradient-to-r from-emerald-400 to-teal-500', text: 'text-emerald-600', sub: 'bg-emerald-50' }
];

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
  const [categories, setCategories] = useState<any[]>([]); 
  const [settings, setSettings] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<any>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  
  // Sub-tabs & Views
  const [productSubTab, setProductSubTab] = useState<'categories' | 'items' | 'packages'>('categories'); 
  const [reservationView, setReservationView] = useState<'list' | 'calendar'>('list'); // Persona 2: Calendar View
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI States
  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'}|null>(null);

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
        onSnapshot(query(collection(db, "cms_categories"), orderBy("createdAt", "asc")), (s) => setCategories(s.docs.map(d => ({id:d.id, ...d.data()})))), 
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
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (typeof val === 'string') {
          const num = Number(val.replace(/[^0-9.]/g, ''));
          return isNaN(num) ? 0 : num;
      }
      return 0;
  };

  const allProducts = useMemo(() => {
      const rawProducts = products.map(item => ({ 
          ...item, 
          type: 'product', 
          _coll: 'products', 
          price: parsePrice(item.price || item.priceVal),
          category: item.category || '미지정'
      }));
      const rawPackages = packages.map(item => ({ 
          ...item, 
          type: 'package', 
          category: '올인원패키지', 
          _coll: 'cms_packages', 
          price: parsePrice(item.price) 
      }));
      return [...rawProducts, ...rawPackages];
  }, [products, packages]);

  const filteredProducts = useMemo(() => {
      let data = allProducts;
      if (productCategoryFilter !== 'all') {
          data = data.filter(p => {
              const cat = String(p.category || '').toLowerCase();
              const target = productCategoryFilter.toLowerCase();
              if (target === '건강검진') return cat.includes('건강') || cat.includes('health');
              if (target === '뷰티시술') return cat.includes('뷰티') || cat.includes('beauty');
              if (target === 'k-idol') return cat.includes('idol') || cat.includes('아이돌');
              if (target === '뷰티컨설팅') return cat.includes('컨설팅') || cat.includes('consult');
              if (target === '올인원패키지') return cat.includes('패키지') || cat.includes('package');
              return cat.includes(target);
          });
      }
      return data;
  }, [allProducts, productCategoryFilter]);

  const stats = useMemo(() => {
      const revenue = reservations.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
      return {
          revenue,
          orders: reservations.length,
          users: users.length
      };
  }, [reservations, users]);

  const activeGroupBuys = groupBuys.filter(g => g.status !== 'completed');
  const pastGroupBuys = groupBuys.filter(g => g.status === 'completed');

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } 
      catch (e) { alert("로그인 실패"); }
  };

  const deleteItem = async (col: string, id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까?")) return;
      await deleteDoc(doc(db, col, id));
      showToast("삭제되었습니다.");
  };

  // Safe Delete for Categories
  const handleDeleteCategory = async (cat: any) => {
      // Logic: If any product is using this category (by exact label matching), block deletion.
      const linkedProducts = allProducts.filter(p => p.category === cat.label);
      
      if (linkedProducts.length > 0) {
          alert(
              `[삭제 불가] 이 카테고리에 연결된 상품이 ${linkedProducts.length}개 있습니다.\n\n` +
              `1. '상품 목록' 탭으로 이동하세요.\n` +
              `2. 해당 상품들의 카테고리를 변경하거나 상품을 먼저 삭제하세요.\n` +
              `3. 그 후 카테고리를 삭제할 수 있습니다.`
          );
          return;
      }

      if(!window.confirm(`'${cat.label}' 카테고리를 정말 삭제하시겠습니까?`)) return;
      await deleteItem('cms_categories', cat.id);
  };

  // Persona 2: Reservation Operations
  const updateReservationStatus = async (id: string, status: string) => {
      if (!window.confirm(`예약 상태를 '${status}'(으)로 변경하시겠습니까?`)) return;
      try {
          await updateDoc(doc(db, "reservations", id), { status });
          showToast(`상태가 변경되었습니다.`);
          if (modalType === 'reservation_detail') setModalType(null); // Close modal if open
      } catch (e) {
          showToast("변경 실패", 'error');
      }
  };

  const saveItem = async () => {
      let col = "";
      if (modalType === 'magazine') col = "cms_magazine";
      else if (modalType === 'product') col = "products";
      else if (modalType === 'package') col = "cms_packages";
      else if (modalType === 'coupon') col = "coupons";
      else if (modalType === 'affiliate') col = "affiliates";
      else if (modalType === 'groupbuy') col = "group_buys";
      else if (modalType === 'category') col = "cms_categories";

      const payload = { ...editingItem };
      if (modalType === 'product' || modalType === 'magazine') {
          payload.images = galleryImages;
          payload.price = parsePrice(editingItem.price);
      }
      
      // Handle Package Specifics (Persona 1)
      if (modalType === 'package') {
          payload.price = parsePrice(editingItem.price);
          // Items are already updated in state as string array
      }

      // Parse keywords for category
      if (modalType === 'category' && typeof payload.keywords === 'string') {
          payload.keywords = payload.keywords.split(',').map((k:string) => k.trim()).filter((k:string) => k);
      }
      
      delete payload._coll;
      delete payload.type;

      try {
          if (editingItem.id) {
              if (modalType === 'category') {
                  const originalCat = categories.find(c => c.id === editingItem.id);
                  if (originalCat && originalCat.label !== payload.label) {
                      const batch = writeBatch(db);
                      const oldLabel = originalCat.label;
                      const newLabel = payload.label;
                      let updatedCount = 0;

                      const catRef = doc(db, "cms_categories", editingItem.id);
                      batch.update(catRef, { ...payload, updatedAt: serverTimestamp() });

                      products.forEach(p => {
                          if (p.category === oldLabel) {
                              const pRef = doc(db, "products", p.id);
                              batch.update(pRef, { category: newLabel });
                              updatedCount++;
                          }
                      });

                      await batch.commit();
                      showToast(`카테고리 수정 및 연결된 상품 ${updatedCount}건 업데이트 완료!`);
                  } else {
                      await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
                      showToast("저장되었습니다.");
                  }
              } else {
                  await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
                  showToast("저장되었습니다.");
              }
          } else {
              await addDoc(collection(db, col), { ...payload, createdAt: serverTimestamp() });
              showToast("저장되었습니다.");
          }
          
          setModalType(null);
      } catch(e: any) { 
          showToast("저장 실패: " + e.message, 'error'); 
          console.error(e);
      }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setUploadingImg(true);
              const url = await uploadImage(file, 'main_images');
              setEditingItem((prev: any) => ({ ...prev, image: url }));
          } catch (error) {
              showToast("이미지 업로드 실패", 'error');
          } finally {
              setUploadingImg(false);
              e.target.value = ''; 
          }
      }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          setUploadingImg(true);
          try {
            const uploadedUrls = await Promise.all(
                Array.from(files).map((file) => uploadImage(file as File, 'product_gallery'))
            );
            setGalleryImages(prev => [...prev, ...uploadedUrls]);
          } catch(e) {
              showToast("이미지 업로드 중 오류가 발생했습니다.", 'error');
          } finally {
              setUploadingImg(false);
          }
      }
  };

  // Persona 1: Smart Package Builder Helpers
  const togglePackageItem = (prod: any) => {
      const currentSelectedIds = editingItem.selectedProductIds || [];
      let newSelectedIds: string[];
      let newItems: string[];
      
      if (currentSelectedIds.includes(prod.id)) {
          newSelectedIds = currentSelectedIds.filter((id: string) => id !== prod.id);
          newItems = (editingItem.items || []).filter((title: string) => title !== prod.title);
      } else {
          newSelectedIds = [...currentSelectedIds, prod.id];
          newItems = [...(editingItem.items || []), prod.title];
      }

      setEditingItem({
          ...editingItem,
          selectedProductIds: newSelectedIds,
          items: newItems
      });
  };

  const getPackageTotal = () => {
      if (!editingItem?.selectedProductIds) return 0;
      return editingItem.selectedProductIds.reduce((sum: number, id: string) => {
          const p = products.find(prod => prod.id === id);
          return sum + (p ? parsePrice(p.price || p.priceVal) : 0);
      }, 0);
  };

  const handleDeleteGroupBuy = async (group: any) => {
      if (!window.confirm("정말 이 공동구매를 삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "group_buys", group.id));
          showToast("공동구매가 삭제되었습니다.");
      } catch (e) {
          showToast("삭제 실패", 'error');
      }
  };

  const handleGroupBuyProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pid = e.target.value;
      if (!pid) {
          setEditingItem({ ...editingItem, productId: '', productName: '', productImage: '', originalPrice: 0 });
          return;
      }
      const prod = allProducts.find(p => p.id === pid);
      if (prod) {
          setEditingItem({
              ...editingItem,
              productId: prod.id,
              productName: prod.title || prod.productName,
              productImage: prod.image || '',
              originalPrice: parsePrice(prod.price || prod.priceVal)
          });
      }
  };

  // Persona 2: Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      // Empty cells for start padding
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border-b border-r border-gray-200"></div>);
      }
      // Days
      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayReservations = reservations.filter(r => r.date === dateStr);
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          days.push(
              <div key={day} className={`h-32 border-b border-r border-gray-200 p-2 relative group hover:bg-blue-50/30 transition-colors ${isToday ? 'bg-blue-50' : ''}`}>
                  <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</span>
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                      {dayReservations.map(res => (
                          <div 
                            key={res.id} 
                            onClick={() => { setEditingItem(res); setModalType('reservation_detail'); }}
                            className={`text-[10px] px-2 py-1 rounded cursor-pointer truncate font-medium border ${
                                res.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' :
                                res.status === 'cancelled' ? 'bg-red-50 text-red-400 border-red-100 line-through' :
                                res.status === 'completed' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                              {res.status === 'confirmed' && '✅ '}
                              {res.options?.guests?.[0]?.name || 'Guest'} ({res.peopleCount}명)
                          </div>
                      ))}
                  </div>
                  {/* Add Quick Action on Hover */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Logic to add manual block */ }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500"
                  >
                      <Plus size={16}/>
                  </button>
              </div>
          );
      }

      return days;
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
        {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold flex items-center gap-2 ${toast.type==='success'?'bg-black':toast.type==='error'?'bg-red-500':'bg-blue-500'}`}>{toast.type==='success'?<CheckCircle size={16}/>:toast.type==='error'?<AlertCircle size={16}/>:<RefreshCw size={16} className="animate-spin"/>} {toast.msg}</div>}

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0]">K-ADMIN</div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                    {id:'dashboard', label:'대시보드', icon:LayoutDashboard},
                    {id:'reservations', label:'예약 관리', icon:ShoppingCart},
                    {id:'products', label:'상품/카테고리 관리', icon:Package}, // Integrated Menu
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

            {/* RESERVATIONS TAB (Persona 2: Operations) */}
            {activeTab === 'reservations' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black flex items-center gap-2"><ShoppingCart className="text-[#0070F0]"/> 예약 관리</h2>
                        <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                            <button 
                                onClick={() => setReservationView('list')}
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${reservationView === 'list' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List size={16}/> 리스트
                            </button>
                            <button 
                                onClick={() => setReservationView('calendar')}
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${reservationView === 'calendar' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <CalendarIcon size={16}/> 캘린더 (운영팀)
                            </button>
                        </div>
                    </div>

                    {reservationView === 'list' ? (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b"><tr><th className="p-4">날짜</th><th className="p-4">상품명</th><th className="p-4">예약자</th><th className="p-4">인원</th><th className="p-4">금액</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
                                <tbody className="divide-y">
                                    {reservations.map(res => (
                                        <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-mono">{res.date}</td>
                                            <td className="p-4 font-bold">{res.productName}</td>
                                            <td className="p-4">{res.options?.guests?.[0]?.name || res.userId}</td>
                                            <td className="p-4">{res.peopleCount}명</td>
                                            <td className="p-4 font-bold">₩{Number(res.totalPrice).toLocaleString()}</td>
                                            <td className="p-4"><StatusBadge status={res.status}/></td>
                                            <td className="p-4"><button onClick={() => { setEditingItem(res); setModalType('reservation_detail'); }} className="text-gray-400 hover:text-black"><MoreHorizontal size={20}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border shadow-sm">
                            {/* Calendar Header */}
                            <div className="p-4 flex items-center justify-between border-b">
                                <h3 className="font-bold text-lg">{calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft/></button>
                                    <button onClick={() => setCalendarDate(new Date())} className="px-3 py-1 text-xs font-bold bg-gray-100 rounded hover:bg-gray-200">Today</button>
                                    <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight/></button>
                                </div>
                            </div>
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 border-b bg-gray-50">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                    <div key={day} className="py-2 text-center text-xs font-bold text-gray-500 border-r last:border-0">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {renderCalendar()}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* INTEGRATED PRODUCTS & CATEGORIES TAB */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {/* Sub-tab Navigation */}
                    <div className="flex gap-4 border-b border-gray-200 pb-1">
                        <button 
                            onClick={() => setProductSubTab('categories')} 
                            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 transition-colors ${productSubTab === 'categories' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FolderTree size={18}/> 카테고리 관리
                        </button>
                        <button 
                            onClick={() => setProductSubTab('items')} 
                            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 transition-colors ${productSubTab === 'items' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid size={18}/> 상품 목록
                        </button>
                        <button 
                            onClick={() => setProductSubTab('packages')} 
                            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 transition-colors ${productSubTab === 'packages' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Layers size={18}/> 패키지 구성 (MD)
                        </button>
                    </div>

                    {/* SUB-TAB: CATEGORIES */}
                    {productSubTab === 'categories' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black">카테고리 구성</h2>
                                    <p className="text-xs text-gray-500 mt-1">이곳에서 카테고리를 먼저 설정해야 상품 등록 시 선택할 수 있습니다. <br/>순서: 카테고리 생성 &rarr; 상품 등록</p>
                                </div>
                                <button onClick={() => { setEditingItem({ label: '', labelEn: '', keywords: '' }); setModalType('category'); }} className="bg-black text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2">
                                    <Plus size={16}/> 카테고리 추가
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-6">
                                {categories.map((cat) => {
                                    const linkedCount = allProducts.filter(p => p.category === cat.label).length;
                                    return (
                                        <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group relative">
                                            <div className="h-40 bg-gray-100 relative">
                                                {cat.image ? (
                                                    <img src={cat.image} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button onClick={() => { setEditingItem({ ...cat, keywords: Array.isArray(cat.keywords) ? cat.keywords.join(', ') : '' }); setModalType('category'); }} className="bg-white text-black p-2 rounded-full hover:bg-gray-200"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleDeleteCategory(cat)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-lg">{cat.label}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${linkedCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {linkedCount}개 상품
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">{cat.labelEn}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {(cat.keywords || []).map((k: string, i: number) => (
                                                        <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600">{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {categories.length === 0 && (
                                    <div className="col-span-4 text-center py-20 bg-white border border-dashed border-gray-300 rounded-xl text-gray-400 flex flex-col items-center gap-2">
                                        <p>등록된 카테고리가 없습니다.</p>
                                        <p className="text-xs">우측 상단 [카테고리 추가] 버튼을 눌러 카테고리를 생성해주세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB: ITEMS (PRODUCTS) */}
                    {productSubTab === 'items' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black">상품 목록</h2>
                                <button onClick={()=>{setEditingItem({category:'건강검진', price:0}); setGalleryImages([]); setModalType('product');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Plus size={16}/> 상품 등록</button>
                            </div>
                            <div className="flex gap-2 mb-4 bg-gray-100 p-2 rounded-lg inline-flex">
                                <button onClick={()=>setProductCategoryFilter('all')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${productCategoryFilter==='all'?'bg-white shadow-sm text-black':'text-gray-500 hover:text-black'}`}>전체 보기</button>
                                {categories.map((cat) => (
                                    <button key={cat.id} onClick={()=>setProductCategoryFilter(cat.label)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${productCategoryFilter===cat.label?'bg-white shadow-sm text-black':'text-gray-500 hover:text-black'}`}>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {filteredProducts.filter(p => p.type !== 'package').map(p => (
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
                                {filteredProducts.filter(p => p.type !== 'package').length === 0 && (
                                    <div className="col-span-4 text-center py-20 bg-white border border-dashed rounded-xl text-gray-400">
                                        등록된 일반 상품이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUB-TAB: PACKAGES (MD) */}
                    {productSubTab === 'packages' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black">올인원 패키지 구성 (Smart Builder)</h2>
                                    <p className="text-xs text-gray-500 mt-1">개별 상품들을 조합하여 패키지를 만들고 할인 가격을 설정하세요.</p>
                                </div>
                                <button onClick={() => { setEditingItem({ title: '', items: [], theme: 'mint', price: 0, selectedProductIds: [] }); setModalType('package'); }} className="bg-black text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2">
                                    <Plus size={16}/> 패키지 만들기
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                {packages.map((pkg) => {
                                    const themeColors: any = { mint: 'bg-[#40E0D0]', yellow: 'bg-[#FFD700]', orange: 'bg-[#FFB800]' };
                                    const bgClass = themeColors[pkg.theme] || 'bg-gray-400';
                                    
                                    return (
                                        <div key={pkg.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col relative group">
                                            <div className={`h-24 ${bgClass} flex items-center justify-center relative`}>
                                                <h3 className="text-white font-black text-xl drop-shadow-md">{pkg.title}</h3>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button onClick={() => { setEditingItem(pkg); setModalType('package'); }} className="bg-white text-black p-2 rounded-full hover:bg-gray-200"><Edit2 size={16}/></button>
                                                    <button onClick={() => deleteItem('cms_packages', pkg.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <ul className="space-y-2 mb-4 flex-1">
                                                    {pkg.items?.map((item: string, i: number) => (
                                                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                                            <CheckCircle2 size={14} className="text-green-500"/> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="pt-4 border-t border-gray-100">
                                                    <p className="text-xs text-gray-400 text-right mb-1">패키지 할인가</p>
                                                    <p className="text-xl font-black text-right text-[#111]">₩ {pkg.price.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {packages.length === 0 && (
                                    <div className="col-span-3 py-20 text-center bg-white border border-dashed rounded-xl text-gray-400">
                                        등록된 패키지가 없습니다. [패키지 만들기]를 눌러 시작하세요.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* GROUP BUYS */}
            {activeTab === 'groupbuys' && (
                <div className="space-y-8">
                    {/* Active Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-2xl font-black flex items-center gap-2"><Megaphone className="text-[#0070F0]"/> 진행 중인 공동구매</h2>
                             <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                 * 날짜가 지난 공동구매는 자동으로 '완료됨' 처리됩니다.
                             </div>
                        </div>

                        {activeGroupBuys.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <Megaphone size={48} className="text-gray-200 mb-4"/>
                                <p className="text-gray-500 font-bold">현재 진행 중인 공동구매가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeGroupBuys.map((group, index) => {
                                    const safeName = group.productName || 'Unknown Product';
                                    const safeMax = group.maxCount || 10;
                                    const safeCurrent = group.currentCount || 0;
                                    const safeOriginalPrice = group.originalPrice || 0;
                                    const progress = Math.min(100, (safeCurrent / safeMax) * 100);
                                    const theme = CARD_THEMES[index % CARD_THEMES.length];
                                    
                                    // 최대 30% 할인 (인당 3%)
                                    const discountRate = Math.min(0.3, safeCurrent * 0.03); 
                                    const finalPrice = safeOriginalPrice * (1 - discountRate);
                                    const depositPerPerson = Math.round(finalPrice * 0.2);
                                    const totalDepositCollected = depositPerPerson * safeCurrent;
                                    const remainingBalance = finalPrice - depositPerPerson;

                                    return (
                                        <div key={group.id} className="bg-white rounded-[24px] shadow-lg overflow-hidden border border-gray-100 relative group-card">
                                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                                <button onClick={()=>handleDeleteGroupBuy(group)} className="bg-white/80 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded-full shadow-sm backdrop-blur-sm transition-colors border border-red-100">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                            {group.isSecret && (
                                                <div className="absolute top-16 right-4 z-10 bg-black text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                                                    <Lock size={12}/> Secret
                                                </div>
                                            )}
                                            <div className={`h-14 ${theme.bg} px-6 flex items-center justify-between text-white`}>
                                                <span className="font-black tracking-wider text-sm uppercase">GROUP #{index+1}</span>
                                                <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg text-xs font-bold">
                                                    <Timer size={12}/> <span>{group.visitDate}</span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="mb-4">
                                                    <h2 className="text-xl font-black text-gray-900 mb-1 leading-snug truncate">{safeName}</h2>
                                                    <p className="text-xs text-gray-500 mb-3 truncate">{group.description || 'Admin View'}</p>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {(group.items || ['건강검진','뷰티시술','K-IDOL']).slice(0,2).map((item: string, i: number) => (
                                                            <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] rounded font-bold border border-gray-100 flex items-center gap-1">
                                                                <CheckCircle2 size={10} className={theme.text}/> {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-xs font-bold text-gray-700">진행 현황 ({(discountRate * 100).toFixed(0)}% OFF)</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-sm font-black ${theme.text}`}>{safeCurrent}명</span>
                                                            <span className="text-xs text-gray-400">/ {safeMax}명</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className={`h-full ${theme.bg}`} style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mb-4 text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    <div className="border-r border-gray-200 last:border-0"><p className="text-[10px] text-gray-400 font-bold mb-1">1인 할인가</p><p className="font-bold text-xs text-gray-800">₩{finalPrice.toLocaleString()}</p></div>
                                                    <div className="border-r border-gray-200 last:border-0"><p className="text-[10px] text-gray-400 font-bold mb-1">총 결제액</p><p className="font-bold text-xs text-blue-600">₩{totalDepositCollected.toLocaleString()}</p></div>
                                                    <div><p className="text-[10px] text-gray-400 font-bold mb-1">1인 잔금</p><p className="font-bold text-xs text-red-500">₩{remainingBalance.toLocaleString()}</p></div>
                                                </div>
                                                <div className="flex items-center gap-3 mb-4 p-2 bg-blue-50/50 rounded-lg border border-blue-50">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg relative">
                                                        🧑‍💻<div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-white"><Crown size={8} className="text-white fill-white"/></div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">LEADER</p>
                                                        <p className="text-xs font-bold text-gray-800 truncate">{group.leaderName}</p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-gray-100 pt-3 mt-3">
                                                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase flex items-center gap-1"><SettingsIcon size={10}/> Admin Details</h4>
                                                    {group.isSecret && (<div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded text-xs mb-2"><span className="font-bold text-gray-600">Secret Code</span><span className="font-mono font-black text-red-500">{group.secretCode}</span></div>)}
                                                    <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto no-scrollbar">
                                                        <p className="text-[10px] text-gray-500 font-bold mb-1">참여자 리스트 ({group.participants?.length || 0})</p>
                                                        {group.participantDetails && group.participantDetails.length > 0 ? (
                                                            group.participantDetails.map((p: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between items-center text-[10px] border-b border-gray-100 last:border-0 py-1">
                                                                    <span className="font-bold text-gray-700 truncate max-w-[80px]">{p.name}</span>
                                                                    <div className="flex items-center gap-1 text-gray-400"><Phone size={8}/> <span>{p.phone || '-'}</span></div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            group.participants?.map((pid: string, idx: number) => (<div key={idx} className="text-[10px] text-gray-400 font-mono truncate border-b border-gray-100 last:border-0 py-0.5">{idx + 1}. {pid}</div>))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Past Section */}
                    {pastGroupBuys.length > 0 && (
                        <div className="pt-8 border-t border-dashed border-gray-300">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-500"><Archive className="text-gray-400"/> 진행 완료된 공동구매 (History)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-75">
                                {pastGroupBuys.map((group) => (
                                    <div key={group.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">COMPLETED</span>
                                            <div className="text-xs text-gray-400 font-mono">{group.visitDate}</div>
                                        </div>
                                        <h4 className="font-bold text-gray-700 truncate">{group.productName}</h4>
                                        <p className="text-xs text-gray-500 mb-2">Leader: {group.leaderName}</p>
                                        <div className="text-xs bg-white border rounded p-2 text-gray-500">
                                            최종 인원: {group.currentCount}명
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Coupons */}
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
        </main>

        {/* MODAL */}
        {modalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg">{modalType === 'reservation_detail' ? '예약 상세 정보' : modalType.toUpperCase() + ' EDITOR'}</h3>
                        <button onClick={()=>setModalType(null)}><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 space-y-6">
                        
                        {/* RESERVATION DETAIL MODAL */}
                        {modalType === 'reservation_detail' && editingItem && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">{editingItem.date}</div>
                                        <h2 className="text-2xl font-black">{editingItem.productName}</h2>
                                        <p className="text-sm font-bold text-gray-600 mt-1">
                                            예약자: {editingItem.options?.guests?.[0]?.name || editingItem.userId} 
                                            <span className="text-gray-400 mx-2">|</span>
                                            인원: {editingItem.peopleCount}명
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge status={editingItem.status}/>
                                        <div className="text-xl font-bold mt-2">₩ {Number(editingItem.totalPrice).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 mb-2">예약자 상세</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-bold mr-2">Email:</span> {editingItem.options?.guestEmail || '-'}</p>
                                            <p><span className="font-bold mr-2">메신저:</span> {editingItem.options?.guests?.[0]?.messengerApp} / {editingItem.options?.guests?.[0]?.messengerId}</p>
                                            <p><span className="font-bold mr-2">국적:</span> {editingItem.options?.guests?.[0]?.nationality}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 mb-2">결제 정보</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-bold mr-2">방식:</span> {editingItem.options?.payment === 'deposit' ? '예약금 결제' : '전액 결제'}</p>
                                            <p><span className="font-bold mr-2">쿠폰:</span> {editingItem.options?.coupon || '사용안함'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h4 className="text-sm font-bold mb-3">상태 변경 (Ops Action)</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateReservationStatus(editingItem.id, 'confirmed')} className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded hover:bg-green-200">확정 처리</button>
                                        <button onClick={() => updateReservationStatus(editingItem.id, 'completed')} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200">이용 완료</button>
                                        <button onClick={() => updateReservationStatus(editingItem.id, 'cancelled')} className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200">예약 취소</button>
                                        <div className="flex-1"></div>
                                        <button className="px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded hover:bg-gray-50 flex items-center gap-2"><Mail size={16}/> 바우처 재발송</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CATEGORY EDITOR */}
                        {modalType === 'category' && (
                            <div className="space-y-6">
                                <div className="flex gap-6 items-start">
                                    <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden group">
                                        {editingItem.image ? (
                                            <img src={editingItem.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">No Image</span>
                                        )}
                                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity font-bold text-xs">
                                            변경 <input type="file" className="hidden" onChange={handleMainImageUpload} />
                                        </label>
                                        {uploadingImg && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500"/></div>}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold mb-1">카테고리명 (한글)</label>
                                                <input className="w-full border p-2 rounded" value={editingItem.label} onChange={e=>setEditingItem({...editingItem, label:e.target.value})} placeholder="예: 뷰티 시술"/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Category Name (English)</label>
                                                <input className="w-full border p-2 rounded" value={editingItem.labelEn} onChange={e=>setEditingItem({...editingItem, labelEn:e.target.value})} placeholder="e.g. Beauty Procedure"/>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">필터 키워드 (쉼표로 구분)</label>
                                            <input className="w-full border p-2 rounded" value={editingItem.keywords} onChange={e=>setEditingItem({...editingItem, keywords:e.target.value})} placeholder="예: 뷰티, beauty, skin (상품 카테고리와 매칭됩니다)"/>
                                            <p className="text-[10px] text-gray-400 mt-1">* 상품의 카테고리에 이 단어들이 포함되어 있으면 해당 카테고리로 분류됩니다.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalType === 'groupbuy' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">대상 상품 선택</label>
                                    <select className="w-full border p-2 rounded" onChange={handleGroupBuyProductSelect} value={editingItem.productId || ''}>
                                        <option value="">상품을 선택하세요</option>
                                        <optgroup label="올인원 패키지">
                                            {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </optgroup>
                                        <optgroup label="개별 상품">
                                            {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                {editingItem.productId && (
                                    <div className="p-4 bg-gray-50 rounded border border-gray-200 flex gap-4">
                                        <img src={editingItem.productImage} className="w-16 h-16 object-cover rounded"/>
                                        <div>
                                            <p className="font-bold">{editingItem.productName}</p>
                                            <p className="text-sm text-gray-500">원가: ₩{editingItem.originalPrice?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold mb-1">방문 예정일</label><input type="date" className="w-full border p-2 rounded" value={editingItem.visitDate} onChange={e=>setEditingItem({...editingItem, visitDate:e.target.value})}/></div>
                                    <div><label className="block text-xs font-bold mb-1">모집 마감일</label><input type="date" className="w-full border p-2 rounded" value={editingItem.deadline} onChange={e=>setEditingItem({...editingItem, deadline:e.target.value})}/></div>
                                    <div><label className="block text-xs font-bold mb-1">리더 이름 (표시용)</label><input className="w-full border p-2 rounded" value={editingItem.leaderName} onChange={e=>setEditingItem({...editingItem, leaderName:e.target.value})}/></div>
                                    <div><label className="block text-xs font-bold mb-1">시작 인원</label><input type="number" className="w-full border p-2 rounded" value={editingItem.currentCount} onChange={e=>setEditingItem({...editingItem, currentCount:Number(e.target.value)})}/></div>
                                </div>
                            </div>
                        )}
                         {modalType === 'product' && (
                             <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1">카테고리</label>
                                        <select className="w-full border p-2 rounded" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                                            <option value="미지정">선택하세요</option>
                                            {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-1">* 카테고리 관리에서 생성한 항목만 선택 가능합니다. <br/>순서: 카테고리 생성 &rarr; 상품 등록</p>
                                    </div>
                                    <div><label className="block text-xs font-bold mb-1">상품명</label><input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold mb-1">가격 (KRW)</label><input type="number" className="w-full border p-2 rounded" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} /></div>
                                    <div><label className="block text-xs font-bold mb-1">짧은 설명 (카드 표시용)</label><input className="w-full border p-2 rounded" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6"><div className="border p-4 rounded-xl bg-gray-50"><label className="block text-xs font-bold mb-2">대표 이미지</label><div className="flex items-center gap-4">{editingItem.image ? (<img src={editingItem.image} className="w-20 h-20 object-cover rounded-lg border" />) : (<div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No Image</div>)}<label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50">변경<input type="file" className="hidden" onChange={handleMainImageUpload} /></label></div></div><div className="border p-4 rounded-xl bg-gray-50 relative">{uploadingImg && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl"><RefreshCw className="animate-spin text-blue-500"/></div>}<label className="block text-xs font-bold mb-2">추가 이미지 (갤러리)</label><div className="flex flex-wrap gap-2 mb-2">{galleryImages.map((img, idx) => (<div key={idx} className="relative w-16 h-16 group"><img src={img} className="w-full h-full object-cover rounded-lg border" /><button onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button></div>))}<label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"><Plus size={20} className="text-gray-400"/><input type="file" className="hidden" multiple onChange={handleGalleryUpload} /></label></div></div></div>
                                <div><label className="block text-xs font-bold mb-2">포함 내역 (옵션)</label><div className="flex flex-wrap gap-2 mb-2">{(editingItem.items || []).map((item: string, idx: number) => (<span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">{item}<button onClick={() => {const newItems = [...(editingItem.items || [])]; newItems.splice(idx, 1); setEditingItem({...editingItem, items: newItems});}}><X size={12}/></button></span>))}</div><div className="flex gap-2"><input id="newItemInput" className="border p-2 rounded text-sm flex-1" placeholder="예: 픽업 서비스, 통역 포함" onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault(); const val = e.currentTarget.value.trim(); if (val) {setEditingItem({...editingItem, items: [...(editingItem.items||[]), val]}); e.currentTarget.value = '';}}}} /><button type="button" onClick={() => {const input = document.getElementById('newItemInput') as HTMLInputElement; if(input.value.trim()) {setEditingItem({...editingItem, items: [...(editingItem.items||[]), input.value.trim()]}); input.value = '';}}} className="bg-gray-200 px-4 py-2 rounded font-bold text-xs">추가</button></div></div>
                                <div><label className="block text-xs font-bold mb-2">상세 본문 (이미지/텍스트)</label><RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} /></div>
                             </div>
                         )}

                         {/* PACKAGE EDITOR */}
                         {modalType === 'package' && (
                             <div className="flex gap-6 h-[500px]">
                                 {/* Left: Settings */}
                                 <div className="w-1/2 space-y-4">
                                     <div>
                                         <label className="block text-xs font-bold mb-1">패키지 이름 (한글/영문)</label>
                                         <input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} placeholder="예: K-VIP All-in-One"/>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold mb-1">간단 설명</label>
                                         <input className="w-full border p-2 rounded" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} placeholder="예: 건강검진 + 뷰티 풀코스"/>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold mb-1">디자인 테마</label>
                                         <div className="flex gap-2">
                                             {['mint', 'yellow', 'orange'].map(theme => (
                                                 <button 
                                                    key={theme} 
                                                    onClick={() => setEditingItem({...editingItem, theme})} 
                                                    className={`w-8 h-8 rounded-full border-2 ${editingItem.theme === theme ? 'border-black scale-110' : 'border-transparent'} ${theme === 'mint' ? 'bg-[#40E0D0]' : theme === 'yellow' ? 'bg-[#FFD700]' : 'bg-[#FFB800]'}`}
                                                 />
                                             ))}
                                         </div>
                                     </div>
                                     <div className="bg-gray-50 p-4 rounded-xl space-y-2 mt-auto">
                                         <div className="flex justify-between text-sm"><span>선택 상품 합계 (정가)</span><span className="font-bold line-through text-gray-400">₩ {getPackageTotal().toLocaleString()}</span></div>
                                         <div className="flex justify-between items-center">
                                             <label className="text-sm font-bold">최종 할인가 (판매가)</label>
                                             <input type="number" className="w-32 border p-1 rounded text-right font-black" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})}/>
                                         </div>
                                         <div className="text-right text-red-500 font-bold text-xs">
                                             {getPackageTotal() > 0 ? Math.round(((getPackageTotal() - editingItem.price) / getPackageTotal()) * 100) : 0}% 할인 적용됨
                                         </div>
                                     </div>
                                 </div>

                                 {/* Right: Product Selector */}
                                 <div className="w-1/2 border border-gray-200 rounded-xl flex flex-col overflow-hidden">
                                     <div className="bg-gray-50 p-3 text-xs font-bold border-b border-gray-200">패키지 구성 상품 선택 ({editingItem.items?.length || 0}개)</div>
                                     <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                         {products.map(prod => {
                                             const isSelected = (editingItem.selectedProductIds || []).includes(prod.id);
                                             return (
                                                 <div key={prod.id} onClick={() => togglePackageItem(prod)} className={`p-2 rounded cursor-pointer border flex items-center gap-2 ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                                         {isSelected && <CheckCircle2 size={12} className="text-white"/>}
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <div className="text-xs font-bold truncate">{prod.title}</div>
                                                         <div className="text-[10px] text-gray-500">₩ {parsePrice(prod.price || prod.priceVal).toLocaleString()}</div>
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             </div>
                         )}

                         {modalType === 'coupon' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold mb-1">쿠폰명</label><input className="w-full border p-2 rounded" value={editingItem.name} onChange={e=>setEditingItem({...editingItem, name:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold mb-1">코드</label><input className="w-full border p-2 rounded bg-gray-50" value={editingItem.code || Math.random().toString(36).substr(2,8).toUpperCase()} onChange={e=>setEditingItem({...editingItem, code:e.target.value})}/></div>
                                <div><label className="block text-xs font-bold mb-1">타입</label><select className="w-full border p-2 rounded" value={editingItem.type} onChange={e=>setEditingItem({...editingItem, type:e.target.value})}><option value="percent">% 할인</option><option value="fixed">정액 할인</option></select></div>
                                <div><label className="block text-xs font-bold mb-1">값</label><input type="number" className="w-full border p-2 rounded" value={editingItem.value} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})}/></div>
                                <div><label className="block text-xs font-bold mb-1">최대 수량</label><input type="number" className="w-full border p-2 rounded" value={editingItem.maxUsage} onChange={e=>setEditingItem({...editingItem, maxUsage:Number(e.target.value)})}/></div>
                            </div>
                        )}
                    </div>
                    {modalType !== 'reservation_detail' && (
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <button onClick={()=>setModalType(null)} className="px-4 py-2 font-bold text-gray-500">취소</button>
                            <button onClick={saveItem} className="bg-black text-white px-6 py-2 rounded font-bold flex items-center gap-2">{uploadingImg?<RefreshCw className="animate-spin" size={16}/>:<Save size={16}/>} 저장하기</button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
