
import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface MyPageProps {
  language: 'ko' | 'en';
}

const STATUS_MAP_KO: {[key: string]: string} = {
  'pending': '입금대기',
  'confirmed': '예약확정',
  'cancelled': '취소됨',
  'completed': '이용완료'
};

const STATUS_MAP_EN: {[key: string]: string} = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'cancelled': 'Cancelled',
  'completed': 'Completed'
};

export const MyPage: React.FC<MyPageProps> = ({ language }) => {
  const isEn = language === 'en';
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <h2 className="text-xl font-bold mb-4">{isEn ? 'Please Log In' : '로그인이 필요합니다'}</h2>
            <p className="text-gray-500">{isEn ? 'Login to view your reservations.' : '예약 내역을 확인하려면 로그인해주세요.'}</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-8 text-[#111] border-b pb-4">
          {isEn ? 'My Reservations' : '나의 예약 내역'}
      </h1>

      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
            <p className="text-gray-500">{isEn ? 'No reservations found.' : '예약 내역이 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
            {reservations.map((res) => {
                const statusLabel = isEn ? (STATUS_MAP_EN[res.status] || res.status) : (STATUS_MAP_KO[res.status] || res.status);
                return (
                    <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${res.status === 'confirmed' ? 'bg-green-100 text-green-700' : res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {statusLabel}
                                </span>
                                <span className="text-sm text-gray-500">{new Date(res.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#111] mb-1">{res.productName}</h3>
                            <p className="text-gray-600 text-sm">
                                {isEn ? 'Date' : '이용일'}: <strong>{res.date}</strong> | 
                                {isEn ? ' People' : ' 인원'}: <strong>{res.peopleCount}</strong>
                            </p>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                            <span className="text-xl font-bold text-[#0070F0]">
                                {isEn ? '$' : '₩'} {Number(res.totalPrice).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
      )}
    </div>
  );
};
