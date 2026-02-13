
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
          price: parsePrice(item.priceMale || item.price || item.priceVal),
          category: item.category || '미지정'
      }));
      const rawPackages = packages.map(item => ({ 
          ...item, 
          type: 'package', 
          category: '올인원패키지', 
          _coll: 'cms_packages', 
          price: parsePrice(item.priceMale || item.price) 
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
          payload.priceMale = parsePrice(editingItem.priceMale);
          payload.priceFemale = parsePrice(editingItem.priceFemale);
      }
      
      if (modalType === 'package') {
          payload.priceMale = parsePrice(editingItem.priceMale);
          payload.priceFemale = parsePrice(editingItem.priceFemale);
      }

      if (modalType === 'category' && typeof payload.keywords === 'string') {
          payload.keywords = payload.keywords.split(',').map((k:string) => k.trim()).filter((k:string) => k);
      }
      
      delete payload._coll;
      delete payload.type;

      try {
          if (editingItem.id) {
              await updateDoc(doc(db, col, editingItem.id), { ...payload, updatedAt: serverTimestamp() });
              showToast("저장되었습니다.");
          } else {
              await addDoc(collection(db, col), { ...payload, createdAt: serverTimestamp() });
              showToast("저장되었습니다.");
          }
          setModalType(null);
      } catch(e: any) { 
          showToast("저장 실패: " + e.message, 'error'); 
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
          }
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

      setEditingItem({
          ...editingItem,
          selectedProductIds: newSelectedIds,
          items: newItems
      });
  };

  const getPackageTotal = (gender: 'male' | 'female' = 'male') => {
      if (!editingItem?.selectedProductIds) return 0;
      return editingItem.selectedProductIds.reduce((sum: number, id: string) => {
          const p = products.find(prod => prod.id === id);
          const price = gender === 'male' ? parsePrice(p?.priceMale || p?.price || p?.priceVal) : parsePrice(p?.priceFemale || p?.price || p?.priceVal);
          return sum + price;
      }, 0);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] font-sans text-[#333]">
        {toast && <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-bold flex items-center gap-2 ${toast.type==='success'?'bg-black':toast.type==='error'?'bg-red-500':'bg-blue-500'}`}>{toast.msg}</div>}

        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed">
            <div className="h-16 flex items-center px-6 font-black text-xl text-[#0070F0]">K-ADMIN</div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                    {id:'dashboard', label:'대시보드', icon:LayoutDashboard},
                    {id:'reservations', label:'예약 관리', icon:ShoppingCart},
                    {id:'products', label:'상품/카테고리 관리', icon:Package},
                    {id:'groupbuys', label:'공동구매', icon:Megaphone},
                    {id:'coupons', label:'쿠폰 관리', icon:Ticket},
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
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold mb-2">총 매출</h3>
                            <p className="text-2xl font-black">₩ {stats.revenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-gray-500 text-xs font-bold mb-2">예약 건수</h3>
                            <p className="text-2xl font-black">{stats.orders}건</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="flex gap-4 border-b border-gray-200 pb-1">
                        <button onClick={() => setProductSubTab('categories')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'categories' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>카테고리</button>
                        <button onClick={() => setProductSubTab('items')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'items' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>일반 상품</button>
                        <button onClick={() => setProductSubTab('packages')} className={`px-4 py-2 font-bold text-sm ${productSubTab === 'packages' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400'}`}>패키지 (MD)</button>
                    </div>

                    {productSubTab === 'items' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black">상품 목록</h2>
                                <button onClick={()=>{setEditingItem({category:'건강검진', priceMale:0, priceFemale:0}); setGalleryImages([]); setModalType('product');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 상품 등록</button>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {filteredProducts.filter(p => p.type !== 'package').map(p => (
                                    <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm group">
                                        <div className="h-40 bg-gray-100 relative">
                                            <img src={p.image} className="w-full h-full object-cover"/>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold truncate mb-1">{p.title}</h4>
                                            <div className="flex flex-col text-xs text-gray-500 mb-3">
                                                <span>남성: ₩{(p.priceMale || p.price).toLocaleString()}</span>
                                                <span>여성: ₩{(p.priceFemale || p.price).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={()=>{setEditingItem(p); setGalleryImages(p.images||[]); setModalType('product');}} className="text-blue-500"><Edit2 size={16}/></button>
                                                <button onClick={()=>deleteItem(p._coll, p.id)} className="text-red-500"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {productSubTab === 'packages' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black">패키지 구성</h2>
                                <button onClick={() => { setEditingItem({ title: '', items: [], theme: 'mint', priceMale: 0, priceFemale: 0, selectedProductIds: [] }); setModalType('package'); }} className="bg-black text-white px-4 py-2 rounded font-bold text-sm">+ 패키지 추가</button>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 relative group">
                                        <div className="p-6">
                                            <h3 className="font-black text-lg mb-2">{pkg.title}</h3>
                                            <div className="text-sm text-gray-500 space-y-1 mb-4">
                                                <p>남성: ₩{(pkg.priceMale || pkg.price).toLocaleString()}</p>
                                                <p>여성: ₩{(pkg.priceFemale || pkg.price).toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setEditingItem(pkg); setModalType('package'); }} className="text-blue-500"><Edit2 size={16}/></button>
                                                <button onClick={() => deleteItem('cms_packages', pkg.id)} className="text-red-500"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>

        {modalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg">{modalType.toUpperCase()} EDITOR</h3>
                        <button onClick={()=>setModalType(null)}><X/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 space-y-6">
                        {modalType === 'product' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold mb-1">상품명</label>
                                        <input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-blue-600">남성 가격 (KRW)</label>
                                        <input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-pink-600">여성 가격 (KRW)</label>
                                        <input type="number" className="w-full border p-2 rounded font-bold" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="border p-4 rounded-xl bg-gray-50"><label className="block text-xs font-bold mb-2">대표 이미지</label><div className="flex items-center gap-4">{editingItem.image ? (<img src={editingItem.image} className="w-20 h-20 object-cover rounded-lg border" />) : (<div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No Image</div>)}<label className="cursor-pointer bg-white border border-gray-300 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50">변경<input type="file" className="hidden" onChange={handleMainImageUpload} /></label></div></div>
                                <div><label className="block text-xs font-bold mb-2">상세 본문</label><RichTextEditor value={editingItem.content || ''} onChange={(val) => setEditingItem({...editingItem, content: val})} /></div>
                            </div>
                        )}

                        {modalType === 'package' && (
                             <div className="flex gap-6 h-[500px]">
                                 <div className="w-1/2 space-y-4">
                                     <div>
                                         <label className="block text-xs font-bold mb-1">패키지 이름</label>
                                         <input className="w-full border p-2 rounded" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                                     </div>
                                     <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl">
                                         <div>
                                             <label className="block text-[10px] font-bold text-gray-400">남성 정가 합계</label>
                                             <p className="font-bold text-gray-400 line-through">₩ {getPackageTotal('male').toLocaleString()}</p>
                                             <label className="block text-xs font-bold text-blue-600 mt-2">남성 할인가 (판매가)</label>
                                             <input type="number" className="w-full border p-2 rounded font-black" value={editingItem.priceMale} onChange={e => setEditingItem({...editingItem, priceMale: Number(e.target.value)})}/>
                                         </div>
                                         <div>
                                             <label className="block text-[10px] font-bold text-gray-400">여성 정가 합계</label>
                                             <p className="font-bold text-gray-400 line-through">₩ {getPackageTotal('female').toLocaleString()}</p>
                                             <label className="block text-xs font-bold text-pink-600 mt-2">여성 할인가 (판매가)</label>
                                             <input type="number" className="w-full border p-2 rounded font-black" value={editingItem.priceFemale} onChange={e => setEditingItem({...editingItem, priceFemale: Number(e.target.value)})}/>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="w-1/2 border border-gray-200 rounded-xl flex flex-col overflow-hidden">
                                     <div className="bg-gray-50 p-3 text-xs font-bold border-b">패키지 구성 상품 선택</div>
                                     <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                         {products.map(prod => (
                                             <div key={prod.id} onClick={() => togglePackageItem(prod)} className={`p-2 rounded cursor-pointer border flex items-center gap-2 ${(editingItem.selectedProductIds || []).includes(prod.id) ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                                                 <div className="flex-1 text-xs">
                                                     <div className="font-bold truncate">{prod.title}</div>
                                                     <div className="text-[10px] text-gray-500">M: {parsePrice(prod.priceMale || prod.price).toLocaleString()} / F: {parsePrice(prod.priceFemale || prod.price).toLocaleString()}</div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
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
