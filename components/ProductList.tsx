
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { Heart } from 'lucide-react';

// Enhanced Skeleton Component
const ProductSkeleton = () => (
    <div className="flex flex-col">
        <div className="relative overflow-hidden rounded-[12px] bg-gray-200 aspect-square mb-5 animate-pulse"></div>
        <div className="h-4 bg-gray-200 w-1/3 rounded mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 w-3/4 rounded mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 w-full rounded mb-4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 w-1/2 rounded mt-auto animate-pulse"></div>
    </div>
);

export const ProductList: React.FC<any> = () => {
  const { t, products, wishlist, toggleWishlist } = useGlobal();
  const TABS = [t('tab_all'), t('tab_health'), t('tab_idol'), t('tab_beauty')];
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);

  // Sync tab language when language changes
  useEffect(() => {
      setActiveTab(TABS[0]);
  }, [t]);

  useEffect(() => {
      setLoading(true);
      setTimeout(() => setLoading(false), 800); // Slightly longer for skeleton demo
  }, [products]);

  const filteredProducts = activeTab === t('tab_all') 
    ? products 
    : products.filter(p => {
        if (activeTab === t('tab_health') && p.category.includes("Health") || p.category.includes("건강") || p.category.includes("健康")) return true;
        if (activeTab === t('tab_idol') && p.category.includes("IDOL")) return true;
        if (activeTab === t('tab_beauty') && (p.category.includes("Beauty") || p.category.includes("뷰티") || p.category.includes("美容"))) return true;
        return false;
    });

  const handleProductClick = (product: any) => {
      window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
  };

  const handleWishlistClick = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      toggleWishlist(id);
  };

  return (
    <section id="products" className="w-full max-w-[1280px] mx-auto px-4 pb-32 font-sans tracking-tight">
        <ScrollReveal>
            <div className="text-center mb-16">
                <h2 className="text-[24px] font-extrabold text-[#111] mb-10 tracking-[-0.03em]">{t('prod_title')}</h2>
                <div className="flex justify-center items-center gap-10 text-[15px]">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`transition-all duration-300 relative pb-1 tracking-tight ${activeTab === tab ? 'text-[#111] font-extrabold border-b-2 border-black scale-105' : 'text-[#999] hover:text-[#555] font-semibold hover:scale-105'}`}>{tab}</button>
                    ))}
                </div>
            </div>
        </ScrollReveal>

        {loading ? (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                 {[1,2,3,4,5,6,7,8].map(i => <ProductSkeleton key={i} />)}
             </div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {filteredProducts.map((product: any, idx: number) => (
                    <ScrollReveal key={idx} delay={idx * 50}>
                        <div onClick={() => handleProductClick(product)} className="group flex flex-col cursor-pointer">
                            <div className="relative overflow-hidden rounded-[12px] bg-gray-50 aspect-square mb-5 shadow-sm group-hover:shadow-lg transition-all duration-500">
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                                {(idx === 0 || product.title.includes("Premium") || product.title.includes("프리미엄")) && (
                                    <div className="absolute bottom-0 left-0 bg-[#007BFF] text-white text-[11px] font-bold px-3 py-1.5 rounded-tr-lg z-10 tracking-tight">BEST</div>
                                )}
                                {/* Wishlist Heart Micro-interaction */}
                                <button 
                                    onClick={(e) => handleWishlistClick(e, product.id)}
                                    className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-sm"
                                >
                                    <Heart 
                                        size={18} 
                                        className={`transition-colors duration-300 ${wishlist.includes(product.id) ? "fill-red-500 text-red-500 animate-heart-pop" : "text-gray-400 hover:text-red-400"}`} 
                                    />
                                </button>
                            </div>
                            <div className="flex flex-col text-left">
                                <div className="text-[11px] text-[#999] mb-2 font-semibold tracking-tight">{product.category}</div>
                                <h3 className="text-[16px] text-[#111] font-bold mb-1 line-clamp-1 group-hover:text-[#0070F0] transition-colors tracking-[-0.03em]">{product.title}</h3>
                                <p className="text-[13px] text-[#777] mb-4 line-clamp-1 tracking-tight">{product.description}</p>
                                <div className="mt-auto border-t border-[#eee] w-full pt-4 flex justify-between items-center">
                                    <span className="font-black text-[18px] text-[#111] tracking-[-0.03em]">{product.price}</span>
                                    <span className="text-[11px] font-bold text-[#0070F0] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">View Details →</span>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        )}
    </section>
  );
};
