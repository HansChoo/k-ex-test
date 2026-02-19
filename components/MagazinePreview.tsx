import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useGlobal } from '../contexts/GlobalContext';
import { BookOpen, Calendar, ArrowRight, ChevronRight } from 'lucide-react';

export const MagazinePreview: React.FC = () => {
  const { language } = useGlobal();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, "cms_magazine"), orderBy("createdAt", "desc"), limit(4));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getExcerpt = (post: any) => {
    if (post.excerpt) return post.excerpt;
    if (post.content) {
      const text = post.content.replace(/<[^>]+>/g, '');
      return text.substring(0, 80) + (text.length > 80 ? '...' : '');
    }
    return '';
  };

  const handleViewAll = () => {
    window.dispatchEvent(new CustomEvent('navigate-magazine'));
  };

  if (loading) {
    return (
      <section className="w-full max-w-[1280px] mx-auto px-4 py-16 font-sans">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <div className="h-5 bg-gray-200 w-40 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 w-24 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-5 overflow-hidden px-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[280px] md:min-w-[300px] animate-pulse">
              <div className="bg-gray-200 h-44 rounded-2xl mb-3"></div>
              <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 py-16 font-sans tracking-tight">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-[#0070F0]" />
            <h2 className="text-[20px] font-black text-[#111] dark:text-white">
              {language === 'ko' ? 'K-Experience 매거진' : 'Latest Stories'}
            </h2>
          </div>
          <p className="text-sm text-gray-400 font-medium">
            {language === 'ko' ? '최신 K-트렌드 소식' : 'Discover K-trends & tips'}
          </p>
        </div>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-[#0070F0] font-bold text-sm hover:underline transition-all group"
        >
          {language === 'ko' ? '더보기' : 'View All'}
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-[#0070F0]" />
          </div>
          <p className="text-gray-500 text-sm font-medium text-center mb-1">
            {language === 'ko' ? '매거진 콘텐츠가 준비 중입니다' : 'Magazine content coming soon'}
          </p>
          <p className="text-gray-400 text-xs text-center">
            {language === 'ko' ? 'K-뷰티, K-헬스, K-POP 등 다양한 트렌드 소식을 만나보세요' : 'Stay tuned for K-Beauty, K-Health, K-POP trends & more'}
          </p>
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-2 pb-4 snap-x snap-mandatory">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              onClick={handleViewAll}
              className="min-w-[280px] md:min-w-[300px] max-w-[300px] flex-shrink-0 cursor-pointer group snap-start"
            >
              <div className="relative h-44 rounded-2xl overflow-hidden bg-gray-100 mb-3">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <BookOpen size={36} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#111]">
                  {post.category || 'K-Trend'}
                </div>
              </div>
              <h3 className="text-[15px] font-bold text-[#111] dark:text-white leading-snug mb-1.5 line-clamp-2 group-hover:text-[#0070F0] transition-colors">
                {post.title}
              </h3>
              <p className="text-[13px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                {getExcerpt(post)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Calendar size={11} />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          ))}

          <div
            onClick={handleViewAll}
            className="min-w-[140px] flex-shrink-0 flex items-center justify-center cursor-pointer group snap-start"
          >
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[#0070F0] transition-colors">
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 group-hover:border-[#0070F0] flex items-center justify-center transition-colors">
                <ArrowRight size={20} />
              </div>
              <span className="text-xs font-bold">{language === 'ko' ? '전체 보기' : 'See All'}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
