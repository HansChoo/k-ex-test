
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
    MessageSquare,
    Clock,
    Info
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, writeBatch, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User, sendPasswordResetEmail } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, logoutUser } from '../services/authService';
import { PRODUCTS } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';

interface AdminDashboardProps {
  language: 'ko' | 'en';
}

interface ProductType {
    id?: string;
    order?: number;
    title: string;
    description: string;
    price: string;
    priceValue?: number;
    image: string;
    category: string;
    detailTopImage?: string;
    detailContentImage?: string;
    infoText?: string;
    faqText?: string;
}

interface MainPackageType {
    id: string;
    title: string;
    price: number;
    originalPrice: number;
    description: string;
    features: string[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { t, language } = useGlobal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'reservations' | 'products' | 'packages' | 'groupbuys' | 'users'>('dashboard');
  
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [mainPackages, setMainPackages] = useState<MainPackageType[]>([]);
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [productForm, setProductForm] = useState<ProductType>({
      title: '', description: '', price: '', image: '', category: '', order: 99,
      detailTopImage: '', detailContentImage: '', infoText: '', faqText: ''
  });

  const ADMIN_EMAIL = "admin@k-experience.com";
  const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME DATA SYNC
  useEffect(() => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;

    // 1. Reservations Sync
    const qRes = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setReservations(data);
        
        // Stats Calc
        const revenueByMonth = Array(12).fill(0);
        let totalRev = 0;
        
        data.forEach((r: any) => {
            if (r.status !== 'cancelled' && r.createdAt) {
                // Robust Date Parsing
                let date: Date | null = null;
                if (r.createdAt?.seconds) {
                    date = new Date(r.createdAt.seconds * 1000);
                } else if (r.createdAt instanceof Date) {
                    date = r.createdAt;
                } else if (typeof r.createdAt === 'string') {
                    date = new Date(r.createdAt);
                }

                if (date && !isNaN(date.getTime())) {
                     const monthIndex = date.getMonth(); // 0-11
                     if (monthIndex >= 0 && monthIndex < 12) {
                        const amt = Number(r.totalPrice) || 0;
                        revenueByMonth[monthIndex] += amt;
                        totalRev += amt;
                     }
                }
            }
        });
        
        setMonthlyRevenue(revenueByMonth);
        setStats(prev => ({ ...prev, revenue: totalRev, orders: data.length }));
    });

