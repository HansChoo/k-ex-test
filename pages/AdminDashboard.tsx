
import React, { useEffect, useState } from 'react';
import { 
    LayoutDashboard, ShoppingCart, Users, Search, DollarSign, Lock, Eye, EyeOff, AlertCircle, Calendar as CalendarIcon, Package, Plus, Edit2, Trash2, Megaphone, X, Save, RefreshCw, Star, BarChart3, AlertTriangle, MessageSquare, Clock, Info, ShieldCheck, ChevronRight, LogOut, Shield, UserCheck, UserX, Settings as SettingsIcon, Printer, Mail, FileText, HelpCircle, Ticket, BookOpen, Link as LinkIcon, Globe, Copy, Check
} from 'lucide-react';
import { collection, query, orderBy, updateDoc, doc, addDoc, deleteDoc, writeBatch, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User, sendPasswordResetEmail } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, logoutUser } from '../services/authService';
import { PRODUCTS } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { sendEmail } from '../services/emailService';

interface AdminDashboardProps {
  language: 'ko' | 'en';
}

interface ProductType {
    id?: string; order?: number; title: string; description: string; price: string; priceValue?: number; image: string; category: string; detailTopImage?: string; detailContentImage?: string; infoText?: string; faqText?: string; content?: string; [key: string]: any; 
}
interface MainPackageType {
    id: string; title: string; price: number; originalPrice: number; description: string; content?: string; themeColor?: string; [key: string]: any;
}

const DEFAULT_CONTENT = `
<div style="text-align: center; margin-bottom: 30px;">
    <h2>Package Details</h2>
    <p>Enter detailed description here.</p>
</div>
`;

