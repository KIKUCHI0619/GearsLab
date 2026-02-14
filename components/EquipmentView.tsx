
import React, { useState, useEffect } from 'react';
import { EquipmentItem } from '../types';
import { polishDescription, fetchGearMetadata } from '../services/geminiService';

interface EquipmentViewProps {
  filterCategory?: string;
}

type SortOption = 'newest' | 'rating-desc' | 'rating-asc';

const EquipmentView: React.FC<EquipmentViewProps> = ({ filterCategory }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPolishing, setIsPolishing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Form states
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Microphone');
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');

  useEffect(() => {
    const loadData = () => {
      const savedV2 = localStorage.getItem('vault-gear-list-v2');
      if (savedV2) {
        setItems(JSON.parse(savedV2));
      }
    };
    loadData();
  }, []);

  // Filter and Sort logic
  const filteredAndSortedItems = items
    .filter(i => !filterCategory || i.category === filterCategory)
    .filter(i => 
      `${i.brand} ${i.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'rating-asc') return a.rating - b.rating;
      return parseInt(b.id) - parseInt(a.id); // newest default
    });

  const saveItems = (updated: any[]) => {
    setItems(updated);
    localStorage.setItem('vault-gear-list-v2', JSON.stringify(updated));
  };

  const handleAddGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;

    // 画像URLが空なら「モデル名.png」をデフォルトにする
    const finalImageName = imageFileName.trim() || `${model.trim()}.png`;

    const newItem = {
      id: Date.now().toString(),
      brand: brand.trim() || 'Unknown',
      model: model.trim(),
      category,
      rating,
      description,
      imageUrl: finalImageName, // ここにファイル名を格納
      purchaseUrl: purchaseUrl.trim(),
      date: new Date().toLocaleDateString()
    };

    saveItems([newItem, ...items]);
    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setBrand(''); setModel(''); setCategory('Microphone');
    setDescription(''); setImageFileName(''); setPurchaseUrl('');
    setRating(5);
  };

  const handleAISearch = async () => {
    const query = `${brand} ${model}`.trim();
    if (!query) return alert("メーカーとモデル名を入力してください。");
    setIsSearching(true);
    try {
      const result = await fetchGearMetadata(query);
      const storeMatch = result.text.match(/STORE[:\s]+(https?:\/\/[^\s\n\r"']+)/i);
      if (storeMatch && storeMatch[1]) setPurchaseUrl(storeMatch[1].replace(/[()]/g, ''));
      if (!description) setDescription(`${brand} ${model} の情報をAIで取得しました。`);
      // 画像はファイル名運用にするため、自動入力は「モデル名.png」を提案する形にする
      if (!imageFileName) setImageFileName(`${model}.png`);
    } catch (e) {
      console.error(e);
      alert("AI検索が不安定です。手動入力をお願いします。");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePolish = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || isPolishing) return;
    setIsPolishing(id);
    try {
      const polished = await polishDescription(`${item.brand} ${item.model}`, item.description);
      saveItems(items.map(i => i.id === id ? { ...i, description: polished } : i));
    } catch (e) { console.error(e); }
    finally { setIsPolishing(null); }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        <div className="flex flex-col gap-6 border-b border-slate-800 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                {filterCategory ? filterCategory : 'Collection Archive'}
              </h2>
              <div className="flex items-center space-x-3">
                <p className="text-slate-500 font-medium text-sm">
                  {filteredAndSortedItems.length} items found
                </p>
                <div className="h-3 w-[1px] bg-slate-800"></div>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-indigo-400 text-xs font-bold outline-none cursor-pointer hover:text-indigo-300"
                >
                  <option value="newest">Sort by: Newest</option>
                  <option value="rating-desc">Sort by: Rating (High)</option>
                  <option value="rating-asc">Sort by: Rating (Low)</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`px-8 py-4 rounded-full font-black transition-all flex items-center justify-center space-x-3 shadow-2xl ${
                isAdding ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{isAdding ? 'Close Panel' : 'Add New Gear'}</span>
            </button>
          </div>

          <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search by brand or model..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-1 focus:ring-indigo-600 outline-none transition-all placeholder-slate-600 backdrop-blur-sm" 
            />
          </div>
        </div>

        {isAdding && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[2rem] p-6 md:p-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <form onSubmit={handleAddGear} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Brand</label>
                    <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Neumann" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Model</label>
                    <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. U87ai" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 appearance-none">
                    <option value="Microphone">Microphone</option>
                    <option value="Preamp/Interface/Amp">Preamp / Interface / Amp</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Headphone">Headphone</option>
                    <option value="Earphone">Earphone</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Image Filename (e.g. Babyface.png)</label>
                  <input type="text" value={imageFileName} onChange={(e) => setImageFileName(e.target.value)} placeholder="Default: model.png" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-colors" />
                  <p className="text-[10px] text-slate-500 italic px-1">※画像がない場合は Noimage.png が表示されます</p>
                </div>

                <button type="button" onClick={handleAISearch} disabled={isSearching}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-black rounded-2xl border border-indigo-500/20 flex items-center justify-center space-x-2 transition-all">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  <span>Search Store Link & Suggestion</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Review</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Share your thoughts..."
                    className="w-full h-44 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none resize-none focus:border-indigo-500 transition-colors" />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Rating</label>
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl transition-colors ${rating >= n ? 'text-yellow-500' : 'text-slate-800 hover:text-slate-600'}`}>★</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all">
                    SAVE TO ARCHIVE
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {filteredAndSortedItems.map(item => (
            <div key={item.id} className="group bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 relative">
              
              <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                <img 
                  src={item.imageUrl || 'Noimage.png'} 
                  alt={item.model} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'Noimage.png';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {item.category}
                  </span>
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ID: {item.id.slice(-6)}
                  </span>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{item.brand}</h4>
                      <h3 className="text-xl font-bold text-white tracking-tight">{item.model}</h3>
                    </div>
                    <div className="flex space-x-0.5">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className={`text-xs ${item.rating >= n ? 'text-yellow-500' : 'text-slate-800'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 min-h-[4.5rem]">
                  {item.description || "No review provided for this piece of equipment."}
                </p>

                <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-800/50">
                  <div className="flex gap-2">
                    {item.purchaseUrl && (
                      <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      </a>
                    )}
                    <button onClick={() => handlePolish(item.id)} disabled={!!isPolishing} className="p-3 bg-slate-800 hover:bg-indigo-600/20 rounded-xl transition-colors text-slate-400 hover:text-indigo-400">
                      {isPolishing === item.id ? (
                         <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedItems.length === 0 && (
          <div className="py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
              <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-300">No gear found</h3>
              <p className="text-slate-500 font-medium">No archived gear matches your filter or search.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentView;
