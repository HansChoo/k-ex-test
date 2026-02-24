
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Heart, Star, Plus } from 'lucide-react';
import { auth } from '../services/firebaseConfig';

const ProductSkeleton = () => (
    <div className="flex flex-col">
        <div className="relative overflow-hidden rounded-[12px] bg-gray-100 aspect-square mb-3 animate-pulse"></div>
        <div className="h-4 bg-gray-100 w-1/3 rounded mb-1 animate-pulse"></div>
        <div className="h-5 bg-gray-100 w-3/4 rounded mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-100 w-1/2 rounded mt-auto animate-pulse"></div>
    </div>
);

interface ProductListProps {
    language: 'ko' | 'en' | 'ja' | 'zh';
    initialCategory?: { id: string, ts: number } | null;
    onViewAll?: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ initialCategory, onViewAll }) => {
  const { t, products, wishlist, toggleWishlist, addToCart, getLocalizedValue, convertPrice, language } = useGlobal();

  const [loading, setLoading] = useState(true);

  useEffect(() => { 
      setLoading(true); 
      setTimeout(() => setLoading(false), 500); 
  }, [products]);

  const handleProductClick = (product: any) => {
      window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
  };

  return (
    <section id="products" className="w-full max-w-[1280px] mx-auto px-4 pb-16 font-sans tracking-tight pt-4">
        <ScrollReveal>
            <div className="mb-6 px-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Star className="fill-yellow-400 text-yellow-400 w-5 h-5"/>
                        <h2 className="text-[20px] font-bold text-[#111]">{t('popular_products')}</h2>
                    </div>
                    {onViewAll && (
                        <button onClick={onViewAll} className="text-[13px] font-bold text-[#0070F0] hover:underline">
                            {language === 'ko' ? '전체보기 →' : 'View All →'}
                        </button>
                    )}
                </div>
            </div>
        </ScrollReveal>

        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                 {[1,2,3,4].map(i => <ProductSkeleton key={i} />)}
             </div>
        ) : products.length === 0 ? (
             <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-xl mx-2">
                 {t('no_products')}
             </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                {products.map((product: any, idx: number) => {
                    const title = getLocalizedValue(product, 'title');
                    const numericPrice = product.priceVal || (typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g,'')) : product.price);

                    return (
                        <ScrollReveal key={idx} delay={idx * 30}>
                            <div className="bg-white rounded-[12px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full cursor-pointer group relative" onClick={() => handleProductClick(product)}>
                                <div className="relative aspect-[3/2] bg-gray-50 overflow-hidden">
                                    <img src={product.image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if (!auth?.currentUser) { window.dispatchEvent(new Event('open-auth-modal')); return; } toggleWishlist(product.id); }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10"
                                    >
                                        <Heart size={12} className={`transition-colors ${wishlist.some(w => String(w) === String(product.id)) ? "fill-red-500 text-red-500" : "text-white"}`} />
                                    </button>
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h3 className="text-[13px] font-bold text-[#111] leading-tight mb-2 line-clamp-2">{title}</h3>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="font-black text-[14px] text-[#111]">{convertPrice(numericPrice)}</span>
                                        <button onClick={(e) => { e.stopPropagation(); if (!auth?.currentUser) { window.dispatchEvent(new Event('open-auth-modal')); return; } addToCart(product); }} className="bg-[#0070F0] text-white rounded-md p-1 hover:bg-blue-600 transition-colors">
                                            <Plus size={14}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    );
                })}
            </div>
        )}
    </section>
  );
};
