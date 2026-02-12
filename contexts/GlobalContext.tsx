
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS_DATA } from '../constants';

type Currency = 'KRW' | 'USD' | 'JPY' | 'CNY';
type Language = 'ko' | 'en' | 'ja' | 'zh';

interface GlobalContextType {
  language: Language;
  currency: Currency;
  setGlobalMode: (countryCode: string) => void;
  convertPrice: (krwPrice: number) => string;
  wishlist: number[];
  toggleWishlist: (id: number) => void;
  t: (key: string) => string;
  products: any[];
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
    promo_badge: '공동구매 프로모션',
    promo_title: '함께할수록\n더 커지는 할인!',
    promo_desc: '친구들과 함께하면 더 저렴하게! 공구 인원수에 따라 최대 30% 할인',
    promo_btn: '공동구매 보기',
    pkg_title: 'K-체험 올인원 패키지',
    pkg_basic: '올인원 패키지 - 베이직',
    pkg_prem: '올인원 패키지 - 프리미엄',
    prod_title: '모든 K-체험 상품을 한눈에!',
    bottom_title: '나만의 K-체험을 즐겨보세요',
    bottom_desc: '건강검진부터 뷰티 케어, K-아이돌 체험까지!\n당신이 원하는 모든 한국 체험이 이곳에 있습니다.',
    tab_all: '전체 상품', tab_health: '건강검진', tab_idol: 'K-IDOL', tab_beauty: '뷰티시술',
    detail: '상세정보', notice: '안내사항', faq: 'FAQ',
    // Reservation Pages
    step1: 'STEP 1', step1_label: '이용 날짜',
    step2: 'STEP 2', step2_label: '옵션 선택',
    gender: '성별', male: '남성', female: '여성',
    payment_type: '결제 방식', pay_deposit: '예약금 (20%)', pay_full: '전액 결제',
    res_guide: '예약 안내', res_guide_desc: '예약 확정 후 바우처가 이메일로 발송됩니다.',
    back_list: '목록으로', sold_out: '매진되었습니다.', select_options: '옵션을 선택하세요',
    confirm_msg: '예약이 확정되었습니다!',
    // Group Buying
    hot_group: 'HOT 공동구매',
    ongoing_public: '진행중인 공개 공동구매',
    no_active: '진행중인 모집이 없습니다!',
    be_leader: '첫 번째 리더가 되어 최대 50% 할인을 받아보세요!',
    create_group: '공동구매 생성하기',
    join_group: '이 그룹 참여하기',
    current: '현재 참여', discount: '현재 할인율', time_left: '남은 시간',
    progress: '진행률', est_total: '예상 총액',
    create_pay: '예약금 결제하고 그룹 생성',
    visit_date_req: '방문 예정일 (필수)',
    male_cnt: '남성 인원', female_cnt: '여성 인원',
    gb_title: 'Your BEST K-Experience',
    gb_sub: 'More People, Lower Price!',
    gb_desc: '친구들과 함께하면 더 저렴하게! 인원별 최대 50% 할인 혜택을 누리세요',
    // Social Proof
    just_purchased: '방금 구매했습니다!',
    bought: '님이 구매함',
    // Admin
    admin_dash: '대시보드', admin_cal: '예약 캘린더', admin_res: '주문/예약 관리',
    admin_prod: '일반 상품 관리', admin_pkg: '메인 패키지 관리', admin_gb: '공동구매 관리', admin_users: '회원 관리',
    revenue: '총 매출', orders: '총 예약', users: '회원수', products: '상품수',
    monthly_rev: '월별 매출 추이', order_date: '주문일시', status: '상태', manage: '관리',
    status_pending: '입금대기', status_confirmed: '예약확정', status_completed: '이용완료', status_cancelled: '취소됨',
    save: '저장', cancel: '취소', delete: '삭제', edit: '수정', memo: '메모',
    no_products: '등록된 상품이 없습니다!', import_db: '기본 상품 DB로 가져오기'
  },
  en: {
    login: 'Login', signup: 'Sign Up', mypage: 'My Page', logout: 'Logout',
    admin: 'Admin', share: 'Share', map: 'Map', wishlist: 'Wishlist', view_wishlist: 'My Wishlist',
    book_now: 'Book Now', total: 'Total', select_date: 'Select Date',
    hero_badge: '2,847 people already experiencing!',
    hero_title: 'Your BEST K-Experience!',
    hero_subtitle: 'Every K You Want Is Here!',
    hero_desc: 'Health Check · Beauty Treatment · Beauty Consulting · KPOP\nAll-in-one platform for various K-experiences!',
    promo_badge: 'Group Buy Promotion',
    promo_title: 'More People\nLower Price!',
    promo_desc: 'More affordable with friends! Get up to 30% discount based on group size',
    promo_btn: 'View Group Buy',
    pkg_title: 'K-Experience All-in-One Packages',
    pkg_basic: 'All-in-One Package - Basic',
    pkg_prem: 'All-in-One Package - Premium',
    prod_title: 'All K-Experience Products',
    bottom_title: 'Enjoy Your Own K-Experience',
    bottom_desc: 'Health check, beauty treatment, K-IDOL and more!\nAll Korean experiences you want in one place',
    tab_all: 'All', tab_health: 'Health Check', tab_idol: 'K-IDOL', tab_beauty: 'Beauty',
    detail: 'Detail', notice: 'Notice', faq: 'FAQ',
    // Reservation Pages
    step1: 'STEP 1', step1_label: 'Select Date',
    step2: 'STEP 2', step2_label: 'Select Options',
    gender: 'Gender', male: 'Male', female: 'Female',
    payment_type: 'Payment Type', pay_deposit: 'Deposit (20%)', pay_full: 'Full Payment',
    res_guide: 'Reservation Guide', res_guide_desc: 'Voucher will be sent to email after confirmation.',
    back_list: 'Back to List', sold_out: 'Sold Out', select_options: 'Select Options',
    confirm_msg: 'Reservation Confirmed!',
    // Group Buying
    hot_group: 'HOT Group Buy',
    ongoing_public: 'Ongoing Public Group Buys',
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
    gb_desc: 'Cheaper together! Up to 50% discount per person',
    // Social Proof
    just_purchased: 'Just Purchased!',
    bought: 'bought',
    // Admin
    admin_dash: 'Dashboard', admin_cal: 'Calendar', admin_res: 'Reservations',
    admin_prod: 'Products', admin_pkg: 'Packages', admin_gb: 'Group Buys', admin_users: 'Users',
    revenue: 'Revenue', orders: 'Orders', users: 'Users', products: 'Products',
    monthly_rev: 'Monthly Revenue', order_date: 'Date', status: 'Status', manage: 'Manage',
    status_pending: 'Pending', status_confirmed: 'Confirmed', status_completed: 'Completed', status_cancelled: 'Cancelled',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', memo: 'Note',
    no_products: 'No products found!', import_db: 'Import Defaults'
  },
  ja: {
    login: 'ログイン', signup: '会員登録', mypage: 'マイページ', logout: 'ログアウト',
    admin: '管理者', share: '共有', map: '地図', wishlist: 'ウィッシュリスト', view_wishlist: '私のウィッシュリスト',
    book_now: '予約する', total: '合計', select_date: '日付選択',
    hero_badge: 'すでに2,847人が体験中！',
    hero_title: 'K-体験のすべて！',
    hero_subtitle: 'あなたが望むすべてのKがここに！',
    hero_desc: '健康診断 · 美容施術 · 美容コンサルティング · K-POP\n様々なK-体験を一度にできるオールインワンプラットフォーム！',
    promo_badge: '共同購入プロモーション',
    promo_title: '集まれば集まるほど\n安くなる！',
    promo_desc: '友達と一緒ならもっとお得に！人数に応じて最大30%割引',
    promo_btn: '共同購入を見る',
    pkg_title: 'K-体験 オールインワンパッケージ',
    pkg_basic: 'オールインワンパッケージ - ベーシック',
    pkg_prem: 'オールインワンパッケージ - プレミアム',
    prod_title: 'すべてのK-体験商品を一目で！',
    bottom_title: 'あなただけのK-体験を楽しもう',
    bottom_desc: '健康診断から美容ケア、K-アイドル体験まで！\nあなたが望むすべての韓国体験がここにあります。',
    tab_all: '全商品', tab_health: '健康診断', tab_idol: 'K-IDOL', tab_beauty: '美容施術',
    detail: '詳細情報', notice: '案内事項', faq: 'よくある質問',
    // Reservation Pages
    step1: 'STEP 1', step1_label: '利用日',
    step2: 'STEP 2', step2_label: 'オプション選択',
    gender: '性別', male: '男性', female: '女性',
    payment_type: '決済方法', pay_deposit: '予約金 (20%)', pay_full: '全額決済',
    res_guide: '予約案内', res_guide_desc: '予約確定後、バウチャーがメールで送信されます。',
    back_list: 'リストに戻る', sold_out: '売り切れ', select_options: 'オプションを選択',
    confirm_msg: '予約が確定しました！',
    // Group Buying
    hot_group: 'HOT 共同購入',
    ongoing_public: '進行中の共同購入',
    no_active: '進行中のグループがありません！',
    be_leader: '最初のリーダーになって最大50%割引を受けましょう！',
    create_group: '共同購入を作成',
    join_group: 'このグループに参加',
    current: '現在', discount: '割引率', time_left: '残り時間',
    progress: '進行率', est_total: '予想合計',
    create_pay: '予約金を支払って作成',
    visit_date_req: '訪問予定日 (必須)',
    male_cnt: '男性', female_cnt: '女性',
    gb_title: 'Your BEST K-Experience',
    gb_sub: 'More People, Lower Price!',
    gb_desc: '友達と一緒ならもっとお得に！人数に応じて最大50%割引',
    // Social Proof
    just_purchased: 'たった今購入しました！',
    bought: 'さんが購入',
    // Admin
    admin_dash: 'ダッシュボード', admin_cal: '予約カレンダー', admin_res: '注文/予約管理',
    admin_prod: '一般商品管理', admin_pkg: 'メインパッケージ管理', admin_gb: '共同購入管理', admin_users: '会員管理',
    revenue: '総売上', orders: '総予約', users: '会員数', products: '商品数',
    monthly_rev: '月別売上推移', order_date: '注文日時', status: '状態', manage: '管理',
    status_pending: '入金待ち', status_confirmed: '予約確定', status_completed: '利用完了', status_cancelled: 'キャンセル',
    save: '保存', cancel: 'キャンセル', delete: '削除', edit: '修正', memo: 'メモ',
    no_products: '登録された商品がありません！', import_db: '基本商品DBをインポート'
  },
  zh: {
    login: '登录', signup: '注册', mypage: '我的页面', logout: '退出',
    admin: '管理员', share: '分享', map: '地图', wishlist: '愿望清单', view_wishlist: '我的愿望清单',
    book_now: '立即预订', total: '总计', select_date: '选择日期',
    hero_badge: '已有2,847人体验中！',
    hero_title: 'K-体验的一切！',
    hero_subtitle: '你想要的所有K都在这里！',
    hero_desc: '健康检查 · 美容手术 · 美容咨询 · K-POP\n一次性体验各种K-体验的一站式平台！',
    promo_badge: '团购促销',
    promo_title: '人越多\n折扣越大！',
    promo_desc: '和朋友一起更便宜！根据人数最多可享受30%的折扣',
    promo_btn: '查看团购',
    pkg_title: 'K-体验 一站式套餐',
    pkg_basic: '一站式套餐 - 基础',
    pkg_prem: '一站式套餐 - 高级',
    prod_title: '一目了然的所有K-体验产品！',
    bottom_title: '享受你自己的K-体验',
    bottom_desc: '从健康检查到美容护理，K-偶像体验！\n你想要的所有韩国体验都在这里。',
    tab_all: '全部商品', tab_health: '健康检查', tab_idol: 'K-IDOL', tab_beauty: '美容手术',
    detail: '详细信息', notice: '注意事项', faq: '常见问题',
    // Reservation Pages
    step1: 'STEP 1', step1_label: '选择日期',
    step2: 'STEP 2', step2_label: '选择选项',
    gender: '性别', male: '男性', female: '女性',
    payment_type: '支付方式', pay_deposit: '定金 (20%)', pay_full: '全额付款',
    res_guide: '预订指南', res_guide_desc: '确认后凭证将发送至您的电子邮箱。',
    back_list: '返回列表', sold_out: '已售罄', select_options: '选择选项',
    confirm_msg: '预订已确认！',
    // Group Buying
    hot_group: 'HOT 团购',
    ongoing_public: '进行中的团购',
    no_active: '暂无进行中的团购！',
    be_leader: '成为第一个发起人，享受高达50%的折扣！',
    create_group: '创建团购',
    join_group: '加入此团购',
    current: '当前', discount: '折扣', time_left: '剩余时间',
    progress: '进度', est_total: '预计总额',
    create_pay: '支付定金并创建',
    visit_date_req: '访问日期 (必填)',
    male_cnt: '男性', female_cnt: '女性',
    gb_title: 'Your BEST K-Experience',
    gb_sub: 'More People, Lower Price!',
    gb_desc: '和朋友一起更便宜！人越多折扣越大 (最高50%)',
    // Social Proof
    just_purchased: '刚刚购买！',
    bought: '购买了',
    // Admin
    admin_dash: '仪表板', admin_cal: '预订日历', admin_res: '订单/预订管理',
    admin_prod: '一般产品管理', admin_pkg: '主套餐管理', admin_gb: '团购管理', admin_users: '会员管理',
    revenue: '总收入', orders: '总预订', users: '会员数', products: '产品数',
    monthly_rev: '月收入趋势', order_date: '订单日期', status: '状态', manage: '管理',
    status_pending: '待付款', status_confirmed: '已确认', status_completed: '已完成', status_cancelled: '已取消',
    save: '保存', cancel: '取消', delete: '删除', edit: '编辑', memo: '备注',
    no_products: '未找到产品！', import_db: '导入默认值'
  }
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [wishlist, setWishlist] = useState<number[]>([]);

  // Init from Local Storage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('k_exp_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    const savedLang = localStorage.getItem('k_exp_lang') as Language;
    const savedCurr = localStorage.getItem('k_exp_curr') as Currency;
    if (savedLang) setLanguage(savedLang);
    if (savedCurr) setCurrency(savedCurr);
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
    if (currency === 'KRW') return `₩ ${Math.round(converted).toLocaleString()}`;
    if (currency === 'JPY') return `¥ ${Math.round(converted).toLocaleString()}`;
    if (currency === 'CNY') return `¥ ${converted.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    return `${SYMBOLS[currency]} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  return (
    <GlobalContext.Provider value={{ language, currency, setGlobalMode, convertPrice, wishlist, toggleWishlist, t, products: PRODUCTS_DATA[language] }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal must be used within a GlobalProvider");
  return context;
};
