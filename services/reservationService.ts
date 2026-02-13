
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
import { sendEmail } from "./emailService";

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
 * + 쿠폰 재고 차감 (Coupon Usage Tracking)
 * + 제휴 파트너 매출 집계 (Affiliate Revenue Tracking)
 */
export const createReservation = async (data: ReservationData) => {
  const inventoryRef = doc(db, "inventory", data.date); 
  
  try {
    const reservationRef = doc(collection(db, "reservations")); // Generate ID first

    await runTransaction(db, async (transaction) => {
      // 1. Inventory Check
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

      // 2. Coupon Validation & Consumption (Atomic)
      if (data.options?.couponId) {
          const couponRef = doc(db, "coupons", data.options.couponId);
          const couponDoc = await transaction.get(couponRef);
          
          if (!couponDoc.exists()) throw new Error("Invalid Coupon");
          
          const couponData = couponDoc.data();
          const currentUsage = couponData.currentUsage || 0;
          const maxUsage = couponData.maxUsage || 999999;

          if (currentUsage >= maxUsage) {
              throw new Error("Coupon Limit Reached: 쿠폰 사용 한도가 초과되었습니다.");
          }

          transaction.update(couponRef, { currentUsage: currentUsage + 1 });
      }

      // 3. Create Reservation (Using pre-generated ref)
      transaction.set(reservationRef, {
        ...data,
        createdAt: serverTimestamp(),
        status: "confirmed"
      });

      // 4. Update Inventory
      transaction.set(inventoryRef, {
        currentCount: currentCount + data.peopleCount,
        maxCapacity: maxCapacity
      }, { merge: true });
    });
    
    // 5. Update Affiliate Stats
    if (data.options?.affiliateCode) {
        const q = query(collection(db, "affiliates"), where("code", "==", data.options.affiliateCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const affDoc = snap.docs[0].ref;
            await updateDoc(affDoc, { 
                sales: increment(1),
                totalRevenue: increment(data.totalPrice)
            });
        }
    }

    // 6. Send Email with Survey Link
    await sendEmail('confirmation', {
        name: data.options.guestEmail || data.userId,
        email: data.options.guestEmail,
        productName: data.productName,
        date: data.date
    }, reservationRef.id);

    console.log("Reservation Successful! ID:", reservationRef.id);
    return { success: true, id: reservationRef.id };

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
 * Returns Coupon ID for usage tracking
 */
export const validateCoupon = async (code: string) => {
    try {
        const q = query(collection(db, "coupons"), where("code", "==", code), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return { valid: false, message: "Invalid Code" };
        
        const couponDoc = snapshot.docs[0];
        const coupon = couponDoc.data();
        const today = new Date().toISOString().split('T')[0];
        
        // Expiry Check
        if (coupon.expiryDate && coupon.expiryDate < today) {
            return { valid: false, message: "Expired Coupon" };
        }

        // Limit Check
        const currentUsage = coupon.currentUsage || 0;
        const maxUsage = coupon.maxUsage || 999999;
        if (currentUsage >= maxUsage) {
            return { valid: false, message: "Coupon limit reached" };
        }
        
        return { 
            valid: true,
            id: couponDoc.id, 
            type: coupon.type, // 'percent' | 'fixed'
            value: coupon.value,
            code: coupon.code
        };
    } catch (e) {
        console.error("Coupon check failed", e);
        return { valid: false, message: "Error" };
    }
};
