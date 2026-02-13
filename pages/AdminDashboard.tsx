import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useGlobal } from '../contexts/GlobalContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const AdminDashboard: React.FC<{ language: string }> = ({ language }) => {
    const { categories, products } = useGlobal();
    
    // State variables
    const [productSubTab, setProductSubTab] = useState('items');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [modalType, setModalType] = useState<string | null>(null);
    const [productCategoryFilter, setProductCategoryFilter] = useState('all');

    // Derived state
    const filteredProducts = productCategoryFilter === 'all' 
        ? products 
        : products.filter(p => (p.category || '') === productCategoryFilter);

    // Actions
    const deleteItem = async (collectionName: string, id: string) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch(e) {
            console.error(e);
            alert("삭제 실패");
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
            
            {/* Navigation Tabs (Simplified) */}
            <div className="flex gap-4 mb-6 border-b pb-4">
                <button 
                    onClick={() => setProductSubTab('items')} 
                    className={`font-bold pb-2 ${productSubTab === 'items' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                    Products
                </button>
            </div>

            {/* SUB-TAB: ITEMS (PRODUCTS) */}
            {productSubTab === 'items' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black">상품 목록</h2>
                        <button onClick={()=>{setEditingItem({category:'건강검진', price:0}); setGalleryImages([]); setModalType('product');}} className="bg-black text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Plus size={16}/> 상품 등록</button>
                    </div>
                    <div className="flex gap-2 mb-4 bg-gray-100 p-2 rounded-lg inline-flex flex-wrap">
                        <button onClick={()=>setProductCategoryFilter('all')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${productCategoryFilter==='all'?'bg-white shadow-sm text-black':'text-gray-500 hover:text-black'}`}>전체 보기</button>
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={()=>setProductCategoryFilter(cat.label)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${productCategoryFilter===cat.label?'bg-white shadow-sm text-black':'text-gray-500 hover:text-black'}`}>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.filter(p => p.type !== 'package').map(p => (
                            <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm group">
                                <div className="h-40 bg-gray-100 relative">
                                    <img src={p.image} className="w-full h-full object-cover" alt={p.title}/>
                                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded font-bold">{p.category}</span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold truncate mb-1">{p.title}</h4>
                                    <p className="text-gray-500 text-xs mb-3 truncate">{p.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">₩ {Number(p.price).toLocaleString()}</span>
                                        <div className="flex gap-2">
                                            <button onClick={()=>{setEditingItem(p); setGalleryImages(p.images||[]); setModalType('product');}} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                                            <button onClick={()=>deleteItem(p._coll || 'products', p.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.filter(p => p.type !== 'package').length === 0 && (
                            <div className="col-span-full text-center py-20 bg-white border border-dashed rounded-xl text-gray-400">
                                등록된 일반 상품이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Simple Modal Placeholder to prevent errors if modalType is set */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
                        <button onClick={() => setModalType(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20}/></button>
                        <h3 className="text-xl font-bold mb-4">{editingItem?.id ? 'Edit Product' : 'New Product'}</h3>
                        <p className="text-gray-500 text-sm">Product form placeholder. Implement full form logic here.</p>
                        <div className="mt-6 flex justify-end gap-2">
                             <button onClick={() => setModalType(null)} className="px-4 py-2 bg-gray-100 rounded text-sm font-bold">Close</button>
                             <button onClick={() => setModalType(null)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};