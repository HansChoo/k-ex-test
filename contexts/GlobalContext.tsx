
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../services/firebaseConfig';
import { fetchExchangeRates } from '../services/currencyService';

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

export interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
}

interface GlobalContextType {
  language: Language;
  currency: Currency;
  setGlobalMode: (countryCode: string) => void;
  convertPrice: (krwPrice: number) => string;
  liveRates: { KRW: number; USD: number; JPY: number; CNY: number };
  ratesLoaded: boolean;
  wishlist: (number | string)[];
  toggleWishlist: (id: number | string) => void;
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  t: (key: string) => string;
  products: any[];
  packages: any[];
  categories: Category[];
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
    hero_badge: '{count}명이 이미 체험 중!',
    hero_title: 'K-체험의 모든 것!',
    hero_subtitle: 'Every K You Want Is Here!',
    hero_desc: '건강검진 · 뷰티시술 · 뷰티컨설팅 · K-POP\n다양한 K-체험을 한번에 할 수 있는 올인원 플랫폼!',
    popular_categories: '인기 카테고리',
    select_category_desc: '원하는 체험을 선택하세요',
    popular_products: '인기 체험',
    promo_badge: '공동구매 프로모션',
    promo_title: '함께할수록\n더 커지는 할인!',
    promo_desc: '친구들과 함께하면 더 저렴해진다!\n10명이 모이면 최대 30% 할인!',
    promo_btn: '공동구매 보기',
    pkg_title: '올인원 패키지',
    pkg_desc_sub: '한번에 모든 것을 경험하세요',
    pkg_basic: '올인원 패키지 - 베이직',
    pkg_prem: '올인원 패키지 - 프리미엄',
    prod_title: '모든 K-체험 상품을 한눈에!',
    bottom_title: '나만의 K-체험을 즐겨보세요',
    bottom_desc: 'K-뷰티부터 K-POP, 건강검진까지!\n당신이 원하는 모든 한국 체험이 이곳에 있습니다.',
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
    no_products: '등록된 상품이 없습니다!', no_reviews: '아직 리뷰가 없습니다.', import_db: '기본 상품 DB로 가져오기',
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
    usage_limit_reached: '선착순 마감된 쿠폰입니다.',
    start_now: '지금 시작하기', home: '홈', group_buy: '공동구매', all_exp: '전체체험',
    no_categories: '카테고리가 준비 중입니다.', live_rate: '실시간 환율 적용',
    quiz_q1: '가장 관심 있는 분야는?', quiz_q2: '선호하는 예산 범위는?',
    quiz_basic: '에센셜 체험 (베이직)', quiz_premium: '프리미엄 VIP 서비스',
    ai_concierge: 'AI 컨시어지', analyzing: '취향을 분석 중...', finding: '당신에게 완벽한 K-체험을 찾고 있습니다',
    we_recommend: '추천합니다', start_over: '다시 시작', question: '질문',
    passport_name: '여권 영문 이름', date_of_birth: '생년월일', nationality: '국적', select_nationality: '국적 선택',
    phone_number: '휴대폰 번호', representative_contact: '대표 연락처', messenger_id_placeholder: '메신저 ID 또는 전화번호',
    view_all: '전체보기', copyright: '© K-experience. All Rights Reserved.',
    cart: '장바구니', reservations: '예약', quantity: '수량', remove: '삭제',
    no_items: '상품이 없습니다', go_shopping: '쇼핑하러 가기',
    payment_complete: '결제 완료!', reservation_confirmed: '예약이 확정되었습니다.',
    go_home: '홈으로', pay_securely: 'PayPal로 안전하게 결제하세요',
    payment_error: '결제 오류가 발생했습니다.', select_all: '전체 선택',
    selected_items: '선택한 상품', add_to_cart: '장바구니 담기', proceed_payment: '결제하기',
    per_person: '1인 기준', no_packages: '올인원 패키지가 준비 중입니다.',
    quiz_opt_kpop: 'K-POP & 아이돌 문화', quiz_opt_beauty: '스킨케어 & 뷰티', quiz_opt_health: '종합 건강검진',
    magazine_title: 'K-Experience 매거진', magazine_subtitle: '최신 K-트렌드 소식',
    magazine_more: '더보기', magazine_see_all: '전체 보기', magazine_coming: '매거진 콘텐츠가 준비 중입니다',
    magazine_coming_desc: 'K-뷰티, K-헬스, K-POP 등 다양한 트렌드 소식을 만나보세요',
    copied: '복사됨!', copy_link: '링크 복사',
    back_to_list: '목록으로', related_products: '관련 상품',
    related_products_desc: '이 글과 관련된 K-Experience 상품을 확인해보세요',
    back_to_magazine: '매거진 목록으로',
    magazine_desc: '한국의 뷰티, 건강, 문화, 엔터테인먼트 최신 트렌드를 만나보세요.',
    search_articles: '매거진 검색...', no_results: '검색 결과가 없습니다.',
    coming_soon: '게시글이 없습니다.',
    tab_all_magazine: '전체',
    rec_health_premium: '프리미엄 종합 건강검진', rec_health_basic: '베이직 건강검진',
    rec_idol_premium: 'K-IDOL 프리미엄 메이크오버', rec_idol_basic: 'K-IDOL 베이직 포토',
    rec_beauty_premium: '리쥬란힐러 VIP 패키지', rec_beauty_basic: '글래스 스킨 베이직 패키지'
  },
  en: {
    login: 'Login', signup: 'Sign Up', mypage: 'My Page', logout: 'Logout',
    admin: 'Admin', share: 'Share', map: 'Map', wishlist: 'Wishlist', view_wishlist: 'My Wishlist',
    book_now: 'Book Now', total: 'Total', select_date: 'Select Date',
    hero_badge: '{count} people already experiencing!',
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
    no_products: 'No products found!', no_reviews: 'No reviews yet.', import_db: 'Import Defaults',
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
    usage_limit_reached: 'This coupon has reached its usage limit.',
    start_now: 'Start Now!', home: 'Home', group_buy: 'Group Buy', all_exp: 'All Exp.',
    no_categories: 'Categories coming soon.', live_rate: 'Live exchange rate',
    quiz_q1: 'What are you most interested in?', quiz_q2: 'What is your preferred range?',
    quiz_basic: 'Essential Experience (Basic)', quiz_premium: 'Premium VIP Service',
    ai_concierge: 'AI Concierge', analyzing: 'Analyzing your taste...', finding: 'Finding the perfect K-Experience for you',
    we_recommend: 'We recommend', start_over: 'Start Over', question: 'QUESTION',
    passport_name: 'Passport Name', date_of_birth: 'Date of Birth', nationality: 'Nationality', select_nationality: 'Select Nationality',
    phone_number: 'Phone Number', representative_contact: 'Representative Contact', messenger_id_placeholder: 'Messenger ID or Phone',
    view_all: 'View All', copyright: '© K-experience. All Rights Reserved.',
    cart: 'Cart', reservations: 'Reservations', quantity: 'Qty', remove: 'Remove',
    no_items: 'No items yet', go_shopping: 'Go Shopping',
    payment_complete: 'Payment Complete!', reservation_confirmed: 'Your reservation is confirmed.',
    go_home: 'Go Home', pay_securely: 'Pay securely with PayPal',
    payment_error: 'Payment error occurred.', select_all: 'Select All',
    selected_items: 'Selected Items', add_to_cart: 'Add to Cart', proceed_payment: 'Proceed to Payment',
    per_person: 'Per Person', no_packages: 'Packages are being prepared.',
    quiz_opt_kpop: 'K-POP & Idol Culture', quiz_opt_beauty: 'Skin Care & Beauty', quiz_opt_health: 'General Health Checkup',
    magazine_title: 'K-Experience Magazine', magazine_subtitle: 'Latest K-trend news',
    magazine_more: 'View All', magazine_see_all: 'See All', magazine_coming: 'Magazine content coming soon',
    magazine_coming_desc: 'Stay tuned for K-Beauty, K-Health, K-POP trends & more',
    copied: 'Copied!', copy_link: 'Share',
    back_to_list: 'Back', related_products: 'Related Products',
    related_products_desc: 'Check out related K-Experience products',
    back_to_magazine: 'Back to Magazine',
    magazine_desc: 'Discover the latest trends and tips about Korean beauty, health, culture, and entertainment.',
    search_articles: 'Search articles...', no_results: 'No results found.',
    coming_soon: 'Coming Soon!',
    tab_all_magazine: 'All',
    rec_health_premium: 'Premium Health Checkup', rec_health_basic: 'Basic Health Checkup',
    rec_idol_premium: 'K-IDOL Premium Makeover', rec_idol_basic: 'K-IDOL Basic Photoshoot',
    rec_beauty_premium: 'Rejuran Healer VIP Package', rec_beauty_basic: 'Glass Skin Basic Package'
  },
  ja: {
    login: 'ログイン', signup: '会員登録', mypage: 'マイページ', logout: 'ログアウト',
    admin: '管理者', share: '共有', map: '地図', wishlist: 'お気に入り', view_wishlist: 'マイお気に入り',
    book_now: '予約する', total: '合計', select_date: '日付を選択',
    hero_badge: '{count}人が体験中！',
    hero_title: 'K-体験のすべて！',
    hero_subtitle: 'Every K You Want Is Here!',
    hero_desc: '健康診断 · 美容施術 · 美容コンサルティング · K-POP\nさまざまなK-体験をワンストップで！',
    popular_categories: '人気カテゴリー',
    select_category_desc: 'ご希望の体験をお選びください',
    popular_products: '人気体験',
    promo_badge: '共同購入プロモーション',
    promo_title: '人数が増えるほど\nお得に！',
    promo_desc: '友達と一緒にもっとお得に！\n10人集まれば最大30%割引！',
    promo_btn: '共同購入を見る',
    pkg_title: 'オールインワンパッケージ',
    pkg_desc_sub: 'すべてを一度に体験',
    pkg_basic: 'オールインワン - ベーシック',
    pkg_prem: 'オールインワン - プレミアム',
    prod_title: 'すべてのK-体験商品',
    bottom_title: 'あなただけのK-体験を楽しもう',
    bottom_desc: '健康診断からK-POP、美容まで！\nあなたが望む韓国体験がすべてここに。',
    tab_all: 'すべて', tab_health: '健康診断', tab_idol: 'K-IDOL', tab_beauty: '美容',
    detail: '詳細を見る', notice: 'ご案内', faq: 'FAQ',
    step1: 'STEP 1', step1_label: '利用日',
    step2: 'STEP 2', step2_label: 'オプション選択',
    gender: '性別', male: '男性', female: '女性',
    payment_type: 'お支払い方法', pay_deposit: '予約金（20%）', pay_full: '全額払い',
    res_guide: '予約案内', res_guide_desc: '予約確定後、バウチャーがメールで送信されます。',
    back_list: '一覧に戻る', sold_out: '売り切れ', select_options: 'オプションを選択してください',
    confirm_msg: '予約が確定しました！',
    hot_group: 'HOT 共同購入',
    ongoing_public: '進行中の共同購入',
    ongoing_public_desc: '誰でも参加可能！友達と一緒に購入すると追加10%割引！',
    no_active: '進行中の募集はありません！',
    be_leader: '最初のリーダーになって最大30%割引を受けましょう！',
    create_group: '共同購入を作成',
    join_group: '共同購入に参加',
    current: '現在参加', discount: '割引率', time_left: '残り時間',
    progress: '進捗', est_total: '予想合計',
    create_pay: '予約金を支払ってグループ作成',
    visit_date_req: '訪問予定日（必須）',
    male_cnt: '男性人数', female_cnt: '女性人数',
    gb_title: 'あなたのベストK-体験',
    gb_sub: '人数が多いほどお得！',
    gb_desc: '友達と一緒にもっとお得に！人数別で最大30%割引',
    just_purchased: '購入しました！',
    bought: 'さんが購入',
    admin_dash: 'ダッシュボード', admin_cal: 'カレンダー', admin_res: '予約管理',
    admin_prod: '商品管理', admin_pkg: 'パッケージ管理', admin_gb: '共同購入管理', admin_users: '会員管理',
    revenue: '総売上', orders: '総予約', users: '会員数', products: '商品数',
    monthly_rev: '月別売上推移', order_date: '注文日時', status: '状態', manage: '管理',
    status_pending: '入金待ち', status_confirmed: '予約確定', status_completed: '利用完了', status_cancelled: 'キャンセル',
    save: '保存', cancel: 'キャンセル', delete: '削除', edit: '編集', memo: 'メモ',
    no_products: '登録された商品がありません！', no_reviews: 'まだレビューがありません。', import_db: 'デフォルトDBをインポート',
    magazine: 'K-マガジン', inquiry: '1:1 お問い合わせ', coupon: 'クーポン', affiliate: 'アフィリエイト',
    coupon_code: 'プロモーションコード', apply: '適用', discount_applied: '割引適用', invalid_coupon: '無効なクーポンです。',
    my_inquiries: 'お問い合わせ履歴', new_inquiry: '新しいお問い合わせ', inquiry_title: 'タイトル', inquiry_content: '内容',
    status_waiting: '回答待ち', status_answered: '回答済み',
    admin_coupon: 'クーポン管理', admin_magazine: 'マガジン管理', admin_inquiry: 'お問い合わせ管理', admin_affiliate: '提携パートナー',
    create_coupon: 'クーポン発行', create_post: '記事作成',
    coupon_name: 'クーポン名', discount_type: '割引タイプ', discount_value: '割引値', expiry: '有効期限',
    percent: 'パーセント(%)', fixed_amount: '定額(ウォン)',
    affiliate_code: 'パートナーコード', partner_name: 'パートナー名', clicks: 'クリック数', sales: '販売数', commission: '手数料率',
    total_rev: '総売上額', comm_amount: '精算額', link_copy: 'リンクコピー', max_usage: '発行数量', current_usage: '使用済み',
    usage_limit_reached: 'このクーポンは使用上限に達しました。',
    start_now: '今すぐ始める', home: 'ホーム', group_buy: '共同購入', all_exp: 'すべての体験',
    no_categories: 'カテゴリー準備中です。', live_rate: 'リアルタイム為替レート',
    quiz_q1: '最も興味のある分野は？', quiz_q2: 'ご予算は？',
    quiz_basic: 'エッセンシャル体験（ベーシック）', quiz_premium: 'プレミアムVIPサービス',
    ai_concierge: 'AIコンシェルジュ', analyzing: 'お好みを分析中...', finding: 'あなたにぴったりのK-体験を探しています',
    we_recommend: 'おすすめ', start_over: 'やり直す', question: '質問',
    passport_name: 'パスポート英文名', date_of_birth: '生年月日', nationality: '国籍', select_nationality: '国籍を選択',
    phone_number: '電話番号', representative_contact: '代表連絡先', messenger_id_placeholder: 'メッセンジャーIDまたは電話番号',
    view_all: 'すべて見る', copyright: '© K-experience. All Rights Reserved.',
    cart: 'カート', reservations: '予約', quantity: '数量', remove: '削除',
    no_items: 'アイテムがありません', go_shopping: 'ショッピングに行く',
    payment_complete: 'お支払い完了！', reservation_confirmed: 'ご予約が確定しました。',
    go_home: 'ホームへ', pay_securely: 'PayPalで安全にお支払い',
    payment_error: 'お支払いエラーが発生しました。', select_all: 'すべて選択',
    selected_items: '選択した商品', add_to_cart: 'カートに追加', proceed_payment: 'お支払いへ',
    per_person: '1名様あたり', no_packages: 'パッケージ準備中です。',
    quiz_opt_kpop: 'K-POP＆アイドル文化', quiz_opt_beauty: 'スキンケア＆ビューティー', quiz_opt_health: '総合健康診断',
    magazine_title: 'K-Experience マガジン', magazine_subtitle: '最新K-トレンドニュース',
    magazine_more: 'もっと見る', magazine_see_all: 'すべて見る', magazine_coming: 'マガジンコンテンツ準備中',
    magazine_coming_desc: 'K-ビューティー、K-ヘルス、K-POPなど最新トレンド情報をお届けします',
    copied: 'コピー済み！', copy_link: 'リンクコピー',
    back_to_list: '一覧へ', related_products: '関連商品',
    related_products_desc: 'この記事に関連するK-Experience商品をチェック',
    back_to_magazine: 'マガジン一覧へ',
    magazine_desc: '韓国のビューティー、健康、文化、エンタメの最新トレンドをお届けします。',
    search_articles: 'マガジン検索...', no_results: '検索結果がありません。',
    coming_soon: '記事がありません。',
    tab_all_magazine: 'すべて',
    rec_health_premium: 'プレミアム総合健康診断', rec_health_basic: 'ベーシック健康診断',
    rec_idol_premium: 'K-IDOLプレミアムメイクオーバー', rec_idol_basic: 'K-IDOLベーシックフォト',
    rec_beauty_premium: 'リジュランヒーラーVIPパッケージ', rec_beauty_basic: 'グラススキンベーシックパッケージ'
  },
  zh: {
    login: '登录', signup: '注册', mypage: '我的页面', logout: '退出',
    admin: '管理员', share: '分享', map: '地图', wishlist: '收藏夹', view_wishlist: '我的收藏',
    book_now: '立即预约', total: '总计', select_date: '选择日期',
    hero_badge: '{count}人正在体验！',
    hero_title: 'K-体验的一切！',
    hero_subtitle: 'Every K You Want Is Here!',
    hero_desc: '健康检查 · 美容手术 · 美容咨询 · K-POP\n多种K-体验一站式平台！',
    popular_categories: '热门类别',
    select_category_desc: '选择您想要的体验',
    popular_products: '热门体验',
    promo_badge: '拼团优惠',
    promo_title: '人越多\n折扣越大！',
    promo_desc: '和朋友一起更划算！\n10人拼团最高享30%折扣！',
    promo_btn: '查看拼团',
    pkg_title: '全套体验套餐',
    pkg_desc_sub: '一次体验所有项目',
    pkg_basic: '全套套餐 - 基础版',
    pkg_prem: '全套套餐 - 尊享版',
    prod_title: '所有K-体验产品',
    bottom_title: '享受专属K-体验',
    bottom_desc: '从健康检查到K-POP、美容！\n您想要的所有韩国体验都在这里。',
    tab_all: '全部', tab_health: '健康检查', tab_idol: 'K-IDOL', tab_beauty: '美容',
    detail: '查看详情', notice: '须知', faq: 'FAQ',
    step1: 'STEP 1', step1_label: '选择日期',
    step2: 'STEP 2', step2_label: '选择选项',
    gender: '性别', male: '男', female: '女',
    payment_type: '支付方式', pay_deposit: '定金（20%）', pay_full: '全额支付',
    res_guide: '预约指南', res_guide_desc: '预约确认后，优惠券将通过邮件发送。',
    back_list: '返回列表', sold_out: '已售罄', select_options: '请选择选项',
    confirm_msg: '预约已确认！',
    hot_group: 'HOT 拼团',
    ongoing_public: '进行中的拼团',
    ongoing_public_desc: '任何人都可以参加！和朋友一起购买额外享10%折扣！',
    no_active: '暂无进行中的拼团！',
    be_leader: '成为第一个团长，享受最高30%折扣！',
    create_group: '创建拼团',
    join_group: '加入拼团',
    current: '当前参与', discount: '折扣率', time_left: '剩余时间',
    progress: '进度', est_total: '预计总额',
    create_pay: '支付定金并创建拼团',
    visit_date_req: '预计到访日期（必填）',
    male_cnt: '男性人数', female_cnt: '女性人数',
    gb_title: '您的最佳K-体验',
    gb_sub: '人越多价越低！',
    gb_desc: '和朋友一起更划算！按人数最高享30%折扣',
    just_purchased: '刚刚购买了！',
    bought: '购买了',
    admin_dash: '仪表盘', admin_cal: '日历', admin_res: '预约管理',
    admin_prod: '商品管理', admin_pkg: '套餐管理', admin_gb: '拼团管理', admin_users: '会员管理',
    revenue: '总销售额', orders: '总预约', users: '会员数', products: '商品数',
    monthly_rev: '月度销售趋势', order_date: '订单日期', status: '状态', manage: '管理',
    status_pending: '待付款', status_confirmed: '已确认', status_completed: '已完成', status_cancelled: '已取消',
    save: '保存', cancel: '取消', delete: '删除', edit: '编辑', memo: '备注',
    no_products: '暂无商品！', no_reviews: '暂无评价。', import_db: '导入默认数据',
    magazine: 'K-杂志', inquiry: '1:1 咨询', coupon: '优惠券', affiliate: '联盟营销',
    coupon_code: '优惠码', apply: '应用', discount_applied: '已应用折扣', invalid_coupon: '无效的优惠券',
    my_inquiries: '我的咨询', new_inquiry: '新建咨询', inquiry_title: '标题', inquiry_content: '内容',
    status_waiting: '等待回复', status_answered: '已回复',
    admin_coupon: '优惠券管理', admin_magazine: '杂志管理', admin_inquiry: '咨询管理', admin_affiliate: '合作伙伴',
    create_coupon: '创建优惠券', create_post: '创建文章',
    coupon_name: '优惠券名称', discount_type: '折扣类型', discount_value: '折扣值', expiry: '有效期',
    percent: '百分比(%)', fixed_amount: '固定金额(韩元)',
    affiliate_code: '合作伙伴代码', partner_name: '合作伙伴名称', clicks: '点击数', sales: '销售数', commission: '佣金率',
    total_rev: '总销售额', comm_amount: '结算金额', link_copy: '复制链接', max_usage: '发行数量', current_usage: '已使用',
    usage_limit_reached: '此优惠券已达到使用上限。',
    start_now: '立即开始', home: '首页', group_buy: '拼团', all_exp: '全部体验',
    no_categories: '类别准备中。', live_rate: '实时汇率',
    quiz_q1: '您最感兴趣的领域？', quiz_q2: '您的预算范围？',
    quiz_basic: '基础体验（基础版）', quiz_premium: '尊享VIP服务',
    ai_concierge: 'AI助手', analyzing: '正在分析您的偏好...', finding: '正在为您寻找完美的K-体验',
    we_recommend: '为您推荐', start_over: '重新开始', question: '问题',
    passport_name: '护照英文名', date_of_birth: '出生日期', nationality: '国籍', select_nationality: '选择国籍',
    phone_number: '手机号码', representative_contact: '代表联系方式', messenger_id_placeholder: '通讯软件ID或手机号',
    view_all: '查看全部', copyright: '© K-experience. All Rights Reserved.',
    cart: '购物车', reservations: '预约', quantity: '数量', remove: '删除',
    no_items: '暂无商品', go_shopping: '去购物',
    payment_complete: '支付完成！', reservation_confirmed: '您的预约已确认。',
    go_home: '返回首页', pay_securely: '使用PayPal安全支付',
    payment_error: '支付出现错误。', select_all: '全选',
    selected_items: '选中的商品', add_to_cart: '加入购物车', proceed_payment: '去支付',
    per_person: '每人', no_packages: '套餐正在准备中。',
    quiz_opt_kpop: 'K-POP & 偶像文化', quiz_opt_beauty: '护肤 & 美容', quiz_opt_health: '综合健康检查',
    magazine_title: 'K-Experience 杂志', magazine_subtitle: '最新K-趋势资讯',
    magazine_more: '查看更多', magazine_see_all: '查看全部', magazine_coming: '杂志内容即将上线',
    magazine_coming_desc: '敬请期待K-美容、K-健康、K-POP等趋势资讯',
    copied: '已复制！', copy_link: '复制链接',
    back_to_list: '返回', related_products: '相关产品',
    related_products_desc: '查看与本文相关的K-Experience产品',
    back_to_magazine: '返回杂志列表',
    magazine_desc: '发现韩国美容、健康、文化、娱乐的最新趋势。',
    search_articles: '搜索杂志...', no_results: '未找到结果。',
    coming_soon: '暂无文章。',
    tab_all_magazine: '全部',
    rec_health_premium: '尊享综合健康检查', rec_health_basic: '基础健康检查',
    rec_idol_premium: 'K-IDOL尊享美妆改造', rec_idol_basic: 'K-IDOL基础写真',
    rec_beauty_premium: '丽珠兰VIP套餐', rec_beauty_basic: '水光肌基础套餐'
  }
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [currency, setCurrency] = useState<Currency>('KRW');
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [realtimeProducts, setRealtimeProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [liveRates, setLiveRates] = useState<{ KRW: number; USD: number; JPY: number; CNY: number }>(RATES);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const savingRef = useRef(false);

  const saveToFirestore = useCallback(async (uid: string, newWishlist: (number | string)[], newCart: CartItem[]) => {
    if (!isFirebaseConfigured || !db || !uid) return;
    savingRef.current = true;
    try {
      await setDoc(doc(db, 'user_data', uid), { wishlist: newWishlist, cart: newCart }, { merge: true });
    } catch (e) { console.warn('Failed to save user data:', e); } finally {
      savingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        try {
          const snap = await getDoc(doc(db!, 'user_data', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.wishlist) setWishlist(data.wishlist);
            if (data.cart) setCart(data.cart);
          }
        } catch (e) { console.warn('Failed to load user data:', e); }
      } else {
        setCurrentUid(null);
        setWishlist([]);
        setCart([]);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUid || !isFirebaseConfigured || !db) return;
    const unsubSnap = onSnapshot(doc(db, 'user_data', currentUid), (snap) => {
      if (savingRef.current) return;
      if (snap.exists()) {
        const data = snap.data();
        setWishlist(data.wishlist || []);
        setCart(data.cart || []);
      }
    }, (err) => console.warn('User data listener error:', err));
    return () => unsubSnap();
  }, [currentUid]);

  useEffect(() => {
    const savedLang = localStorage.getItem('k_exp_lang') as Language;
    const savedCurr = localStorage.getItem('k_exp_curr') as Currency;
    if (savedLang) setLanguage(savedLang);
    if (savedCurr) setCurrency(savedCurr);
  }, []);

  useEffect(() => {
    fetchExchangeRates().then(rates => {
      setLiveRates({ KRW: 1, USD: rates.USD, JPY: rates.JPY, CNY: rates.CNY });
      setRatesLoaded(true);
    });
    const interval = setInterval(() => {
      fetchExchangeRates().then(rates => {
        setLiveRates({ KRW: 1, USD: rates.USD, JPY: rates.JPY, CNY: rates.CNY });
      });
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db!, "products"), orderBy("createdAt", "desc")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        products.sort((a: any, b: any) => (a.order ?? 9999) - (b.order ?? 9999));
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
    const rate = liveRates[currency];
    const converted = krwPrice * rate;
    if (currency === 'KRW') return `₩${Math.round(converted).toLocaleString()}`;
    if (currency === 'JPY') return `¥${Math.round(converted).toLocaleString()}`;
    if (currency === 'CNY') return `¥${converted.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const toggleWishlist = (id: number | string) => {
    const isInWishlist = wishlist.some(item => String(item) === String(id));
    let newWishlist: (number | string)[];
    if (isInWishlist) newWishlist = wishlist.filter(item => String(item) !== String(id));
    else newWishlist = [...wishlist, id];
    setWishlist(newWishlist);
    if (currentUid) saveToFirestore(currentUid, newWishlist, cart);
    window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: isInWishlist ? (language === 'ko' ? '위시리스트에서 삭제됨' : 'Removed from Wishlist') : (language === 'ko' ? '위시리스트에 추가됨' : 'Added to Wishlist'), type: 'info' } 
    }));
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === String(product.id));
      let newCart: CartItem[];
      if (existing) {
        newCart = prev.map(item => item.productId === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        const numericPrice = product.priceVal || (typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g,'')) : product.price) || 0;
        newCart = [...prev, { productId: String(product.id), title: product.title || '', image: product.image || '', price: numericPrice, quantity: 1 }];
      }
      if (currentUid) saveToFirestore(currentUid, wishlist, newCart);
      return newCart;
    });
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: language === 'ko' ? '장바구니에 추가됨' : 'Added to Cart', type: 'success' } 
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.productId !== productId);
      if (currentUid) saveToFirestore(currentUid, wishlist, newCart);
      return newCart;
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => {
      const newCart = prev.map(item => item.productId === productId ? { ...item, quantity } : item);
      if (currentUid) saveToFirestore(currentUid, wishlist, newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (currentUid) saveToFirestore(currentUid, wishlist, []);
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
    <GlobalContext.Provider value={{ language, currency, setGlobalMode, convertPrice, liveRates, ratesLoaded, wishlist, toggleWishlist, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, t, products: displayProducts, packages, categories, getLocalizedValue }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobal must be used within a GlobalProvider");
  return context;
};
