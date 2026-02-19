import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebaseConfig';
import { useGlobal } from '../contexts/GlobalContext';
import { updateMetaTags } from '../services/seoService';
import { BookOpen, Calendar, User, ArrowLeft, Search, Clock, Share2, Link2, ChevronRight, X } from 'lucide-react';
import '../styles/tiptap-editor.css';

const CATEGORIES = ['All', 'K-Beauty', 'K-Health', 'K-POP', 'K-Culture', 'K-Food', 'K-Travel'];

const estimateReadingTime = (html: string): number => {
  if (!html) return 1;
  const text = html.replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const MagazinePage: React.FC = () => {
  const { t, products, language, convertPrice, getLocalizedValue } = useGlobal();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, "cms_magazine"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      const excerpt = selectedPost.content
        ? selectedPost.content.replace(/<[^>]+>/g, '').substring(0, 160)
        : '';
      updateMetaTags({
        title: `${selectedPost.title} | K-Experience Magazine`,
        description: excerpt,
        image: selectedPost.image || '',
        url: window.location.href,
        type: 'article',
        keywords: `${selectedPost.category || ''}, K-Experience, Korea`,
      });
    } else {
      updateMetaTags({
        title: 'K-Experience Magazine | K-매거진',
        description: 'Discover the latest trends, tips, and stories about Korean beauty, health, culture, and entertainment.',
        url: window.location.href,
        type: 'website',
        keywords: 'K-Beauty, K-Health, K-POP, K-Culture, Korea, Magazine',
      });
    }
  }, [selectedPost]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory !== 'All') {
      result = result.filter(p => (p.category || '').toLowerCase().includes(activeCategory.toLowerCase().replace('k-', '')));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.content || '').replace(/<[^>]+>/g, '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, activeCategory, searchQuery]);

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  const relatedProducts = useMemo(() => {
    if (!selectedPost || !products.length) return [];
    const category = (selectedPost.category || '').toLowerCase();
    const titleWords = (selectedPost.title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    return products.filter((product: any) => {
      const prodCat = (product.category || '').toLowerCase();
      const prodTitle = (product.title || '').toLowerCase();

      if (category && prodCat.includes(category.replace('k-', ''))) return true;
      if (category.includes('beauty') && (prodCat.includes('뷰티') || prodCat.includes('beauty'))) return true;
      if (category.includes('health') && (prodCat.includes('건강') || prodCat.includes('health'))) return true;
      if (category.includes('pop') && (prodCat.includes('idol') || prodCat.includes('아이돌') || prodCat.includes('kpop'))) return true;

      return titleWords.some((w: string) => prodTitle.includes(w) || prodCat.includes(w));
    }).slice(0, 4);
  }, [selectedPost, products]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProductClick = (product: any) => {
    window.dispatchEvent(new CustomEvent('navigate-product-detail', { detail: product }));
  };

  const handleBack = () => {
    setSelectedPost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getExcerpt = (post: any) => {
    if (post.excerpt) return post.excerpt;
    if (post.content) {
      const text = post.content.replace(/<[^>]+>/g, '');
      return text.substring(0, 120) + (text.length > 120 ? '...' : '');
    }
    return '';
  };

  if (selectedPost) {
    const readTime = estimateReadingTime(selectedPost.content);
    return (
      <div className="min-h-screen bg-white font-sans">
        <div className="relative h-[50vh] md:h-[60vh] bg-gray-900 overflow-hidden">
          {selectedPost.image && (
            <img src={selectedPost.image} alt={selectedPost.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-sm font-bold transition-all"
            >
              <ArrowLeft size={16} />
              {language === 'ko' ? '목록으로' : 'Back'}
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-[800px] mx-auto">
              <span className="inline-block bg-[#0070F0] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                {selectedPost.category || 'K-Trend'}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
                {selectedPost.title}
              </h1>
              {selectedPost.subtitle && (
                <p className="text-lg text-white/80 font-medium mb-4">{selectedPost.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  <span>{selectedPost.author || 'K-Experience Editor'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{formatDate(selectedPost.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{readTime} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-end gap-2 py-6 border-b border-gray-100">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-bold text-gray-600 transition-colors"
            >
              {copied ? (
                <><Link2 size={14} className="text-green-500" /> {language === 'ko' ? '복사됨!' : 'Copied!'}</>
              ) : (
                <><Share2 size={14} /> {language === 'ko' ? '링크 복사' : 'Share'}</>
              )}
            </button>
          </div>

          <article className="tiptap-editor-content py-8 md:py-12">
            <div className="tiptap" dangerouslySetInnerHTML={{ __html: selectedPost.content || '' }} />
          </article>
        </div>

        {relatedProducts.length > 0 && (
          <div className="bg-gray-50 py-16 mt-8">
            <div className="max-w-[1000px] mx-auto px-4">
              <h3 className="text-2xl font-black text-[#111] mb-2">
                {language === 'ko' ? '관련 상품' : 'Related Products'}
              </h3>
              <p className="text-gray-500 text-sm mb-8">
                {language === 'ko' ? '이 글과 관련된 K-Experience 상품을 확인해보세요' : 'Check out related K-Experience products'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((product: any) => {
                  const title = getLocalizedValue(product, 'title');
                  const numericPrice = product.priceVal || (typeof product.price === 'string' ? parseInt(product.price.replace(/[^0-9]/g, '')) : product.price);
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] text-gray-400 font-bold mb-1">{product.category}</p>
                        <h4 className="text-[14px] font-bold text-[#111] line-clamp-2 mb-2 leading-snug">{title}</h4>
                        <p className="font-black text-[15px] text-[#111] mb-3">{convertPrice(numericPrice)}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                          className="w-full py-2 bg-[#0070F0] text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                        >
                          {language === 'ko' ? '자세히 보기' : 'View Details'}
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[800px] mx-auto px-4 py-12 text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111] text-white font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            {language === 'ko' ? '매거진 목록으로' : 'Back to Magazine'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-16 font-sans">
      <div className="text-center mb-12">
        <span className="text-[#0070F0] font-black tracking-widest text-sm uppercase mb-2 block">K-Experience Magazine</span>
        <h1 className="text-4xl md:text-5xl font-black text-[#111] mb-4">{t('magazine')}</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          {language === 'ko'
            ? '한국의 뷰티, 건강, 문화, 엔터테인먼트 최신 트렌드를 만나보세요.'
            : 'Discover the latest trends and tips about Korean beauty, health, culture, and entertainment.'}
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-8 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'ko' ? '매거진 검색...' : 'Search articles...'}
          className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#0070F0] focus:ring-2 focus:ring-[#0070F0]/10 transition-all bg-gray-50 focus:bg-white"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
              activeCategory === cat
                ? 'bg-[#0070F0] text-white border-[#0070F0]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat === 'All' ? (language === 'ko' ? '전체' : 'All') : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
              <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl text-gray-500">
          {searchQuery
            ? (language === 'ko' ? '검색 결과가 없습니다.' : 'No results found.')
            : (language === 'ko' ? '게시글이 없습니다.' : 'Coming Soon!')}
        </div>
      ) : (
        <>
          {featuredPost && (
            <div
              onClick={() => { setSelectedPost(featuredPost); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="mb-12 cursor-pointer group"
            >
              <div className="relative h-[400px] md:h-[480px] rounded-3xl overflow-hidden bg-gray-100">
                {featuredPost.image ? (
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-100 to-gray-200">
                    <BookOpen size={64} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  <span className="inline-block bg-[#0070F0] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {featuredPost.category || 'Featured'}
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 max-w-2xl">
                    {featuredPost.title}
                  </h2>
                  <p className="text-white/70 text-sm md:text-base max-w-xl mb-4 line-clamp-2">
                    {getExcerpt(featuredPost)}
                  </p>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <div className="flex items-center gap-1"><User size={13} /> {featuredPost.author || 'Editor'}</div>
                    <div className="flex items-center gap-1"><Calendar size={13} /> {formatDate(featuredPost.createdAt)}</div>
                    <div className="flex items-center gap-1"><Clock size={13} /> {estimateReadingTime(featuredPost.content)} min</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gridPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map(post => (
                <div
                  key={post.id}
                  onClick={() => { setSelectedPost(post); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-1"
                >
                  <div className="h-56 overflow-hidden bg-gray-100 relative">
                    {post.image ? (
                      <img
                        src={post.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={post.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#111] shadow-sm">
                      {post.category || 'K-Trend'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#111] mb-2 line-clamp-2 group-hover:text-[#0070F0] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {getExcerpt(post)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1"><User size={12} /> {post.author || 'Editor'}</div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1"><Clock size={12} /> {estimateReadingTime(post.content)} min</div>
                        <div className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
