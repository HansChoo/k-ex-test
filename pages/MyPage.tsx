
import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ticket, XCircle, Download } from 'lucide-react';
import { useGlobal } from '../contexts/GlobalContext';

export const MyPage: React.FC<any> = () => {
  const { t, language } = useGlobal();
  const isEn = language !== 'ko';
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "reservations"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        try {
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReservations(data);
        } catch (e) { console.error("Error fetching reservations:", e); }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <div className="p-20 text-center">{t('login')}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-8 text-[#111] border-b pb-4">{t('mypage')}</h1>
      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl"><p className="text-gray-500">No Reservations.</p></div>
      ) : (
        <div className="space-y-6">
            {reservations.map((res) => (
                <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all hover:shadow-md">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#111] mb-1">{res.productName}</h3>
                        <p className="text-gray-600 text-sm mb-4">Date: <strong>{res.date}</strong> | People: <strong>{res.peopleCount}</strong></p>
                        <div className="flex gap-2">
                            {res.status === 'confirmed' && (
                                <button onClick={() => setSelectedVoucher(res)} className="text-xs flex items-center gap-1 bg-[#0070F0] text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"><Ticket size={14} /> Voucher</button>
                            )}
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                        <span className="text-xs text-gray-400 mb-1">{t('total')}</span>
                        <span className="text-xl font-black text-[#111]">₩ {Number(res.totalPrice).toLocaleString()}</span>
                    </div>
                </div>
            ))}
        </div>
      )}
      {selectedVoucher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-sm" onClick={() => setSelectedVoucher(null)}>
              <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden relative shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="bg-[#0070F0] p-6 text-white text-center relative"><h3 className="font-black text-2xl tracking-widest">E-VOUCHER</h3></div>
                  <div className="px-8 pt-2 pb-8 text-center"><h4 className="text-lg font-bold text-gray-900 mb-1">{selectedVoucher.productName}</h4><p className="text-sm text-gray-500 mb-6">{selectedVoucher.id.slice(0,8).toUpperCase()}</p><button className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800"><Download size={16}/> Save</button></div>
              </div>
          </div>
      )}
    </div>
  );
};
