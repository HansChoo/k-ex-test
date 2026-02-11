
import { 
  doc, 
  runTransaction, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDoc
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
 * Firebase Transaction을 사용하여 동시 접속자가 있어도 정확하게 재고를 차감합니다.
 */
export const createReservation = async (data: ReservationData) => {
  const inventoryRef = doc(db, "inventory", data.date); // e.g., inventory/2026-02-10
  
  try {
    await runTransaction(db, async (transaction) => {
      const inventoryDoc = await transaction.get(inventoryRef);
      
      let currentCount = 0;
      let maxCapacity = 50; // 기본 최대 인원 설정 (필요시 DB에서 가져옴)

      if (inventoryDoc.exists()) {
        const invData = inventoryDoc.data();
        currentCount = invData.currentCount || 0;
        if (invData.maxCapacity) maxCapacity = invData.maxCapacity;
      }

      // 1. 잔여 인원 체크
      if (currentCount + data.peopleCount > maxCapacity) {
        throw new Error("Sold Out: 해당 날짜의 예약 정원이 초과되었습니다.");
      }

      // 2. 예약 데이터 저장 (주문서 생성)
      const reservationRef = doc(collection(db, "reservations"));
      transaction.set(reservationRef, {
        ...data,
        createdAt: serverTimestamp(),
        status: "confirmed" // 결제 완료 후라면 confirmed, 아니면 pending
      });

      // 3. 인원 수 업데이트 (아토믹 연산)
      transaction.set(inventoryRef, {
        currentCount: currentCount + data.peopleCount,
        maxCapacity: maxCapacity
      }, { merge: true });
    });

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

      // 참여자 수 증가
      transaction.update(campaignRef, { participants: newCount });
      
      // 참여 기록 저장
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
 * 특정 날짜의 예약 가능 여부 확인 (UI 표시용)
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
  return { available: 50, total: 50 }; // 기본값
};
