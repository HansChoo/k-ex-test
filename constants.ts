
export const NAV_LINKS = {
  ko: [
    { name: '홈', href: '#' },
    { name: 'K-체험상품', href: '#products' },
    { name: '공동구매', href: '#promo' },
  ],
  en: [
    { name: 'HOME', href: '#' },
    { name: 'All Products', href: '#products' },
    { name: 'Group Buying', href: '#promo' },
  ],
  ja: [
    { name: 'ホーム', href: '#' },
    { name: 'K-体験商品', href: '#products' },
    { name: '共同購入', href: '#promo' },
  ],
  zh: [
    { name: '首页', href: '#' },
    { name: 'K-体验产品', href: '#products' },
    { name: '团购', href: '#promo' },
  ]
};

// Major Countries for K-Tourism Target
export const COUNTRY_CODES = [
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷', lang: 'ko', curr: 'KRW' },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', lang: 'en', curr: 'USD' },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', lang: 'ja', curr: 'JPY' },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', lang: 'zh', curr: 'CNY' },
];

// NOTE: All-in-One Packages are now fully dynamic from Firestore (cms_packages).
// Hardcoded data removed to prevent sync issues.

const BASE_PRODUCTS = [
  {
    id: 27,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/ff52ffbd8b074f22f92879af29f72de4.png",
    priceVal: 970000
  },
  {
    id: 28,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/38201343997edc3482db1092fb6f6d44.png",
    priceVal: 3400000
  },
  {
    id: 29,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/a8f90410496fac4a5e78aaec1cb64a5b.png",
    priceVal: 600000
  },
  {
    id: 30,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260111/176e7cb73b995fa1d8d89bf5c8b3ceb6.png",
    priceVal: 750000
  },
  {
    id: 31,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260102/b256e665469c1296c0406272c769f1a6.png",
    priceVal: 1500000
  },
  {
    id: 32,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260102/29ec7932cdf886e965a3fac3d754e3e8.png",
    priceVal: 2500000
  },
  {
    id: 33,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260102/604139af42e1013d2910d6cfa4638d73.png",
    priceVal: 4200000
  },
  {
    id: 34,
    image: "https://ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/product/medium/20260102/2d2a64bd59c3295295657f610df8bc40.png",
    priceVal: 5500000
  }
];

export const PRODUCTS_DATA = {
  ko: BASE_PRODUCTS.map((p, i) => ({
    ...p,
    title: ["베이직 건강검진", "프리미엄 건강검진", "K-IDOL 베이직", "K-IDOL 프리미엄", "GLASS SKIN 패키지", "V-LINE LIFT 패키지", "REJURAN BOOST 패키지", "K-GLOW VIP 패키지"][i],
    description: ["성인(20-40세)을 위한 기본 건강검진", "40세 이상 성인을 위한 종합 정밀 검진", "아이돌 프로필 사진 + 뮤직비디오 촬영", "K-뷰티 체험 + 뮤직비디오 촬영", "피부관리 + 주름 보톡스 + 여신주사", "피부관리 + 주름 보톡스 + 덴서티 + 여신주사", "프리미엄 피부관리 + 주름 보톡스 + 텐쎄라&덴서티", "프리미엄 피부관리 + 주름 보톡스 + 텐쎄라&덴서티 (VIP)"][i],
    category: i < 2 ? "건강검진" : i < 4 ? "K-IDOL" : "뷰티시술",
    price: `${p.priceVal.toLocaleString()}원`
  })),
  en: BASE_PRODUCTS.map((p, i) => ({
    ...p,
    title: ["Basic Health Checkup", "Premium Health Checkup", "K-IDOL Basic", "K-IDOL Premium", "GLASS SKIN Package", "V-LINE LIFT Package", "REJURAN BOOST Package", "K-GLOW VIP Package"][i],
    description: ["Basic health checkup for adults (20-40)", "Comprehensive precision check-up (40+)", "Idol experience (Photo + MV)", "K-Beauty Experience + MV Filming", "Skin care + Botox + Goddess injection", "Skin care + Botox + Density + Goddess injection", "Premium skin care + Botox + 10Thera/Density", "Premium skin care + Botox + 10Thera/Density (VIP)"][i],
    category: i < 2 ? "Health Check" : i < 4 ? "K-IDOL" : "Beauty Treatment",
    price: `$${(p.priceVal * 0.00075).toFixed(2)}`
  })),
  ja: BASE_PRODUCTS.map((p, i) => ({
    ...p,
    title: ["ベーシック健康診断", "プレミアム健康診断", "K-IDOL ベーシック", "K-IDOL プレミアム", "GLASS SKIN パッケージ", "V-LINE LIFT パッケージ", "REJURAN BOOST パッケージ", "K-GLOW VIP パッケージ"][i],
    description: ["成人(20-40歳)のための基本健康診断", "40歳以上の成人のための総合精密検査", "アイドルプロフィール写真 + MV撮影", "K-Beauty体験 + MV撮影", "スキンケア + しわボトックス + 女神注射", "スキンケア + ボトックス + デンシティ + 女神注射", "プレミアムスキンケア + ボトックス + テンセラ & デンシティ", "プレミアムスキンケア (VIP)"][i],
    category: i < 2 ? "健康診断" : i < 4 ? "K-IDOL" : "美容施術",
    price: `¥${(p.priceVal * 0.11).toLocaleString()}`
  })),
  zh: BASE_PRODUCTS.map((p, i) => ({
    ...p,
    title: ["基础健康检查", "高级健康检查", "K-IDOL 基础", "K-IDOL 高级", "GLASS SKIN 套餐", "V-LINE LIFT 套餐", "REJURAN BOOST 套餐", "K-GLOW VIP 套餐"][i],
    description: ["成人(20-40岁) 基本健康检查", "40岁以上成人综合精密检查", "偶像个人简介照片 + MV拍摄", "K-Beauty体验 + MV拍摄", "皮肤护理 + 皱纹肉毒杆菌 + 女神注射", "皮肤护理 + 肉毒杆菌 + 密度 + 女神注射", "高级皮肤护理 + 肉毒杆菌 + 10Thera & 密度", "高级皮肤护理 (VIP)"][i],
    category: i < 2 ? "健康检查" : i < 4 ? "K-IDOL" : "美容手术",
    price: `¥${(p.priceVal * 0.0054).toLocaleString()}`
  }))
};

