
import React, { useRef } from 'react';
import { useGlobal } from '../contexts/GlobalContext';
import { ScrollReveal } from './ScrollReveal';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface PackageSectionProps {
  language: 'ko' | 'en' | 'ja' | 'zh';
  onBookClick: (productId: string) => void;
  onViewAll?: () => void;
}

export const PackageSection: React.FC<PackageSectionProps> = ({ onBookClick, language, onViewAll }) => {
  const { convertPrice, t, products, getLocalizedValue, categories, currency, ratesLoaded } = useGlobal();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const packageProducts = products.filter(p => {
    const cat = (p.category || '').toLowerCase();
    return cat.includes('올인원') || cat.includes('패키지');
  });
  
  const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
          const scrollAmount = 300;
          scrollContainerRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto px-6 pb-6 pt-10 font-sans tracking-tight relative">
        <ScrollReveal>
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[18px] mb-1">🎁 <strong>{t('pkg_title')}</strong></div>
                        <p className="text-[13px] text-gray-500">{t('pkg_desc_sub')}</p>
                    </div>
                    {onViewAll && (
                        <button onClick={onViewAll} className="text-[13px] font-bold text-[#0070F0] hover:underline shrink-0">
                            {t('view_all')} →
                        </button>
                    )}
                </div>
            </div>
        </ScrollReveal>

        {packageProducts.length === 0 ? (
            <div className="w-full py-16 bg-gray-50 rounded-[16px] flex items-center justify-center text-gray-400 text-sm">
                {t('no_packages')}
            </div>
        ) : (
            <>
                {packageProducts.length > 2 && (
                    <>
                        <button 
                            onClick={() => scroll('left')} 
                            className="absolute left-2 top-[55%] z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => scroll('right')} 
                            className="absolute right-2 top-[55%] z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 pb-8 -mx-6 px-6 no-scrollbar snap-x snap-mandatory relative scroll-smooth"
                >
                    {packageProducts.map((product, idx) => {
                        const title = getLocalizedValue(product, 'title');
                        const desc = getLocalizedValue(product, 'description');
                        const image = getLocalizedValue(product, 'image') || product.image;
                        const price = product.price || product.priceVal || 0;
                        const hasOptions = (product.options || []).some((o: any) => o.name?.trim() && o.price > 0);
                        
                        return (
                            <div 
                                key={product.id || idx}
                                className="flex-shrink-0 w-[160px] md:w-[280px] bg-white rounded-[16px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all snap-center flex flex-col cursor-pointer group"
                                onClick={() => onBookClick(product.id)}
                            >
                                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                                    {image ? (
                                        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🎁</div>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                                        🎁 <span>{product.category}</span>
                                    </div>
                                    <h3 className="text-[14px] font-bold text-[#111] leading-tight mb-4 line-clamp-2">{title}</h3>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="font-black text-[16px] text-[#111]">{hasOptions ? <span className="text-[10px] font-bold text-gray-400 mr-0.5">~</span> : ''}{convertPrice(price)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        )}
    </section>
  );
};
