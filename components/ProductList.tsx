
import React, { useState, useEffect } from 'react';
import { PRODUCTS, PRODUCTS_EN } from '../constants';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useNavigate } from 'react-router-dom'; // Conceptually used, but we use props in App.tsx pattern

// Since we are not using react-router-dom in this simple setup yet, we emit event or use a global handler.
// Assuming App.tsx passes an onProductClick prop. But currently it does not.
// We will dispatch a custom event or you can update App.tsx to pass a setter. 
// For now, let's use a Custom Event to communicate with App.tsx or assume App.tsx will be updated to handle this.
// Better yet, let's make App.tsx pass a prop. But I only see props in the XML for App.tsx later.
// I will dispatch a custom window event for simplicity in this file-based update without prop drilling refactor.

const TABS_KO = ["전체 상품", "건강검진", "K-IDOL", "뷰티시술"];
const TABS_EN = ["All", "Health Check", "K-IDOL", "Beauty Treatment"];

interface ProductListProps {
  language: 'ko' | 'en';
}

export const ProductList: React.FC<ProductListProps> = ({ language }) => {
  const isEn = language === 'en';
  const TABS = isEn ? TABS_EN : TABS_KO;
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
        try {
            // Sort by 'order' field ascending
            const q = query(collection(db, "products"), orderBy("order", "asc"));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDbProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };
    fetchProducts();
  }, []);

  const currentProducts = dbProducts.length > 0 ? dbProducts : (isEn ? PRODUCTS_EN : PRODUCTS);

  const getCategoryFromTab = (tab: string) => {
      if (tab === "전체 상품" || tab === "All") return "ALL";
      if (tab === "Health Check") return "건강검진"; 
      if (tab === "Beauty Treatment") return "뷰티시술";
      return tab; 
  };

  const selectedCategory = getCategoryFromTab(activeTab);

  const filteredProducts = selectedCategory === "ALL" 
    ? currentProducts 
    : currentProducts.filter(p => {
        if (p.category === selectedCategory) return true;
        if (selectedCategory === "건강검진" && p.category === "Health Check") return true;
        if (selectedCategory === "뷰티시술" && p.category === "Beauty Treatment") return true;
        return false;
    });

  const handleProductClick = (product: any) => {
      // Dispatch event for App.tsx to catch
      const event = new CustomEvent('navigate-product-detail', { detail: product });
      window.dispatchEvent(event);
  };

  return (
    <section id="products" className="w-full max-w-[1280px] mx-auto px-4 pb-32 font-sans tracking-tight">
        <div className="text-center mb-16">
            <h2 className="text-[24px] font-extrabold text-[#111] mb-10 tracking-[-0.03em]">
                {isEn ? 'All K-Experience Products at a Glance' : '모든 K-체험 상품을 한눈에!'}
            </h2>
            <div className="flex justify-center items-center gap-10 text-[15px]">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`transition-colors relative pb-1 tracking-tight ${
                            activeTab === tab ? 'text-[#111] font-extrabold border-b-2 border-black' : 'text-[#999] hover:text-[#555] font-semibold'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
             <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                {filteredProducts.map((product, idx) => (
                    <div key={product.id || idx} onClick={() => handleProductClick(product)} className="group flex flex-col cursor-pointer">
                        <div className="relative overflow-hidden rounded-[12px] bg-gray-50 aspect-square mb-5">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-white/50 z-10">
                                <span className="text-[10px] font-bold text-gray-500 tracking-tight">LIKE</span>
                            </div>
                            {(idx === 0 || product.title.includes("프리미엄") || product.title.includes("Premium")) && (
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
