
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

  const [searchTerm, setSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSubTab, setProductSubTab] = useState<'categories' | 'items' | 'packages'>('categories'); 
  const [reservationView, setReservationView] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [modalType, setModalType] = useState<string | null>(null); 
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'}|null>(null);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);

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
          priceMale: parsePrice(item.priceMale || item.priceVal || item.price),
          priceFemale: parsePrice(item.priceFemale || item.priceVal || item.price),
          category: item.category || '미지정'
      }));
      const rawPackages = packages.map(item => ({ 
          ...item, 
          type: 'package', 
          category: '올인원패키지', 
          _coll: 'cms_packages', 
          priceMale: parsePrice(item.priceMale || item.price),
          priceFemale: parsePrice(item.priceFemale || item.price)
      }));
      return [...rawProducts, ...rawPackages];
  }, [products, packages]);

  const filteredProducts = useMemo(() => {
      let data = allProducts;
      if (productCategoryFilter !== 'all') {
          data = data.filter(p => p.category === productCategoryFilter);
      }
      return data;
  }, [allProducts, productCategoryFilter]);

  const stats = useMemo(() => {
      const revenue = reservations.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
      return { revenue, orders: reservations.length, users: users.length };
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

  const updateReservationStatus = async (id: string, status: string) => {
      if (!window.confirm(`예약 상태를 '${status}'(으)로 변경하시겠습니까?`)) return;
      try {
          await updateDoc(doc(db, "reservations", id), { status });
          showToast(`상태가 변경되었습니다.`);
          if (modalType === 'reservation_detail') setModalType(null);
      } catch (e) { showToast("변경 실패", 'error'); }
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
      }
      
      // Male/Female price sanitization
      if (modalType === 'product' || modalType === 'package') {
          payload.priceMale = parsePrice(editingItem.priceMale);
          payload.priceFemale = parsePrice(editingItem.priceFemale);
          // For legacy compatibility
          payload.priceVal = payload.priceMale; 
      }

      if (modalType === 'category' && typeof payload.keywords === 'string') {
          payload.keywords = payload.keywords.split(',').map((k:string) => k.trim()).filter((k:string) => k);
      }
      
      delete payload._coll;
      delete payload.type;

      try {
          if (editingItem.id) {
              await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
          } else {
              await addDoc(collection(db, col), { ...payload, createdAt: serverTimestamp() });
          }
          showToast("저장되었습니다.");
          setModalType(null);
      } catch(e: any) { 
          showToast("저장 실패", 'error'); 
      }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setUploadingImg(true);
              const url = await uploadImage(file, 'main_images');
              setEditingItem((prev: any) => ({ ...prev, image: url }));
          } catch (error) { showToast("이미지 업로드 실패", 'error'); }
          finally { setUploadingImg(false); e.target.value = ''; }
      }
  };

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

      // Calculate MSRPs
      const msrpMale = newSelectedIds.reduce((sum, id) => {
          const p = products.find(x => x.id === id);
          return sum + parsePrice(p?.priceMale || p?.priceVal);
      }, 0);
      const msrpFemale = newSelectedIds.reduce((sum, id) => {
          const p = products.find(x => x.id === id);
          return sum + parsePrice(p?.priceFemale || p?.priceVal);
      }, 0);

      const discountRate = editingItem.discountRate || 0;

      setEditingItem({
          ...editingItem,
          selectedProductIds: newSelectedIds,
          items: newItems,
          msrpMale,
          msrpFemale,
          priceMale: Math.round(msrpMale * (1 - discountRate / 100)),
          priceFemale: Math.round(msrpFemale * (1 - discountRate / 100))
      });
  };

  const updatePackageDiscount = (rate: number) => {
      const msrpM = editingItem.msrpMale || 0;
      const msrpF = editingItem.msrpFemale || 0;
      setEditingItem({
          ...editingItem,
          discountRate: rate,
          priceMale: Math.round(msrpM * (1 - rate / 100)),
          priceFemale: Math.round(msrpF * (1 - rate / 100))
      });
  };

  const handleGroupBuyProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pid = e.target.value;
      const prod = allProducts.find(p => p.id === pid);
      if (prod) {
          setEditingItem({
              ...editingItem,
              productId: prod.id,
              productName: prod.title || prod.productName,
              productImage: prod.image || '',
              priceMale: prod.priceMale,
              priceFemale: prod.priceFemale,
              originalPrice: prod.priceMale // Keep for legacy
          });
      }
  };

  const renderCalendar = () => {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border-b border-r border-gray-200"></div>);
      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRes = reservations.filter(r => r.date === dateStr);
          days.push(
              <div key={day} className="h-32 border-b border-r border-gray-200 p-2 relative group hover:bg-blue-50/30">
                  <span className="text-sm font-bold text-gray-700">{day}</span>
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                      {dayRes.map(res => (
                          <div key={res.id} onClick={() => { setEditingItem(res); setModalType('reservation_detail'); }} className="text-[10px] px-2 py-1 rounded cursor-pointer truncate font-medium border bg-white shadow-sm">
                              {res.options?.guests?.[0]?.name || 'Guest'}
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      return days;
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {toast && <div className={`fixed top-4 right-4 z-[9999] px-4 py-2 rounded shadow-lg text-white font-bold bg-black`}>{toast.msg}</div>}

        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0]">K-ADMIN</div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                    {id:'dashboard', label:'대시보드', icon:LayoutDashboard},
                    {id:'reservations', label:'예약 관리', icon:ShoppingCart},
                    {id:'products', label:'상품/카테고리 관리', icon:Package},
                    {id:'groupbuys', label:'공동구매', icon:Megaphone},
                    {id:'coupons', label:'쿠폰 관리', icon:Ticket},
                    {id:'magazine', label:'매거진', icon:BookOpen},
                    {id:'inquiries', label:'1:1 문의', icon:MessageCircle},
                    {id:'users', label:'회원 관리', icon:Users},
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
                    <h2 className="text-2xl font-black">대시보드</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2">총 매출</h3><p className="text-2xl font-black">₩ {stats.revenue.toLocaleString()}</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2">예약 건수</h3><p className="text-2xl font-black">{stats.orders}건</p></div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm"><h3 className="text-gray-500 text-xs font-bold mb-2">회원 수</h3><p className="text-2xl font-black">{stats.users}명</p></div>
                    </div>
                </div>
            )}

            {activeTab === 'reservations' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-black flex items-center gap-2"><ShoppingCart className="text-[#0070F0]"/> 예약 관리</h2></div>
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">날짜</th><th className="p-4">상품명</th><th className="p-4">예약자</th><th className="p-4">금액</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y">
                                {reservations.map(res => (
                                    <tr key={res.id} className="hover:bg-gray-50">
                                        <td className="p-4">{res.date}</td>
                                        <td className="p-4 font-bold">{res.productName}</td>
                                        <td className="p-4">{res.options?.guests?.[0]?.name || res.userId}</td>
                                        <td className="p-4">₩{Number(res.totalPrice).toLocaleString()}</td>
                                        <td className="p-4"><StatusBadge status={res.status}/></td>
                                        <td className="p-4"><button onClick={() => { setEditingItem(res); setModalType('reservation_detail'); }} className="text-gray-400 hover:text-black"><MoreHorizontal size={20}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="flex gap-4 border-b border-gray-200 pb-1">
                        {['categories', 'items', 'packages'].map(tab => (
                            <button key={tab} onClick={() => setProductSubTab(tab as any)} className={`px-4 py-2 font-bold text-sm ${productSubTab === tab ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>
                                {tab === 'categories' ? '카테고리' : tab === 'items' ? '상품 목록' : '패키지 구성'}
                            </button>
                        ))}
                    </div>

                    {productSubTab === 'categories' && (
                        <div className="grid grid-cols-4 gap-6">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-white rounded-xl shadow-sm border p-4 group relative">
                                    <div className="h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                        <img src={cat.image} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold">{cat.label}</h3>
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => { setEditingItem(cat); setModalType('category'); }} className="bg-white p-1 rounded shadow"><Edit2 size={14}/></button>
                                        <button onClick={() => deleteItem('cms_categories', cat.id)} className="bg-white p-1 rounded shadow text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setEditingItem({}); setModalType('category'); }} className="border-2 border-dashed rounded-xl flex items-center justify-center h-48 text-gray-400 hover:bg-gray-50"><Plus size={32}/></button>
                        </div>
                    )}

                    {productSubTab === 'items' && (
                        <div className="grid grid-cols-4 gap-4">
                            {allProducts.filter(p => p.type !== 'package').map(p => (
                                <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                    <img src={p.image} className="h-40 w-full object-cover"/>
                                    <div className="p-4">
                                        <h4 className="font-bold truncate">{p.title}</h4>
                                        <p className="text-xs text-blue-600 font-bold mb-2">M: ₩{p.priceMale.toLocaleString()} / F: ₩{p.priceFemale.toLocaleString()}</p>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={()=>{setEditingItem(p); setModalType('product');}} className="text-blue-500"><Edit2 size={16}/></button>
                                            <button onClick={()=>deleteItem('products', p.id)} className="text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={()=>{setEditingItem({priceMale:0, priceFemale:0}); setModalType('product');}} className="border-2 border-dashed rounded-xl flex items-center justify-center h-56 text-gray-400 hover:bg-gray-50"><Plus size={32}/></button>
                        </div>
                    )}

                    {productSubTab === 'packages' && (
                        <div className="grid grid-cols-3 gap-6">
                            {packages.map((pkg) => (
                                <div key={pkg.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border p-6">
                                    <h3 className="font-black text-xl mb-4">{pkg.title}</h3>
                                    <p className="text-sm font-bold text-red-500 mb-4">{pkg.discountRate || 0}% 할인 적용 중</p>
                                    <div className="flex justify-between items-end border-t pt-4">
                                        <div className="text-xs text-gray-400">최종 할인가<br/><span className="text-sm font-bold text-black">M: ₩{pkg.priceMale?.toLocaleString()} / F: ₩{pkg.priceFemale?.toLocaleString()}</span></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingItem(pkg); setModalType('package'); }} className="text-blue-500"><Edit2 size={18}/></button>
                                            <button onClick={() => deleteItem('cms_packages', pkg.id)} className="text-red-500"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setEditingItem({ selectedProductIds: [], discountRate: 0, priceMale:0, priceFemale:0 }); setModalType('package'); }} className="border-2 border-dashed rounded-2xl flex items-center justify-center h-64 text-gray-400 hover:bg-gray-50"><Plus size={32}/></button>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'groupbuys' && (
                <div className="grid grid-cols-3 gap-6">
                    {groupBuys.map(g => (
                        <div key={g.id} className="bg-white rounded-xl shadow border p-6">
                            <h3 className="font-bold mb-2">{g.productName}</h3>
                            <p className="text-xs text-gray-500 mb-4">M: ₩{g.priceMale?.toLocaleString()} / F: ₩{g.priceFemale?.toLocaleString()}</p>
                            <button onClick={()=>deleteItem('group_buys', g.id)} className="text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button onClick={()=>{setEditingItem({}); setModalType('groupbuy');}} className="border-2 border-dashed rounded-xl flex items-center justify-center h-48 text-gray-400 hover:bg-gray-50"><Plus size={32}/></button>
                </div>
            )}
        </main>

        {modalType && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg">{modalType.toUpperCase()} EDITOR</h3>
                        <button onClick={()=>setModalType(null)}><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 space-y-6">
                        {modalType === 'product' && (
                             <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold mb-1">상품명</label><input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                    <div><label className="block text-xs font-bold mb-1">카테고리</label>
                                        <select className="w-full border p-2 rounded" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                                            <option value="미지정">선택</option>
                                            {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl grid grid-cols-2 gap-4 col-span-2">
                                        <div><label className="block text-xs font-bold mb-1">남성 가격 (KRW)</label><input type="number" className="w-full border p-2 rounded bg-white" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})} /></div>
                                        <div><label className="block text-xs font-bold mb-1">여성 가격 (KRW)</label><input type="number" className="w-full border p-2 rounded bg-white" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})} /></div>
                                    </div>
                                    <div className="col-span-2"><label className="block text-xs font-bold mb-1">설명</label><input className="w-full border p-2 rounded" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} /></div>
                                </div>
                                <div className="border p-4 rounded-xl flex items-center gap-4">
                                    {editingItem.image && <img src={editingItem.image} className="w-20 h-20 object-cover rounded border" />}
                                    <label className="cursor-pointer bg-white border px-3 py-1.5 rounded text-xs font-bold">이미지 변경<input type="file" className="hidden" onChange={handleMainImageUpload} /></label>
                                </div>
                                <RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} />
                             </div>
                        )}

                        {modalType === 'package' && (
                             <div className="flex gap-6 h-[500px]">
                                 <div className="w-1/2 space-y-4">
                                     <div><label className="block text-xs font-bold mb-1">패키지 이름</label><input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} /></div>
                                     <div className="bg-gray-100 p-4 rounded-xl space-y-3">
                                         <div className="flex justify-between text-xs font-bold text-gray-400"><span>구성 상품 정가 합계 (MSRP)</span></div>
                                         <div className="flex justify-between text-sm"><span>남성 합계</span><span className="font-bold">₩ {(editingItem.msrpMale || 0).toLocaleString()}</span></div>
                                         <div className="flex justify-between text-sm"><span>여성 합계</span><span className="font-bold">₩ {(editingItem.msrpFemale || 0).toLocaleString()}</span></div>
                                         
                                         <div className="pt-3 border-t">
                                             <label className="block text-xs font-black text-blue-600 mb-2">할인율 설정 (%)</label>
                                             <div className="flex items-center gap-3">
                                                 <input type="range" min="0" max="90" step="5" className="flex-1" value={editingItem.discountRate || 0} onChange={e => updatePackageDiscount(Number(e.target.value))}/>
                                                 <span className="w-12 text-center font-black text-lg">{editingItem.discountRate || 0}%</span>
                                             </div>
                                         </div>

                                         <div className="pt-3 border-t bg-white p-3 rounded-lg border border-blue-100">
                                             <p className="text-[10px] font-bold text-gray-400 mb-1">최종 판매가 (자동 계산)</p>
                                             <div className="flex justify-between mb-1"><span className="text-sm">남성 최종</span><span className="text-lg font-black text-blue-600">₩ {editingItem.priceMale?.toLocaleString()}</span></div>
                                             <div className="flex justify-between"><span className="text-sm">여성 최종</span><span className="text-lg font-black text-pink-600">₩ {editingItem.priceFemale?.toLocaleString()}</span></div>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="w-1/2 border rounded-xl overflow-hidden flex flex-col">
                                     <div className="bg-gray-50 p-3 text-xs font-bold">상품 선택</div>
                                     <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                         {products.map(prod => {
                                             const isSelected = (editingItem.selectedProductIds || []).includes(prod.id);
                                             return (
                                                 <div key={prod.id} onClick={() => togglePackageItem(prod)} className={`p-2 rounded cursor-pointer border flex items-center gap-2 ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'}`}>
                                                     <div className="flex-1">
                                                         <div className="text-xs font-bold">{prod.title}</div>
                                                         <div className="text-[9px] text-gray-400">M: ₩{parsePrice(prod.priceMale || prod.priceVal).toLocaleString()} / F: ₩{parsePrice(prod.priceFemale || prod.priceVal).toLocaleString()}</div>
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             </div>
                        )}

                        {modalType === 'groupbuy' && (
                            <div className="space-y-4">
                                <label className="block text-xs font-bold">상품 선택</label>
                                <select className="w-full border p-2 rounded" onChange={handleGroupBuyProductSelect} value={editingItem.productId}>
                                    <option value="">선택</option>
                                    {allProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold">방문일</label><input type="date" className="w-full border p-2 rounded" value={editingItem.visitDate} onChange={e=>setEditingItem({...editingItem, visitDate:e.target.value})}/></div>
                                    <div><label className="block text-xs font-bold">리더명</label><input className="w-full border p-2 rounded" value={editingItem.leaderName} onChange={e=>setEditingItem({...editingItem, leaderName:e.target.value})}/></div>
                                </div>
                            </div>
                        )}
                        
                        {/* CATEGORY EDITOR */}
                        {modalType === 'category' && (
                             <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                     <div><label className="block text-xs font-bold">카테고리명 (KO)</label><input className="w-full border p-2 rounded" value={editingItem.label} onChange={e=>setEditingItem({...editingItem, label:e.target.value})}/></div>
                                     <div><label className="block text-xs font-bold">Category Name (EN)</label><input className="w-full border p-2 rounded" value={editingItem.labelEn} onChange={e=>setEditingItem({...editingItem, labelEn:e.target.value})}/></div>
                                 </div>
                                 <div className="border p-4 rounded-xl flex items-center gap-4">
                                    {editingItem.image && <img src={editingItem.image} className="w-20 h-20 object-cover rounded border" />}
                                    <label className="cursor-pointer bg-white border px-3 py-1.5 rounded text-xs font-bold">이미지 변경<input type="file" className="hidden" onChange={handleMainImageUpload} /></label>
                                 </div>
                             </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                        <button onClick={()=>setModalType(null)} className="px-4 py-2 font-bold text-gray-500">취소</button>
                        <button onClick={saveItem} className="bg-black text-white px-6 py-2 rounded font-bold">저장하기</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
