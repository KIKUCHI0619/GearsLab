
import React, { useState, useEffect } from 'react';
import { EquipmentItem } from '../types';
import { polishDescription, fetchGearMetadata } from '../services/geminiService';

interface EquipmentViewProps {
  filterCategory?: string;
}

type SortOption = 'newest' | 'rating-desc' | 'rating-asc';

// カテゴリーごとのスタイル定義
const categoryStyles: Record<string, { icon: React.ReactNode, color: string, bg: string }> = {
  'Microphone': {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
    color: 'text-indigo-400',
    bg: 'from-indigo-600/20 to-indigo-900/40'
  },
  'Preamp/Interface/Amp': {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />,
    color: 'text-amber-400',
    bg: 'from-amber-600/20 to-amber-900/40'
  },
  'Speaker': {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />,
    color: 'text-emerald-400',
    bg: 'from-emerald-600/20 to-emerald-900/40'
  },
  'Headphone': {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l9 5-9 5-9-5 9-5z" />,
    color: 'text-rose-400',
    bg: 'from-rose-600/20 to-rose-900/40'
  },
  'Earphone': {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 11zm12 0c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 11z" />,
    color: 'text-cyan-400',
    bg: 'from-cyan-600/20 to-cyan-900/40'
  }
};

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

  const filteredAndSortedItems = items
    .filter(i => !filterCategory || i.category === filterCategory)
    .filter(i => 
      `${i.brand} ${i.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'rating-asc') return a.rating - b.rating;
      return parseInt(b.id) - parseInt(a.id);
    });

  const saveItems = (updated: any[]) => {
    setItems(updated);
    localStorage.setItem('vault-gear-list-v2', JSON.stringify(updated));
  };

  const handleAddGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      brand: brand.trim() || 'Unknown',
      model: model.trim(),
      category,
      rating,
      description,
      purchaseUrl: purchaseUrl.trim(),
      date: new Date().toLocaleDateString()
    };

    saveItems([newItem, ...items]);
    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setBrand(''); setModel(''); setCategory('Microphone');
    setDescription(''); setPurchaseUrl(''); setRating(5);
  };

  const handleAISearch = async () => {
    const query = `${brand} ${model}`.trim();
    if (!query) return alert("メーカーとモデル名を入力してください。");
    setIsSearching(true);
    try {
      const result = await fetchGearMetadata(query);
      const storeMatch = result.text.match(/STORE[:\s]+(https?:\/\/[^\s\n\r"']+)/i);
      if (storeMatch && storeMatch[1]) setPurchaseUrl(storeMatch[1].replace(/[()]/g, ''));
      if (!description) setDescription(`${brand} ${model} の情報をAIで取得しました。レビューを書き込んでください。`);
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
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 border-b border-slate-800 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                {filterCategory ? filterCategory : 'Gear Library'}
              </h2>
              <div className="flex items-center space-x-3">
                <p className="text-slate-500 font-bold text-sm tracking-wide">
                  {filteredAndSortedItems.length} ARCHIVES
                </p>
                <div className="h-3 w-[1px] bg-slate-800"></div>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-indigo-400 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:text-indigo-300"
                >
                  <option value="newest">Sort: NEWEST</option>
                  <option value="rating-desc">Sort: TOP RATED</option>
                  <option value="rating-asc">Sort: LOWEST RATED</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center justify-center space-x-3 shadow-2xl ${
                isAdding ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="uppercase tracking-widest text-sm">{isAdding ? 'Close Panel' : 'Archive New Gear'}</span>
            </button>
          </div>

          <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Search equipment..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl pl-16 pr-6 py-5 text-white focus:ring-1 focus:ring-indigo-600 outline-none transition-all placeholder-slate-600 backdrop-blur-md" 
            />
          </div>
        </div>

        {/* Add Form */}
        {isAdding && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <form onSubmit={handleAddGear} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Brand</label>
                    <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Neumann" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Model</label>
                    <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. U87ai" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 appearance-none">
                    <option value="Microphone">Microphone</option>
                    <option value="Preamp/Interface/Amp">Preamp / Interface / Amp</option>
                    <option value="Speaker">Speaker</option>
                    <option value="Headphone">Headphone</option>
                    <option value="Earphone">Earphone</option>
                  </select>
                </div>

                <button type="button" onClick={handleAISearch} disabled={isSearching}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-black rounded-2xl border border-indigo-500/20 flex items-center justify-center space-x-3 transition-all uppercase tracking-widest text-xs">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  <span>Auto-fill Info via Gemini</span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Review / Notes</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Share your experience with this gear..."
                    className="w-full h-44 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none resize-none focus:border-indigo-500 transition-colors" />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Rating</label>
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setRating(n)} className={`text-3xl transition-colors ${rating >= n ? 'text-yellow-500' : 'text-slate-800 hover:text-slate-600'}`}>★</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full sm:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-widest text-sm">
                    ARCHIVE GEAR
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Gear Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredAndSortedItems.map(item => {
            const style = categoryStyles[item.category] || categoryStyles['Microphone'];
            return (
              <div key={item.id} className="group bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 relative flex flex-col">
                
                {/* Visual Header (Instead of Image) */}
                <div className={`h-48 bg-gradient-to-br ${style.bg} relative flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  </div>
                  
                  <div className={`w-24 h-24 rounded-3xl bg-slate-950/80 backdrop-blur-xl flex items-center justify-center border border-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-110`}>
                    <svg className={`w-12 h-12 ${style.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {style.icon}
                    </svg>
                  </div>

                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black text-white/70 uppercase tracking-widest">
                      {item.category}
                    </span>
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-full text-[9px] font-bold text-white/40 uppercase tracking-widest">
                      ID-{item.id.slice(-6)}
                    </span>
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="p-8 space-y-5 flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-tight">{item.brand}</h4>
                      <div className="flex text-yellow-500/80 text-[10px]">
                        {Array.from({ length: 5 }).map((_, n) => (
                          <span key={n} className={item.rating > n ? 'opacity-100' : 'opacity-20'}>★</span>
                        ))}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter leading-tight group-hover:text-indigo-400 transition-colors">
                      {item.model}
                    </h3>
                  </div>

                  <div className="flex-1">
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-4 italic">
                      {item.description ? `"${item.description}"` : "No archive notes provided."}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between gap-4 border-t border-slate-800/50">
                    <div className="flex gap-2">
                      {item.purchaseUrl && (
                        <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white group/btn">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </a>
                      )}
                      <button 
                        onClick={() => handlePolish(item.id)} 
                        disabled={!!isPolishing} 
                        className="p-3 bg-slate-800 hover:bg-indigo-600/20 rounded-xl transition-colors text-slate-400 hover:text-indigo-400 flex items-center gap-2"
                        title="Rewrite with AI"
                      >
                        {isPolishing === item.id ? (
                           <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{item.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAndSortedItems.length === 0 && (
          <div className="py-32 text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-32 h-32 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto border border-slate-800 shadow-inner">
              <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Archive Is Empty</h3>
              <p className="text-slate-600 font-medium max-w-xs mx-auto text-sm leading-relaxed">一致する機材が見つかりません。新しい機材を登録してコレクションを開始しましょう。</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-black rounded-xl uppercase tracking-widest border border-indigo-500/20"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentView;
