
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Search, DollarSign, Lock, Eye, EyeOff, AlertCircle, Calendar as CalendarIcon, Package, Plus, Edit2, Trash2, Megaphone, X, Save, RefreshCw, Star, BarChart3, AlertTriangle, MessageSquare, Clock, Info, ShieldCheck, ChevronRight, LogOut, Shield, UserCheck, UserX, Settings as SettingsIcon, Printer, Mail, FileText, HelpCircle, Ticket, BookOpen, Link as LinkIcon, Globe, Copy, Check, ClipboardList
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, writeBatch, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, logoutUser } from '../services/authService';
import { useGlobal } from '../contexts/GlobalContext';
import { RichTextEditor } from '../components/RichTextEditor';

interface ProductType {
    id?: string; order?: number; title: string; description: string; price: string; priceValue?: number; image: string; category: string; detailTopImage?: string; detailContentImage?: string; infoText?: string; faqText?: string; content?: string; [key: string]: any; 
}
interface MainPackageType {
    id: string; title: string; price: number; originalPrice: number; description: string; content?: string; themeColor?: string; items?: string[]; theme?: string; [key: string]: any;
}
interface GroupBuyType {
    id: string; title: string; subTitle?: string; productType: 'basic' | 'premium'; originalPrice: number; discountedPrice: number; currentCount: number; maxCount: number; visitDate: string; startDate?: string; endDate?: string; status: 'active' | 'ended'; [key: string]: any;
}

