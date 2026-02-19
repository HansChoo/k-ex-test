
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebaseConfig';
import { useGlobal } from '../contexts/GlobalContext';
import { BookOpen, Calendar, User, X } from 'lucide-react';

export const MagazinePage: React.FC = () => {
    const { t } = useGlobal();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    useEffect(() => {
        if (!db) { setLoading(false); return; }
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
        return date.toLocaleDateString();
    };

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-16 font-sans">
            <div className="text-center mb-16">
                <span className="text-[#0070F0] font-black tracking-widest text-sm uppercase mb-2 block">K-Experience Blog</span>
                <h1 className="text-4xl font-black text-[#111] mb-4">{t('magazine')}</h1>
                <p className="text-gray-500">Discover the latest trends and tips about Korea.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1,2,3].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
                            <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl text-gray-500">
                    Coming Soon!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <div key={post.id} onClick={() => setSelectedPost(post)} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-1">
                            <div className="h-60 overflow-hidden bg-gray-100 relative">
                                {post.image ? (
                                    <img src={post.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={post.title}/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><BookOpen size={48}/></div>
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#111] shadow-sm">
                                    {post.category || 'K-Trend'}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-[#111] mb-3 line-clamp-2 group-hover:text-[#0070F0] transition-colors">{post.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">{post.excerpt || "Click to read more..."}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1"><User size={12}/> {post.author || 'Editor'}</div>
                                    <div className="flex items-center gap-1"><Calendar size={12}/> {formatDate(post.createdAt)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Post Detail Modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-[100] flex justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedPost(null)}>
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative my-10 flex flex-col overflow-hidden h-fit min-h-[50vh]" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 md:h-80 bg-gray-100">
                            {selectedPost.image && <img src={selectedPost.image} className="w-full h-full object-cover" />}
                            <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"><X size={20}/></button>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
                                <span className="bg-[#0070F0] text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{selectedPost.category || 'Story'}</span>
                                <h2 className="text-2xl md:text-3xl font-black leading-tight">{selectedPost.title}</h2>
                            </div>
                        </div>
                        <div className="p-8 md:p-12 prose max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
