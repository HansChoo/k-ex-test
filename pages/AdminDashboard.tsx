
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
    Calendar,
    Lock,
    ShieldAlert
} from 'lucide-react';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, logoutUser, handleAuthError } from '../services/authService';

interface AdminDashboardProps {
  language: 'ko' | 'en';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const isEn = language === 'en';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'users'>('dashboard');
  const [stats, setStats] = useState({ revenue: 0, orders: 0, users: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth State for Admin Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ADMIN CREDENTIALS
  const ADMIN_EMAIL = "admin@k-experience.com";

  // Check Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) {
          fetchData();
      } else {
          setLoading(false); // Stop loading to show login form
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Reservations
        const resQuery = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
        const resSnap = await getDocs(resQuery);
        const resData = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReservations(resData);

        // 2. Fetch Users
        const userQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const userSnap = await getDocs(userQuery);
        const userData = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(userData);

        // 3. Calc Stats
        const totalRevenue = resData.reduce((acc: number, curr: any) => acc + (Number(curr.totalPrice) || 0), 0);
        setStats({
            revenue: totalRevenue,
            orders: resData.length,
            users: userData.length
        });

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      try {
          await loginWithEmail(email, password);
          // onAuthStateChanged will trigger data fetch
      } catch (error: any) {
          handleAuthError(error, isEn);
      } finally {
          setAuthLoading(false);
      }
  };

  const createDefaultAdmin = async () => {
      if (!window.confirm(isEn ? "Create default admin account (admin@k-experience.com)?" : "기본 관리자 계정(admin@k-experience.com)을 생성하시겠습니까?")) return;
      
      setAuthLoading(true);
      try {
          // Check if already logged in, logout first
          if (auth.currentUser) await logoutUser();

          await registerWithEmail({
              email: ADMIN_EMAIL,
              password: "admin1234",
              name: "Administrator",
              phone: "010-0000-0000",
              nationality: "Korea"
          });
          alert(isEn ? "Admin account created! Please login." : "관리자 계정이 생성되었습니다! 비밀번호 'admin1234'로 로그인해주세요.");
          setEmail(ADMIN_EMAIL);
          setPassword("admin1234");
      } catch (error: any) {
          handleAuthError(error, isEn);
      } finally {
          setAuthLoading(false);
      }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
      try {
          await updateDoc(doc(db, "reservations", id), { status: newStatus });
          setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
          alert(isEn ? "Status Updated" : "상태가 변경되었습니다.");
      } catch (e) {
          console.error(e);
          alert("Error updating status");
      }
  };

  // --- RENDER: LOADING ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Admin Panel...</div>;

  // --- RENDER: LOGIN FORM (If not logged in as admin) ---
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8] px-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0070F0]">
                          <Lock size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-gray-900">{isEn ? 'Admin Access' : '관리자 로그인'}</h2>
                      <p className="text-gray-500 text-sm mt-2">{isEn ? 'Restricted area. Authorized personnel only.' : '접근 권한이 필요한 페이지입니다.'}</p>
                  </div>

                  {currentUser && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-center gap-2">
                          <ShieldAlert size={16} />
                          <span>
                              {isEn ? `Logged in as ${currentUser.email}, but not authorized.` : `현재 ${currentUser.email} 계정은 관리자 권한이 없습니다.`}
                          </span>
                      </div>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
                          <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full h-12 border rounded-lg px-4 bg-gray-50 focus:bg-white transition-colors outline-none focus:border-blue-500"
                            placeholder="admin@k-experience.com"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Password</label>
                          <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full h-12 border rounded-lg px-4 bg-gray-50 focus:bg-white transition-colors outline-none focus:border-blue-500"
                            placeholder="••••••••"
                          />
                      </div>
                      <button 
                        type="submit" 
                        disabled={authLoading}
                        className="w-full h-12 bg-[#1e2330] text-white font-bold rounded-lg hover:bg-black transition-colors"
                      >
                          {authLoading ? 'Verifying...' : (isEn ? 'Login to Dashboard' : '관리자 로그인')}
                      </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                      <p className="text-xs text-gray-400 mb-3">{isEn ? 'First time setting up?' : '초기 설정이 필요하신가요?'}</p>
                      <button 
                        onClick={createDefaultAdmin}
                        className="text-sm font-bold text-[#0070F0] hover:underline"
                      >
                          {isEn ? 'Create Default Admin Account' : '기본 관리자 계정 생성하기'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: DASHBOARD (If authorized) ---
  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333]">
        
        {/* Sidebar */}
        <aside className="w-64 bg-[#1e2330] text-white flex-shrink-0 hidden md:flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-gray-700 font-bold text-lg tracking-tight">
                K-Experience Admin
            </div>
            <nav className="flex-1 py-6 space-y-1 px-3">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <LayoutDashboard size={18} /> {isEn ? 'Dashboard' : '대시보드'}
                </button>
                <button 
                    onClick={() => setActiveTab('reservations')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reservations' ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <ShoppingCart size={18} /> {isEn ? 'Reservations' : '예약/주문 관리'}
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-[#0070F0] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                    <Users size={18} /> {isEn ? 'Users' : '회원 관리'}
                </button>
                <div className="pt-6 mt-6 border-t border-gray-700">
                    <p className="px-3 text-xs text-gray-500 font-bold mb-2 uppercase">Settings</p>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white">
                        <Settings size={18} /> {isEn ? 'Configuration' : '상점 설정'}
                    </button>
                </div>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-500"></div>
                    <div>
                        <p className="text-sm font-bold text-white">Administrator</p>
                        <p className="text-xs text-gray-400">{currentUser.email}</p>
                    </div>
                </div>
                <button onClick={() => logoutUser()} className="mt-4 w-full py-2 bg-gray-800 text-xs rounded hover:bg-gray-700 text-gray-300">
                    Sign Out
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8">
                <h2 className="text-lg font-bold text-gray-800 capitalize">{activeTab}</h2>
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder={isEn ? "Search..." : "검색어 입력"} className="h-9 pl-9 pr-4 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-64" />
                    </div>
                    <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                </div>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto p-6 md:p-8">
                
                {/* 1. DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{isEn ? 'Total Revenue' : '총 매출액'}</p>
                                    <h3 className="text-2xl font-black text-gray-900">₩ {stats.revenue.toLocaleString()}</h3>
                                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><TrendingUp size={12}/> +12.5% from last month</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><DollarSign size={24} /></div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{isEn ? 'Total Orders' : '총 예약 건수'}</p>
                                    <h3 className="text-2xl font-black text-gray-900">{stats.orders}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Lifetime orders</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600"><ShoppingCart size={24} /></div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{isEn ? 'Total Users' : '총 회원 수'}</p>
                                    <h3 className="text-2xl font-black text-gray-900">{stats.users}</h3>
                                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><TrendingUp size={12}/> +5 new today</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600"><Users size={24} /></div>
                            </div>
                        </div>

                        {/* Recent Orders Preview */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{isEn ? 'Recent Reservations' : '최근 예약 현황'}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">{isEn ? 'Order ID' : '주문번호'}</th>
                                            <th className="px-4 py-3">{isEn ? 'Product' : '상품명'}</th>
                                            <th className="px-4 py-3">{isEn ? 'Customer' : '예약자'}</th>
                                            <th className="px-4 py-3">{isEn ? 'Amount' : '결제금액'}</th>
                                            <th className="px-4 py-3 rounded-r-lg">{isEn ? 'Status' : '상태'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reservations.slice(0, 5).map((res) => (
                                            <tr key={res.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-4 font-medium text-gray-900">#{res.id.slice(0,8)}</td>
                                                <td className="px-4 py-4">{res.productName}</td>
                                                <td className="px-4 py-4">{res.options?.gender === 'Male' ? 'Male' : 'Female'} Customer</td>
                                                <td className="px-4 py-4 font-bold">₩{res.totalPrice?.toLocaleString()}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold 
                                                        ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                                          res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. RESERVATIONS VIEW */}
                {activeTab === 'reservations' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-bold text-gray-800">{isEn ? 'All Reservations' : '전체 예약 목록'}</h3>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">{isEn ? 'Export CSV' : '엑셀 다운로드'}</button>
                                <button className="px-4 py-2 bg-[#0070F0] text-white rounded-lg text-sm font-bold shadow-sm">{isEn ? 'Add Order' : '수기 예약 등록'}</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">{isEn ? 'Date' : '예약일시'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Product' : '상품정보'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Options' : '옵션'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Price' : '금액'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Status' : '상태 관리'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reservations.map((res) => (
                                        <tr key={res.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(res.createdAt?.seconds * 1000).toLocaleDateString()}
                                                <div className="text-xs text-gray-400 mt-1">{new Date(res.createdAt?.seconds * 1000).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 mb-1">{res.productName}</div>
                                                <div className="text-xs text-gray-500">ID: {res.id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2 mb-1"><Users size={14}/> {res.peopleCount} {isEn ? 'ppl' : '명'}</div>
                                                <div className="flex items-center gap-2"><Calendar size={14}/> {res.date}</div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-gray-900">
                                                ₩{res.totalPrice?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    value={res.status}
                                                    onChange={(e) => handleStatusUpdate(res.id, e.target.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer
                                                        ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                                          res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
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
                    </div>
                )}

                {/* 3. USERS VIEW */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">{isEn ? 'Registered Users' : '가입 회원 목록'}</h3>
                        </div>
                        <div className="overflow-x-auto">
                             <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">{isEn ? 'Name' : '이름'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Email' : '이메일'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Phone' : '연락처'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Nationality' : '국적'}</th>
                                        <th className="px-6 py-4">{isEn ? 'Joined At' : '가입일'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900">{user.name || 'No Name'}</td>
                                            <td className="px-6 py-4 text-blue-600">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.nationality || '-'}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </main>
    </div>
  );
};
