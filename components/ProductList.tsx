import React, { useState } from 'react';
import { PRODUCTS, PRODUCTS_EN } from '../constants';
import { Heart, ShoppingBag } from 'lucide-react';

const TABS_KO = ["전체 상품", "건강검진", "K-IDOL", "뷰티시술"];
const TABS_EN = ["All", "Health Check", "K-IDOL", "Beauty Treatment"];

interface ProductListProps {
  language: 'ko' | 'en';
}

export const ProductList: React.FC<ProductListProps> = ({ language }) => {
  const isEn = language === 'en';
  const TABS = isEn ? TABS_EN : TABS_KO;
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // Reset tab when language changes if the current active tab is not in the new language list (simple approach: reset to "All" equivalent)
  // Or map the index.
  const currentProducts = isEn ? PRODUCTS_EN : PRODUCTS;

  // Helper to map tab selection to category string in data
  const getCategoryFromTab = (tab: string) => {
      if (tab === "전체 상품" || tab === "All") return "ALL";
      return tab;
  };

  const filteredProducts = getCategoryFromTab(activeTab) === "ALL" 
    ? currentProducts 
    : currentProducts.filter(p => p.category === getCategoryFromTab(activeTab));

  return (
    <section id="products" className="w-full max-w-[1280px] mx-auto px-4 pb-32 font-sans tracking-tight">
        {/* Header */}
        <div className="text-center mb-16">
            <h2 className="text-[24px] font-extrabold text-[#111] mb-10 tracking-[-0.03em]">
                {isEn ? 'All K-Experience Products at a Glance' : '모든 K-체험 상품을 한눈에!'}
            </h2>
            
            {/* Tabs - Simple Text Style */}
            <div className="flex justify-center items-center gap-10 text-[15px]">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`transition-colors relative pb-1 tracking-tight ${
                            activeTab === tab 
                            ? 'text-[#111] font-extrabold border-b-2 border-black' 
                            : 'text-[#999] hover:text-[#555] font-semibold'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map(product => (
                <div key={product.id} className="group flex flex-col cursor-pointer">
                    {/* Image */}
                    <div className="relative overflow-hidden rounded-[12px] bg-gray-50 aspect-square mb-5">
                        <img 
                            src={product.image} 
                            alt={product.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                         
                         {/* Like Badge - Top Left */}
                         <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-white/50 z-10">
                            <span className="text-[10px] font-bold text-gray-500 tracking-tight">LIKE</span>
                         </div>

                        {/* Best Badge (Optional, based on ID for demo) */}
                         {product.id === 27 && (
                            <div className="absolute bottom-0 left-0 bg-[#007BFF] text-white text-[11px] font-bold px-3 py-1.5 rounded-tr-lg z-10 tracking-tight">
                                BEST
                            </div>
                         )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col text-left">
                         {/* Category Label */}
                         <div className="text-[11px] text-[#999] mb-2 font-semibold tracking-tight">
                            {product.category}
                         </div>
                         
                        <h3 className="text-[16px] text-[#111] font-bold mb-1 line-clamp-1 group-hover:underline tracking-[-0.03em]">
                            {product.title}
                        </h3>
                        <p className="text-[13px] text-[#777] mb-4 line-clamp-1 tracking-tight">
                            {product.description}
                        </p>
                        <div className="mt-auto border-t border-[#eee] w-full pt-4">
                             <span className="font-black text-[18px] text-[#111] tracking-[-0.03em]">{product.price}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
};