    // 2. Users Sync
    const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setStats(prev => ({ ...prev, users: snapshot.size }));
    });

    // 3. Products Sync
    const qProds = query(collection(db, "products"), orderBy("order", "asc"));
    const unsubProds = onSnapshot(qProds, (snapshot) => {
        setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductType)));
        setStats(prev => ({ ...prev, products: snapshot.size }));
    });

    // 4. Group Buys Sync
    const qGb = query(collection(db, "group_buys"), orderBy("createdAt", "desc"));
    const unsubGb = onSnapshot(qGb, (snapshot) => {
        setGroupBuys(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Packages Sync (No order needed usually)
    const unsubPkg = onSnapshot(collection(db, "cms_packages"), (snapshot) => {
        setMainPackages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MainPackageType)));
    });

    setLoading(false);

    return () => {
        unsubRes(); unsubUsers(); unsubProds(); unsubGb(); unsubPkg();
    };
  }, [currentUser]);


  // --- Actions ---
  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setLoginError(null);
      try { await loginWithEmail(email, password); } 
      catch (error: any) { setLoginError({ type: 'error', message: error.message }); } 
      finally { setAuthLoading(false); }
  };

  const createDefaultAdmin = async () => {
      if (!window.confirm("Create default admin account?")) return;
      setAuthLoading(true);
      try {
          if (auth.currentUser) await logoutUser();
          await registerWithEmail({ email: ADMIN_EMAIL, password: "admin1234", name: "Admin", phone: "000", nationality: "KR" });
          setEmail(ADMIN_EMAIL); setPassword("admin1234");
          setLoginError({ type: 'success', message: "Account created." });
      } catch (e: any) { setLoginError({ type: 'error', message: e.message }); } 
      finally { setAuthLoading(false); }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
      await updateDoc(doc(db, "reservations", id), { status: newStatus });
  };

  const handleAdminNoteUpdate = async (id: string, note: string) => {
      const newNote = prompt("Enter Note:", note);
      if (newNote !== null) await updateDoc(doc(db, "reservations", id), { adminNote: newNote });
  };

  const saveProduct = async () => {
      if(!productForm.title || !productForm.price) return alert("Missing fields");
      if (editingProduct?.id) await updateDoc(doc(db, "products", editingProduct.id), productForm as any);
      else await addDoc(collection(db, "products"), { ...productForm, createdAt: new Date() });
      setIsProductModalOpen(false);
  };

  const deleteProduct = async (id: string) => {
      if (window.confirm(t('delete') + "?")) await deleteDoc(doc(db, "products", id));
  };

  const updatePackage = async (pkg: MainPackageType, field: string, value: any) => {
      const ref = doc(db, "cms_packages", pkg.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, { ...pkg, [field]: value });
      else await updateDoc(ref, { [field]: value });
  };

  const deleteGroupBuy = async (id: string) => {
      if (window.confirm(t('delete') + "?")) await deleteDoc(doc(db, "group_buys", id));
  };

  const handleSeedProducts = async () => {
      if (!window.confirm("Reset products DB?")) return;
      const batch = writeBatch(db);
      PRODUCTS.forEach((p, i) => batch.set(doc(collection(db, "products")), { ...p, order: i + 1 }));
      await batch.commit();
  };

  // --- Render ---
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500"><RefreshCw className="animate-spin mr-2"/> Connecting to Real-time DB...</div>;

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8] px-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                  <h2 className="text-2xl font-black text-center mb-6">{t('login')}</h2>
                  {loginError && <div className={`p-3 rounded mb-4 text-sm ${loginError.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{loginError.message}</div>}
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full h-12 border rounded px-4" placeholder="admin@k-experience.com"/>
                      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full h-12 border rounded px-4" placeholder="Password"/>
                      <button disabled={authLoading} className="w-full h-12 bg-black text-white rounded font-bold">{authLoading ? 'Loading...' : t('login')}</button>
                  </form>
                  <button onClick={createDefaultAdmin} className="mt-4 text-xs text-blue-500 underline w-full text-center">Create Init Account</button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        <aside className="w-64 bg-[#1e2330] text-white flex-shrink-0 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-700 font-bold text-lg">K-Experience Admin</div>
            <nav className="flex-1 py-6 space-y-1 px-3">
                {[{ id: 'dashboard', icon: LayoutDashboard, label: t('admin_dash') }, { id: 'calendar', icon: CalendarIcon, label: t('admin_cal') }, { id: 'reservations', icon: ShoppingCart, label: t('admin_res') }, { id: 'products', icon: Package, label: t('admin_prod') }, { id: 'packages', icon: Star, label: t('admin_pkg') }, { id: 'groupbuys', icon: Megaphone, label: t('admin_gb') }, { id: 'users', icon: Users, label: t('admin_users') }].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800'}`}><item.icon size={18} /> {item.label}</button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700"><button onClick={() => logoutUser()} className="w-full py-2 bg-gray-800 text-xs rounded text-gray-300">{t('logout')}</button></div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 capitalize flex items-center gap-2">
                    {t(activeTab === 'dashboard' ? 'admin_dash' : activeTab === 'calendar' ? 'admin_cal' : activeTab === 'reservations' ? 'admin_res' : activeTab === 'products' ? 'admin_prod' : activeTab === 'packages' ? 'admin_pkg' : activeTab === 'groupbuys' ? 'admin_gb' : 'admin_users')}
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1"><Clock size={10}/> Real-time</span>
                </h2>
                <div className="text-xs text-gray-400">Auto-sync active</div>
            </header>

            <div className="flex-1 overflow-auto p-8">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[{ label: t('revenue'), val: `₩ ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: t('orders'), val: stats.orders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' }, { label: t('users'), val: stats.users, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }, { label: t('products'), val: stats.products, icon: Package, color: 'text-green-600', bg: 'bg-green-50' }].map((s, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p><h3 className="text-2xl font-black">{s.val}</h3></div><div className={`w-12 h-12 ${s.bg} rounded-full flex items-center justify-center ${s.color}`}><s.icon size={24} /></div></div>
                            ))}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><BarChart3 size={20}/> {t('monthly_rev')}</h3>
                            <div className="h-64 flex items-end gap-2 md:gap-4 justify-between px-2 md:px-10 border-b border-gray-200 pb-2">
                                {monthlyRevenue.map((amount, idx) => {
                                     // Safe calculation to prevent NaN
                                     const safeAmount = isNaN(amount) ? 0 : amount;
                                     const safeMax = Math.max(...monthlyRevenue.map(v => isNaN(v) ? 0 : v), 1);
                                     const heightPercent = (safeAmount / safeMax) * 100;
                                     
                                     return (
                                         <div key={idx} className="w-full flex flex-col items-center gap-2 group relative">
                                             <div 
                                                className="w-full max-w-[40px] bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all relative" 
                                                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                             >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 font-bold">
                                                    ₩{safeAmount.toLocaleString()}
                                                </div>
                                             </div>
                                             <span className="text-[10px] md:text-xs text-gray-500 font-bold">
                                                 {language === 'ko' ? MONTHS_KO[idx] : MONTHS_EN[idx]}
                                             </span>
                                         </div>
                                     );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-bold mb-6">{t('admin_cal')}</h3><div className="grid grid-cols-7 border-b border-gray-200 pb-2 mb-2 text-center text-sm font-bold text-gray-500">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 gap-2 min-h-[400px]">{Array.from({length: 31}, (_, i) => { const day = i + 1; const dateStr = `2026-02-${day.toString().padStart(2, '0')}`; const dayRes = reservations.filter(r => r.date === dateStr); return (<div key={day} className={`border border-gray-100 rounded p-1 h-24 overflow-hidden ${dayRes.length > 0 ? 'bg-blue-50' : ''}`}><span className="text-sm font-bold text-gray-700 ml-1">{day}</span><div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">{dayRes.map((r: any) => (<div key={r.id} className={`text-[10px] px-1 rounded truncate ${r.status === 'confirmed' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-100'}`}>{r.productName}</div>))}</div></div>) })}</div></div>
                )}

                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-medium"><tr><th className="px-6 py-4">{t('order_date')}</th><th className="px-6 py-4">Product/Date</th><th className="px-6 py-4">{t('total')}</th><th className="px-6 py-4">{t('status')}</th><th className="px-6 py-4">{t('manage')}</th></tr></thead><tbody className="divide-y divide-gray-100">{reservations.map((res) => { const statusColor = res.status === 'confirmed' ? 'text-green-600 bg-green-50 border-green-200' : res.status === 'cancelled' ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'; return (<tr key={res.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 text-gray-500">{new Date(res.createdAt?.seconds * 1000).toLocaleDateString()}<div className="text-xs">{new Date(res.createdAt?.seconds * 1000).toLocaleTimeString()}</div></td><td className="px-6 py-4"><div className="font-bold text-[#111]">{res.productName}</div><div className="text-xs text-blue-600 font-medium">Date: {res.date}</div><div className="text-[10px] text-gray-400 mt-1">ID: {res.id}</div>{res.adminNote && (<div className="mt-2 text-xs bg-gray-100 p-2 rounded flex items-start gap-1"><MessageSquare size={12} className="mt-0.5 text-gray-500"/><span className="text-gray-700">{res.adminNote}</span></div>)}</td><td className="px-6 py-4 font-bold">₩{Number(res.totalPrice).toLocaleString()}</td><td className="px-6 py-4"><select value={res.status} onChange={(e) => handleStatusUpdate(res.id, e.target.value)} className={`px-2 py-1.5 rounded border text-xs font-bold focus:outline-none ${statusColor}`}><option value="pending">{t('status_pending')}</option><option value="confirmed">{t('status_confirmed')}</option><option value="completed">{t('status_completed')}</option><option value="cancelled">{t('status_cancelled')}</option></select></td><td className="px-6 py-4"><button onClick={() => handleAdminNoteUpdate(res.id, res.adminNote || '')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-bold text-gray-600">{t('memo')}</button></td></tr>)})}</tbody></table></div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-bold">{t('admin_prod')}</h3><div className="flex gap-2"><button onClick={handleSeedProducts} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center gap-2"><RefreshCw size={16}/> {t('import_db')}</button><button onClick={() => { setEditingProduct(null); setProductForm({ title: '', description: '', price: '', image: '', category: '', order: products.length + 1 }); setIsProductModalOpen(true); }} className="px-4 py-2 bg-[#0070F0] text-white rounded font-bold text-sm flex gap-2"><Plus size={16}/> Add Product</button></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(product => (<div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"><div className="relative h-48 bg-gray-100"><img src={product.image} className="w-full h-full object-cover"/><div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">No. {product.order}</div><div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingProduct(product); setProductForm(product); setIsProductModalOpen(true); }} className="bg-white p-2 rounded-full shadow hover:text-blue-600"><Edit2 size={14}/></button><button onClick={() => deleteProduct(product.id!)} className="bg-white p-2 rounded-full shadow hover:text-red-600"><Trash2 size={14}/></button></div></div><div className="p-4"><div className="text-xs text-gray-500 mb-1">{product.category}</div><h4 className="font-bold truncate">{product.title}</h4><div className="text-[#0070F0] font-black mt-2">{product.price}</div></div></div>))}</div></div>
                )}

                {activeTab === 'packages' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-lg font-bold mb-6">{t('admin_pkg')}</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{['package_basic', 'package_premium'].map(pkgId => { const pkg = mainPackages.find(p => p.id === pkgId) || { id: pkgId, title: 'Package', price: 0, originalPrice: 0, description: '', features: [] }; const isBasic = pkgId === 'package_basic'; return (<div key={pkgId} className={`p-6 rounded-xl border-2 ${isBasic ? 'border-blue-100 bg-blue-50' : 'border-yellow-100 bg-yellow-50'}`}><h4 className={`text-xl font-black mb-4 ${isBasic ? 'text-blue-700' : 'text-yellow-700'}`}>{isBasic ? 'BASIC PACKAGE' : 'PREMIUM PACKAGE'}</h4><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-600 mb-1">Title</label><input className="w-full p-2 border rounded bg-white" value={pkg.title} onChange={e => updatePackage(pkg, 'title', e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-600 mb-1">Price</label><input type="number" className="w-full p-2 border rounded bg-white" value={pkg.price} onChange={e => updatePackage(pkg, 'price', Number(e.target.value))} /></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Orig Price</label><input type="number" className="w-full p-2 border rounded bg-white" value={pkg.originalPrice} onChange={e => updatePackage(pkg, 'originalPrice', Number(e.target.value))} /></div></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Description</label><textarea className="w-full p-2 border rounded bg-white h-20" value={pkg.description} onChange={e => updatePackage(pkg, 'description', e.target.value)} /></div></div></div>) })}</div></div>
                )}
                
                {activeTab === 'groupbuys' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4">{t('admin_gb')}</h3>
                        <div className="text-xs text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg flex gap-2">
                             <Info size={16} /> 
                             Items without a date will not be shown on the website. Please delete and recreate them.
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500"><tr><th>Product</th><th>Creator</th><th>Visit Date</th><th>Count</th><th>{t('manage')}</th></tr></thead>
                            <tbody>
                                {groupBuys.map(gb => (
                                    <tr key={gb.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-bold">{gb.product} <span className="text-xs font-normal text-gray-500">({gb.type})</span></td>
                                        <td className="p-3">{gb.creatorName}</td>
                                        <td className={`p-3 font-bold ${!gb.visitDate ? 'text-red-500' : 'text-blue-600'}`}>
                                            {gb.visitDate || "🚫 Missing Date"}
                                        </td>
                                        <td className="p-3">{gb.currentCount}/{gb.maxCount}</td>
                                        <td className="p-3"><button onClick={() => deleteGroupBuy(gb.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-bold mb-4">{t('admin_users')}</h3><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Nation</th><th>Date</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b"><td className="p-3 font-bold">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.phone}</td><td className="p-3">{u.nationality}</td><td className="p-3 text-gray-400">{u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</td></tr>))}</tbody></table></div>
                )}
            </div>
        </main>

        {isProductModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="font-bold text-lg">{editingProduct ? t('edit') : 'Add Product'}</h3><button onClick={() => setIsProductModalOpen(false)}><X size={20}/></button></div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Order</label><input type="number" className="w-full border rounded p-2" value={productForm.order} onChange={e => setProductForm({...productForm, order: Number(e.target.value)})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Category</label><input type="text" className="w-full border rounded p-2" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} placeholder="K-IDOL, Beauty..." /></div></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Title</label><input type="text" className="w-full border rounded p-2" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Display Price</label><input type="text" className="w-full border rounded p-2" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="100,000원" /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Image URL</label><input type="text" className="w-full border rounded p-2" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} /></div></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Description</label><input type="text" className="w-full border rounded p-2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h4 className="font-bold text-sm mb-4 flex items-center gap-2"><LayoutDashboard size={14}/> Detail Page Config</h4><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Top Banner Image URL</label><input type="text" className="w-full border rounded p-2 bg-white" value={productForm.detailTopImage || ''} onChange={e => setProductForm({...productForm, detailTopImage: e.target.value})} placeholder="https://..." /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Content Body Image URL</label><input type="text" className="w-full border rounded p-2 bg-white" value={productForm.detailContentImage || ''} onChange={e => setProductForm({...productForm, detailContentImage: e.target.value})} placeholder="https://..." /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Notice Tab Text</label><textarea className="w-full border rounded p-2 bg-white h-20" value={productForm.infoText || ''} onChange={e => setProductForm({...productForm, infoText: e.target.value})} placeholder="..." /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">FAQ Tab Text</label><textarea className="w-full border rounded p-2 bg-white h-20" value={productForm.faqText || ''} onChange={e => setProductForm({...productForm, faqText: e.target.value})} placeholder="Q. ... A. ..." /></div></div></div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 sticky bottom-0"><button onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm">{t('cancel')}</button><button onClick={saveProduct} className="px-6 py-2 bg-[#0070F0] text-white rounded font-bold text-sm">{t('save')}</button></div>
                </div>
            </div>
        )}
    </div>
  );
};
