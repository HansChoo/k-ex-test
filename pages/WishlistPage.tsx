
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { PRODUCTS, PRODUCTS_EN } from '../constants';
import { Heart, ShoppingBag } from 'lucide-react';

interface WishlistPageProps {
    language: 'ko' | 'en';
}

export const WishlistPage: React.FC<WishlistPageProps> = () => {
    const { wishlist, toggleWishlist, language, convertPrice, t } = useGlobal();
    const isEn = language !== 'ko';
    
    // Flatten products from constants (In real app, fetch from DB)
    const allProducts = isEn ? PRODUCTS_EN : PRODUCTS;
    const wishlistedItems = allProducts.filter(p => wishlist.includes(p.id || 999));

    const handleProductClick = (product: any) => {
        const event = new CustomEvent('navigate-product-detail', { detail: product });
        window.dispatchEvent(event);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-16 min-h-[70vh]">
            <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Heart className="fill-red-500 text-red-500" /> 
                {t('view_wishlist')}
            </h1>

            {wishlistedItems.length === 0 ? (
                <div className="text-center py-32 bg-gray-50 rounded-2xl border border-gray-100">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Your wishlist is empty.</p>
                    <button onClick={() => window.location.href='/'} className="mt-4 text-blue-600 font-bold hover:underline">Go Shopping</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlistedItems.map(product => {
                        const numericPrice = typeof product.price === 'string' 
                            ? Number(product.price.replace(/[^0-9]/g, '')) 
                            : product.price;
                        const priceValue = isNaN(numericPrice) ? 0 : numericPrice;

                        return (
                            <div key={product.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow bg-white relative">
                                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => handleProductClick(product)}>
                                    <img src={product.image} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col justify-center flex-1">
                                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.title}</h3>
                                    <p className="text-gray-500 text-sm mb-3 line-clamp-1">{product.description}</p>
                                    <div className="font-black text-xl text-[#0070F0]">{convertPrice(priceValue)}</div>
                                </div>
                                <button 
                                    onClick={() => toggleWishlist(product.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500"
                                >
                                    <XIcon />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
