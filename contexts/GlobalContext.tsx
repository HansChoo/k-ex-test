
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebaseConfig';

type Currency = 'KRW' | 'USD' | 'JPY' | 'CNY';
type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface Category {
    id: string;
    label: string;
    labelEn: string;
    image: string;
    keywords: string[]; // Used to filter products
    order?: number;
}

interface GlobalContextType {
  language: Language;
  currency: Currency;
  setGlobalMode: (countryCode: string) => void;
  convertPrice: (krwPrice: number) => string;
  wishlist: number[];
  toggleWishlist: (id: number) => void;
  t: (key: string) => string;
  products: any[];
  packages: any[]; // Added packages
  categories: Category[]; // Added categories
  getLocalizedValue: (data: any, field: string) => string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const RATES = { KRW: 1, USD: 0.00075, JPY: 0.11, CNY: 0.0054 };
const SYMBOLS = { KRW: '₩', USD: '$', JPY: '¥', CNY: '¥' };

const TRANSLATIONS: any = {
  ko: {
    login: '로그인', signup: '회원가입', mypage: '마이페이지', logout: '로그아웃',
    admin: '관리자', share: '공유하기', map: '지도 보기', wishlist: '위시리스트', view_wishlist: '나의 위시리스트',
    book_now: '예약하기', total: '총 합계', select_date: '날짜 선택',
    hero_badge: '2,847명이 이미 체험 중!',
    hero_title: 'K-체험의 모든 것!',
    hero_subtitle: 'Every K You Want Is Here!',
    hero_desc: '건강검진 · 뷰티시술 · 뷰티컨설팅 · K-POP\n다양한 K-체험을 한번에 할 수 있는 올인원 플랫폼!',
    popular_categories: '인기 카테고리',
    select_category_desc: '원하는 체험을 선택하세요',
    popular_products: '인기 체험',
    promo_badge: '공동구매 프로모션',
    promo_title: '함께할수록\n더 커지는 할인!',
    promo_desc: '친구들과 함께하면 더 저렴하게! 공구 인원수에 따라 최대 30% 할인\nK-아이돌 체험부터 뷰티 케어, 건강검진까지',
    promo_btn: '공동구매 보기',
    pkg_title: '올인원 패키지',
    pkg_desc_sub: '한번에 모든 것을 경험하세요',
    pkg_basic: '올인원 패키지 - 베이직',
    pkg_prem: '올인원 패키지 - 프리미엄',
    prod_title: '모든 K-체험 상품을 한눈에!',
    bottom_title: '나만의 K-체험을 즐겨보세요',
    bottom_desc: '건강검진부터 뷰티 케어, K-아이돌 체험까지!\n당신이 원하는 모든 한국 체험이 이곳에 있습니다.',
    tab_all: '전체 상품', tab_health: '건강검진', tab_idol: 'K-IDOL', tab_beauty: '뷰티시술',
    detail: '상세보기', notice: '안내사항', faq: 'FAQ',
    step1: 'STEP 1', step1_label: '이용 날짜',
    step2: 'STEP 2', step2_label: '옵션 선택',
    gender: '성별', male: '남성', female: '여성',
    payment_type: '결제 방식', pay_deposit: '예약금 (20% 별도)', pay_full: '전액 결제',
    res_guide: '예약 안내', res_guide_desc: '예약 확정 후 바우처가 이메일로 발송됩니다.',
    back_list: '목록으로', sold_out: '매진되었습니다.', select_options: '옵션을 선택하세요',
    confirm_msg: '예약이 확정되었습니다!',
    hot_group: 'HOT 공동구매',
    ongoing_public: '진행 중인 공개 공동구매',
    ongoing_public_desc: '누구나 참여 가능! 친구들과 함께 구매하면 추가 10% 할인 혜택을 받을 수 있습니다!',
    no_active: '진행중인 모집이 없습니다!',
    be_leader: '첫 번째 리더가 되어 최대 30% 할인을 받아보세요!',
    create_group: '공동구매 생성하기',
    join_group: '공동구매 참여하기',
    current: '현재 참여', discount: '현재 할인율', time_left: '남은 시간',
    progress: '진행률', est_total: '예상 총액',
    create_pay: '예약금 결제하고 그룹 생성',
    visit_date_req: '방문 예정일 (필수)',
    male_cnt: '남성 인원', female_cnt: '여성 인원',
    gb_title: 'Your BEST K-experience',
    gb_sub: 'More People, Lower Price!',
    gb_desc: '친구들과 함께하면 더 저렴하게! 인원별 최대 30% 할인 혜택을 누리세요',
    just_purchased: '방금 구매했습니다!',
    bought: '님이 구매함',
    admin_dash: '대시보드', admin_cal: '예약 캘린더', admin_res: '주문/예약 관리',
    admin_prod: '일반 상품 관리', admin_pkg: '메인 패키지 관리', admin_gb: '공동구매 관리', admin_users: '회원 관리',
    revenue: '총 매출', orders: '총 예약', users: '회원수', products: '상품수',
    monthly_rev: '월별 매출 추이', order_date: '주문일시', status: '상태', manage: '관리',
    status_pending: '입금대기', status_confirmed: '예약확정', status_completed: '이용완료', status_cancelled: '취소됨',
    save: '저장', cancel: '취소', delete: '삭제', edit: '수정', memo: '메모',
    no_products: '등록된 상품이 없습니다!', import_db: '기본 상품 DB로 가져오기',
    magazine: 'K-매거진', inquiry: '1:1 문의', coupon: '쿠폰', affiliate: '제휴 마케팅',
    coupon_code: '프로모션 코드', apply: '적용', discount_applied: '할인 적용됨', invalid_coupon: '유효하지 않은 쿠폰입니다.',
    my_inquiries: '나의 문의내역', new_inquiry: '새 문의 작성', inquiry_title: '제목', inquiry_content: '내용',
    status_waiting: '답변대기', status_answered: '답변완료',
    admin_coupon: '쿠폰 관리', admin_magazine: '매거진 관리', admin_inquiry: '문의 관리', admin_affiliate: '제휴 파트너',
    create_coupon: '쿠폰 발행', create_post: '포스트 작성', 
    coupon_name: '쿠폰명 (식별용)', discount_type: '할인 타입', discount_value: '할인값', expiry: '만료일',
    percent: '퍼센트(%)', fixed_amount: '정액(원)',
    affiliate_code: '파트너 코드', partner_name: '파트너/업체명', clicks: '유입(클릭)', sales: '판매수', commission: '수수료율',
    total_rev: '총 매출액', comm_amount: '정산금액', link_copy: '링크복사', max_usage: '발행수량', current_usage: '사용됨',
    usage_limit_reached: '선착순 마감된 쿠폰입니다.'
  },
  en: {
    login: 'Login', signup: 'Sign Up', mypage: 'My Page', logout: 'Logout',
    admin: 'Admin', share: 'Share', map: 'Map', wishlist: 'Wishlist', view_wishlist: 'My Wishlist',
    book_now: 'Book Now', total: 'Total', select_date: 'Select Date',
    hero_badge: '2,847 people already experiencing!',
    hero_title: 'Your BEST K-Experience!',
    hero_subtitle: 'Every K You Want Is Here!',
    hero_desc: 'Health Check · Beauty Treatment · Beauty Consulting · KPOP\nAll-in-one platform for various K-experiences!',
    popular_categories: 'Popular Categories',
    select_category_desc: 'Select the experience you want',
    popular_products: 'Popular Products',
    promo_badge: 'Group Buy Promotion',
    promo_title: 'More People\nLower Price!',
    promo_desc: 'More affordable with friends! Get up to 30% discount based on group size',
    promo_btn: 'View Group Buy',
    pkg_title: 'All-in-One Packages',
    pkg_desc_sub: 'Experience everything at once',
    pkg_basic: 'All-in-One Package - Basic',
    pkg_prem: 'All-in-One Package - Premium',
    prod_title: 'All K-Experience Products',
    bottom_title: 'Enjoy Your Own K-Experience',
    bottom_desc: 'Health check, beauty treatment, K-IDOL and more!\nAll Korean experiences you want in one place',
    tab_all: 'All', tab_health: 'Health Check', tab_idol: 'K-IDOL', tab_beauty: 'Beauty',
    detail: 'View Detail', notice: 'Notice', faq: 'FAQ',
    step1: 'STEP 1', step1_label: 'Select Date',
    step2: 'STEP 2', step2_label: 'Select Options',
    gender: 'Gender', male: 'Male', female: 'Female',
    payment_type: 'Payment Type', pay_deposit: 'Deposit (20% extra)', pay_full: 'Full Payment',
    res_guide: 'Reservation Guide', res_guide_desc: 'Voucher will be sent to email after confirmation.',
    back_list: 'Back to List', sold_out: 'Sold Out', select_options: 'Select Options',
    confirm_msg: 'Reservation Confirmed!',
    hot_group: 'HOT Group Buy',
    ongoing_public: 'Ongoing Public Group Buys',
    ongoing_public_desc: 'Join open groups and get 10% extra discount!',
    no_active: 'No active groups yet!',
    be_leader: 'Be the first leader and get huge discounts!',
    create_group: 'Create Group Buy',
    join_group: 'Join this Group',
    current: 'Current', discount: 'Discount', time_left: 'Time Left',
    progress: 'Progress', est_total: 'Est. Total',
    create_pay: 'Create & Pay Deposit',
    visit_date_req: 'Visit Date (Required)',
    male_cnt: 'Male', female_cnt: 'Female',
    gb_title: 'Your BEST K-Experience',
    gb_sub: 'More People, Lower Price!',
    gb_desc: 'Cheaper together! Up to 30% discount per person',
    just_purchased: 'Just Purchased!',
    bought: 'bought',
    admin_dash: 'Dashboard', admin_cal: 'Calendar', admin_res: 'Reservations',
    admin_prod: 'Products', admin_pkg: 'Packages', admin_gb: 'Group Buys', admin_users: 'Users',
    revenue: 'Revenue', orders: 'Orders', users: 'Users', products: 'Products',
    monthly_rev: 'Monthly Revenue', order_date: 'Date', status: 'Status', manage: 'Manage',
    status_pending: 'Pending', status_confirmed: 'Confirmed', status_completed: 'Completed', status_cancelled: 'Cancelled',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', memo: 'Note',
    no_products: 'No products found!', import_db: 'Import Defaults',
    magazine: 'K-Magazine', inquiry: '1:1 Inquiry', coupon: 'Coupon', affiliate: 'Affiliates',
    coupon_code: 'Promo Code', apply: 'Apply', discount_applied: 'Discount Applied', invalid_coupon: 'Invalid Coupon',
    my_inquiries: 'My Inquiries', new_inquiry: 'New Inquiry', inquiry_title: 'Title', inquiry_content: 'Content',
    status_waiting: 'Waiting', status_answered: 'Answered',
    admin_coupon: 'Coupons', admin_magazine: 'Magazine', admin_inquiry: 'Inquiries', admin_affiliate: 'Affiliates',
    create_coupon: 'Create Coupon', create_post: 'Create Post',
    coupon_name: 'Coupon Name', discount_type: 'Type', discount_value: 'Value', expiry: 'Expiry',
    percent: 'Percent (%)', fixed_amount: 'Amount (KRW)',
    affiliate_code: 'Code', partner_name: 'Partner Name', clicks: 'Clicks', sales: 'Sales', commission: 'Comm %',
    total_rev: 'Total Revenue', comm_amount: 'Comm. Amount', link_copy: 'Copy Link', max_usage: 'Limit', current_usage: 'Used',
    usage_limit_reached: 'This coupon has reached its usage limit.'
  },
  ja: {
    magazine: 'K-マガジン', inquiry: '1:1 お問い合わせ', coupon: 'クーポン', affiliate: 'アフィ리에이트',
    coupon_code: 'プロモーションコード', apply: '適用', discount_applied: '割引適用', invalid_coupon: '無効なクーポンです。',
    usage_limit_reached: 'このクーポンは使用上限에 達しました。'
  },
  zh: {
    magazine: 'K-杂志', inquiry: '1:1 咨询', coupon: '优惠券', affiliate: '联盟营销',
    coupon_code: '优惠码', apply: '应用', discount_applied: '已应用折扣', invalid_coupon: '无效的优惠券',
    usage_limit_reached: '此优惠券已达到使用上限。'
  }
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [realtimeProducts, setRealtimeProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); // New State
  const [categories, setCategories] = useState<Category[]>([]);

  // Init from Local Storage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('k_exp_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    const savedLang = localStorage.getItem('k_exp_lang') as Language;
    const savedCurr = localStorage.getItem('k_exp_curr') as Currency;
    if (savedLang) setLanguage(savedLang);
    if (savedCurr) setCurrency(savedCurr);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db!, "products"), orderBy("createdAt", "desc")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRealtimeProducts(products);
    }, (error) => {
        console.warn("Products listener error:", error.message);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db!, "cms_packages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'package' })));
    }, (error) => {
        console.warn("Packages listener error:", error.message);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db!, "cms_categories"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
        console.warn("Categories listener error:", error.message);
    });
    return () => unsubscribe();
  }, []);

  const setGlobalMode = (countryCode: string) => {
    let newLang: Language = 'ko';
    let newCurr: Currency = 'KRW';

    switch (countryCode) {
      case 'KR': newLang = 'ko'; newCurr = 'KRW'; break;
      case 'US': newLang = 'en'; newCurr = 'USD'; break;
      case 'JP': newLang = 'ja'; newCurr = 'JPY'; break;
      case 'CN': newLang = 'zh'; newCurr = 'CNY'; break;
      default: newLang = 'en'; newCurr = 'USD';
    }
    
    setLanguage(newLang);
    setCurrency(newCurr);
    localStorage.setItem('k_exp_lang', newLang);
    localStorage.setItem('k_exp_curr', newCurr);
  };

  const convertPrice = (krwPrice: number) => {
    const rate = RATES[currency];
    const converted = krwPrice * rate;
    if (currency === 'KRW') return `₩${Math.round(converted).toLocaleString()}`;
    if (currency === 'JPY') return `¥${Math.round(converted).toLocaleString()}`;
    if (currency === 'CNY') return `¥${converted.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const toggleWishlist = (id: number) => {
    let newWishlist;
    if (wishlist.includes(id)) newWishlist = wishlist.filter(item => item !== id);
    else newWishlist = [...wishlist, id];
    setWishlist(newWishlist);
    localStorage.setItem('k_exp_wishlist', JSON.stringify(newWishlist));
    window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: wishlist.includes(id) ? 'Removed from Wishlist' : 'Added to Wishlist', type: 'info' } 
    }));
  };

  const t = (key: string) => TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;

  // Helper to fetch localized content from DB objects
  const getLocalizedValue = (data: any, field: string) => {
      if (!data) return '';
      if (language === 'ko') return data[field] || '';
      
      const localizedField = `${field}_${language}`;
      return data[localizedField] || data[field] || ''; 
  };

  const displayProducts = realtimeProducts; 

  return (
    <GlobalContext.Provider value={{ language, currency, setGlobalMode, convertPrice, wishlist, toggleWishlist, t, products: displayProducts, packages, categories, getLocalizedValue }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal must be used within a GlobalProvider");
  return context;
};
