
import React from 'react';
import { useGlobal } from '../contexts/GlobalContext';

export const BottomHero: React.FC<any> = () => {
  const { t } = useGlobal();

  return (
    <section className="w-full bg-[#F0F8FF] py-24 font-sans tracking-tight">
        <div className="max-w-[1200px] mx-auto px-4 text-center">
             <div className="inline-flex items-center gap-1.5 bg-white px-5 py-2 rounded-full border border-blue-100 text-[#007BFF] font-bold text-[14px] mb-8 shadow-sm">
                <span>✔</span>
                <span className="tracking-tight">Start Now!</span>
             </div>
             <h2 className="text-[32px] md:text-[42px] font-black text-[#111] leading-tight mb-4 tracking-[-0.04em] keep-all">{t('bottom_title')}</h2>
             <p className="text-[16px] text-[#666] mb-12 font-medium leading-relaxed tracking-[-0.02em] keep-all whitespace-pre-line">{t('bottom_desc')}</p>
             <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <button className="min-w-[180px] px-8 py-4 bg-[#007BFF] text-white font-bold rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all text-[16px] tracking-[-0.02em]">{t('book_now')}</button>
             </div>
        </div>
    </section>
  );
};
