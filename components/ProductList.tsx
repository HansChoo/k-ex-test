
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../contexts/GlobalContext';

// Skeleton Component
const ProductSkeleton = () => (
    <div className="flex flex-col animate-pulse">
        <div className="relative overflow-hidden rounded-[12px] bg-gray-200 aspect-square mb-5"></div>
        <div className="h-3 bg-gray-200 w-1/3 rounded mb-2"></div>
        <div className="h-5 bg-gray-200 w-3/4 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 w-full rounded mb-4"></div>
        <div className="h-6 bg-gray-200 w-1/2 rounded mt-auto"></div>
    </div>
);

export const ProductList: React.FC<any> = () => {
  const { t, products } = useGlobal();
  const TABS = [t('tab_all'), t('tab_health'), t('tab_idol'), t('tab_beauty')];
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);

  // Sync tab language when language changes
  useEffect(() => {
      setActiveTab(TABS[0]);
  }, [t]);

  useEffect(() => {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
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

  return (
    <section id="products" className="w-full max-w-[1280px] mx-auto px-4 pb-32 font-sans tracking-tight">
        <div className="text-center mb-16">
            <h2 className="text-[24px] font-extrabold text-[#111] mb-10 tracking-[-0.03em]">{t('prod_title')}</h2>
            <div className="flex justify-center items-center gap-10 text-[15px]">
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`transition-colors relative pb-1 tracking-tight ${activeTab === tab ? 'text-[#111] font-extrabold border-b-2 border-black' : 'text-[#999] hover:text-[#555] font-semibold'}`}>{tab}</button>
                ))}
            </div>
        </div>

        {loading ? (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                 {[1,2,3,4,5,6,7,8].map(i => <ProductSkeleton key={i} />)}
             </div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {filteredProducts.map((product: any, idx: number) => (
                    <div key={idx} onClick={() => handleProductClick(product)} className="group flex flex-col cursor-pointer">
                        <div className="relative overflow-hidden rounded-[12px] bg-gray-50 aspect-square mb-5">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                            {(idx === 0 || product.title.includes("Premium") || product.title.includes("프리미엄")) && (
                                <div className="absolute bottom-0 left-0 bg-[#007BFF] text-white text-[11px] font-bold px-3 py-1.5 rounded-tr-lg z-10 tracking-tight">BEST</div>
                            )}
                        </div>
                        <div className="flex flex-col text-left">
                            <div className="text-[11px] text-[#999] mb-2 font-semibold tracking-tight">{product.category}</div>
                            <h3 className="text-[16px] text-[#111] font-bold mb-1 line-clamp-1 group-hover:underline tracking-[-0.03em]">{product.title}</h3>
                            <p className="text-[13px] text-[#777] mb-4 line-clamp-1 tracking-tight">{product.description}</p>
                            <div className="mt-auto border-t border-[#eee] w-full pt-4">
                                <span className="font-black text-[18px] text-[#111] tracking-[-0.03em]">{product.price}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </section>
  );
};
