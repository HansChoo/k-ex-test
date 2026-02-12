
// PortOne (Iamport) Global Object Definition
declare global {
  interface Window {
    IMP: any;
  }
}

interface PaymentParams {
  merchant_uid: string; // 주문번호 (Unique)
  name: string; // 상품명
  amount: number; // 결제 금액
  buyer_email?: string;
  buyer_name?: string;
  buyer_tel?: string;
}

export const initializePayment = (userCode: string) => {
  if (window.IMP) {
    window.IMP.init(userCode); 
  }
};

export const requestPayment = (params: PaymentParams): Promise<any> => {
  return new Promise((resolve) => {
    // TEST MODE: 무조건 즉시 결제 성공 처리
    console.log(`[TEST MODE] Payment Bypassed for: ${params.name}, Amount: ${params.amount}`);
    
    // Simulate API delay
    setTimeout(() => {
        resolve({
            success: true,
            imp_uid: `test_imp_${new Date().getTime()}`,
            merchant_uid: params.merchant_uid,
            paid_amount: params.amount,
            apply_num: 'TEST_APPROVE_001',
            status: 'paid'
        });
    }, 500); 
  });
};