// --- ORIGINAL RESTORE DATA (The exact content you wanted) ---
const RESTORE_DATA = [
    {
        id: 'package_basic',
        title: 'K-체험 올인원 패키지 - 베이직',
        title_en: 'K-Experience All-in-One Package - Basic',
        price: 2763000,
        originalPrice: 3070000,
        description: '건강검진 (Basic) + K-IDOL (Basic) + GLASS SKIN Package',
        description_en: 'Health Check (Basic) + K-IDOL (Basic) + GLASS SKIN Package',
        themeColor: 'blue',
        content: `
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/big/20260105/1d40ee250a607379e09525c0385c0db3.png" style="width: 100%; border-radius: 12px; margin-bottom: 20px;">
                <h2>Basic Package Highlights</h2>
                <p>합리적인 가격으로 즐기는 한국의 필수 의료/뷰티/문화 체험 코스입니다.</p>
            </div>
            <h3>📋 포함 내역 (Included)</h3>
            <ul>
                <li><strong>건강검진 (Basic):</strong> 혈액검사, 소변검사, 흉부 X-ray, 신체계측 등 필수 항목 검진</li>
                <li><strong>K-IDOL 체험 (Basic):</strong> 헤어 & 메이크업 스타일링 + 스튜디오 프로필 촬영 (원본 제공)</li>
                <li><strong>GLASS SKIN 패키지:</strong> 딥 클렌징 + 보습 관리 + 가벼운 레이저 토닝</li>
                <li>호텔 픽업 서비스 (서울 강남권)</li>
            </ul>
            <br>
            <h3>⏰ 소요 시간</h3>
            <p>총 6~7시간 소요 (오전 9시 시작 권장)</p>
        `,
        content_en: `
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/big/20260105/1d40ee250a607379e09525c0385c0db3.png" style="width: 100%; border-radius: 12px; margin-bottom: 20px;">
                <h2>Basic Package Highlights</h2>
                <p>Essential K-Medical & Culture course at a reasonable price.</p>
            </div>
            <h3>📋 Included Items</h3>
            <ul>
                <li><strong>Health Check (Basic):</strong> Blood test, Urine test, Chest X-ray, Body measurement, etc.</li>
                <li><strong>K-IDOL Experience (Basic):</strong> Hair & Makeup Styling + Studio Profile Photoshoot (Original files provided)</li>
                <li><strong>GLASS SKIN Package:</strong> Deep Cleansing + Moisturizing + Light Laser Toning</li>
                <li>Hotel Pick-up Service (Gangnam area)</li>
            </ul>
            <br>
            <h3>⏰ Duration</h3>
            <p>Approx. 6~7 Hours (Recommended to start at 9 AM)</p>
        `
    },
    {
        id: 'package_premium',
        title: 'K-체험 올인원 패키지 - 프리미엄',
        title_en: 'K-Experience All-in-One Package - Premium',
        price: 7515000,
        originalPrice: 8350000,
        description: '건강검진 (Premium) + K-IDOL (Premium) + REJURAN BOOST Package',
        description_en: 'Health Check (Premium) + K-IDOL (Premium) + REJURAN BOOST Package',
        themeColor: 'gold',
        content: `
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/big/20260105/7014f4a482dbc5af8d684c63b849f70b.png" style="width: 100%; border-radius: 12px; margin-bottom: 20px;">
                <h2>👑 VIP Premium Service</h2>
                <p>최고급 건강검진과 VIP 전용 뷰티 케어, 의전 차량이 포함된 럭셔리 코스입니다.</p>
            </div>
            <h3>📋 포함 내역 (Included)</h3>
            <ul>
                <li><strong>정밀 건강검진 (Premium):</strong> Basic 항목 + MRI/CT 선택 1 + 초음파 + 위/대장 내시경(수면)</li>
                <li><strong>K-IDOL 체험 (Premium):</strong> 풀코스 스타일링 + 뮤직비디오 컨셉 영상 촬영 + 화보 촬영</li>
                <li><strong>REJURAN BOOST:</strong> 리쥬란 힐러(전체) + 써마지/울쎄라 리프팅 + VIP 진정 관리</li>
                <li><strong>VIP 의전:</strong> 공항 픽업/샌딩 + 전 일정 전용 차량 + 1:1 전담 통역사 동행</li>
            </ul>
            <br>
            <h3>⏰ 소요 시간</h3>
            <p>1박 2일 또는 당일 풀코스 (오전 8시 시작)</p>
        `,
        content_en: `
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/big/20260105/7014f4a482dbc5af8d684c63b849f70b.png" style="width: 100%; border-radius: 12px; margin-bottom: 20px;">
                <h2>👑 VIP Premium Service</h2>
                <p>Luxury course including premium check-up, VIP beauty care, and limousine service.</p>
            </div>
            <h3>📋 Included Items</h3>
            <ul>
                <li><strong>Premium Health Check:</strong> Basic items + MRI/CT (Select 1) + Ultrasound + Endoscopy (Sedation)</li>
                <li><strong>K-IDOL Experience (Premium):</strong> Full styling + Music Video concept filming + Pictorial shoot</li>
                <li><strong>REJURAN BOOST:</strong> Rejuran Healer (Full face) + Thermage/Ulthera Lifting + VIP Soothing Care</li>
                <li><strong>VIP Concierge:</strong> Airport Pick-up/Drop-off + Private Limousine + 1:1 Dedicated Translator</li>
            </ul>
            <br>
            <h3>⏰ Duration</h3>
            <p>1 Night 2 Days OR Full Day Course (Starts at 8 AM)</p>
        `
    }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { t, language } = useGlobal();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'reservations' | 'products' | 'packages' | 'groupbuys' | 'users' | 'settings' | 'coupons' | 'magazine' | 'inquiries' | 'affiliates'>('dashboard');
  
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [mainPackages, setMainPackages] = useState<MainPackageType[]>([]);
  const [groupBuys, setGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [coupons, setCoupons] = useState<any[]>([]);
  const [magazinePosts, setMagazinePosts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  // Settings Forms
  const [emailConfig, setEmailConfig] = useState({ serviceId: '', templateId: '', publicKey: '', confirmationBody: '' });
  const [receiptConfig, setReceiptConfig] = useState({ companyName: '', address: '', ceo: '', regNo: '', logoUrl: '', footerText: '' });

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  // --- Multilingual Editor State ---
  const [editLang, setEditLang] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [productForm, setProductForm] = useState<ProductType>({
      title: '', description: '', price: '', image: '', category: '', order: 99,
      content: ''
  });

  // Package Modal
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MainPackageType | null>(null);

  // Magazine Modal
  const [isMagModalOpen, setIsMagModalOpen] = useState(false);
  const [magForm, setMagForm] = useState({ title: '', category: '', image: '', content: '' });

  // Coupon Form Enhanced
  const [couponForm, setCouponForm] = useState({ 
      name: '', // Internal name
      code: '', 
      type: 'percent', 
      value: 10, 
      expiryDate: '',
      maxUsage: 100 // Default limit
  });

  // Affiliate Form Enhanced
  const [affiliateForm, setAffiliateForm] = useState({ 
      code: '', 
      name: '', 
      commission: 10 // %
  });

  const ADMIN_EMAIL = "admin@k-experience.com"; 
  const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Auth & Admin Role Check (Same as before)
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

  // REAL-TIME DATA SYNC
  useEffect(() => {
    if (!currentUser || !isAdmin) return;
    const unsubRes = onSnapshot(query(collection(db, "reservations"), orderBy("createdAt", "desc")), (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setReservations(data);
        const revenueByMonth = Array(12).fill(0);
        let totalRev = 0;
        data.forEach((r: any) => {
            if (r.status !== 'cancelled' && r.createdAt) {
                let date: Date | null = null;
                if (r.createdAt?.seconds) date = new Date(r.createdAt.seconds * 1000);
                else if (r.createdAt instanceof Date) date = r.createdAt;
                else if (typeof r.createdAt === 'string') date = new Date(r.createdAt);
                if (date && !isNaN(date.getTime())) {
                     const monthIndex = date.getMonth();
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
    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snapshot) => { setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); setStats(prev => ({ ...prev, users: snapshot.size })); });
    const unsubProds = onSnapshot(query(collection(db, "products"), orderBy("order", "asc")), (snapshot) => { setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductType))); setStats(prev => ({ ...prev, products: snapshot.size })); });
    const unsubGb = onSnapshot(query(collection(db, "group_buys"), orderBy("createdAt", "desc")), (snapshot) => { setGroupBuys(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubPkg = onSnapshot(collection(db, "cms_packages"), (snapshot) => { const pkgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MainPackageType)); setMainPackages(pkgs.sort((a,b) => a.id.localeCompare(b.id))); });
    const unsubSettings = onSnapshot(collection(db, "settings"), (snapshot) => { snapshot.docs.forEach(doc => { if (doc.id === 'email_config') setEmailConfig(doc.data() as any); if (doc.id === 'receipt_config') setReceiptConfig(doc.data() as any); }); });
    const unsubCoupons = onSnapshot(collection(db, "coupons"), snap => setCoupons(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubMag = onSnapshot(query(collection(db, "cms_magazine"), orderBy("createdAt", "desc")), snap => setMagazinePosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubInq = onSnapshot(query(collection(db, "inquiries"), orderBy("createdAt", "desc")), snap => setInquiries(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubAff = onSnapshot(collection(db, "affiliates"), snap => setAffiliates(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    setLoading(false);
    return () => { unsubRes(); unsubUsers(); unsubProds(); unsubGb(); unsubPkg(); unsubSettings(); unsubCoupons(); unsubMag(); unsubInq(); unsubAff(); };
  }, [currentUser, isAdmin]);

  // Auth Handlers
  const handleAdminLogin = async (e: React.FormEvent) => { e.preventDefault(); setAuthLoading(true); try { await loginWithEmail(email, password); } catch (error: any) { setLoginError({ type: 'error', message: error.message }); } finally { setAuthLoading(false); } };
  const createDefaultAdmin = async () => { if (!window.confirm("Create default admin account?")) return; setAuthLoading(true); try { if (auth.currentUser) await logoutUser(); await registerWithEmail({ email: ADMIN_EMAIL, password: "admin1234", name: "Admin", phone: "000", nationality: "KR" }); setEmail(ADMIN_EMAIL); setPassword("admin1234"); setLoginError({ type: 'success', message: "Account created." }); } catch (e: any) { setLoginError({ type: 'error', message: e.message }); } finally { setAuthLoading(false); } };
  const handleExitAdmin = () => { window.location.href = '/'; };

  // Handlers
  const handleStatusUpdate = async (id: string, newStatus: string, resData: any) => { if (window.confirm(`Change status to ${newStatus}?`)) { await updateDoc(doc(db, "reservations", id), { status: newStatus }); if (newStatus === 'confirmed') { const user = users.find(u => u.uid === resData.userId); if (user && user.email) { const sent = await sendEmail('confirmation', { name: user.name, email: user.email, productName: resData.productName, date: resData.date }); if (sent) alert("Confirmation email sent automatically."); } } } };
  const handleAdminNoteUpdate = async (id: string, note: string) => { const newNote = prompt("Enter Note:", note); if (newNote !== null) await updateDoc(doc(db, "reservations", id), { adminNote: newNote }); };
  const saveProduct = async () => { if(!productForm.title || !productForm.price) return alert("Missing fields"); if (editingProduct?.id) await updateDoc(doc(db, "products", editingProduct.id), productForm as any); else await addDoc(collection(db, "products"), { ...productForm, createdAt: new Date() }); setIsProductModalOpen(false); };
  const deleteProduct = async (id: string) => { if (window.confirm(t('delete') + "?")) await deleteDoc(doc(db, "products", id)); };
  const deleteGroupBuy = async (id: string) => { if (window.confirm(t('delete') + "?")) await deleteDoc(doc(db, "group_buys", id)); };
  const updatePackage = async (pkg: MainPackageType, field: string, value: any) => { const ref = doc(db, "cms_packages", pkg.id); await updateDoc(ref, { [field]: value }); };
  const createNewPackage = async () => { const id = `package_${Date.now()}`; await setDoc(doc(db, "cms_packages", id), { id: id, title: "New Package", price: 1000000, originalPrice: 1500000, description: "새로운 패키지 설명입니다.", content: DEFAULT_CONTENT, themeColor: "blue" }); };
  const deletePackage = async (id: string) => { if(window.confirm("이 패키지를 메인 화면에서 삭제하시겠습니까? (복구 불가)")) { await deleteDoc(doc(db, "cms_packages", id)); } };
  
  // *** RESTORE DEFAULTS HANDLER (AUTOMATIC SYNC INJECTION) ***
  const handleRestoreDefaults = async () => { 
      if(!window.confirm("경고: 베이직/프리미엄 패키지 내용이 초기값으로 복구됩니다. 진행하시겠습니까?")) return; 
      const batch = writeBatch(db); 
      RESTORE_DATA.forEach(pkg => { 
          const ref = doc(db, "cms_packages", pkg.id); 
          batch.set(ref, pkg, { merge: true }); 
      }); 
      await batch.commit(); 
      alert("성공: 원본 패키지 데이터가 복구되었습니다. 메인 화면을 확인하세요."); 
  };

  const openPackageEditor = (pkg: MainPackageType) => { setEditingPackage({ ...pkg }); setEditLang('ko'); setIsPackageModalOpen(true); };
  const savePackageFull = async () => { if (!editingPackage) return; const ref = doc(db, "cms_packages", editingPackage.id); await updateDoc(ref, { ...editingPackage }); setIsPackageModalOpen(false); };
  const saveSettings = async () => { await setDoc(doc(db, "settings", "email_config"), emailConfig); await setDoc(doc(db, "settings", "receipt_config"), receiptConfig); alert("설정이 저장되었습니다!"); };
  
  // Multilingual Helpers
  const handleLocalizedChange = (field: string, value: string, setter: any, currentObj: any) => { const key = editLang === 'ko' ? field : `${field}_${editLang}`; setter({ ...currentObj, [key]: value }); };
  const getInputValue = (currentObj: any, field: string) => { if (!currentObj) return ''; const key = editLang === 'ko' ? field : `${field}_${editLang}`; return currentObj[key] || ''; };
  const LangTabs = () => ( <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 w-fit"> {['ko', 'en', 'ja', 'zh'].map((lang: any) => ( <button key={lang} onClick={() => setEditLang(lang)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors uppercase ${editLang === lang ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{lang}</button> ))} </div> );

  // ... (Rest of component remains exactly the same) ...
  const handleCreateCoupon = async () => {
      if (!couponForm.code || !couponForm.name) return alert("Code and Name required");
      await addDoc(collection(db, "coupons"), {
          ...couponForm, value: Number(couponForm.value), maxUsage: Number(couponForm.maxUsage), currentUsage: 0, isActive: true, createdAt: serverTimestamp()
      });
      setCouponForm({ name: '', code: '', type: 'percent', value: 10, expiryDate: '', maxUsage: 100 });
  };
  const deleteCoupon = async (id: string) => { if(window.confirm(t('delete')+"?")) await deleteDoc(doc(db, "coupons", id)); };
  const handleCreateAffiliate = async () => {
      if (!affiliateForm.code || !affiliateForm.name) return alert("Code and Name required");
      await addDoc(collection(db, "affiliates"), { ...affiliateForm, clicks: 0, sales: 0, totalRevenue: 0, createdAt: serverTimestamp() });
      setAffiliateForm({ code: '', name: '', commission: 10 });
  };
  const copyLink = (code: string) => { const url = `${window.location.origin}?ref=${code}`; navigator.clipboard.writeText(url); alert("Link copied: " + url); };
  const handleMagSubmit = async () => { await addDoc(collection(db, "cms_magazine"), { ...magForm, createdAt: serverTimestamp(), author: 'Admin' }); setIsMagModalOpen(false); setMagForm({ title: '', category: '', image: '', content: '' }); };
  const handleAnswerInquiry = async (id: string) => { const ans = prompt("Answer:"); if(ans) await updateDoc(doc(db, "inquiries", id), { answer: ans, status: 'answered', answeredAt: serverTimestamp() }); };
  const handleDragStart = (e: React.DragEvent, resId: string) => { e.dataTransfer.setData("resId", resId); };
  const handleDrop = async (e: React.DragEvent, dateStr: string) => { e.preventDefault(); const resId = e.dataTransfer.getData("resId"); if (resId && window.confirm(`Move?`)) await updateDoc(doc(db, "reservations", resId), { date: dateStr }); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const toggleUserAdminRole = async (targetUserId: string, currentRole: string, targetUserEmail: string) => { if(window.confirm("Change Role?")) try { await updateDoc(doc(db, "users", targetUserId), { role: currentRole==='admin'?'user':'admin' }); } catch(e) {} };
  const handleSeedProducts = async () => { if(window.confirm("Reset?")) { const batch = writeBatch(db); PRODUCTS.forEach((p, i) => batch.set(doc(collection(db, "products")), { ...p, order: i + 1 })); await batch.commit(); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500"><RefreshCw className="animate-spin mr-2"/> Connecting...</div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><button onClick={handleAdminLogin}>Admin Login</button></div>;

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        <aside className="w-64 bg-[#1e2330] text-white flex-shrink-0 hidden md:flex flex-col h-screen overflow-y-auto">
            <div className="h-16 flex items-center px-6 border-b border-gray-700 font-bold text-lg tracking-tight">K-Experience</div>
            <nav className="flex-1 py-6 space-y-1 px-3">
                {[{ id: 'dashboard', icon: LayoutDashboard, label: t('admin_dash') }, { id: 'calendar', icon: CalendarIcon, label: t('admin_cal') }, { id: 'reservations', icon: ShoppingCart, label: t('admin_res') }, { id: 'products', icon: Package, label: t('admin_prod') }, { id: 'packages', icon: Star, label: t('admin_pkg') }, { id: 'groupbuys', icon: Megaphone, label: t('admin_gb') }, { id: 'users', icon: Users, label: t('admin_users') }, { id: 'coupons', icon: Ticket, label: t('admin_coupon') }, { id: 'magazine', icon: BookOpen, label: t('admin_magazine') }, { id: 'inquiries', icon: MessageSquare, label: t('admin_inquiry') }, { id: 'affiliates', icon: LinkIcon, label: t('admin_affiliate') }, { id: 'settings', icon: SettingsIcon, label: 'Settings' }].map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800'}`}><item.icon size={18} /> {item.label}</button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700"><button onClick={() => { logoutUser(); window.location.reload(); }} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-xs rounded-lg text-gray-300 font-bold flex items-center justify-center gap-2 transition-colors"><LogOut size={14} /> {t('logout')}</button></div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 capitalize flex items-center gap-2">{t(`admin_${activeTab}` as any) || activeTab.toUpperCase()}<span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1"><Clock size={10}/> Live Sync</span></h2>
                <div className="flex items-center gap-4"><button onClick={handleExitAdmin} className="text-xs font-bold text-gray-500 hover:text-[#0070F0] border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">Go to Shop</button><div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200">{currentUser?.email === ADMIN_EMAIL ? 'S' : 'A'}</div></div>
            </header>

            <div className="flex-1 overflow-auto p-8">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[{ label: t('revenue'), val: `₩ ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: t('orders'), val: stats.orders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' }, { label: t('users'), val: stats.users, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }, { label: t('products'), val: stats.products, icon: Package, color: 'text-green-600', bg: 'bg-green-50' }].map((s, i) => (<div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p><h3 className="text-2xl font-black">{s.val}</h3></div><div className={`w-12 h-12 ${s.bg} rounded-full flex items-center justify-center ${s.color}`}><s.icon size={24} /></div></div>))}
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-lg font-bold mb-6 flex items-center gap-2"><BarChart3 size={20}/> {t('monthly_rev')}</h3><div className="h-64 flex items-end gap-2 md:gap-4 justify-between px-2 md:px-10 border-b border-gray-200 pb-2">{monthlyRevenue.map((amount, idx) => { const safeAmount = isNaN(amount) ? 0 : amount; const safeMax = Math.max(...monthlyRevenue.map(v => isNaN(v) ? 0 : v), 1); const heightPercent = (safeAmount / safeMax) * 100; return (<div key={idx} className="w-full flex flex-col items-center gap-2 group relative"><div className="w-full max-w-[40px] bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all relative" style={{ height: `${Math.max(heightPercent, 2)}%` }}><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 font-bold">₩{safeAmount.toLocaleString()}</div></div><span className="text-[10px] md:text-xs text-gray-500 font-bold">{language === 'ko' ? MONTHS_KO[idx] : MONTHS_EN[idx]}</span></div>);})}</div></div>
                    </div>
                )}
                
                {activeTab === 'coupons' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col gap-4 mb-6">
                            <h3 className="text-lg font-bold">{t('admin_coupon')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-gray-50 p-4 rounded-lg">
                                <input type="text" placeholder={t('coupon_name')} value={couponForm.name} onChange={e => setCouponForm({...couponForm, name: e.target.value})} className="border rounded px-2 py-2 text-sm md:col-span-1"/>
                                <input type="text" placeholder={t('coupon_code')} value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="border rounded px-2 py-2 text-sm uppercase md:col-span-1"/>
                                <select value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value})} className="border rounded px-2 py-2 text-sm md:col-span-1"><option value="percent">{t('percent')}</option><option value="fixed">{t('fixed_amount')}</option></select>
                                <input type="number" placeholder={t('discount_value')} value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: Number(e.target.value)})} className="border rounded px-2 py-2 text-sm md:col-span-1"/>
                                <input type="number" placeholder={t('max_usage')} value={couponForm.maxUsage} onChange={e => setCouponForm({...couponForm, maxUsage: Number(e.target.value)})} className="border rounded px-2 py-2 text-sm md:col-span-1"/>
                                <input type="date" value={couponForm.expiryDate} onChange={e => setCouponForm({...couponForm, expiryDate: e.target.value})} className="border rounded px-2 py-2 text-sm md:col-span-1"/>
                                <button onClick={handleCreateCoupon} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold md:col-span-6 mt-2">{t('create_coupon')}</button>
                            </div>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500"><tr><th>Name</th><th>Code</th><th>Type</th><th>Value</th><th>Usage (Used/Max)</th><th>Expiry</th><th>Manage</th></tr></thead>
                            <tbody>
                                {coupons.map(c => {
                                    const percentUsed = Math.min(100, ((c.currentUsage || 0) / (c.maxUsage || 1)) * 100);
                                    return (
                                        <tr key={c.id} className="border-b">
                                            <td className="p-3 font-bold">{c.name}</td>
                                            <td className="p-3 font-mono text-blue-600">{c.code}</td>
                                            <td className="p-3">{c.type === 'percent' ? '%' : 'KRW'}</td>
                                            <td className="p-3">{c.value.toLocaleString()}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-blue-500 h-full" style={{width: `${percentUsed}%`}}></div>
                                                    </div>
                                                    <span className="text-xs">{c.currentUsage || 0} / {c.maxUsage}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">{c.expiryDate}</td>
                                            <td className="p-3"><button onClick={() => deleteCoupon(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'affiliates' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col gap-4 mb-6">
                            <h3 className="text-lg font-bold">{t('admin_affiliate')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-gray-50 p-4 rounded-lg">
                                <input type="text" placeholder={t('affiliate_code')} value={affiliateForm.code} onChange={e => setAffiliateForm({...affiliateForm, code: e.target.value})} className="border rounded px-2 py-2 text-sm"/>
                                <input type="text" placeholder={t('partner_name')} value={affiliateForm.name} onChange={e => setAffiliateForm({...affiliateForm, name: e.target.value})} className="border rounded px-2 py-2 text-sm"/>
                                <input type="number" placeholder={t('commission')} value={affiliateForm.commission} onChange={e => setAffiliateForm({...affiliateForm, commission: Number(e.target.value)})} className="border rounded px-2 py-2 text-sm w-full"/>
                                <button onClick={handleCreateAffiliate} className="bg-purple-600 text-white px-3 py-2 rounded text-sm font-bold">Add Partner</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[800px]">
                                <thead className="bg-gray-50 text-gray-500"><tr><th>Partner</th><th>Code</th><th>Link</th><th>Clicks</th><th>Sales</th><th>{t('total_rev')}</th><th>{t('comm_amount')}</th><th>Manage</th></tr></thead>
                                <tbody>
                                    {affiliates.map(af => {
                                        const commissionAmount = (af.totalRevenue || 0) * ((af.commission || 0) / 100);
                                        return (
                                            <tr key={af.id} className="border-b">
                                                <td className="p-3 font-bold">{af.name}</td>
                                                <td className="p-3 font-mono text-purple-600">{af.code}</td>
                                                <td className="p-3">
                                                    <button onClick={() => copyLink(af.code)} className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600 font-bold border border-gray-300">
                                                        <LinkIcon size={12}/> {t('link_copy')}
                                                    </button>
                                                </td>
                                                <td className="p-3">{af.clicks}</td>
                                                <td className="p-3 font-bold">{af.sales}</td>
                                                <td className="p-3">₩{(af.totalRevenue || 0).toLocaleString()}</td>
                                                <td className="p-3 text-green-600 font-bold">₩{Math.floor(commissionAmount).toLocaleString()} <span className="text-[10px] text-gray-400">({af.commission}%)</span></td>
                                                <td className="p-3"><button onClick={async () => { if(window.confirm("Delete?")) await deleteDoc(doc(db, "affiliates", af.id)); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Other Tabs (Keep existing) */}
                {activeTab === 'calendar' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold">{t('admin_cal')}</h3><span className="text-xs text-blue-500 bg-blue-50 px-3 py-1 rounded-full font-bold">Tip: Drag & Drop reservations to reschedule!</span></div><div className="grid grid-cols-7 border-b border-gray-200 pb-2 mb-2 text-center text-sm font-bold text-gray-500">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 gap-2 min-h-[400px]">{Array.from({length: 31}, (_, i) => { const day = i + 1; const dateStr = `2026-02-${day.toString().padStart(2, '0')}`; const dayRes = reservations.filter(r => r.date === dateStr); return (<div key={day} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dateStr)} className={`border border-gray-100 rounded p-1 h-32 overflow-hidden hover:bg-gray-50 transition-colors ${dayRes.length > 0 ? 'bg-blue-50/50' : ''}`}><span className="text-sm font-bold text-gray-700 ml-1">{day}</span><div className="mt-1 space-y-1 overflow-y-auto max-h-[100px] no-scrollbar">{dayRes.map((r: any) => (<div key={r.id} draggable onDragStart={(e) => handleDragStart(e, r.id)} className={`text-[10px] px-1 py-1 rounded truncate cursor-move shadow-sm active:opacity-50 ${r.status === 'confirmed' ? 'bg-blue-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>{r.productName}</div>))}</div></div>) })}</div></div>
                )}
                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 font-medium"><tr><th className="px-6 py-4">{t('order_date')}</th><th className="px-6 py-4">Product/Date</th><th className="px-6 py-4">{t('total')}</th><th className="px-6 py-4">{t('status')}</th><th className="px-6 py-4">{t('manage')}</th></tr></thead><tbody className="divide-y divide-gray-100">{reservations.map((res) => { const statusColor = res.status === 'confirmed' ? 'text-green-600 bg-green-50 border-green-200' : res.status === 'cancelled' ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'; return (<tr key={res.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 text-gray-500">{new Date(res.createdAt?.seconds * 1000).toLocaleDateString()}<div className="text-xs">{new Date(res.createdAt?.seconds * 1000).toLocaleTimeString()}</div></td><td className="px-6 py-4"><div className="font-bold text-[#111]">{res.productName}</div><div className="text-xs text-blue-600 font-medium">Date: {res.date}</div><div className="text-[10px] text-gray-400 mt-1">ID: {res.id}</div>{res.adminNote && (<div className="mt-2 text-xs bg-gray-100 p-2 rounded flex items-start gap-1"><MessageSquare size={12} className="mt-0.5 text-gray-500"/><span className="text-gray-700">{res.adminNote}</span></div>)}</td><td className="px-6 py-4 font-bold">₩{Number(res.totalPrice).toLocaleString()}</td><td className="px-6 py-4"><select value={res.status} onChange={(e) => handleStatusUpdate(res.id, e.target.value, res)} className={`px-2 py-1.5 rounded border text-xs font-bold focus:outline-none ${statusColor}`}><option value="pending">{t('status_pending')}</option><option value="confirmed">{t('status_confirmed')}</option><option value="completed">{t('status_completed')}</option><option value="cancelled">{t('status_cancelled')}</option></select></td><td className="px-6 py-4"><button onClick={() => handleAdminNoteUpdate(res.id, res.adminNote || '')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-bold text-gray-600">{t('memo')}</button></td></tr>)})}</tbody></table></div>
                )}
                {activeTab === 'products' && (
                    <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="text-lg font-bold">{t('admin_prod')}</h3><div className="flex gap-2"><button onClick={handleSeedProducts} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center gap-2"><RefreshCw size={16}/> {t('import_db')}</button><button onClick={() => { setEditingProduct(null); setProductForm({ title: '', description: '', price: '', image: '', category: '', order: products.length + 1, content: '' }); setEditLang('ko'); setIsProductModalOpen(true); }} className="px-4 py-2 bg-[#0070F0] text-white rounded font-bold text-sm flex gap-2"><Plus size={16}/> Add Product</button></div></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{products.map(product => (<div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"><div className="relative h-48 bg-gray-100"><img src={product.image} className="w-full h-full object-cover"/><div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">No. {product.order}</div><div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingProduct(product); setProductForm(product); setEditLang('ko'); setIsProductModalOpen(true); }} className="bg-white p-2 rounded-full shadow hover:text-blue-600"><Edit2 size={14}/></button><button onClick={() => deleteProduct(product.id!)} className="bg-white p-2 rounded-full shadow hover:text-red-600"><Trash2 size={14}/></button></div></div><div className="p-4"><div className="text-xs text-gray-500 mb-1">{product.category}</div><h4 className="font-bold truncate">{product.title}</h4><div className="text-[#0070F0] font-black mt-2">{product.price}</div></div></div>))}</div></div>
                )}
                {activeTab === 'packages' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold">{t('admin_pkg')}</h3><div className="flex gap-2"><button onClick={handleRestoreDefaults} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors flex items-center gap-2"><RefreshCw size={16} /> 기본 패키지 복구</button><button onClick={createNewPackage} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-2"><Plus size={16} /> Add New Package</button></div></div><div className={`grid grid-cols-1 ${mainPackages.length > 1 ? 'lg:grid-cols-2' : ''} gap-8`}>{mainPackages.map(pkg => (<div key={pkg.id} className="p-6 rounded-xl border-2 border-gray-100 bg-gray-50 relative group"><div className="flex justify-between items-start mb-4"><h4 className="text-xl font-black text-gray-700">{pkg.title}</h4><div className="flex gap-2"><button onClick={() => openPackageEditor(pkg)} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold shadow-sm hover:text-blue-600 flex items-center gap-1"><FileText size={14} /> Edit Detail</button><button onClick={() => deletePackage(pkg.id)} className="bg-white p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div></div><div className="space-y-4"><p className="text-xs text-gray-500">{pkg.description}</p><div className="font-bold text-lg">{pkg.price.toLocaleString()} KRW</div></div></div>))}</div>
                    </div>
                )}
                {activeTab === 'groupbuys' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-bold mb-4">{t('admin_gb')}</h3><div className="text-xs text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg flex gap-2"><Info size={16} /> Items without a date will not be shown on the website. Please delete and recreate them.</div><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500"><tr><th>Product</th><th>Creator</th><th>Visit Date</th><th>Count</th><th>{t('manage')}</th></tr></thead><tbody>{groupBuys.map(gb => (<tr key={gb.id} className="border-b hover:bg-gray-50"><td className="p-3 font-bold">{gb.product} <span className="text-xs font-normal text-gray-500">({gb.type})</span></td><td className="p-3">{gb.creatorName}</td><td className={`p-3 font-bold ${!gb.visitDate ? 'text-red-500' : 'text-blue-600'}`}>{gb.visitDate || "🚫 Missing Date"}</td><td className="p-3">{gb.currentCount}/{gb.maxCount}</td><td className="p-3"><button onClick={() => deleteGroupBuy(gb.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
                )}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-bold mb-4">{t('admin_users')}</h3><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b last:border-0 hover:bg-gray-50"><td className="p-3 font-bold">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.phone}</td><td className="p-3">{u.email === ADMIN_EMAIL ? (<span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-black flex items-center gap-1 w-fit"><Shield size={12}/> SUPER</span>) : u.role === 'admin' ? (<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ShieldCheck size={12}/> ADMIN</span>) : (<span className="text-gray-400 text-xs">USER</span>)}</td><td className="p-3 text-gray-400">{u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString() : '-'}</td><td className="p-3 text-right">{u.email !== ADMIN_EMAIL && (<button onClick={() => toggleUserAdminRole(u.id, u.role, u.email)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ml-auto ${u.role === 'admin' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{u.role === 'admin' ? <><UserX size={14}/> Revoke</> : <><UserCheck size={14}/> Make Admin</>}</button>)}</td></tr>))}</tbody></table></div>
                )}
                {activeTab === 'magazine' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold">{t('admin_magazine')}</h3>
                            <button onClick={() => setIsMagModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus size={16}/> {t('create_post')}</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {magazinePosts.map(post => (
                                <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div className="flex gap-4 items-center">
                                        {post.image && <img src={post.image} className="w-16 h-16 object-cover rounded-lg"/>}
                                        <div><h4 className="font-bold">{post.title}</h4><span className="text-xs text-gray-500">{post.category}</span></div>
                                    </div>
                                    <button onClick={async () => { if(window.confirm("Delete?")) await deleteDoc(doc(db, "cms_magazine", post.id)); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'inquiries' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4">{t('admin_inquiry')}</h3>
                        <div className="space-y-4">
                            {inquiries.map(inq => (
                                <div key={inq.id} className={`p-4 border rounded-xl ${inq.status === 'waiting' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between mb-2">
                                        <div className="font-bold">{inq.userName} <span className="text-xs font-normal text-gray-500">({inq.createdAt?.seconds ? new Date(inq.createdAt.seconds*1000).toLocaleDateString() : ''})</span></div>
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${inq.status === 'waiting' ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>{inq.status}</span>
                                    </div>
                                    <h4 className="font-bold mb-1">{inq.title}</h4>
                                    <p className="text-sm text-gray-600 mb-4">{inq.content}</p>
                                    {inq.status === 'waiting' ? (
                                        <button onClick={() => handleAnswerInquiry(inq.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold">Answer</button>
                                    ) : (
                                        <div className="bg-gray-50 p-2 rounded text-sm"><span className="font-bold text-blue-600">Admin:</span> {inq.answer}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Email Settings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Mail size={20} className="text-blue-600"/> 이메일 자동 발송 설정</h3>
                            <p className="text-xs text-gray-500 mb-6 border-l-2 border-blue-500 pl-2">EmailJS 서비스와 연동하여 예약 확정 시 고객에게 자동으로 메일을 발송합니다.</p>
                            <div className="space-y-5">
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">서비스 ID</label><input className="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white" value={emailConfig.serviceId} onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})} placeholder="service_xxxxx"/></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">템플릿 ID</label><input className="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white" value={emailConfig.templateId} onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})} placeholder="template_xxxxx"/></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">공개 키</label><input className="w-full border rounded p-2 text-sm bg-gray-50 focus:bg-white" value={emailConfig.publicKey} onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})} placeholder="user_xxxxx"/></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">확인 메일 내용</label><textarea className="w-full border rounded p-2 h-32 text-sm bg-gray-50 focus:bg-white" value={emailConfig.confirmationBody} onChange={e => setEmailConfig({...emailConfig, confirmationBody: e.target.value})} placeholder="Hello {name}, your booking for {product} on {date} is confirmed." /></div>
                            </div>
                        </div>
                        {/* Receipt Settings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Printer size={20} className="text-blue-600"/> 영수증/인보이스 출력 설정</h3>
                            <div className="space-y-5">
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">회사명</label><input className="w-full border rounded p-2 text-sm" value={receiptConfig.companyName} onChange={e => setReceiptConfig({...receiptConfig, companyName: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">주소</label><input className="w-full border rounded p-2 text-sm" value={receiptConfig.address} onChange={e => setReceiptConfig({...receiptConfig, address: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-700 block mb-1">대표자명</label><input className="w-full border rounded p-2 text-sm" value={receiptConfig.ceo} onChange={e => setReceiptConfig({...receiptConfig, ceo: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-700 block mb-1">사업자 등록번호</label><input className="w-full border rounded p-2 text-sm" value={receiptConfig.regNo} onChange={e => setReceiptConfig({...receiptConfig, regNo: e.target.value})} /></div></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">로고 URL</label><input className="w-full border rounded p-2 text-sm" value={receiptConfig.logoUrl} onChange={e => setReceiptConfig({...receiptConfig, logoUrl: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-700 block mb-1">하단 문구</label><textarea className="w-full border rounded p-2 h-20 text-sm" value={receiptConfig.footerText} onChange={e => setReceiptConfig({...receiptConfig, footerText: e.target.value})} /></div>
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 flex justify-end"><button onClick={saveSettings} className="px-6 py-3 bg-[#0070F0] text-white font-bold rounded-lg shadow-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"><Save size={18}/> 설정 저장하기</button></div>
                    </div>
                )}
            </div>
        </main>

        {isProductModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="font-bold text-lg">{editingProduct ? t('edit') : 'Add Product'}</h3><button onClick={() => setIsProductModalOpen(false)}><X size={20}/></button></div>
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-sm text-gray-600 flex items-center gap-2"><Globe size={16}/> Multilingual Content</h4>
                            <LangTabs />
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700 mb-4">You are editing: <strong>{editLang.toUpperCase()}</strong>. If you leave this blank, the default Korean content will be shown.</div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Order (Shared)</label><input type="number" className="w-full border rounded p-2" value={productForm.order} onChange={e => setProductForm({...productForm, order: Number(e.target.value)})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Category</label><input type="text" className="w-full border rounded p-2" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} /></div></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Title ({editLang.toUpperCase()})</label><input type="text" className="w-full border rounded p-2" value={getInputValue(productForm, 'title')} onChange={e => handleLocalizedChange('title', e.target.value, setProductForm, productForm)} /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">Display Price (Shared)</label><input type="text" className="w-full border rounded p-2" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">Thumbnail Image URL</label><input type="text" className="w-full border rounded p-2" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} /></div></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Short Description ({editLang.toUpperCase()})</label><input type="text" className="w-full border rounded p-2" value={getInputValue(productForm, 'description')} onChange={e => handleLocalizedChange('description', e.target.value, setProductForm, productForm)} /></div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h4 className="font-bold text-sm mb-4 flex items-center gap-2"><LayoutDashboard size={14}/> Detail Page Content ({editLang.toUpperCase()})</h4><RichTextEditor value={getInputValue(productForm, 'content')} onChange={(html) => handleLocalizedChange('content', html, setProductForm, productForm)} /></div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 sticky bottom-0"><button onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm">{t('cancel')}</button><button onClick={saveProduct} className="px-6 py-2 bg-[#0070F0] text-white rounded font-bold text-sm">{t('save')}</button></div>
                </div>
            </div>
        )}

        {isPackageModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="font-bold text-lg">Edit Package Details: {editingPackage?.title}</h3><div className="flex gap-4 items-center"><LangTabs /><button onClick={() => setIsPackageModalOpen(false)}><X size={20}/></button></div></div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg mb-4 text-xs text-blue-800 leading-relaxed border border-blue-100">You are editing: <strong>{editLang.toUpperCase()}</strong>. Use this to translate titles, descriptions, and content.</div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Package Title ({editLang})</label><input type="text" className="w-full border rounded p-2" value={getInputValue(editingPackage, 'title')} onChange={e => handleLocalizedChange('title', e.target.value, setEditingPackage, editingPackage)} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Short Description ({editLang})</label><input type="text" className="w-full border rounded p-2" value={getInputValue(editingPackage, 'description')} onChange={e => handleLocalizedChange('description', e.target.value, setEditingPackage, editingPackage)} /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Detail Content ({editLang})</label><RichTextEditor value={getInputValue(editingPackage, 'content')} onChange={(html) => handleLocalizedChange('content', html, setEditingPackage, editingPackage)} /></div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50"><button onClick={() => setIsPackageModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-sm">{t('cancel')}</button><button onClick={savePackageFull} className="px-6 py-2 bg-[#0070F0] text-white rounded font-bold text-sm flex items-center gap-2"><Save size={16}/> Save Content</button></div>
                </div>
             </div>
        )}
        {isMagModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"><div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="font-bold text-lg">Create Magazine Post</h3><button onClick={() => setIsMagModalOpen(false)}><X size={20}/></button></div><div className="p-6 space-y-4 flex-1 overflow-y-auto"><input type="text" placeholder="Title" value={magForm.title} onChange={e => setMagForm({...magForm, title: e.target.value})} className="w-full border p-2 rounded"/><div className="flex gap-4"><input type="text" placeholder="Category" value={magForm.category} onChange={e => setMagForm({...magForm, category: e.target.value})} className="w-1/2 border p-2 rounded"/><input type="text" placeholder="Cover Image URL" value={magForm.image} onChange={e => setMagForm({...magForm, image: e.target.value})} className="w-1/2 border p-2 rounded"/></div><RichTextEditor value={magForm.content} onChange={html => setMagForm({...magForm, content: html})} /></div><div className="px-6 py-4 border-t border-gray-100 flex justify-end"><button onClick={handleMagSubmit} className="bg-black text-white px-6 py-2 rounded font-bold">Publish</button></div></div></div>)}
    </div>
  );
};
