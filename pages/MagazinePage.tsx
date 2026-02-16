
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useGlobal } from '../contexts/GlobalContext';
import { BookOpen, Calendar, User, X, ChevronRight, Share2, Clock } from 'lucide-react';

export const MagazinePage: React.FC = () => {
    const { t, language } = useGlobal();
    const isEn = language !== 'ko';
    
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    useEffect(() => {
        const q = query(collection(db, "cms_magazine"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString(isEn ? 'en-US' : 'ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans tracking-tight">
            {/* Magazine Hero */}
            <div className="w-full bg-[#0070F0] pt-28 pb-20 px-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[150%] bg-white/10 rounded-full blur-[120px] rotate-12"></div>
                <div className="max-w-[800px] mx-auto relative z-10">
                    <span className="text-white/80 font-black tracking-[0.3em] text-[12px] uppercase mb-4 block">Premium K-Content</span>
                    <h1 className="text-[40px] md:text-[56px] font-[900] mb-4 leading-none tracking-tighter">
                        {isEn ? 'K-MAGAZINE' : 'K-매거진'}
                    </h1>
                    <p className="text-white/80 text-lg font-medium">Discover the most authentic Korean trends and medical tips.</p>
                </div>
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-16">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-100 h-64 rounded-[24px] mb-6"></div>
                                <div className="h-6 bg-gray-100 w-3/4 rounded-full mb-3"></div>
                                <div className="h-4 bg-gray-100 w-1/2 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">새로운 소식을 준비 중입니다.</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                        {posts.map((post, index) => (
                            <article 
                                key={post.id} 
                                onClick={() => setSelectedPost(post)} 
                                className="group cursor-pointer flex flex-col h-full"
                            >
                                <div className="relative h-[320px] overflow-hidden rounded-[28px] mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                    {post.image ? (
                                        <img src={post.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={post.title}/>
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                            <BookOpen size={64}/>
                                        </div>
                                    )}
                                    <div className="absolute top-5 left-5">
                                        <span className="bg-white/95 backdrop-blur shadow-sm px-4 py-1.5 rounded-full text-[11px] font-[800] text-[#0070F0] uppercase tracking-wider">
                                            {post.category || 'Lifestyle'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><User size={12}/> {post.author || 'Editor'}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(post.createdAt)}</span>
                                    </div>
                                    
                                    <h3 className="text-[22px] font-[900] text-[#111] mb-4 leading-[1.3] group-hover:text-[#0070F0] transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    
                                    <p className="text-gray-500 text-[15px] leading-relaxed line-clamp-3 mb-6 font-medium">
                                        {post.excerpt || "Click to read the full story about this amazing K-experience."}
                                    </p>
                                    
                                    <div className="mt-auto">
                                        <span className="inline-flex items-center gap-1.5 text-[#111] text-[13px] font-black group-hover:gap-3 transition-all">
                                            READ MORE <ChevronRight size={16}/>
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Post Detail Modal */}
            {selectedPost && (
                <div 
                    className="fixed inset-0 z-[100] flex justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-md overflow-y-auto" 
                    onClick={() => setSelectedPost(null)}
                >
                    <div 
                        className="bg-white w-full max-w-[860px] rounded-[32px] shadow-2xl relative my-10 flex flex-col overflow-hidden h-fit" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header/Image */}
                        <div className="relative h-[400px] md:h-[500px] bg-gray-100">
                            {selectedPost.image && <img src={selectedPost.image} className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            
                            <button 
                                onClick={() => setSelectedPost(null)} 
                                className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full backdrop-blur-xl transition-all z-20"
                            >
                                <X size={24}/>
                            </button>
                            
                            <div className="absolute bottom-10 left-10 right-10 text-white z-10">
                                <span className="bg-[#0070F0] text-[11px] font-black px-4 py-1.5 rounded-full mb-4 inline-block uppercase tracking-[0.2em] shadow-lg">
                                    {selectedPost.category || 'Feature'}
                                </span>
                                <h2 className="text-[32px] md:text-[48px] font-[900] leading-[1.1] tracking-tighter mb-4 drop-shadow-xl">
                                    {selectedPost.title}
                                </h2>
                                <div className="flex items-center gap-5 text-sm font-bold opacity-80">
                                    <div className="flex items-center gap-1.5"><User size={16}/> {selectedPost.author}</div>
                                    <div className="flex items-center gap-1.5"><Clock size={16}/> {formatDate(selectedPost.createdAt)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-10 md:p-16 bg-white">
                            <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-100">
                                <div className="bg-gray-50 px-6 py-4 rounded-2xl flex-1 mr-8">
                                    <p className="text-gray-600 font-bold leading-relaxed italic">
                                        "{selectedPost.excerpt}"
                                    </p>
                                </div>
                                <button className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0070F0] hover:border-[#0070F0] transition-all">
                                    <Share2 size={20}/>
                                </button>
                            </div>

                            <div 
                                className="prose prose-lg max-w-none prose-img:rounded-[24px] prose-img:shadow-lg prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-[1.8] prose-p:text-gray-700" 
                                dangerouslySetInnerHTML={{ __html: selectedPost.content }} 
                            />
                            
                            <div className="mt-16 pt-10 border-t border-gray-100 flex justify-center">
                                <button 
                                    onClick={() => setSelectedPost(null)}
                                    className="px-10 py-4 bg-black text-white rounded-full font-black text-sm tracking-widest hover:bg-[#0070F0] transition-all shadow-xl"
                                >
                                    BACK TO MAGAZINE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
