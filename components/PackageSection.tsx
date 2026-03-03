
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
                                className="flex-shrink-0 w-[280px] md:w-[320px] bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-lg snap-center flex flex-col"
                            >
                                <div className="relative w-full aspect-[1.5/1] bg-gray-100 overflow-hidden">
                                    {image ? (
                                        <img src={image} alt={title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🎁</div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-black text-[18px] text-[#111] mb-2 leading-tight break-keep">{title}</h3>
                                    {desc && (
                                        <p className="text-[13px] text-gray-500 font-medium mb-4 min-h-[36px] break-keep line-clamp-2">{desc}</p>
                                    )}

                                    <div className="border-t border-gray-100 pt-4 mb-4 mt-auto">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-bold text-gray-400">
                                                {t('per_person')}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-black text-xl text-[#111]">{hasOptions ? '~' : ''}{convertPrice(price)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => onBookClick(product.id)} className="w-full py-3 bg-[#111] text-white font-bold rounded-lg hover:bg-gray-800 transition-all text-sm shadow-md flex items-center justify-center gap-1">
                                        {t('detail')} <ChevronRight size={14} />
                                    </button>
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
