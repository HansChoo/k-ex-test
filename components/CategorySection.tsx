
import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { useGlobal } from '../contexts/GlobalContext';

interface CategorySectionProps {
  onCategoryClick: (category: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ onCategoryClick }) => {
  const { t } = useGlobal();

  // Updated images to be more specific to keywords (K-POP Stage, Hospital CT, Aesthetic Treatment)
  const categories = [
    { 
      id: 'idol', 
      label: 'K-IDOL 체험', 
      labelEn: 'K-IDOL', 
      image: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop', // Stage/Concert vibe
      count: '7개 체험' 
    },
    { 
      id: 'health', 
      label: '건강검진', 
      labelEn: 'Health Check', 
      image: 'https://images.unsplash.com/photo-1579684385136-1571f5484948?q=80&w=1000&auto=format&fit=crop', // MRI/Doctor vibe
      count: '4개 체험' 
    },
    { 
      id: 'beauty', 
      label: '뷰티 시술', 
      labelEn: 'Beauty', 
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop', // Skincare/Spa vibe
      count: '5개 체험' 
    },
  ];

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 py-8 font-sans tracking-tight bg-white">
      <ScrollReveal>
        <div className="mb-4">
            <h2 className="text-[18px] font-bold text-[#111] mb-1">{t('popular_categories')}</h2>
            <p className="text-[12px] text-gray-500">{t('select_category_desc')}</p>
        </div>
        
        {/* Mobile: Grid 3 cols to match reference showing 3 items in a row */}
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => onCategoryClick(cat.id)}
              className="relative rounded-[16px] overflow-hidden aspect-square cursor-pointer group shadow-sm bg-gray-100"
            >
              <img src={cat.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cat.label} />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

              {/* Text Content */}
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <h3 className="text-white font-bold text-[13px] md:text-[16px] leading-tight mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{cat.label}</h3>
                <p className="text-white/70 text-[10px] md:text-[12px] font-medium">{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};