export const PRODUCTS = PRODUCTS_DATA.ko;
export const PRODUCTS_EN = PRODUCTS_DATA.en;

export const COMPANY_INFO = {
  name: "(주)삼송이앤엠홀딩스",
  president: "이호선",
  address: "06043 서울 강남구 학동로3길 27 메리디엠타워 101",
  phone: "070-7504-1415",
  email: "hema@tpenm.com",
  regNo: "114-87-06304",
  telecomNo: "제2020-서울강남-01762"
};

export const COMPANY_INFO_EN = {
  name: "SAMSONG E&M Holdings Co., Ltd",
  president: "Lee Ho Seon",
  address: "06043 101, Meridem Tower, 27, Hakdong-ro 3-gil, Gangnam-gu, Seoul, Republic of Korea",
  phone: "070-7504-1415",
  email: "hema@tpenm.com",
  regNo: "114-87-06304",
  telecomNo: "2020-Seoul Gangnam-01762"
};

// --- Mock Reviews Generator ---
const REVIEW_TEMPLATES = [
    { text: "Absolutely amazing experience! The staff was so kind.", lang: "en" },
    { text: "정말 친절하고 좋았습니다. 부모님도 만족하셨어요.", lang: "ko" },
    { text: "とても親切でよかったです。また来たいです。", lang: "ja" },
    { text: "服务非常好，翻译也很专业。推荐！", lang: "zh" },
    { text: "Professional and clean. Worth every penny.", lang: "en" },
    { text: "사진이 너무 잘 나왔어요! 인생샷 건졌습니다.", lang: "ko" },
    { text: "The K-pop makeover was a dream come true.", lang: "en" },
    { text: "肌がツルツルになりました！", lang: "ja" },
    { text: "I was nervous about the health check, but they made it easy.", lang: "en" },
    { text: "太棒了，下次还会再来。", lang: "zh" }
];

const NAMES = ["Sarah J.", "Michael", "Emma", "Minji Kim", "Yuki T.", "Wei Zhang", "Jessica", "David Lee", "Sakura", "Li Wei", "Tom H.", "Chloe", "Hana", "Junho", "Sophie"];
const FLAGS = ["🇺🇸", "🇬🇧", "🇰🇷", "🇯🇵", "🇨🇳", "🇨🇦", "🇦🇺", "🇫🇷", "🇩🇪", "🇸🇬"];

export const generateMockReviews = (count: number = 50) => {
    return Array.from({ length: count }, (_, i) => {
        const template = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
        const rating = Math.random() > 0.8 ? 4 : 5;
        // Generate a random date within last 6 months
        const date = new Date(Date.now() - Math.floor(Math.random() * 15552000000)).toISOString().split('T')[0];
        
        return {
            id: i,
            user: `${name} ${flag}`,
            rating: rating,
            date: date,
            text: template.text,
            lang: template.lang
        };
    });
};
