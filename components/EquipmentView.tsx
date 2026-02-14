import React, { useState, useEffect } from 'react';
import { EquipmentItem } from '../types';
import { polishDescription, fetchGearMetadata } from '../services/geminiService';

interface EquipmentViewProps {
  filterCategory?: string;
}

const EquipmentView: React.FC<EquipmentViewProps> = ({ filterCategory }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPolishing, setIsPolishing] = useState<string | null>(null);
  
  // Form states
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Microphone');
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');

  // データの読み込みと移行 (強制的に最新のキーへ統合)
  useEffect(() => {
    const loadData = () => {
      const savedV2 = localStorage.getItem('vault-gear-list-v2');
      const savedV1 = localStorage.getItem('vault-gear-list');
      
      if (savedV2) {
        setItems(JSON.parse(savedV2));
      } else if (savedV1) {
        // V1データが存在する場合のみ移行
        const v1Data = JSON.parse(savedV1);
        const migrated = v1Data.map((item: any) => ({
          ...item,
          brand: item.brand || 'Unknown',
          model: item.model || item.name || 'Unknown Model',
          id: item.id || Date.now().toString() + Math.random()
        }));
        setItems(migrated);
        localStorage.setItem('vault-gear-list-v2', JSON.stringify(migrated));
      }
    };
    loadData();
  }, []);

  const filteredItems = filterCategory 
    ? items.filter(i => i.category === filterCategory)
    : items;

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
      imageUrl: imageUrl.trim(),
      purchaseUrl: purchaseUrl.trim(),
      date: new Date().toLocaleDateString()
    };

    saveItems([newItem, ...items]);
    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setBrand(''); setModel(''); setCategory('Microphone');
    setDescription(''); setImageUrl(''); setPurchaseUrl('');
    setRating(5);
  };

  const handleAISearch = async () => {
    const query = `${brand} ${model}`.trim();
    if (!query) {
      alert("メーカーとモデル名を入力してください。");
      return;
    }
    setIsSearching(true);
    try {
      const result = await fetchGearMetadata(query);
      const text = result.text;
      
      // 改良された正規表現: 改行や空白、Markdown記法を考慮
      const imageMatch = text.match(/IMAGE[:\s]+(https?:\/\/[^\s\n\r"']+)/i);
      const storeMatch = text.match(/STORE[:\s]+(https?:\/\/[^\s\n\r"']+)/i);
      
      if (imageMatch && imageMatch[1]) {
        setImageUrl(imageMatch[1].replace(/[()]/g, '')); // 不要なカッコを除去
      }
      if (storeMatch && storeMatch[1]) {
        setPurchaseUrl(storeMatch[1].replace(/[()]/g, ''));
      }
      
      if (!description) {
        setDescription(`${brand} ${model} の情報をAIで取得しました。`);
      }
    } catch (e) {
      console.error(e);
      alert("AI検索が不安定です。手動でURLを入力するか、もう一度試してください。");
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
    <div className="h-full overflow-y-auto no-scrollbar p-10">
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              {filterCategory ? filterCategory : 'Collection Archive'}
            </h2>
            <p className="text-slate-500 font-medium">
              {filteredItems.length} 点の機材がアーカイブされています。
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`px-10 py-5 rounded-full font-black transition-all flex items-center space-x-3 shadow-2xl ${
              isAdding ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
            }`}
          >
            <svg className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isAdding ? 'Close Panel' : 'Add New Gear'}</span>
          </button>
        </div>

        {isAdding && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <form onSubmit={handleAddGear} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Brand / Maker</label>
                    <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Neumann" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Model Name</label>
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

                <div className="pt-4">
                  <button type="button" onClick={handleAISearch} disabled={isSearching}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-black rounded-2xl border border-indigo-500/20 flex items-center justify-center space-x-2 transition-all">
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    )}
                    <span>Search Metadata with Gemini</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Review / Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Share your thoughts..."
                    className="w-full h-44 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none resize-none focus:border-indigo-500 transition-colors" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Rating</label>
                    <div className="flex space-x-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setRating(n)} className={`text-2xl transition-colors ${rating >= n ? 'text-yellow-500' : 'text-slate-800 hover:text-slate-600'}`}>★</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all">
                    SAVE TO ARCHIVE
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="group bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
              </div>
              
              <div className="p-8 space-y-4">
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

                <div className="pt-4 flex items-center justify-between gap-4">
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

        {filteredItems.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
              <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-slate-500 font-medium italic">No equipment found in this archive category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentView;