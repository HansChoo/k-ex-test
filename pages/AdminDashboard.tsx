
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Users, 
    Search, 
    DollarSign,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Calendar as CalendarIcon,
    Package,
    Plus,
    Edit2,
    Trash2,
    Megaphone,
    X,
    Save,
    RefreshCw,
    Star,
    BarChart3,
    AlertTriangle,
    MessageSquare
} from 'lucide-react';
import { collection, getDocs, query, orderBy, updateDoc, doc, addDoc, deleteDoc, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User, sendPasswordResetEmail } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, logoutUser } from '../services/authService';
import { PRODUCTS } from '../constants';

interface AdminDashboardProps {
  language: 'ko' | 'en';
}

// Updated Product Interface for Detailed CMS
interface ProductType {
    id?: string;
    order?: number; // Sorting Order
    title: string;
    description: string;
    price: string; // Display String e.g. "100,000원"
    priceValue?: number; // Numeric for calculation
    image: string; // Thumbnail
    category: string;
    
    // Detail Page Fields
    detailTopImage?: string; // Top Banner inside detail page
    detailContentImage?: string; // Long description image
    infoText?: string; // Text for 'Notice' tab
    faqText?: string; // Text for 'FAQ' tab
}

// Interface for Main Packages (Basic/Premium)
interface MainPackageType {
    id: string; // 'package_basic' | 'package_premium'
    title: string;
    price: number;
    originalPrice: number;
    description: string;
    features: string[]; // JSON string in DB
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const isEn = language === 'en';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'reservations' | 'products' | 'packages' | 'groupbuys' | 'users'>('dashboard');
  
  // Data States
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [mainPackages, setMainPackages] = useState<MainPackageType[]>([]);
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [productForm, setProductForm] = useState<ProductType>({
      title: '', description: '', price: '', image: '', category: '', order: 99,
      detailTopImage: '', detailContentImage: '', infoText: '', faqText: ''
  });

  const ADMIN_EMAIL = "admin@k-experience.com";
  
  const STATUS_MAP_KO: {[key: string]: string} = {
      'pending': '입금대기',
      'confirmed': '예약확정',
      'cancelled': '취소됨',
      'completed': '이용완료'
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) {
          fetchAllData();
      } else {
          setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async () => {
      setLoading(true);
      try {
        // 1. Reservations & Chart Data
        const resQuery = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
        const resSnap = await getDocs(resQuery);
        const resData = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReservations(resData);

        // Calculate Monthly Revenue
        const revenueByMonth = Array(12).fill(0);
        resData.forEach((r: any) => {
            if (r.status !== 'cancelled' && r.createdAt) {
                const date = new Date(r.createdAt.seconds * 1000);
                const month = date.getMonth(); // 0-11
                revenueByMonth[month] += (Number(r.totalPrice) || 0);
            }
        });
        setMonthlyRevenue(revenueByMonth);

        // 2. Users
        const userQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const userSnap = await getDocs(userQuery);
        const userData = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(userData);

        // 3. Products
        const prodQuery = query(collection(db, "products"), orderBy("order", "asc"));
        const prodSnap = await getDocs(prodQuery);
        const prodData = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductType));
        setProducts(prodData);

        // 4. Main Packages (Basic/Premium)
        const pkgSnap = await getDocs(collection(db, "cms_packages"));
        const pkgData = pkgSnap.docs.map(d => ({ id: d.id, ...d.data() } as MainPackageType));
        setMainPackages(pkgData);

        // 5. Group Buys
        const gbQuery = query(collection(db, "group_buys"), orderBy("createdAt", "desc"));
        const gbSnap = await getDocs(gbQuery);
        const gbData = gbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGroupBuys(gbData);

        // 6. Stats
        const totalRevenue = resData.reduce((acc: number, curr: any) => 
            curr.status !== 'cancelled' ? acc + (Number(curr.totalPrice) || 0) : acc, 0);
        
        setStats({
            revenue: totalRevenue,
            orders: resData.length,
            users: userData.length,
            products: prodData.length
        });

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
  };

