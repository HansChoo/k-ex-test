
import React, { useState, useEffect } from 'react';
import { Users, Flame, Info, Crown, CheckCircle2, ChevronRight, Timer, Lock, Search, Plus, X, Calendar, CreditCard, UserPlus, Mail, Globe, Phone } from 'lucide-react';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useGlobal } from '../contexts/GlobalContext';
import { requestPayment } from '../services/paymentService';
import { COUNTRY_CODES } from '../constants';

interface GroupBuyingPageProps { language: 'ko' | 'en'; }

interface GroupBuyItem { 
    id: string; 
    productId?: string;
    productName?: string;
    productImage?: string;
    originalPrice?: number;
    currentCount?: number; 
    maxCount?: number; 
    visitDate?: string; 
    deadline?: any;
    leaderName?: string;
    participants?: string[];
    description?: string;
    items?: string[];
    isSecret?: boolean;
    secretCode?: string;
    status?: string;
    [key: string]: any; 
}

export const GroupBuyingPage: React.FC<GroupBuyingPageProps> = () => {
  const { t, convertPrice, language, products } = useGlobal();
  const isEn = language !== 'ko';

  const [activeTab, setActiveTab] = useState<'public' | 'secret'>('public');
  const [groupList, setGroupList] = useState<GroupBuyItem[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Create Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newGroupType, setNewGroupType] = useState<'public' | 'secret'>('public');
  const [newGroupData, setNewGroupData] = useState<any>({
      productId: '',
      visitDate: '',
      participants: [] 
  });

  // Fetch Groups & Packages
  useEffect(() => {
    // 1. Fetch Groups
    const q = query(collection(db, "group_buys"), orderBy("createdAt", "desc"));
    const unsubGroup = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupBuyItem));
        setGroupList(list);
        setLoading(false);
    });

    // 2. Fetch Packages (for selection)
    const fetchPkgs = async () => {
        const snap = await getDocs(collection(db, "cms_packages"));
        setPackages(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'package' })));
    };
    fetchPkgs();

    return () => unsubGroup();
  }, []);

  // Filter groups based on tab
  const filteredGroups = groupList.filter(g => {
      if (activeTab === 'public') return !g.isSecret;
      return g.isSecret;
  });

  // --- Actions ---

  const handleJoin = async (group: GroupBuyItem) => {
      if (!auth.currentUser) {
          alert(isEn ? "Please login first." : "로그인이 필요합니다.");
          return;
      }
      
      const participants = group.participants || [];
      if (participants.includes(auth.currentUser.uid)) {
          alert(isEn ? "You already joined." : "이미 참여중인 공동구매입니다.");
          return;
      }

      // Secret Group Check
      if (group.isSecret) {
          const code = prompt(isEn ? "Enter Secret Code:" : "비공개 코드 4자리를 입력하세요:");
          if (code !== group.secretCode) {
              alert(isEn ? "Invalid Code" : "코드가 일치하지 않습니다.");
              return;
          }
      }

      const currentCount = group.currentCount || 0;
      const originalPrice = group.originalPrice || 0;
      const productName = group.productName || 'Product';

      // Calculate Deposit
      const discountRate = Math.min(0.5, currentCount * 0.05);
      const currentPrice = originalPrice * (1 - discountRate);
      const deposit = Math.round(currentPrice * 0.2);

      const confirmMsg = isEn 
        ? `Join this group?\nDeposit: ${convertPrice(deposit)}` 
        : `공동구매에 참여하시겠습니까?\n예약금 결제: ${convertPrice(deposit)}`;
        
      if (!confirm(confirmMsg)) return;

      const payment = await requestPayment({
          merchant_uid: `gb_${group.id}_${Date.now()}`,
          name: `GB Join: ${productName}`,
          amount: deposit,
          buyer_email: auth.currentUser.email || '',
          buyer_name: auth.currentUser.displayName || ''
      });

      if (payment.success) {
          const groupRef = doc(db, "group_buys", group.id);
          await updateDoc(groupRef, {
              currentCount: increment(1),
              participants: arrayUnion(auth.currentUser.uid)
          });
          alert(isEn ? "Joined successfully!" : "참여가 완료되었습니다!");
      }
  };

  const handleOpenCreateModal = (type: 'public' | 'secret') => {
      if (!auth.currentUser) {
          alert(isEn ? "Please login to create a group." : "공동구매를 생성하려면 로그인이 필요합니다.");
          return;
      }
      setNewGroupType(type);
      
      // Default leader info from auth
      const defaultNationality = COUNTRY_CODES.find(c => c.code === 'KR') || COUNTRY_CODES[0];
      
      setNewGroupData({
          productId: '',
          visitDate: '',
          participants: [{ 
              name: auth.currentUser.displayName || '', 
              email: auth.currentUser.email || '',
              nationality: defaultNationality.code,
              dialCode: defaultNationality.dial,
              phone: '',
              dob: '', 
              gender: 'Female'
          }] 
      });
      setCreateStep(1);
      setIsCreateModalOpen(true);
  };

  const handleUpdateParticipant = (index: number, field: string, value: any) => {
      const updated = [...newGroupData.participants];
      updated[index] = { ...updated[index], [field]: value };

      // If nationality changes, update dial code automatically
      if (field === 'nationality') {
          const country = COUNTRY_CODES.find(c => c.code === value);
          if (country) {
              updated[index].dialCode = country.dial;
          }
      }

      setNewGroupData({ ...newGroupData, participants: updated });
  };

  const handleCreateGroupSubmit = async () => {
      // Validate
      if (!newGroupData.productId || !newGroupData.visitDate) return alert("상품과 날짜를 선택해주세요.");
      
      for (let i = 0; i < newGroupData.participants.length; i++) {
          const p = newGroupData.participants[i];
          if (!p.name || !p.email || !p.phone || !p.dob) {
              return alert(isEn ? `Please fill in all details for Participant ${i+1}` : `참여자 ${i+1}의 정보를 모두 입력해주세요.`);
          }
      }

      // Find selected product info
      const allItems = [...packages, ...products];
      const selectedItem = allItems.find(i => i.id === newGroupData.productId);
      if (!selectedItem) return;

      const basePrice = selectedItem.price || selectedItem.priceVal || 0;
      const peopleCount = newGroupData.participants.length;
      
      // Calculate Initial Deposit (Leader pays for initial members)
      // Discount logic: 5% per person (max 50%)
      const discountRate = Math.min(0.5, peopleCount * 0.05);
      const discountedPrice = basePrice * (1 - discountRate);
      const totalDeposit = Math.round((discountedPrice * 0.2) * peopleCount);

      // Payment
      const payment = await requestPayment({
          merchant_uid: `gb_new_${Date.now()}`,
          name: `New Group: ${selectedItem.title || selectedItem.productName}`,
          amount: totalDeposit,
          buyer_email: auth.currentUser?.email || '',
          buyer_name: auth.currentUser?.displayName || ''
      });

      if (payment.success) {
          try {
            await addDoc(collection(db, "group_buys"), {
                productId: selectedItem.id,
                productName: selectedItem.title || selectedItem.productName || 'Group Buy',
                productImage: selectedItem.image || '',
                originalPrice: basePrice,
                currentCount: peopleCount,
                maxCount: 10,
                visitDate: newGroupData.visitDate,
                leaderName: auth.currentUser?.displayName || 'Leader',
                leaderId: auth.currentUser?.uid,
                participants: [auth.currentUser?.uid], // Simplified: storing just IDs for now
                participantDetails: newGroupData.participants, // Store detailed info
                description: selectedItem.description || '',
                items: selectedItem.items || [],
                isSecret: newGroupType === 'secret',
                secretCode: newGroupType === 'secret' ? Math.floor(1000 + Math.random() * 9000).toString() : null,
                status: 'active',
                createdAt: serverTimestamp()
            });
            alert(isEn ? "Group Created!" : "공동구매가 생성되었습니다!");
            setIsCreateModalOpen(false);
          } catch (e) {
              console.error(e);
              alert("Error creating group.");
          }
      }
  };

  // --- Render Helpers ---

  const renderDiscountTable = (originalPrice: number, currentCount: number) => {
      const tiers = [1, 2, 3, 4, 5, 10];
      return (
          <div className="w-full bg-white rounded-lg border border-gray-100 overflow-hidden text-sm mb-4 shadow-sm">
              <div className="flex bg-[#FF8878] text-white font-bold py-2 px-4 text-center">
                  <div className="flex-1">{t('male_cnt') || '인원'}</div>
                  <div className="flex-1">1인당 가격</div>
                  <div className="flex-1">할인율</div>
              </div>
              {tiers.map((tier) => {
                  const isMax = tier === 10;
                  const discountPercent = tier * 5; 
                  const price = originalPrice * (1 - discountPercent / 100);
                  const isCurrent = currentCount === tier;
                  
                  return (
                      <div key={tier} className={`flex py-3 px-4 text-center items-center border-b last:border-0 ${isCurrent ? 'bg-red-50' : ''}`}>
                          <div className="flex-1 font-medium flex items-center justify-center gap-1">
                              {isMax ? '10명+' : `${tier}명`}
                              {isCurrent && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-full animate-pulse">Current</span>}
                          </div>
                          <div className={`flex-1 font-bold ${isCurrent ? 'text-red-600' : 'text-gray-700'}`}>{convertPrice(price)}</div>
                          <div className="flex-1 font-bold text-gray-500">{discountPercent}%</div>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="w-full font-sans text-[#1a1a1a] bg-[#F5F7FB] pb-24 min-h-screen">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white pt-28 pb-16 px-6 relative overflow-hidden text-center">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FFD700] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
          <div className="max-w-[800px] mx-auto relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-full mb-6 shadow-sm animate-bounce">
                  <Flame size={14} className="fill-white text-white"/> <span className="text-white font-bold text-sm">HOT 공동구매</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-sm tracking-tight leading-tight">Your BEST K-experience</h1>
              <h2 className="text-3xl md:text-4xl font-black text-[#FFE812] mb-8 drop-shadow-md tracking-tight leading-tight">More People, Lower Price!</h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg max-w-2xl">
                <p className="text-white font-bold text-base md:text-lg leading-relaxed opacity-95">
                    {language === 'ko' ? <>친구들과 함께하면 더 저렴하게! 인원별 최대 50% 할인 혜택을 누리세요<br/>K-아이돌 체험부터 뷰티시술, 건강검진까지<br/>친구들과 함께하면 최대 50% 할인!!</> : <>Cheaper together with friends! Get up to 50% discount per person.<br/>From K-IDOL experience to beauty care and health checkups.<br/>Up to 50% off when you join together!!</>}
                </p>
              </div>
          </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[800px] mx-auto flex">
              <button onClick={() => setActiveTab('public')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'public' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Users size={16}/> {t('ongoing_public') || 'Public Group'}
              </button>
              <button onClick={() => setActiveTab('secret')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'secret' ? 'text-[#0070F0] border-b-2 border-[#0070F0]' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Lock size={16}/> Secret Group
              </button>
          </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-[800px] mx-auto px-4 py-6">
          <div className="flex gap-4">
              <button onClick={() => handleOpenCreateModal('public')} className="flex-1 bg-white border-2 border-[#0070F0] text-[#0070F0] py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">
                  <Users size={20}/> {isEn ? "Create Public Group" : "공개 공동구매 만들기"}
              </button>
              <button onClick={() => handleOpenCreateModal('secret')} className="flex-1 bg-[#333] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-md">
                  <Lock size={20}/> {isEn ? "Create Secret Group" : "비밀 공동구매 만들기"}
              </button>
          </div>
      </div>

      {/* Group List */}
      <div className="max-w-[600px] mx-auto px-4 space-y-6">
        {filteredGroups.length > 0 ? filteredGroups.map((group) => {
            const safeName = group.productName || 'Unknown Product';
            const isBasic = safeName.includes('Basic');
            const safeMax = group.maxCount || 10;
            const safeCurrent = group.currentCount || 0;
            const safeOriginalPrice = group.originalPrice || 0;
            const progress = Math.min(100, (safeCurrent / safeMax) * 100);
            const nextTarget = Math.min(10, safeCurrent + 1);
            const themeColor = isBasic ? 'bg-[#00C7AE]' : 'bg-[#FFD700] text-black';
            const themeText = isBasic ? 'text-[#00C7AE]' : 'text-[#D4AF37]';
            const depositPrice = (safeOriginalPrice * (1 - (safeCurrent * 0.05))) * 0.2;

            return (
                <div key={group.id} className="bg-white rounded-[24px] shadow-lg overflow-hidden border border-gray-100 relative group-card">
                    {group.isSecret && (
                        <div className="absolute top-4 right-4 z-10 bg-black text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                            <Lock size={12}/> Secret
                        </div>
                    )}
                    
                    <div className={`h-14 ${themeColor} px-6 flex items-center justify-between text-white`}>
                        <span className="font-black tracking-wider text-sm uppercase">{isBasic ? 'BASIC' : 'PREMIUM'}</span>
                        <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg text-xs font-bold">
                            <Timer size={12}/> <span>D-7</span>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-gray-900 mb-1 leading-snug">{safeName}</h2>
                            <p className="text-sm text-gray-500 mb-4">{group.description || 'K-Experience Special Offer'}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(group.items || ['건강검진','뷰티시술','K-IDOL']).map((item, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-[11px] rounded font-bold border border-gray-100 flex items-center gap-1">
                                        <CheckCircle2 size={10} className={themeText}/> {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-gray-700">공동구매 진행 현황</span>
                                <div className="flex items-center gap-1">
                                    <span className={`text-sm font-black ${themeText}`}>{safeCurrent}명</span>
                                    <span className="text-xs text-gray-400">/ {safeMax}명</span>
                                </div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                                <div className={`h-full ${isBasic ? 'bg-[#00C7AE]' : 'bg-[#FFD700]'} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="text-center text-xs font-bold text-gray-500">
                                {safeCurrent < 10 ? <><span className="text-red-500">{nextTarget - safeCurrent}명</span>만 더 참여하면 {nextTarget * 5}% 할인! 🎉</> : <span className="text-green-600">최대 할인율(50%) 달성 완료! 🎁</span>}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50/50 rounded-lg border border-blue-50">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl relative">
                                🧑‍💻
                                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-white"><Crown size={8} className="text-white fill-white"/></div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">GROUP LEADER</p>
                                <p className="text-sm font-bold text-gray-800">{group.leaderName || 'Anonymous'}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Users size={16} /> 인원별 할인 가격 (남성 기준)</h4>
                            {renderDiscountTable(safeOriginalPrice, safeCurrent)}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center mb-4">
                            <p className="text-sm font-bold text-yellow-700 mb-1">예약금 20% 별도</p>
                            <p className="text-xs text-gray-500">남성 {convertPrice(depositPrice)} / 여성 {convertPrice(depositPrice * 1.05)}</p>
                        </div>

                        <div className="flex gap-3">
                            <button className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:text-black hover:border-black transition-colors"><Info size={20}/></button>
                            <button onClick={() => handleJoin(group)} className={`flex-1 ${isBasic ? 'bg-[#00C7AE] hover:bg-[#00B59E]' : 'bg-[#111] hover:bg-black'} text-white font-bold rounded-xl flex items-center justify-center gap-2 py-4 shadow-lg transition-all active:scale-95`}>
                                <Users size={18} className="fill-white"/> {t('join_group')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 relative">
                    <Info size={32} className="text-gray-400"/>
                </div>
                <h3 className="text-xl font-bold text-[#111] mb-2">{activeTab === 'public' ? 'No Public Groups' : 'No Secret Groups'}</h3>
                <p className="text-gray-500 text-sm max-w-xs mb-8">
                    {activeTab === 'public' ? "Be the first leader and start a group buy!" : "Create a secret group and invite your friends."}
                </p>
                <button onClick={() => handleOpenCreateModal(activeTab)} className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                    Create Now
                </button>
            </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg">{newGroupType === 'public' ? '공개 공동구매 만들기' : '비밀 공동구매 만들기'}</h3>
                      <button onClick={() => setIsCreateModalOpen(false)}><X/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {createStep === 1 && (
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-sm font-bold mb-2 flex items-center gap-2"><Crown size={16}/> 1. 상품 선택</label>
                                  <select 
                                    className="w-full border p-3 rounded-xl font-bold bg-white"
                                    value={newGroupData.productId}
                                    onChange={(e) => setNewGroupData({...newGroupData, productId: e.target.value})}
                                  >
                                      <option value="">상품을 선택하세요</option>
                                      <optgroup label="📦 올인원 패키지">
                                          {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                      </optgroup>
                                      <optgroup label="🛍️ 일반 상품">
                                          {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                      </optgroup>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold mb-2 flex items-center gap-2"><Calendar size={16}/> 2. 방문 예정일</label>
                                  <input type="date" className="w-full border p-3 rounded-xl font-bold bg-white" value={newGroupData.visitDate} onChange={(e) => setNewGroupData({...newGroupData, visitDate: e.target.value})}/>
                              </div>
                              <div className="p-4 bg-blue-50 rounded-xl text-xs text-blue-700 leading-relaxed">
                                  <strong>💡 리더 혜택:</strong><br/>
                                  공동구매를 생성하고 10명을 모으면, 리더님은 50% 할인을 받으실 수 있습니다! 시작은 혼자여도 괜찮아요.
                              </div>
                              <button onClick={() => setCreateStep(2)} className="w-full bg-black text-white py-4 rounded-xl font-bold mt-4 flex justify-center gap-2">다음 단계 <ChevronRight/></button>
                          </div>
                      )}

                      {createStep === 2 && (
                          <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold flex items-center gap-2"><UserPlus size={16}/> 3. 참여자 정보 (본인 포함)</label>
                                <button onClick={() => {
                                    const defaultCountry = COUNTRY_CODES[0];
                                    setNewGroupData({
                                        ...newGroupData, 
                                        participants: [...newGroupData.participants, { 
                                            name: '', email: '', dob: '', phone: '', nationality: defaultCountry.code, dialCode: defaultCountry.dial, gender: 'Female' 
                                        }]
                                    });
                                }} className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-gray-200"><Plus size={12}/> 인원 추가</button>
                              </div>
                              
                              <div className="space-y-4">
                                  {newGroupData.participants.map((p: any, idx: number) => (
                                      <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative animate-fade-in-up">
                                          {idx > 0 && <button onClick={() => {
                                              const updated = [...newGroupData.participants];
                                              updated.splice(idx, 1);
                                              setNewGroupData({...newGroupData, participants: updated});
                                          }} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16}/></button>}
                                          
                                          <div className="mb-3 font-bold text-xs text-gray-500 flex items-center gap-1">
                                            {idx === 0 ? <><Crown size={12} className="text-yellow-500"/> 리더 (본인)</> : `참여자 ${idx + 1}`}
                                          </div>
                                          
                                          {/* Name & Gender */}
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                              <input type="text" placeholder="Full Name (Passport)" className="border p-2 rounded text-sm w-full" value={p.name} onChange={(e) => handleUpdateParticipant(idx, 'name', e.target.value)}/>
                                              <select value={p.gender} onChange={(e) => handleUpdateParticipant(idx, 'gender', e.target.value)} className="border p-2 rounded text-sm bg-white font-bold">
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                              </select>
                                          </div>

                                          {/* Nationality & DOB */}
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                              <div className="relative">
                                                  <select value={p.nationality} onChange={(e) => handleUpdateParticipant(idx, 'nationality', e.target.value)} className="w-full border p-2 rounded text-sm bg-white appearance-none pr-8">
                                                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                                  </select>
                                                  <Globe size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none"/>
                                              </div>
                                              <input type="date" className="border p-2 rounded text-sm w-full" value={p.dob} onChange={(e) => handleUpdateParticipant(idx, 'dob', e.target.value)}/>
                                          </div>

                                          {/* Phone */}
                                          <div className="flex gap-2 mb-2">
                                              <div className="w-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-sm font-bold text-gray-600">
                                                  {p.dialCode || '+82'}
                                              </div>
                                              <div className="relative flex-1">
                                                  <input type="tel" placeholder="Phone Number" className="w-full border p-2 pl-8 rounded text-sm" value={p.phone} onChange={(e) => handleUpdateParticipant(idx, 'phone', e.target.value.replace(/[^0-9]/g, ''))}/>
                                                  <Phone size={14} className="absolute left-2.5 top-3 text-gray-400"/>
                                              </div>
                                          </div>

                                          {/* Email */}
                                          <div className="relative">
                                              <input type="email" placeholder="Email Address" className="w-full border p-2 pl-8 rounded text-sm" value={p.email} onChange={(e) => handleUpdateParticipant(idx, 'email', e.target.value)}/>
                                              <Mail size={14} className="absolute left-2.5 top-3 text-gray-400"/>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              
                              <div className="flex gap-2">
                                  <button onClick={() => setCreateStep(1)} className="flex-1 bg-gray-200 text-gray-600 py-4 rounded-xl font-bold">이전</button>
                                  <button onClick={() => setCreateStep(3)} className="flex-1 bg-black text-white py-4 rounded-xl font-bold flex justify-center gap-2">다음 단계 <ChevronRight/></button>
                              </div>
                          </div>
                      )}

                      {createStep === 3 && (
                          <div className="space-y-6 text-center">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                                  <CreditCard size={32}/>
                              </div>
                              <h3 className="text-xl font-bold">결제 및 생성 확정</h3>
                              <p className="text-sm text-gray-500">
                                  총 <strong>{newGroupData.participants.length}명</strong>으로 공동구매를 시작합니다.<br/>
                                  시작 할인율은 <strong>{newGroupData.participants.length * 5}%</strong> 입니다.
                              </p>

                              <div className="bg-gray-50 p-4 rounded-xl text-left space-y-2 border border-gray-100">
                                  <div className="flex justify-between text-sm"><span>참여 인원</span><span className="font-bold">{newGroupData.participants.length}명</span></div>
                                  <div className="flex justify-between text-sm"><span>적용 할인율</span><span className="font-bold text-red-500">{newGroupData.participants.length * 5}%</span></div>
                                  <div className="flex justify-between text-lg font-black border-t pt-2 mt-2"><span>총 예약금 (20%)</span><span className="text-[#0070F0]">결제 진행시 확인</span></div>
                              </div>

                              <div className="flex gap-2">
                                  <button onClick={() => setCreateStep(2)} className="flex-1 bg-gray-200 text-gray-600 py-4 rounded-xl font-bold">이전</button>
                                  <button onClick={handleCreateGroupSubmit} className="flex-[2] bg-[#0070F0] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-600">결제하고 생성하기</button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
