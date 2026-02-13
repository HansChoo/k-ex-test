
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Search, DollarSign, Lock, Eye, EyeOff, AlertCircle, Calendar as CalendarIcon, Package, Plus, Edit2, Trash2, Megaphone, X, Save, RefreshCw, Star, BarChart3, AlertTriangle, MessageSquare, Clock, Info, ShieldCheck, ChevronRight, LogOut, Shield, UserCheck, UserX, Settings as SettingsIcon, Printer, Mail, FileText, HelpCircle, Ticket, BookOpen, Link as LinkIcon, Globe, Copy, Check, ClipboardList, MessageCircle
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, writeBatch, setDoc, getDoc, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { useGlobal } from '../contexts/GlobalContext';
import { RichTextEditor } from '../components/RichTextEditor';

// --- Type Definitions ---
interface ProductType { id?: string; title: string; price: number; category: string; [key: string]: any; }
interface MainPackageType { id: string; title: string; price: number; theme?: string; [key: string]: any; }
interface GroupBuyType { id: string; title: string; productType: 'basic' | 'premium'; currentCount: number; maxCount: number; visitDate: string; [key: string]: any; }
interface CouponType { id: string; code: string; type: 'percent' | 'fixed'; value: number; currentUsage: number; maxUsage: number; isActive: boolean; [key: string]: any; }
interface AffiliateType { id: string; name: string; code: string; commissionRate: number; sales: number; totalRevenue: number; [key: string]: any; }
interface MagazineType { id: string; title: string; category: string; author: string; createdAt: any; [key: string]: any; }
interface InquiryType { id: string; title: string; content: string; status: 'waiting' | 'answered'; answer?: string; [key: string]: any; }

