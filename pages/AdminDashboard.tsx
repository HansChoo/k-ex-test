
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Users, 
    Settings, 
    Search, 
    Bell, 
    TrendingUp,
    DollarSign,
    Lock,
    ShieldAlert,
    Eye,
    EyeOff,
    AlertCircle,
    Mail,
    Calendar as CalendarIcon,
    Package,
    Plus,
    Edit2,
    Trash2,
    Megaphone,
    X,
    Save,
    RefreshCw,
    CheckCircle
} from 'lucide-react';
import { collection, getDocs, query, orderBy, updateDoc, doc, addDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User, sendPasswordResetEmail } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, logoutUser } from '../services/authService';
import { PRODUCTS, PRODUCTS_EN } from '../constants'; // For initial seeding

interface AdminDashboardProps {
  language: 'ko' | 'en';
}

// --- Types ---
interface ProductType {
    id?: string;
    title: string;
    description: string;
    price: string;
    image: string;
    category: string;
    isRecommended?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const isEn = language === 'en';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'reservations' | 'products' | 'groupbuys' | 'users'>('dashboard');
  
  // Data States
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [productForm, setProductForm] = useState<ProductType>({
      title: '', description: '', price: '', image: '', category: ''
  });

  const ADMIN_EMAIL = "admin@k-experience.com";

  // --- Initialization ---
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
        // 1. Reservations
        const resQuery = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
        const resSnap = await getDocs(resQuery);
        const resData = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReservations(resData);

        // 2. Users
        const userQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const userSnap = await getDocs(userQuery);
        const userData = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(userData);