  // --- Auth Handlers (Login/Create/Reset) ---
  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setLoginError(null);
      try {
          await loginWithEmail(email, password);
      } catch (error: any) {
          setLoginError({ type: 'error', message: "로그인 실패: " + error.code });
      } finally {
          setAuthLoading(false);
      }
  };

  const createDefaultAdmin = async () => {
      if (!window.confirm("관리자 계정을 생성하시겠습니까?")) return;
      setAuthLoading(true);
      try {
          if (auth.currentUser) await logoutUser();
          await registerWithEmail({
              email: ADMIN_EMAIL,
              password: "admin1234",
              name: "Administrator",
              phone: "010-0000-0000",
              nationality: "Korea"
          });
          setEmail(ADMIN_EMAIL);
          setPassword("admin1234");
          setLoginError({ type: 'success', message: "계정 생성 완료." });
      } catch (error: any) {
          setLoginError({ type: 'error', message: error.message });
      } finally {
          setAuthLoading(false);
      }
  };
  
  const handleResetPassword = async () => {
      if(!email) return alert("이메일을 입력해주세요.");
      try { await sendPasswordResetEmail(auth, email); alert("발송 완료"); } catch(e:any) { alert(e.message); }
  };

  // --- Data Logic ---
  const handleStatusUpdate = async (id: string, newStatus: string) => {
      try {
          await updateDoc(doc(db, "reservations", id), { status: newStatus });
          setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      } catch (e) { alert("상태 변경 실패"); }
  };

  const handleAdminNoteUpdate = async (id: string, note: string) => {
      const newNote = prompt("관리자 메모를 입력하세요:", note);
      if (newNote === null) return;
      try {
          await updateDoc(doc(db, "reservations", id), { adminNote: newNote });
          setReservations(prev => prev.map(r => r.id === id ? { ...r, adminNote: newNote } : r));
      } catch (e) { alert("메모 저장 실패"); }
  };

  // --- Product CRUD ---
  const handleSeedProducts = async () => {
      if (!window.confirm("기본 데이터 8개를 DB로 가져오시겠습니까? 기존 DB 데이터는 유지됩니다.")) return;
      setLoading(true);
      try {
          const batch = writeBatch(db);
          PRODUCTS.forEach((p, idx) => {
              const docRef = doc(collection(db, "products"));
              batch.set(docRef, { ...p, order: idx + 1 });
          });
          await batch.commit();
          await fetchAllData();
          alert("완료! 이제 상품 데이터는 DB에서 영구적으로 관리됩니다.");
      } catch (e) { alert("초기화 실패"); } finally { setLoading(false); }
  };

  const openProductModal = (product?: ProductType) => {
      if (product) {
          setEditingProduct(product);
          setProductForm(product);
      } else {
          setEditingProduct(null);
          setProductForm({ 
              title: '', description: '', price: '', image: '', category: '', order: products.length + 1,
              detailTopImage: '', detailContentImage: '', infoText: '', faqText: ''
          });
      }
      setIsProductModalOpen(true);
  };

  const saveProduct = async () => {
      if(!productForm.title || !productForm.price) return alert("필수 항목 누락");
      setLoading(true);
      try {
          if (editingProduct && editingProduct.id) {
              await updateDoc(doc(db, "products", editingProduct.id), productForm as any);
          } else {
              await addDoc(collection(db, "products"), { ...productForm, createdAt: new Date() });
          }
          setIsProductModalOpen(false);
          await fetchAllData();
      } catch (e) { alert("저장 실패"); } finally { setLoading(false); }
  };

  const deleteProduct = async (id: string) => {
      if (!window.confirm("삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "products", id));
          setProducts(prev => prev.filter(p => p.id !== id));
      } catch (e) { alert("삭제 실패"); }
  };

  // --- Main Package Management ---
  const updatePackage = async (pkg: MainPackageType, field: string, value: any) => {
      try {
          const newPkg = { ...pkg, [field]: value };
          setMainPackages(prev => prev.map(p => p.id === pkg.id ? newPkg : p));
          const ref = doc(db, "cms_packages", pkg.id);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
             await setDoc(ref, newPkg);
          } else {
             await updateDoc(ref, { [field]: value });
          }
      } catch (e) { console.error(e); alert("패키지 업데이트 실패"); }
  };

  const deleteGroupBuy = async (id: string) => {
      if (!window.confirm("삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "group_buys", id));
          setGroupBuys(prev => prev.filter(g => g.id !== id));
      } catch (e) { alert("삭제 실패"); }
  }

  // --- Render Helpers ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-bold"><RefreshCw className="animate-spin mr-2"/> Admin Loading...</div>;
  
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8] px-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                  <h2 className="text-2xl font-black text-center mb-6">관리자 로그인</h2>
                  {loginError && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{loginError.message}</div>}
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full h-12 border rounded px-4" placeholder="admin@k-experience.com"/>
                      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full h-12 border rounded px-4" placeholder="Password"/>
                      <button className="w-full h-12 bg-black text-white rounded font-bold">로그인</button>
                  </form>
                  <button onClick={createDefaultAdmin} className="mt-4 text-xs text-blue-500 underline w-full text-center">초기 계정 생성</button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1e2330] text-white flex-shrink-0 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-700 font-bold text-lg">K-Experience Admin</div>
            <nav className="flex-1 py-6 space-y-1 px-3">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                    { id: 'calendar', icon: CalendarIcon, label: '예약 캘린더' },
                    { id: 'reservations', icon: ShoppingCart, label: '주문/예약 관리' },
                    { id: 'products', icon: Package, label: '일반 상품 관리' },
                    { id: 'packages', icon: Star, label: '메인 패키지 관리' },
                    { id: 'groupbuys', icon: Megaphone, label: '공동구매 관리' },
                    { id: 'users', icon: Users, label: '회원 관리' },
                ].map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button onClick={() => logoutUser()} className="w-full py-2 bg-gray-800 text-xs rounded text-gray-300">로그아웃</button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 capitalize">{activeTab.toUpperCase()}</h2>
                <button onClick={fetchAllData} className="p-2 hover:bg-gray-100 rounded-full"><RefreshCw size={20}/></button>
            </header>

            <div className="flex-1 overflow-auto p-8">
                
                {/* 1. DASHBOARD & CHART */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: '총 매출', val: `₩ ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: '총 예약', val: stats.orders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: '회원수', val: stats.users, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
                                { label: '상품수', val: stats.products, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div><p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p><h3 className="text-2xl font-black">{s.val}</h3></div>
                                    <div className={`w-12 h-12 ${s.bg} rounded-full flex items-center justify-center ${s.color}`}><s.icon size={24} /></div>
                                </div>
                            ))}
                        </div>

                        {/* Dynamic Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                             <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><BarChart3 size={20}/> 2025-2026 월별 매출 추이</h3>
                             <div className="h-64 flex items-end gap-2 md:gap-4 justify-between px-2 md:px-10 border-b border-gray-200 pb-2">
                                 {monthlyRevenue.map((amount, idx) => {
                                     const maxVal = Math.max(...monthlyRevenue, 1);
                                     const heightPercent = (amount / maxVal) * 100;
                                     return (
                                         <div key={idx} className="w-full flex flex-col items-center gap-2 group relative">
                                             <div 
                                                className="w-full max-w-[40px] bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all relative" 
                                                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                             >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                                    ₩{amount.toLocaleString()}
                                                </div>
                                             </div>
                                             <span className="text-xs text-gray-500 font-bold">{idx + 1}월</span>
                                         </div>
                                     );
                                 })}
                             </div>
                        </div>
                    </div>
                )}

                {/* 2. CALENDAR (Simple View) */}
                {activeTab === 'calendar' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-6">예약 일정 (2026년 2월 기준)</h3>
                        <div className="grid grid-cols-7 border-b border-gray-200 pb-2 mb-2 text-center text-sm font-bold text-gray-500">
                            {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                            {Array.from({length: 31}, (_, i) => {
                                const day = i + 1;
                                const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
                                const dayRes = reservations.filter(r => r.date === dateStr);
                                return (
                                    <div key={day} className={`border border-gray-100 rounded p-1 h-24 overflow-hidden ${dayRes.length > 0 ? 'bg-blue-50' : ''}`}>
                                        <span className="text-sm font-bold text-gray-700 ml-1">{day}</span>
                                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">
                                            {dayRes.map((r: any) => (
                                                <div key={r.id} className={`text-[10px] px-1 rounded truncate ${r.status === 'confirmed' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-100'}`}>
                                                    {r.productName}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* 3. RESERVATIONS (Enhanced Status & Note) */}
                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">주문일시</th>
                                    <th className="px-6 py-4">상품명/이용일</th>
                                    <th className="px-6 py-4">결제금액</th>
                                    <th className="px-6 py-4">상태 변경</th>
                                    <th className="px-6 py-4">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reservations.map((res) => {
                                    const statusColor = res.status === 'confirmed' ? 'text-green-600 bg-green-50 border-green-200' : 
                                                      res.status === 'cancelled' ? 'text-red-600 bg-red-50 border-red-200' : 
                                                      'text-yellow-600 bg-yellow-50 border-yellow-200';
                                    return (
                                    <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(res.createdAt?.seconds * 1000).toLocaleDateString()}
                                            <div className="text-xs">{new Date(res.createdAt?.seconds * 1000).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#111]">{res.productName}</div>
                                            <div className="text-xs text-blue-600 font-medium">예약일: {res.date}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">ID: {res.id}</div>
                                            {res.adminNote && (
                                                <div className="mt-2 text-xs bg-gray-100 p-2 rounded flex items-start gap-1">
                                                    <MessageSquare size={12} className="mt-0.5 text-gray-500"/>
                                                    <span className="text-gray-700">{res.adminNote}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold">₩{Number(res.totalPrice).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={res.status}
                                                onChange={(e) => handleStatusUpdate(res.id, e.target.value)}
                                                className={`px-2 py-1.5 rounded border text-xs font-bold focus:outline-none ${statusColor}`}
                                            >
                                                <option value="pending">입금대기 (Pending)</option>
                                                <option value="confirmed">예약확정 (Confirmed)</option>
                                                <option value="completed">이용완료 (Completed)</option>
                                                <option value="cancelled">취소됨 (Cancelled)</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleAdminNoteUpdate(res.id, res.adminNote || '')}
                                                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-bold text-gray-600"
                                            >
                                                메모
                                            </button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. PRODUCTS (Enhanced with Seed Prompt) */}
                {activeTab === 'products' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">일반 상품 관리</h3>
                            <div className="flex gap-2">
                                <button onClick={handleSeedProducts} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <RefreshCw size={16}/> {isEn ? 'Import Defaults' : '기본 상품 DB로 가져오기'}
                                </button>
                                <button onClick={() => openProductModal()} className="px-4 py-2 bg-[#0070F0] text-white rounded font-bold text-sm flex gap-2">
                                    <Plus size={16}/> 상품 등록
                                </button>
                            </div>
                        </div>

                        {/* WARNING ALERT for Initial State */}
                        {products.length === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center mb-6">
                                <AlertTriangle className="mx-auto text-yellow-600 mb-2" size={32} />
                                <h4 className="font-bold text-yellow-800 text-lg mb-2">등록된 상품이 없습니다!</h4>
                                <p className="text-yellow-700 text-sm mb-4">
                                    현재 DB에 상품이 없습니다. 일반 사용자에게는 하드코딩된 기본 상품이 보이지만,<br/>
                                    <strong>관리자가 여기서 새 상품을 1개라도 추가하면 하드코딩된 상품들은 사라지고 DB 상품만 보이게 됩니다.</strong><br/>
                                    기존 상품들이 사라지지 않게 하려면 아래 버튼을 눌러 기본 상품을 DB로 복사하세요.
                                </p>
                                <button onClick={handleSeedProducts} className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors">
                                    기본 상품 8개 DB로 복사하기
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                    <div className="relative h-48 bg-gray-100">
                                        <img src={product.image} className="w-full h-full object-cover"/>
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">No. {product.order}</div>
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openProductModal(product)} className="bg-white p-2 rounded-full shadow hover:text-blue-600"><Edit2 size={14}/></button>
                                            <button onClick={() => deleteProduct(product.id!)} className="bg-white p-2 rounded-full shadow hover:text-red-600"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                                        <h4 className="font-bold truncate">{product.title}</h4>
                                        <div className="text-[#0070F0] font-black mt-2">{product.price}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. MAIN PACKAGES (Basic/Premium) */}
                {activeTab === 'packages' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-6">메인 올인원 패키지 설정</h3>
                        <p className="text-sm text-gray-500 mb-6">※ 베이직/프리미엄 패키지의 가격과 설명을 수정하면 메인화면과 예약페이지에 즉시 반영됩니다.</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {['package_basic', 'package_premium'].map(pkgId => {
                                const pkg = mainPackages.find(p => p.id === pkgId) || {
                                    id: pkgId,
                                    title: pkgId === 'package_basic' ? 'All-in-One Basic' : 'All-in-One Premium',
                                    price: pkgId === 'package_basic' ? 2763000 : 7515000,
                                    originalPrice: pkgId === 'package_basic' ? 3070000 : 8350000,
                                    description: '기본 설명',
                                    features: []
                                };
                                const isBasic = pkgId === 'package_basic';

                                return (
                                    <div key={pkgId} className={`p-6 rounded-xl border-2 ${isBasic ? 'border-blue-100 bg-blue-50' : 'border-yellow-100 bg-yellow-50'}`}>
                                        <h4 className={`text-xl font-black mb-4 ${isBasic ? 'text-blue-700' : 'text-yellow-700'}`}>
                                            {isBasic ? 'BASIC PACKAGE' : 'PREMIUM PACKAGE'}
                                        </h4>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">표시 제목</label>
                                                <input className="w-full p-2 border rounded bg-white" value={pkg.title} onChange={e => updatePackage(pkg, 'title', e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-600 mb-1">할인가 (최종가격)</label>
                                                    <input type="number" className="w-full p-2 border rounded bg-white" value={pkg.price} onChange={e => updatePackage(pkg, 'price', Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-600 mb-1">정상가 (취소선)</label>
                                                    <input type="number" className="w-full p-2 border rounded bg-white" value={pkg.originalPrice} onChange={e => updatePackage(pkg, 'originalPrice', Number(e.target.value))} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">간단 설명 (메인 카드용)</label>
                                                <textarea className="w-full p-2 border rounded bg-white h-20" value={pkg.description} onChange={e => updatePackage(pkg, 'description', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                
                {/* 6. GROUP BUYS */}
                {activeTab === 'groupbuys' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4">공동구매 현황</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr><th>상품</th><th>생성자</th><th>방문일</th><th>참여현황</th><th>관리</th></tr>
                            </thead>
                            <tbody>
                                {groupBuys.map(gb => (
                                    <tr key={gb.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-bold">{gb.product} <span className="text-xs font-normal text-gray-500">({gb.type})</span></td>
                                        <td className="p-3">{gb.creatorName}</td>
                                        <td className="p-3 text-blue-600 font-bold">{gb.visitDate}</td>
                                        <td className="p-3">{gb.currentCount}/{gb.maxCount}명</td>
                                        <td className="p-3"><button onClick={() => deleteGroupBuy(gb.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* 7. USERS */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4">가입 회원</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500"><tr><th>이름</th><th>이메일</th><th>연락처</th><th>국적</th><th>가입일</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b">
                                        <td className="p-3 font-bold">{u.name}</td>
                                        <td className="p-3">{u.email}</td>
                                        <td className="p-3">{u.phone}</td>
                                        <td className="p-3">{u.nationality}</td>
                                        <td className="p-3 text-gray-400">{u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>

        {/* --- PRODUCT MODAL --- */}
        {isProductModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="font-bold text-lg">{editingProduct ? '상품 수정' : '새 상품 등록'}</h3>
                        <button onClick={() => setIsProductModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">노출 순서 (낮을수록 앞쪽)</label>
                                <input type="number" className="w-full border rounded p-2" value={productForm.order} onChange={e => setProductForm({...productForm, order: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label>
                                <input type="text" className="w-full border rounded p-2" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} placeholder="K-IDOL, 뷰티시술..." />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">상품명</label>
                            <input type="text" className="w-full border rounded p-2" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">표시 가격 (문자열)</label>
                                <input type="text" className="w-full border rounded p-2" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="100,000원" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">썸네일 이미지 URL</label>
                                <input type="text" className="w-full border rounded p-2" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">간단 설명</label>
                            <input type="text" className="w-full border rounded p-2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                        </div>

                        {/* Detail Page CMS Fields */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><LayoutDashboard size={14}/> 상세 페이지 설정 (CMS)</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">상세페이지 상단 배너 이미지 URL</label>
                                    <input type="text" className="w-full border rounded p-2 bg-white" value={productForm.detailTopImage || ''} onChange={e => setProductForm({...productForm, detailTopImage: e.target.value})} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">상세 내용 통이미지 URL (긴 이미지)</label>
                                    <input type="text" className="w-full border rounded p-2 bg-white" value={productForm.detailContentImage || ''} onChange={e => setProductForm({...productForm, detailContentImage: e.target.value})} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">[안내사항] 탭 내용 (텍스트)</label>
                                    <textarea className="w-full border rounded p-2 bg-white h-20" value={productForm.infoText || ''} onChange={e => setProductForm({...productForm, infoText: e.target.value})} placeholder="예약 취소 규정 등..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">[FAQ] 탭 내용 (텍스트)</label>
                                    <textarea className="w-full border rounded p-2 bg-white h-20" value={productForm.faqText || ''} onChange={e => setProductForm({...productForm, faqText: e.target.value})} placeholder="Q. 질문\nA. 답변" />
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 sticky bottom-0">
                        <button onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm">취소</button>
                        <button onClick={saveProduct} className="px-6 py-2 bg-[#0070F0] text-white rounded font-bold text-sm">저장</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