export const AdminDashboard: React.FC<any> = () => {
  const { t, language } = useGlobal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'reservations' | 'products' | 'packages' | 'groupbuys' | 'users' | 'settings' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates' | 'surveys'>('dashboard');
  
  // Data States
  const [reservations, setReservations] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [mainPackages, setMainPackages] = useState<MainPackageType[]>([]);
  const [groupBuys, setGroupBuys] = useState<GroupBuyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });

  // Modal States
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Partial<MainPackageType> | null>(null);
  const [isGbModalOpen, setIsGbModalOpen] = useState(false);
  const [editingGb, setEditingGb] = useState<Partial<GroupBuyType> | null>(null);
  
  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const ADMIN_EMAIL = "admin@k-experience.com"; 

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
          if (user.email === ADMIN_EMAIL) { setIsAdmin(true); setLoading(false); } 
          else {
              try {
                  const userDoc = await getDoc(doc(db, "users", user.uid));
                  if (userDoc.exists() && userDoc.data().role === 'admin') setIsAdmin(true);
                  else setIsAdmin(false);
              } catch (e) { setIsAdmin(false); }
              setLoading(false);
          }
      } else { setIsAdmin(false); setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!currentUser || !isAdmin) return;
    
    // Reservations
    const unsubRes = onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snapshot) => {
        setReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        let totalRev = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if(data.status !== 'cancelled') totalRev += Number(data.totalPrice || 0);
        });
        setStats(prev => ({...prev, revenue: totalRev, orders: snapshot.size}));
    });
    
    // Packages
    const unsubPkg = onSnapshot(collection(db, "cms_packages"), (snap) => {
        setMainPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as MainPackageType)));
    });

    // Products
    const unsubProd = onSnapshot(collection(db, "products"), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductType)));
        setStats(prev => ({...prev, products: snap.size}));
    });

    // Group Buys
    const unsubGb = onSnapshot(query(collection(db, "group_buys"), orderBy("visitDate", "asc")), (snap) => {
        setGroupBuys(snap.docs.map(d => ({ id: d.id, ...d.data() } as GroupBuyType)));
    });

    setLoading(false);
    return () => { unsubRes(); unsubPkg(); unsubProd(); unsubGb(); };
  }, [currentUser, isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => { e.preventDefault(); try { await loginWithEmail(email, password); } catch (e) { alert("Login Failed"); } };
  const handleExitAdmin = () => window.location.href = '/';

  // --- PACKAGE CRUD ---
  const handleEditPackage = (pkg?: MainPackageType) => {
      setEditingPkg(pkg || { 
          id: '', title: '', description: '', price: 0, originalPrice: 0, theme: 'mint', items: [] 
      });
      setIsPkgModalOpen(true);
  };

  const handleSavePackage = async () => {
      if (!editingPkg || !editingPkg.title) return;
      const pkgData = { ...editingPkg, updatedAt: serverTimestamp() };
      try {
          if (editingPkg.id && mainPackages.some(p => p.id === editingPkg.id)) {
               await updateDoc(doc(db, "cms_packages", editingPkg.id), pkgData);
          } else {
              const newId = editingPkg.id || `pkg_${Date.now()}`;
              await setDoc(doc(db, "cms_packages", newId), { ...pkgData, id: newId });
          }
          setIsPkgModalOpen(false);
          alert("패키지가 저장되었습니다.");
      } catch (e) { console.error(e); alert("저장 실패"); }
  };

  const handleDeletePackage = async (id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까?")) return;
      await deleteDoc(doc(db, "cms_packages", id));
  };

  // --- GROUP BUY CRUD ---
  const handleEditGroupBuy = (gb?: GroupBuyType) => {
      setEditingGb(gb || {
          title: '', subTitle: '', productType: 'basic', originalPrice: 0, discountedPrice: 0,
          currentCount: 0, maxCount: 5, visitDate: '', status: 'active'
      });
      setIsGbModalOpen(true);
  };

  const handleSaveGroupBuy = async () => {
      if (!editingGb || !editingGb.title) return;
      const gbData = { ...editingGb, updatedAt: serverTimestamp() };
      try {
          if (editingGb.id) {
              await updateDoc(doc(db, "group_buys", editingGb.id), gbData);
          } else {
              await addDoc(collection(db, "group_buys"), gbData);
          }
          setIsGbModalOpen(false);
          alert("공동구매가 저장되었습니다.");
      } catch (e) { console.error(e); alert("저장 실패"); }
  };

  const handleDeleteGroupBuy = async (id: string) => {
      if(!window.confirm("정말 삭제하시겠습니까?")) return;
      await deleteDoc(doc(db, "group_buys", id));
  };

  const handleDeleteProduct = async (id: string) => {
      if(!window.confirm("정말 이 상품을 삭제하시겠습니까?")) return;
      await deleteDoc(doc(db, "products", id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
              <h2 className="text-2xl font-bold mb-6 text-center">관리자 로그인</h2>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full mb-4 border p-2 rounded bg-white"/>
              <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full mb-6 border p-2 rounded bg-white"/>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">로그인</button>
          </form>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        <aside className="w-64 bg-[#2C3E50] text-white hidden md:flex flex-col h-screen overflow-y-auto">
            <div className="h-16 flex items-center px-6 font-bold text-lg border-b border-gray-600">관리자 페이지</div>
            <nav className="flex-1 py-4 px-3 space-y-1">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                    { id: 'reservations', icon: ShoppingCart, label: '예약 현황' },
                    { id: 'packages', icon: Star, label: '올인원 패키지 관리' },
                    { id: 'groupbuys', icon: Megaphone, label: '공동구매 관리' },
                    { id: 'products', icon: Package, label: '개별 상품 관리' },
                    { id: 'users', icon: Users, label: '회원 관리' },
                    { id: 'settings', icon: SettingsIcon, label: '환경 설정' },
                ].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? 'bg-[#0070F0]' : 'hover:bg-gray-700'}`}>
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4"><button onClick={() => logoutUser()} className="w-full py-2 bg-gray-700 rounded text-sm">로그아웃</button></div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-16 bg-white border-b flex items-center justify-between px-8">
                <h2 className="text-lg font-bold">{activeTab.toUpperCase()}</h2>
                <button onClick={handleExitAdmin} className="text-sm bg-gray-100 px-3 py-1 rounded">쇼핑몰로 이동</button>
            </header>

            <div className="flex-1 overflow-auto p-8">
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>총 매출</h3><p className="text-2xl font-bold">₩ {stats.revenue.toLocaleString()}</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>총 예약</h3><p className="text-2xl font-bold">{stats.orders}건</p></div>
                        <div className="bg-white p-6 rounded-lg shadow-sm"><h3>상품 수</h3><p className="text-2xl font-bold">{stats.products}개</p></div>
                    </div>
                )}

                {activeTab === 'groupbuys' && (
                    <div className="space-y-6">
                         <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">공동구매(핫딜) 관리</h3>
                                <p className="text-sm text-gray-500">진행 중인 공동구매 상품을 등록하고 관리합니다.</p>
                            </div>
                            <button onClick={() => handleEditGroupBuy()} className="bg-[#FF6B6B] text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                                <Plus size={16}/> 공동구매 등록
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupBuys.length > 0 ? groupBuys.map(gb => (
                                <div key={gb.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative group">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditGroupBuy(gb)} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Edit2 size={14} className="text-gray-600"/></button>
                                        <button onClick={() => handleDeleteGroupBuy(gb.id)} className="p-2 bg-red-50 rounded hover:bg-red-100"><Trash2 size={14} className="text-red-500"/></button>
                                    </div>
                                    <div className={`text-xs font-bold inline-block px-2 py-1 rounded mb-3 text-white ${gb.productType === 'basic' ? 'bg-[#00C7AE]' : 'bg-[#FFD700]'}`}>
                                        {gb.productType.toUpperCase()}
                                    </div>
                                    <h4 className="font-bold text-lg mb-1">{gb.title}</h4>
                                    <p className="text-xs text-gray-500 mb-4">{gb.visitDate} 방문 예정</p>
                                    
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-gray-500">참여현황</div>
                                        <div className="font-bold text-[#FF6B6B]">{gb.currentCount} / {gb.maxCount}명</div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                        <div className="bg-[#FF6B6B] h-2 rounded-full" style={{ width: `${Math.min(100, (gb.currentCount / gb.maxCount) * 100)}%` }}></div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                        <span className="text-xs line-through text-gray-400">₩ {gb.originalPrice.toLocaleString()}</span>
                                        <span className="font-bold text-lg">₩ {gb.discountedPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-3 text-center py-20 bg-gray-50 rounded border border-dashed border-gray-300">
                                    <Megaphone className="mx-auto text-gray-300 mb-4" size={48}/>
                                    <p className="text-gray-500 font-medium mb-4">진행 중인 공동구매가 없습니다.</p>
                                    <button onClick={() => handleEditGroupBuy()} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors flex items-center gap-2 mx-auto">
                                        <Plus size={14}/> 첫 공동구매 등록하기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'packages' && (
                    <div className="space-y-6">
                         <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">올인원 패키지 관리</h3>
                                <p className="text-sm text-gray-500">웹사이트 메인에 노출되는 패키지 상품을 관리합니다. (Wellness, Idol, Glow 등)</p>
                            </div>
                            <button onClick={() => handleEditPackage()} className="bg-[#0070F0] text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                                <Plus size={16}/> 패키지 추가
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mainPackages.length > 0 ? mainPackages.map(pkg => (
                                <div key={pkg.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative group">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditPackage(pkg)} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Edit2 size={14} className="text-gray-600"/></button>
                                        <button onClick={() => handleDeletePackage(pkg.id)} className="p-2 bg-red-50 rounded hover:bg-red-100"><Trash2 size={14} className="text-red-500"/></button>
                                    </div>
                                    <div className={`text-xs font-bold inline-block px-2 py-1 rounded mb-3 text-white ${pkg.theme === 'mint' ? 'bg-[#40E0D0]' : pkg.theme === 'yellow' ? 'bg-[#FFD700]' : 'bg-[#FFB800]'}`}>
                                        {pkg.theme?.toUpperCase() || 'THEME'}
                                    </div>
                                    <h4 className="font-bold text-lg mb-2">{pkg.title}</h4>
                                    <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{pkg.description}</p>
                                    <div className="text-right font-bold text-blue-600">₩ {pkg.price?.toLocaleString()}</div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
                                        ID: {pkg.id}
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-3 text-center py-20 bg-gray-50 rounded border border-dashed border-gray-300">
                                    <Package className="mx-auto text-gray-300 mb-4" size={48}/>
                                    <p className="text-gray-500 font-medium mb-4">등록된 패키지가 없습니다.</p>
                                    <p className="text-xs text-gray-400">'패키지 추가' 버튼을 눌러 새로운 패키지를 등록해주세요.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">개별 상품 관리</h3>
                                <p className="text-sm text-gray-500">카테고리별 체험 상품을 관리합니다.</p>
                            </div>
                            <button className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                                <Plus size={16}/> 상품 추가 (준비중)
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50"><tr><th className="p-4">상품명</th><th className="p-4">카테고리</th><th className="p-4">가격</th><th className="p-4 text-right">관리</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-bold">{p.title}</td>
                                            <td className="p-4">{p.category}</td>
                                            <td className="p-4">₩ {p.priceValue?.toLocaleString()}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteProduct(p.id!)} className="text-red-500 hover:text-red-700 font-bold text-xs">삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Other tabs placeholder */}
                {activeTab === 'users' && <div className="p-10 text-center text-gray-400">회원 관리 기능 준비중</div>}
                {activeTab === 'settings' && <div className="p-10 text-center text-gray-400">환경 설정 기능 준비중</div>}
                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50"><tr><th className="p-4">날짜</th><th className="p-4">상품명</th><th className="p-4">예약자</th><th className="p-4">금액</th><th className="p-4">상태</th></tr></thead>
                            <tbody>
                                {reservations.map(res => (
                                    <tr key={res.id} className="border-b">
                                        <td className="p-4">{res.date}</td>
                                        <td className="p-4 font-bold">{res.productName}</td>
                                        <td className="p-4">{res.userId === 'guest' ? `Guest (${res.options?.guestEmail})` : '회원'}</td>
                                        <td className="p-4">₩ {Number(res.totalPrice).toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${res.status==='confirmed'?'bg-green-100 text-green-700':'bg-yellow-100'}`}>{res.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PACKAGE MODAL */}
            {isPkgModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingPkg?.id ? '패키지 수정' : '새 패키지 추가'}</h3>
                            <button onClick={() => setIsPkgModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">ID (영문, 고유값)</label>
                                <input type="text" value={editingPkg?.id} onChange={e => setEditingPkg({...editingPkg, id: e.target.value})} disabled={!!(editingPkg as any)?.createdAt} className="w-full border p-2 rounded bg-gray-50" placeholder="ex) pkg_wellness" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">패키지명 (Title)</label>
                                <input type="text" value={editingPkg?.title} onChange={e => setEditingPkg({...editingPkg, title: e.target.value})} className="w-full border p-2 rounded" placeholder="ex) WELLNESS 올인원" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">설명 (Description)</label>
                                <input type="text" value={editingPkg?.description} onChange={e => setEditingPkg({...editingPkg, description: e.target.value})} className="w-full border p-2 rounded" placeholder="간단한 설명" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">가격 (Price)</label>
                                    <input type="number" value={editingPkg?.price} onChange={e => setEditingPkg({...editingPkg, price: Number(e.target.value)})} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">테마 (Theme)</label>
                                    <select value={editingPkg?.theme} onChange={e => setEditingPkg({...editingPkg, theme: e.target.value})} className="w-full border p-2 rounded bg-white">
                                        <option value="mint">Mint (Basic)</option>
                                        <option value="yellow">Yellow (Idol)</option>
                                        <option value="orange">Orange (Glow)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">포함 내역 (Items) - 줄바꿈으로 구분</label>
                                <textarea 
                                    value={editingPkg?.items?.join('\n')} 
                                    onChange={e => setEditingPkg({...editingPkg, items: e.target.value.split('\n')})} 
                                    className="w-full border p-2 rounded h-24 text-sm"
                                    placeholder="건강검진 (베이직)&#13;&#10;엘피지오 (페이스)"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={handleSavePackage} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">저장하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* GROUP BUY MODAL */}
            {isGbModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                         <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingGb?.id ? '공동구매 수정' : '새 공동구매 등록'}</h3>
                            <button onClick={() => setIsGbModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">타이틀</label>
                                <input type="text" value={editingGb?.title} onChange={e => setEditingGb({...editingGb, title: e.target.value})} className="w-full border p-2 rounded" placeholder="ex) 3월 벚꽃시즌 IDOL 패키지" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">상품 타입</label>
                                    <select value={editingGb?.productType} onChange={e => setEditingGb({...editingGb, productType: e.target.value as any})} className="w-full border p-2 rounded bg-white">
                                        <option value="basic">BASIC</option>
                                        <option value="premium">PREMIUM</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">방문 예정일</label>
                                    <input type="date" value={editingGb?.visitDate} onChange={e => setEditingGb({...editingGb, visitDate: e.target.value})} className="w-full border p-2 rounded" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">정상가 (Original)</label>
                                    <input type="number" value={editingGb?.originalPrice} onChange={e => setEditingGb({...editingGb, originalPrice: Number(e.target.value)})} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">할인가 (Discounted)</label>
                                    <input type="number" value={editingGb?.discountedPrice} onChange={e => setEditingGb({...editingGb, discountedPrice: Number(e.target.value)})} className="w-full border p-2 rounded" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">현재 모집인원</label>
                                    <input type="number" value={editingGb?.currentCount} onChange={e => setEditingGb({...editingGb, currentCount: Number(e.target.value)})} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">최대 모집인원</label>
                                    <input type="number" value={editingGb?.maxCount} onChange={e => setEditingGb({...editingGb, maxCount: Number(e.target.value)})} className="w-full border p-2 rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                            <button onClick={handleSaveGroupBuy} className="bg-[#FF6B6B] text-white px-6 py-2 rounded font-bold hover:bg-[#ff5252]">저장하기</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};