export const AdminDashboard: React.FC<any> = () => {
  const { t } = useGlobal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'products' | 'packages' | 'groupbuys' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates' | 'users' | 'settings'>('dashboard');
  
  // Data States
  const [reservations, setReservations] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [packages, setPackages] = useState<MainPackageType[]>([]);
  const [groupBuys, setGroupBuys] = useState<GroupBuyType[]>([]);
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateType[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<MagazineType[]>([]);
  const [inquiries, setInquiries] = useState<InquiryType[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Modals
  const [modalType, setModalType] = useState<string | null>(null); // 'package', 'groupbuy', 'coupon', 'affiliate', 'magazine'
  const [editingItem, setEditingItem] = useState<any>(null);

  // Check Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          // Simple Admin Check (Expand logic for production)
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

  // Fetch Data
  useEffect(() => {
    if (!isAdmin) return;

    const unsubs = [
        onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snap) => {
            setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            const totalRev = snap.docs.reduce((acc, curr) => acc + (Number(curr.data().totalPrice) || 0), 0);
            setStats(prev => ({ ...prev, revenue: totalRev, orders: snap.size }));
        }),
        onSnapshot(collection(db, "products"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductType)))),
        onSnapshot(collection(db, "cms_packages"), (snap) => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as MainPackageType)))), 
        onSnapshot(query(collection(db, "group_buys"), orderBy("visitDate", "asc")), (snap) => setGroupBuys(snap.docs.map(d => ({ id: d.id, ...d.data() } as GroupBuyType)))),
        onSnapshot(collection(db, "coupons"), (snap) => setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as CouponType)))),
        onSnapshot(collection(db, "affiliates"), (snap) => setAffiliates(snap.docs.map(d => ({ id: d.id, ...d.data() } as AffiliateType)))),
        onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), (snap) => setMagazinePosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as MagazineType)))),
        onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), (snap) => setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() } as InquiryType)))),
        onSnapshot(collection(db, "users"), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setStats(prev => ({ ...prev, users: snap.size }));
        })
    ];

    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try { await loginWithEmail(email, password); } catch (e) { alert("Login failed"); }
  };

  const deleteItem = async (collectionName: string, id: string) => {
      if(!window.confirm("Delete this item?")) return;
      await deleteDoc(doc(db, collectionName, id));
  };

  // --- GENERIC SAVE HANDLERS ---
  const savePackage = async () => {
      if(!editingItem.title) return;
      const data = { ...editingItem, updatedAt: serverTimestamp() };
      const col = collection(db, "cms_packages");
      if(editingItem.id && packages.some(p=>p.id===editingItem.id)) await updateDoc(doc(col, editingItem.id), data);
      else await setDoc(doc(col, editingItem.id || `pkg_${Date.now()}`), data);
      setModalType(null);
  };

  const saveGroupBuy = async () => {
      if(!editingItem.title) return;
      const data = { ...editingItem, updatedAt: serverTimestamp() };
      if(editingItem.id) await updateDoc(doc(db, "group_buys", editingItem.id), data);
      else await addDoc(collection(db, "group_buys"), data);
      setModalType(null);
  };

  const saveCoupon = async () => {
      if(!editingItem.code) return;
      const data = { ...editingItem, updatedAt: serverTimestamp() };
      if(editingItem.id) await updateDoc(doc(db, "coupons", editingItem.id), data);
      else await addDoc(collection(db, "coupons"), data);
      setModalType(null);
  };

  const saveAffiliate = async () => {
      if(!editingItem.name) return;
      const data = { ...editingItem, updatedAt: serverTimestamp() };
      if(editingItem.id) await updateDoc(doc(db, "affiliates", editingItem.id), data);
      else await addDoc(collection(db, "affiliates"), data);
      setModalType(null);
  };

  const saveMagazine = async () => {
      if(!editingItem.title) return;
      const data = { ...editingItem, createdAt: editingItem.createdAt || serverTimestamp(), updatedAt: serverTimestamp() };
      if(editingItem.id) await updateDoc(doc(db, "cms_magazine", editingItem.id), data);
      else await addDoc(collection(db, "cms_magazine"), data);
      setModalType(null);
  };

  const saveInquiryAnswer = async () => {
      if(!editingItem.answer) return;
      await updateDoc(doc(db, "inquiries", editingItem.id), {
          answer: editingItem.answer,
          answeredAt: serverTimestamp(),
          status: 'answered'
      });
      setModalType(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
              <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full mb-4 border p-2 rounded" placeholder="Email"/>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full mb-6 border p-2 rounded" placeholder="Password"/>
              <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Login</button>
          </form>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        {/* SIDEBAR */}
        <aside className="w-64 bg-[#2C3E50] text-white flex-shrink-0 flex flex-col h-screen overflow-y-auto">
            <div className="h-16 flex items-center px-6 font-bold text-lg border-b border-gray-600">ADMIN</div>
            <nav className="flex-1 py-4 px-3 space-y-1">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                    { id: 'reservations', icon: ShoppingCart, label: '예약 관리' },
                    { id: 'packages', icon: Star, label: '패키지 관리' },
                    { id: 'groupbuys', icon: Megaphone, label: '공동구매(핫딜)' },
                    { id: 'products', icon: Package, label: '상품 관리' },
                    { id: 'coupons', icon: Ticket, label: '쿠폰 관리' },
                    { id: 'affiliates', icon: LinkIcon, label: '제휴 마케팅' },
                    { id: 'magazine', icon: BookOpen, label: '매거진 관리' },
                    { id: 'inquiries', icon: MessageCircle, label: '1:1 문의' },
                    { id: 'users', icon: Users, label: '회원 관리' },
                    { id: 'settings', icon: SettingsIcon, label: '설정' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? 'bg-[#0070F0]' : 'hover:bg-gray-700'}`}>
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4"><button onClick={() => logoutUser()} className="w-full py-2 bg-gray-700 rounded text-sm">Logout</button></div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-16 bg-white border-b flex items-center justify-between px-8 flex-shrink-0">
                <h2 className="text-lg font-bold">{activeTab.toUpperCase()}</h2>
                <button onClick={() => window.location.href='/'} className="text-sm bg-gray-100 px-3 py-1 rounded">Go to Shop</button>
            </header>

            <div className="flex-1 overflow-auto p-8">
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>Total Revenue</h3><p className="text-2xl font-bold">₩ {stats.revenue.toLocaleString()}</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>Total Orders</h3><p className="text-2xl font-bold">{stats.orders}</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>Total Users</h3><p className="text-2xl font-bold">{stats.users}</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>Active Products</h3><p className="text-2xl font-bold">{products.length + packages.length}</p></div>
                    </div>
                )}

                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50"><tr><th className="p-4">Date</th><th className="p-4">Product</th><th className="p-4">Customer</th><th className="p-4">Price</th><th className="p-4">Status</th></tr></thead>
                            <tbody>
                                {reservations.map(res => (
                                    <tr key={res.id} className="border-b">
                                        <td className="p-4">{res.date}</td>
                                        <td className="p-4 font-bold">{res.productName}</td>
                                        <td className="p-4">{res.options?.guestEmail || res.userId}</td>
                                        <td className="p-4">₩ {Number(res.totalPrice).toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${res.status==='confirmed'?'bg-green-100 text-green-700':'bg-yellow-100'}`}>{res.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-4">
                         <div className="flex justify-between"><h3 className="font-bold text-lg">Products</h3><button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Add Product</button></div>
                         {products.map(p => (
                             <div key={p.id} className="bg-white p-4 rounded shadow-sm flex justify-between items-center border">
                                 <div><h4 className="font-bold">{p.title}</h4><p className="text-xs text-gray-500">{p.category} | ₩ {p.price?.toLocaleString()}</p></div>
                                 <button onClick={()=>deleteItem("products", p.id!)} className="text-red-500"><Trash2 size={16}/></button>
                             </div>
                         ))}
                    </div>
                )}

                {activeTab === 'packages' && (
                    <div className="space-y-4">
                        <div className="flex justify-between"><h3 className="font-bold text-lg">Packages</h3><button onClick={()=>{setEditingItem({}); setModalType('package');}} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Add Package</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.map(pkg => (
                                <div key={pkg.id} className="bg-white p-4 rounded shadow-sm border relative">
                                    <h4 className="font-bold">{pkg.title}</h4>
                                    <p className="text-xs text-gray-500 mb-2">{pkg.id}</p>
                                    <div className="text-right font-bold text-blue-600 mb-4">₩ {pkg.price?.toLocaleString()}</div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={()=>{setEditingItem(pkg); setModalType('package');}} className="text-gray-500"><Edit2 size={16}/></button>
                                        <button onClick={()=>deleteItem("cms_packages", pkg.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'groupbuys' && (
                    <div className="space-y-4">
                        <div className="flex justify-between"><h3 className="font-bold text-lg">Group Buys</h3><button onClick={()=>{setEditingItem({productType:'basic', maxCount:5}); setModalType('groupbuy');}} className="bg-[#FF6B6B] text-white px-4 py-2 rounded text-sm font-bold">Add Group Buy</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupBuys.map(gb => (
                                <div key={gb.id} className="bg-white p-4 rounded shadow-sm border relative">
                                    <span className={`absolute top-2 left-2 text-[10px] px-2 py-1 text-white rounded ${gb.productType==='basic'?'bg-teal-500':'bg-yellow-500'}`}>{gb.productType.toUpperCase()}</span>
                                    <div className="mt-6"><h4 className="font-bold">{gb.title}</h4><p className="text-xs text-gray-500">{gb.visitDate}</p></div>
                                    <div className="mt-2 w-full bg-gray-100 rounded-full h-2"><div className="bg-[#FF6B6B] h-2 rounded-full" style={{width: `${(gb.currentCount/gb.maxCount)*100}%`}}></div></div>
                                    <div className="flex justify-between mt-1 text-xs font-bold"><span className="text-[#FF6B6B]">{gb.currentCount}/{gb.maxCount}</span><span>Joined</span></div>
                                    <div className="flex gap-2 justify-end mt-4">
                                        <button onClick={()=>{setEditingItem(gb); setModalType('groupbuy');}} className="text-gray-500"><Edit2 size={16}/></button>
                                        <button onClick={()=>deleteItem("group_buys", gb.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="space-y-4">
                        <div className="flex justify-between"><h3 className="font-bold text-lg">Coupons</h3><button onClick={()=>{setEditingItem({type:'percent', isActive:true}); setModalType('coupon');}} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Create Coupon</button></div>
                        <div className="bg-white rounded shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50"><tr><th className="p-4">Code</th><th className="p-4">Value</th><th className="p-4">Usage</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c.id} className="border-b">
                                            <td className="p-4 font-bold font-mono">{c.code}</td>
                                            <td className="p-4">{c.value}{c.type === 'percent' ? '%' : ' KRW'}</td>
                                            <td className="p-4">{c.currentUsage} / {c.maxUsage}</td>
                                            <td className="p-4">{c.isActive ? <span className="text-green-600 font-bold">Active</span> : <span className="text-red-500">Inactive</span>}</td>
                                            <td className="p-4"><button onClick={()=>deleteItem("coupons", c.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'affiliates' && (
                    <div className="space-y-4">
                        <div className="flex justify-between"><h3 className="font-bold text-lg">Affiliates</h3><button onClick={()=>{setEditingItem({sales:0, totalRevenue:0}); setModalType('affiliate');}} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Add Partner</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {affiliates.map(aff => (
                                <div key={aff.id} className="bg-white p-4 rounded shadow-sm border">
                                    <div className="flex justify-between items-start mb-2">
                                        <div><h4 className="font-bold">{aff.name}</h4><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{aff.code}</code></div>
                                        <button onClick={()=>deleteItem("affiliates", aff.id)} className="text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                                        <div>Sales: <span className="font-bold text-black">{aff.sales}</span></div>
                                        <div>Rev: <span className="font-bold text-black">₩ {aff.totalRevenue?.toLocaleString()}</span></div>
                                        <div>Comm: <span className="font-bold text-black">{aff.commissionRate}%</span></div>
                                        <div className="col-span-2 text-blue-600 cursor-pointer" onClick={() => navigator.clipboard.writeText(`https://k-experience.com/?ref=${aff.code}`)}>Copy Link</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'magazine' && (
                    <div className="space-y-4">
                        <div className="flex justify-between"><h3 className="font-bold text-lg">Magazine</h3><button onClick={()=>{setEditingItem({}); setModalType('magazine');}} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">New Post</button></div>
                        <div className="grid grid-cols-1 gap-4">
                            {magazinePosts.map(post => (
                                <div key={post.id} className="bg-white p-4 rounded shadow-sm border flex justify-between items-center">
                                    <div><h4 className="font-bold">{post.title}</h4><span className="text-xs text-gray-400">{post.category} | {new Date(post.createdAt?.seconds*1000).toLocaleDateString()}</span></div>
                                    <div className="flex gap-2">
                                        <button onClick={()=>{setEditingItem(post); setModalType('magazine');}} className="text-gray-500"><Edit2 size={16}/></button>
                                        <button onClick={()=>deleteItem("cms_magazine", post.id)} className="text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'inquiries' && (
                    <div className="space-y-4">
                         <h3 className="font-bold text-lg">Inquiries</h3>
                         {inquiries.map(inq => (
                             <div key={inq.id} className="bg-white p-4 rounded shadow-sm border">
                                 <div className="flex justify-between mb-2">
                                     <h4 className="font-bold">{inq.title}</h4>
                                     <span className={`text-xs px-2 py-1 rounded font-bold ${inq.status==='answered'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inq.status}</span>
                                 </div>
                                 <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded">{inq.content}</p>
                                 {inq.status === 'answered' ? (
                                     <div className="ml-4 pl-4 border-l-2 border-blue-200"><p className="text-sm font-bold text-blue-600 mb-1">Answer:</p><p className="text-sm text-gray-700">{inq.answer}</p></div>
                                 ) : (
                                     <button onClick={()=>{setEditingItem(inq); setModalType('inquiry');}} className="text-sm text-blue-600 font-bold hover:underline">Reply</button>
                                 )}
                             </div>
                         ))}
                    </div>
                )}
                
                {/* Fallbacks */}
                {activeTab === 'users' && <div className="p-4 bg-white rounded shadow-sm"><h3 className="font-bold mb-4">Users List ({users.length})</h3><div className="space-y-2">{users.map(u=>(<div key={u.id} className="text-sm border-b pb-2">{u.email} ({u.name})</div>))}</div></div>}
                {activeTab === 'settings' && <div className="p-10 text-center text-gray-400">Settings Placehoder</div>}
            </div>

            {/* --- MODALS --- */}
            {modalType && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold uppercase">{modalType} EDITOR</h3><button onClick={()=>setModalType(null)}><X size={20}/></button></div>
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* DYNAMIC FORM FIELDS BASED ON MODAL TYPE */}
                            {modalType === 'package' && (
                                <>
                                    <input className="w-full border p-2 rounded" placeholder="ID (Unique)" value={editingItem.id||''} onChange={e=>setEditingItem({...editingItem, id:e.target.value})} disabled={!!editingItem.createdAt} />
                                    <input className="w-full border p-2 rounded" placeholder="Title" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})} />
                                    <input className="w-full border p-2 rounded" type="number" placeholder="Price" value={editingItem.price||0} onChange={e=>setEditingItem({...editingItem, price:Number(e.target.value)})} />
                                    <textarea className="w-full border p-2 rounded" placeholder="Description" value={editingItem.description||''} onChange={e=>setEditingItem({...editingItem, description:e.target.value})} />
                                    <select className="w-full border p-2 rounded" value={editingItem.theme||'mint'} onChange={e=>setEditingItem({...editingItem, theme:e.target.value})}><option value="mint">Mint</option><option value="yellow">Yellow</option><option value="orange">Orange</option></select>
                                    <RichTextEditor value={editingItem.content||''} onChange={(html)=>setEditingItem({...editingItem, content:html})} />
                                </>
                            )}
                            {modalType === 'groupbuy' && (
                                <>
                                    <input className="w-full border p-2 rounded" placeholder="Title" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})} />
                                    <select className="w-full border p-2 rounded" value={editingItem.productType||'basic'} onChange={e=>setEditingItem({...editingItem, productType:e.target.value})}><option value="basic">Basic</option><option value="premium">Premium</option></select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className="border p-2 rounded" type="date" value={editingItem.visitDate||''} onChange={e=>setEditingItem({...editingItem, visitDate:e.target.value})} />
                                        <input className="border p-2 rounded" type="number" placeholder="Max Count" value={editingItem.maxCount||5} onChange={e=>setEditingItem({...editingItem, maxCount:Number(e.target.value)})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className="border p-2 rounded" type="number" placeholder="Original Price" value={editingItem.originalPrice||0} onChange={e=>setEditingItem({...editingItem, originalPrice:Number(e.target.value)})} />
                                        <input className="border p-2 rounded" type="number" placeholder="Discounted Price" value={editingItem.discountedPrice||0} onChange={e=>setEditingItem({...editingItem, discountedPrice:Number(e.target.value)})} />
                                    </div>
                                    <input className="w-full border p-2 rounded" type="number" placeholder="Current Count (Manual Override)" value={editingItem.currentCount||0} onChange={e=>setEditingItem({...editingItem, currentCount:Number(e.target.value)})} />
                                </>
                            )}
                            {modalType === 'coupon' && (
                                <>
                                    <input className="w-full border p-2 rounded uppercase" placeholder="CODE (e.g. WELCOME10)" value={editingItem.code||''} onChange={e=>setEditingItem({...editingItem, code:e.target.value.toUpperCase()})} />
                                    <div className="flex gap-2">
                                        <select className="border p-2 rounded" value={editingItem.type||'percent'} onChange={e=>setEditingItem({...editingItem, type:e.target.value})}><option value="percent">Percent (%)</option><option value="fixed">Fixed Amount</option></select>
                                        <input className="flex-1 border p-2 rounded" type="number" placeholder="Value" value={editingItem.value||0} onChange={e=>setEditingItem({...editingItem, value:Number(e.target.value)})} />
                                    </div>
                                    <input className="w-full border p-2 rounded" type="number" placeholder="Max Usage Limit" value={editingItem.maxUsage||100} onChange={e=>setEditingItem({...editingItem, maxUsage:Number(e.target.value)})} />
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={editingItem.isActive||false} onChange={e=>setEditingItem({...editingItem, isActive:e.target.checked})} /> Active</label>
                                </>
                            )}
                            {modalType === 'affiliate' && (
                                <>
                                    <input className="w-full border p-2 rounded" placeholder="Partner Name" value={editingItem.name||''} onChange={e=>setEditingItem({...editingItem, name:e.target.value})} />
                                    <input className="w-full border p-2 rounded" placeholder="Code (e.g. PARTNER_A)" value={editingItem.code||''} onChange={e=>setEditingItem({...editingItem, code:e.target.value})} />
                                    <input className="w-full border p-2 rounded" type="number" placeholder="Commission Rate (%)" value={editingItem.commissionRate||10} onChange={e=>setEditingItem({...editingItem, commissionRate:Number(e.target.value)})} />
                                </>
                            )}
                            {modalType === 'magazine' && (
                                <>
                                    <input className="w-full border p-2 rounded" placeholder="Title" value={editingItem.title||''} onChange={e=>setEditingItem({...editingItem, title:e.target.value})} />
                                    <input className="w-full border p-2 rounded" placeholder="Category" value={editingItem.category||''} onChange={e=>setEditingItem({...editingItem, category:e.target.value})} />
                                    <input className="w-full border p-2 rounded" placeholder="Cover Image URL" value={editingItem.image||''} onChange={e=>setEditingItem({...editingItem, image:e.target.value})} />
                                    <textarea className="w-full border p-2 rounded" placeholder="Short Excerpt" value={editingItem.excerpt||''} onChange={e=>setEditingItem({...editingItem, excerpt:e.target.value})} />
                                    <RichTextEditor value={editingItem.content||''} onChange={(html)=>setEditingItem({...editingItem, content:html})} />
                                </>
                            )}
                            {modalType === 'inquiry' && (
                                <>
                                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm"><p className="font-bold mb-1">{editingItem.title}</p><p>{editingItem.content}</p></div>
                                    <textarea className="w-full border p-2 rounded h-32" placeholder="Write your answer..." value={editingItem.answer||''} onChange={e=>setEditingItem({...editingItem, answer:e.target.value})} />
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button 
                                onClick={
                                    modalType === 'package' ? savePackage : 
                                    modalType === 'groupbuy' ? saveGroupBuy : 
                                    modalType === 'coupon' ? saveCoupon : 
                                    modalType === 'affiliate' ? saveAffiliate : 
                                    modalType === 'magazine' ? saveMagazine :
                                    saveInquiryAnswer
                                } 
                                className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};