        // 3. Products
        const prodQuery = query(collection(db, "products")); // No order for simplicity, or add createdAt
        const prodSnap = await getDocs(prodQuery);
        const prodData = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductType));
        setProducts(prodData);

        // 4. Group Buys
        const gbQuery = query(collection(db, "group_buys"), orderBy("createdAt", "desc"));
        const gbSnap = await getDocs(gbQuery);
        const gbData = gbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGroupBuys(gbData);

        // 5. Stats
        const totalRevenue = resData.reduce((acc: number, curr: any) => acc + (Number(curr.totalPrice) || 0), 0);
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

  // --- Auth Handlers ---
  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setLoginError(null);
      try {
          await loginWithEmail(email, password);
      } catch (error: any) {
          let msg = error.message;
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') msg = "비밀번호가 올바르지 않습니다.";
          else if (error.code === 'auth/user-not-found') msg = "계정을 찾을 수 없습니다.";
          setLoginError({ type: 'error', message: msg });
      } finally {
          setAuthLoading(false);
      }
  };

  const createDefaultAdmin = async () => {
      if (!window.confirm("기본 관리자 계정(admin@k-experience.com)을 생성하시겠습니까?")) return;
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
          setLoginError({ type: 'success', message: "계정 생성 완료. 로그인해주세요." });
      } catch (error: any) {
          setLoginError({ type: 'error', message: error.message });
      } finally {
          setAuthLoading(false);
      }
  };

  const handleResetPassword = async () => {
      if(!email) return alert("이메일을 입력해주세요.");
      try {
          await sendPasswordResetEmail(auth, email);
          alert("비밀번호 재설정 메일을 보냈습니다.");
      } catch(e:any) { alert(e.message); }
  };

  // --- Data Handlers ---
  const handleStatusUpdate = async (id: string, newStatus: string) => {
      try {
          await updateDoc(doc(db, "reservations", id), { status: newStatus });
          setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      } catch (e) { alert("업데이트 실패"); }
  };

  // --- Product Management Handlers ---
  const handleSeedProducts = async () => {
      if (!window.confirm("기존 상수 데이터(constants.ts)를 Firebase로 복사하시겠습니까? 중복될 수 있습니다.")) return;
      setLoading(true);
      try {
          const batch = writeBatch(db);
          // Use KO products for default DB population
          PRODUCTS.forEach(p => {
              const docRef = doc(collection(db, "products"));
              batch.set(docRef, { ...p, price: p.price.toString() }); // Ensure string price
          });
          await batch.commit();
          await fetchAllData();
          alert("상품 데이터 가져오기 완료!");
      } catch (e) {
          console.error(e);
          alert("데이터 가져오기 실패");
      } finally {
          setLoading(false);
      }
  };

  const openProductModal = (product?: ProductType) => {
      if (product) {
          setEditingProduct(product);
          setProductForm(product);
      } else {
          setEditingProduct(null);
          setProductForm({ title: '', description: '', price: '', image: '', category: '' });
      }
      setIsProductModalOpen(true);
  };

  const saveProduct = async () => {
      if(!productForm.title || !productForm.price) return alert("상품명과 가격은 필수입니다.");
      
      setLoading(true);
      try {
          if (editingProduct && editingProduct.id) {
              // Edit
              await updateDoc(doc(db, "products", editingProduct.id), productForm as any);
          } else {
              // Create
              await addDoc(collection(db, "products"), {
                  ...productForm,
                  createdAt: new Date()
              });
          }
          setIsProductModalOpen(false);
          await fetchAllData();
      } catch (e) {
          console.error(e);
          alert("저장 실패");
      } finally {
          setLoading(false);
      }
  };

  const deleteProduct = async (id: string) => {
      if (!window.confirm("정말 삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "products", id));
          setProducts(prev => prev.filter(p => p.id !== id));
      } catch (e) { alert("삭제 실패"); }
  };
  
  const deleteGroupBuy = async (id: string) => {
      if (!window.confirm("이 공동구매를 삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "group_buys", id));
          setGroupBuys(prev => prev.filter(g => g.id !== id));
      } catch (e) { alert("삭제 실패"); }
  }


  // --- RENDER: LOADING ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold"><RefreshCw className="animate-spin mr-2"/> Admin Loading...</div>;

  // --- RENDER: LOGIN ---
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8] px-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0070F0]">
                          <Lock size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-gray-900">{isEn ? 'Admin Access' : '관리자 로그인'}</h2>
                  </div>
                  {loginError && (
                      <div className={`mb-6 p-4 rounded-lg text-sm flex items-start gap-2 ${loginError.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          <AlertCircle size={16} className="mt-0.5" />
                          <span>{loginError.message}</span>
                      </div>
                  )}
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 border rounded-lg px-4 bg-gray-50" placeholder="admin@k-experience.com"/>
                      </div>
                      <div className="relative">
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Password</label>
                          <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 border rounded-lg px-4 bg-gray-50" placeholder="admin1234"/>
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                      </div>
                      <button type="submit" disabled={authLoading} className="w-full h-12 bg-[#1e2330] text-white font-bold rounded-lg hover:bg-black transition-colors">{authLoading ? '...' : (isEn ? 'Login' : '로그인')}</button>
                  </form>
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                      <button onClick={handleResetPassword} className="text-[#0070F0] font-bold">비밀번호 재설정</button>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                      <button onClick={createDefaultAdmin} className="w-full py-3 rounded-lg border-2 border-dashed border-[#0070F0] text-[#0070F0] font-bold text-sm">+ 기본 관리자 생성</button>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: DASHBOARD CONTENT ---
  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1e2330] text-white flex-shrink-0 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-700 font-bold text-lg">K-Experience Admin</div>
            <nav className="flex-1 py-6 space-y-1 px-3">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: isEn ? 'Dashboard' : '대시보드' },
                    { id: 'calendar', icon: CalendarIcon, label: isEn ? 'Calendar' : '예약 캘린더' },
                    { id: 'reservations', icon: ShoppingCart, label: isEn ? 'Orders' : '주문/예약' },
                    { id: 'products', icon: Package, label: isEn ? 'Products' : '상품 관리' },
                    { id: 'groupbuys', icon: Megaphone, label: isEn ? 'Group Buy' : '공동구매' },
                    { id: 'users', icon: Users, label: isEn ? 'Users' : '회원 관리' },
                ].map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button onClick={() => logoutUser()} className="w-full py-2 bg-gray-800 text-xs rounded hover:bg-gray-700 text-gray-300">Sign Out</button>
            </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 capitalize">{activeTab}</h2>
                <div className="flex items-center gap-4">
                    <button onClick={fetchAllData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20}/></button>
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="검색..." className="h-9 pl-9 pr-4 rounded-full bg-gray-100 text-sm focus:outline-none w-64" />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-8">
                {/* 1. DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: isEn ? 'Revenue' : '총 매출', val: `₩ ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: isEn ? 'Orders' : '총 주문', val: stats.orders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: isEn ? 'Users' : '회원수', val: stats.users, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
                                { label: isEn ? 'Products' : '등록 상품', val: stats.products, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div><p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p><h3 className="text-2xl font-black text-gray-900">{s.val}</h3></div>
                                    <div className={`w-12 h-12 ${s.bg} rounded-full flex items-center justify-center ${s.color}`}><s.icon size={24} /></div>
                                </div>
                            ))}
                        </div>
                        {/* Simple Chart Visualization */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                             <h3 className="text-lg font-bold mb-6">{isEn ? 'Monthly Revenue Trend' : '월별 매출 추이 (최근 6개월)'}</h3>
                             <div className="h-48 flex items-end gap-4 justify-between px-4">
                                 {[40, 65, 50, 85, 70, 95].map((h, i) => (
                                     <div key={i} className="w-full flex flex-col items-center gap-2 group">
                                         <div className="w-full bg-blue-100 rounded-t-lg relative group-hover:bg-blue-200 transition-all" style={{ height: `${h}%` }}>
                                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">₩{(h * 100000).toLocaleString()}</div>
                                         </div>
                                         <span className="text-xs text-gray-500 font-medium">{i+1}월</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}

                {/* 2. CALENDAR */}
                {activeTab === 'calendar' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{isEn ? 'Reservation Calendar' : '예약 캘린더'}</h3>
                            <div className="flex gap-2">
                                <span className="flex items-center text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>Confirmed</span>
                                <span className="flex items-center text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>Pending</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 border-b border-gray-200 pb-2 mb-2">
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-sm font-bold text-gray-500">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                            {Array.from({length: 31}, (_, i) => {
                                const day = i + 1;
                                const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
                                const dayRes = reservations.filter(r => r.date === dateStr);
                                return (
                                    <div key={day} className={`border border-gray-100 rounded-lg p-2 h-24 overflow-hidden relative ${dayRes.length > 0 ? 'bg-blue-50/30' : ''}`}>
                                        <span className={`text-sm font-bold ${day < 10 && day !== 1 ? 'text-gray-300' : 'text-gray-700'}`}>{day}</span>
                                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">
                                            {dayRes.map((r: any) => (
                                                <div key={r.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${r.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
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

                {/* 3. RESERVATIONS */}
                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">ID/Date</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reservations.map((res) => (
                                    <tr key={res.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{new Date(res.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">ID: {res.id.slice(0,6)}...</div>
                                        </td>
                                        <td className="px-6 py-4"><div className="font-medium text-gray-900">{res.productName}</div><div className="text-xs text-gray-500">{res.date}</div></td>
                                        <td className="px-6 py-4">Guest ({res.peopleCount}ppl)</td>
                                        <td className="px-6 py-4 font-bold">₩{res.totalPrice?.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={res.status}
                                                onChange={(e) => handleStatusUpdate(res.id, e.target.value)}
                                                className={`px-2 py-1 rounded text-xs font-bold border-none outline-none cursor-pointer ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                                            >
                                                <option value="confirmed">Confirmed</option>
                                                <option value="pending">Pending</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. PRODUCTS (CRUD) */}
                {activeTab === 'products' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">{isEn ? 'Product Management' : '상품 관리'}</h3>
                            <div className="flex gap-2">
                                {products.length === 0 && (
                                    <button onClick={handleSeedProducts} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <RefreshCw size={16}/> {isEn ? 'Load Defaults' : '기본 상품 가져오기'}
                                    </button>
                                )}
                                <button onClick={() => openProductModal()} className="px-4 py-2 bg-[#0070F0] text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                                    <Plus size={16}/> {isEn ? 'Add Product' : '상품 등록'}
                                </button>
                            </div>
                        </div>

                        {products.length === 0 ? (
                            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-4">{isEn ? 'No products found.' : '등록된 상품이 없습니다.'}</p>
                                <button onClick={handleSeedProducts} className="text-blue-600 font-bold underline">기본 상품 데이터 로드하기</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                        <div className="h-48 overflow-hidden relative">
                                            <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openProductModal(product)} className="bg-white p-2 rounded-full shadow-md hover:text-blue-600"><Edit2 size={16}/></button>
                                                <button onClick={() => deleteProduct(product.id!)} className="bg-white p-2 rounded-full shadow-md hover:text-red-600"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="text-xs text-gray-400 font-bold mb-1">{product.category}</div>
                                            <h4 className="font-bold text-gray-900 mb-1 truncate">{product.title}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">{product.description}</p>
                                            <div className="font-black text-lg text-[#0070F0]">{product.price}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* 5. GROUP BUYS */}
                {activeTab === 'groupbuys' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                             <h3 className="text-lg font-bold">{isEn ? 'Active Group Buys' : '진행중인 공동구매'}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Creator</th>
                                        <th className="px-6 py-4">Visit Date</th>
                                        <th className="px-6 py-4">Progress</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {groupBuys.map((gb) => (
                                        <tr key={gb.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {gb.product === 'basic' ? 'Basic Package' : 'Premium Package'}
                                                <div className="text-xs text-gray-400 font-normal">{gb.type === 'public' ? 'Public' : 'Private'}</div>
                                            </td>
                                            <td className="px-6 py-4">{gb.creatorName}</td>
                                            <td className="px-6 py-4 font-bold text-blue-600">{gb.visitDate}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${(gb.currentCount/gb.maxCount)*100}%`}}></div>
                                                    </div>
                                                    <span className="text-xs font-bold">{gb.currentCount}/{gb.maxCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => deleteGroupBuy(gb.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {groupBuys.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-500">진행중인 공동구매가 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. USERS */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4">{isEn ? 'User List' : '회원 목록'}</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Nationality</th>
                                    <th className="px-4 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-4 py-3 font-bold">{u.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                                        <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                                        <td className="px-4 py-3 text-gray-500">{u.nationality}</td>
                                        <td className="px-4 py-3 text-gray-400">{u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
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
                <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg">{editingProduct ? (isEn ? 'Edit Product' : '상품 수정') : (isEn ? 'Add New Product' : '새 상품 등록')}</h3>
                        <button onClick={() => setIsProductModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">상품명 (Title)</label>
                            <input type="text" className="w-full border rounded-lg p-2.5 text-sm" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} placeholder="e.g. K-Beauty Basic" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">카테고리 (Category)</label>
                            <input type="text" className="w-full border rounded-lg p-2.5 text-sm" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} placeholder="e.g. 뷰티시술" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">가격 (Price String)</label>
                            <input type="text" className="w-full border rounded-lg p-2.5 text-sm" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="e.g. 1,500,000원" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">설명 (Description)</label>
                            <textarea className="w-full border rounded-lg p-2.5 text-sm h-20" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="상품 간단 설명" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">이미지 URL</label>
                            <input type="text" className="w-full border rounded-lg p-2.5 text-sm" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} placeholder="https://..." />
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                        <button onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm">Cancel</button>
                        <button onClick={saveProduct} className="px-6 py-2 bg-[#0070F0] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-blue-600 flex items-center gap-2">
                            <Save size={16}/> Save Product
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
