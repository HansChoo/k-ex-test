
import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useGlobal } from '../contexts/GlobalContext';

interface CategorySectionProps {
  onCategoryClick: (category: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ onCategoryClick }) => {
  const { t, categories, language } = useGlobal();

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 py-8 font-sans tracking-tight bg-white">
      <ScrollReveal>
        <div className="mb-4">
            <h2 className="text-[18px] font-bold text-[#111] mb-1">{t('popular_categories')}</h2>
            <p className="text-[12px] text-gray-500">{t('select_category_desc')}</p>
        </div>
        
        {categories.length === 0 ? (
            <div className="w-full py-16 bg-gray-50 rounded-[16px] flex items-center justify-center text-gray-400 text-sm">
                카테고리가 준비 중입니다.
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
                <div 
                key={cat.id} 
                onClick={() => onCategoryClick(cat.id)}
                className="relative rounded-[16px] overflow-hidden aspect-[4/5] md:aspect-square cursor-pointer group shadow-sm bg-gray-100"
                >
                <img src={cat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cat.label} />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

                {/* Text Content */}
                <div className="absolute bottom-4 left-4 right-4 text-left">
                    <h3 className="text-white font-bold text-[14px] md:text-[16px] leading-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {language === 'ko' ? cat.label : cat.labelEn}
                    </h3>
                </div>
                </div>
            ))}
            </div>
        )}
      </ScrollReveal>
    </section>
  );
};
