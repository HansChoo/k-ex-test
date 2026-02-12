
import { 
  doc, 
  runTransaction, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  increment,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebaseConfig";

interface ReservationData {
  userId: string;
  productName: string;
  date: string; // YYYY-MM-DD
  peopleCount: number;
  totalPrice: number;
  options: any;
}

/**
 * [핵심 기능] 날짜별 인원 제한 체크 및 예약 생성
 */
export const createReservation = async (data: ReservationData) => {
  const inventoryRef = doc(db, "inventory", data.date); 
  
  try {
    await runTransaction(db, async (transaction) => {
      const inventoryDoc = await transaction.get(inventoryRef);
      
      let currentCount = 0;
      let maxCapacity = 50; 

      if (inventoryDoc.exists()) {
        const invData = inventoryDoc.data();
        currentCount = invData.currentCount || 0;
        if (invData.maxCapacity) maxCapacity = invData.maxCapacity;
      }

      if (currentCount + data.peopleCount > maxCapacity) {
        throw new Error("Sold Out: 해당 날짜의 예약 정원이 초과되었습니다.");
      }

      const reservationRef = doc(collection(db, "reservations"));
      transaction.set(reservationRef, {
        ...data,
        createdAt: serverTimestamp(),
        status: "confirmed"
      });

      transaction.set(inventoryRef, {
        currentCount: currentCount + data.peopleCount,
        maxCapacity: maxCapacity
      }, { merge: true });
      
      // Affiliate Tracking: If affiliate code exists in options, increment sales
      if (data.options?.affiliateCode) {
          // This part ideally runs in a cloud function, but for now we try a client-side update (requires proper rules)
          // or we just log it in the reservation and let admin handle it.
          // We will update the affiliate doc asynchronously outside transaction to avoid complexity here if needed,
          // but doing it here ensures consistency.
          // Note: Needs query to find doc by code. Since transaction needs refs, we skip complex query inside transaction.
          // We will handle affiliate increment after this function succeeds in the calling component or separate logic.
      }
    });
    
    // Post-transaction: Update Affiliate Stats if exists
    if (data.options?.affiliateCode) {
        const q = query(collection(db, "affiliates"), where("code", "==", data.options.affiliateCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const affDoc = snap.docs[0].ref;
            await updateDoc(affDoc, { sales: increment(1) });
        }
    }

    console.log("Reservation Successful!");
    return { success: true };

  } catch (e: any) {
    console.error("Reservation Failed: ", e);
    return { success: false, message: e.message };
  }
};

/**
 * [공동구매] 공동구매 참여자 수 업데이트
 */
export const joinGroupBuy = async (campaignId: string, userId: string) => {
  const campaignRef = doc(db, "group_buys", campaignId);

  try {
    await runTransaction(db, async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef);
      if (!campaignDoc.exists()) {
        throw new Error("Campaign not found");
      }

      const campaignData = campaignDoc.data();
      const newCount = (campaignData.participants || 0) + 1;

      transaction.update(campaignRef, { participants: newCount });
      
      const participantRef = doc(collection(db, `group_buys/${campaignId}/entries`));
      transaction.set(participantRef, {
        userId,
        joinedAt: serverTimestamp()
      });
    });
    return true;
  } catch (e) {
    console.error("Group buy join failed", e);
    return false;
  }
};

/**
 * 특정 날짜의 예약 가능 여부 확인
 */
export const checkAvailability = async (date: string) => {
  const inventoryRef = doc(db, "inventory", date);
  const snap = await getDoc(inventoryRef);
  
  if (snap.exists()) {
    const data = snap.data();
    return {
      available: (data.maxCapacity || 50) - (data.currentCount || 0),
      total: data.maxCapacity || 50
    };
  }
  return { available: 50, total: 50 }; 
};

/**
 * [쿠폰] 쿠폰 유효성 검증
 */
export const validateCoupon = async (code: string) => {
    try {
        const q = query(collection(db, "coupons"), where("code", "==", code), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return { valid: false, message: "Invalid Code" };
        
        const coupon = snapshot.docs[0].data();
        const today = new Date().toISOString().split('T')[0];
        
        if (coupon.expiryDate && coupon.expiryDate < today) {
            return { valid: false, message: "Expired Coupon" };
        }
        
        return { 
            valid: true, 
            type: coupon.type, // 'percent' | 'fixed'
            value: coupon.value,
            code: coupon.code
        };
    } catch (e) {
        console.error("Coupon check failed", e);
        return { valid: false, message: "Error" };
    }
};
