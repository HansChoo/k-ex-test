
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { Heart, Star, Plus, ArrowLeft, Check, ChevronRight } from 'lucide-react';

interface AllProductsPageProps {
    language: 'ko' | 'en' | 'ja' | 'zh';
    initialCategoryLabel?: string;
}

export const AllProductsPage: React.FC<AllProductsPageProps> = ({ initialCategoryLabel }) => {
  const { t, products, packages, wishlist, toggleWishlist, getLocalizedValue, convertPrice, categories, language } = useGlobal();
  const isEn = language !== 'ko';

  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
      if (initialCategoryLabel && categories.length > 0) {
          const matched = categories.find(c => c.label === initialCategoryLabel || c.labelEn === initialCategoryLabel);
          if (matched) setActiveFilter(matched.id);
      }
  }, [initialCategoryLabel, categories]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
      setLoading(true); 
      setTimeout(() => setLoading(false), 400); 
  }, [activeFilter, products]);

  const isPackageCategory = (() => {
      if (activeFilter === 'all') return false;
      const activeCat = categories.find(c => c.id === activeFilter);
      if (!activeCat) return false;
      const label = (activeCat.label || '').toLowerCase();
      return label.includes('올인원') || label.includes('패키지');
  })();

  const filteredProducts = activeFilter === 'all' 
    ? products
    : isPackageCategory
    ? []
    : products.filter(p => {
        const activeCat = categories.find(c => c.id === activeFilter);
        if (!activeCat) return false;
        const productCat = (p.category || '').trim().toLowerCase();
        const categoryLabel = (activeCat.label || '').trim().toLowerCase();
        if (productCat === categoryLabel) return true;
        let keywords = activeCat.keywords;
        if (!keywords || keywords.length === 0) {
            keywords = [activeCat.label];
        }
        return keywords.some((k: string) => productCat.includes(k.toLowerCase()));
    });

  const handleProductClick = (product: any) => {
      window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
  };

  const handleBack = () => {
      window.location.hash = '';
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 pb-32 font-sans tracking-tight pt-4">
        <div className="mb-6 px-2">
            <button onClick={handleBack} className="flex items-center gap-1 text-gray-500 hover:text-black text-sm font-bold mb-4">
                <ArrowLeft size={16}/> {language === 'ko' ? '메인으로' : 'Back'}
            </button>
            <div className="flex items-center gap-1 mb-4">
                <Star className="fill-yellow-400 text-yellow-400 w-5 h-5"/>
                <h2 className="text-[22px] font-bold text-[#111]">{language === 'ko' ? '전체 상품' : 'All Products'}</h2>
                <span className="text-sm text-gray-400 ml-2">{isPackageCategory ? packages.length : filteredProducts.length}{language === 'ko' ? '개' : ' items'}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                        activeFilter === 'all' 
                        ? 'bg-[#0070F0] text-white border-[#0070F0]' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                >
                    {t('tab_all')}
                </button>
                {categories.map((cat) => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                            activeFilter === cat.id 
                            ? 'bg-[#0070F0] text-white border-[#0070F0]' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {isEn ? cat.labelEn : cat.label}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                 {[1,2,3,4].map(i => (
                     <div key={i} className="flex flex-col">
                         <div className="relative overflow-hidden rounded-[12px] bg-gray-100 aspect-square mb-3 animate-pulse"></div>
                         <div className="h-4 bg-gray-100 w-1/3 rounded mb-1 animate-pulse"></div>
                         <div className="h-5 bg-gray-100 w-3/4 rounded mb-2 animate-pulse"></div>
                         <div className="h-6 bg-gray-100 w-1/2 rounded mt-auto animate-pulse"></div>
                     </div>
                 ))}
             </div>
        ) : isPackageCategory ? (
            packages.length === 0 ? (
                <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-xl mx-2">
                    {isEn ? 'No packages available.' : '등록된 패키지가 없습니다.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
                    {packages.map((pkg: any, idx: number) => {
                        const themeColors: any = {
                            mint: { bg: 'bg-[#00BFAE]', badge: 'BASIC', icon: '💪' },
                            yellow: { bg: 'bg-[#FFC200]', badge: 'PREMIUM', icon: '🎤' },
                            orange: { bg: 'bg-[#FF8C00]', badge: 'PREMIUM', icon: '✨' }
                        };
                        const theme = themeColors[pkg.theme] || themeColors.mint;
                        return (
                            <div key={pkg.id || idx} className="bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-lg flex flex-col cursor-pointer hover:shadow-xl transition-all" onClick={() => handleProductClick(pkg)}>
                                <div className={`h-[140px] ${theme.bg} relative flex flex-col items-center justify-center text-center p-4`}>
                                    <span className="absolute top-4 left-4 bg-white/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">{theme.badge}</span>
                                    <div className="text-4xl mb-2 drop-shadow-sm">{theme.icon}</div>
                                    <h3 className="text-white font-black text-[20px] leading-none drop-shadow-md px-2 break-keep">
                                        {isEn ? (pkg.title_en || pkg.title) : pkg.title}
                                    </h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-[13px] text-gray-500 font-medium mb-4 text-center min-h-[40px] flex items-center justify-center break-keep">
                                        {pkg.description}
                                    </p>
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {pkg.items?.map((item: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-[13px] text-[#333] font-medium">
                                                <div className="w-4 h-4 rounded-full bg-[#00C7AE] flex items-center justify-center text-white shrink-0 mt-0.5">
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                <span className="leading-tight">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-t border-gray-100 pt-4 mb-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-bold text-gray-400">{isEn ? 'Per Person' : '1인 기준'}</span>
                                            <span className="font-black text-xl text-[#111]">{convertPrice(pkg.price)}</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-[#111] text-white font-bold rounded-lg hover:bg-gray-800 transition-all text-sm shadow-md flex items-center justify-center gap-1">
                                        {t('detail')} <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
        ) : filteredProducts.length === 0 ? (
             <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-xl mx-2">
                 {t('no_products')}
             </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                {filteredProducts.map((product: any, idx: number) => {
                    const title = getLocalizedValue(product, 'title');
                    const numericPrice = product.priceVal || (typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g,'')) : product.price);

                    return (
                        <div key={idx} className="bg-white rounded-[16px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full cursor-pointer group relative" onClick={() => handleProductClick(product)}>
                            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                <img src={product.image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10"
                                >
                                    <Heart size={14} className={`transition-colors ${wishlist.some(w => String(w) === String(product.id)) ? "fill-red-500 text-red-500" : "text-white"}`} />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                                    {product.category?.includes('건강') ? '🏥' : product.category?.includes('뷰티') ? '💄' : '🎤'} 
                                    <span>{product.category}</span>
                                </div>
                                <h3 className="text-[14px] font-bold text-[#111] leading-tight mb-4 line-clamp-2">{title}</h3>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-black text-[16px] text-[#111]">{convertPrice(numericPrice)}</span>
                                    <div className="bg-[#0070F0] text-white rounded-lg p-1.5 hover:bg-blue-600 transition-colors">
                                        <Plus size={16}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </section>
  );
};
