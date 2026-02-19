
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { Heart, ShoppingBag, X } from 'lucide-react';

interface WishlistPageProps {
    language: 'ko' | 'en' | 'ja' | 'zh';
}

export const WishlistPage: React.FC<WishlistPageProps> = () => {
    const { wishlist, toggleWishlist, language, convertPrice, t, products, getLocalizedValue } = useGlobal();
    const isKo = language === 'ko';

    const wishlistedItems = products.filter(p => 
        wishlist.some(wId => String(wId) === String(p.id))
    );

    const handleProductClick = (product: any) => {
        window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
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
                    <p className="text-gray-500 font-medium">
                        {isKo ? '위시리스트가 비어 있습니다.' : 'Your wishlist is empty.'}
                    </p>
                    <button 
                        onClick={() => { window.location.hash = ''; window.location.reload(); }}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                    >
                        {isKo ? '쇼핑하러 가기' : 'Go Shopping'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlistedItems.map(product => {
                        const title = getLocalizedValue(product, 'title') || product.title || product.name || '';
                        const description = getLocalizedValue(product, 'description') || product.description || '';
                        const numericPrice = typeof product.price === 'string' 
                            ? Number(product.price.replace(/[^0-9]/g, '')) 
                            : (product.price || 0);
                        const priceValue = isNaN(numericPrice) ? 0 : numericPrice;
                        const imageUrl = product.image || product.images?.[0] || '';

                        return (
                            <div key={product.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700 relative">
                                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => handleProductClick(product)}>
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ShoppingBag size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                    <h3 className="font-bold text-lg mb-1 line-clamp-1 dark:text-white">{title}</h3>
                                    <p className="text-gray-500 text-sm mb-3 line-clamp-1">{description}</p>
                                    <div className="font-black text-xl text-[#0070F0]">{convertPrice(priceValue)}</div>
                                </div>
                                <button 
                                    onClick={() => toggleWishlist(product.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    title={isKo ? '삭제' : 'Remove'}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
