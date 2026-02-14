
import React, { useState, useEffect, useRef } from 'react';
import { fetchGearMetadata } from '../services/geminiService';

const ManageView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing form state
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPurchaseUrl, setEditPurchaseUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('vault-gear-list-v2');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveToStorage = (newItems: any[]) => {
    setItems(newItems);
    localStorage.setItem('vault-gear-list-v2', JSON.stringify(newItems));
  };

  // CSV Import
  const handleImport = () => {
    const lines = csvInput.split('\n');
    const newGears: any[] = [];
    const categoryMap: Record<string, string> = {
      'Microphone': 'Microphone',
      'Audio Interface': 'Preamp/Interface/Amp',
      'Mic Pre': 'Preamp/Interface/Amp',
      'Speaker': 'Speaker',
      'Headphone': 'Headphone',
      'Earphone': 'Earphone'
    };

    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return;
      const [brand, model, type, shop, url] = line.split(',').map(s => s?.trim());
      if (model) {
        newGears.push({
          id: `imported-${Date.now()}-${index}`,
          brand: brand || 'Unknown',
          model: model,
          category: categoryMap[type] || 'Microphone',
          rating: 5,
          description: `${shop || 'カタログ'}掲載モデル。`,
          purchaseUrl: url || '',
          imageUrl: '',
          date: new Date().toLocaleDateString()
        });
      }
    });

    const combined = [...newGears, ...items];
    saveToStorage(combined);
    setCsvInput('');
    setShowImport(false);
    alert(`${newGears.length} 件をインポートしました。`);
  };

  // JSON Backup (Export)
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `gear_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // JSON Restore (Import)
  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm(`${json.length} 件のデータを読み込みます。現在のデータに「追加」しますか？（キャンセルで「上書き」します）`)) {
            saveToStorage([...json, ...items]);
          } else {
            saveToStorage(json);
          }
          alert("復元が完了しました。");
        }
      } catch (err) {
        alert("無効なJSONファイルです。");
      }
    };
    reader.readAsText(file);
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditBrand(item.brand);
    setEditModel(item.model);
    setEditCategory(item.category);
    setEditRating(item.rating);
    setEditDescription(item.description);
    setEditImageUrl(item.imageUrl || '');
    setEditPurchaseUrl(item.purchaseUrl || '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const updated = items.map(item => item.id === editingId ? {
      ...item, brand: editBrand, model: editModel, category: editCategory,
      rating: editRating, description: editDescription, imageUrl: editImageUrl, purchaseUrl: editPurchaseUrl
    } : item);
    saveToStorage(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('この機材をアーカイブから削除しますか？')) {
      saveToStorage(items.filter(i => i.id !== id));
    }
  };

  const autoFetchImages = async () => {
    const targets = items.filter(i => !i.imageUrl && i.purchaseUrl);
    if (targets.length === 0) {
      alert("画像URLが未登録の機材はありません。");
      return;
    }
    if (!window.confirm(`${targets.length}件の画像をAIで検索します。完了までページを閉じないでください。`)) return;

    setIsAutoUpdating(true);
    const updatedItems = [...items];
    for (const target of targets) {
      try {
        const result = await fetchGearMetadata(`${target.brand} ${target.model}`);
        const imageMatch = result.text.match(/IMAGE[:\s]+(https?:\/\/[^\s\n\r"']+)/i);
        if (imageMatch && imageMatch[1]) {
          const idx = updatedItems.findIndex(i => i.id === target.id);
          updatedItems[idx].imageUrl = imageMatch[1].replace(/[()]/g, '');
          setItems([...updatedItems]);
        }
        await new Promise(r => setTimeout(r, 1200));
      } catch (e) { console.error(e); }
    }
    saveToStorage(updatedItems);
    setIsAutoUpdating(false);
    alert("一括更新が完了しました。");
  };

  const filteredItems = items.filter(i => 
    `${i.brand} ${i.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-10 bg-slate-950/50">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Inventory Manager</h2>
            <p className="text-slate-500 text-sm mt-1">機材アーカイブの管理・バックアップ・AI補完</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* CSV Import */}
            <button onClick={() => setShowImport(!showImport)} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all border border-slate-700">
              CSV Import
            </button>
            
            {/* JSON Export */}
            <button onClick={handleExportJSON} className="px-5 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all border border-indigo-500/30 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Backup JSON
            </button>

            {/* JSON Restore */}
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all border border-slate-700 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Restore JSON
            </button>
            <input type="file" ref={fileInputRef} onChange={handleRestoreJSON} accept=".json" className="hidden" />

            {/* AI Update */}
            <button onClick={autoFetchImages} disabled={isAutoUpdating} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
              {isAutoUpdating ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.243 17.243a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707z" /></svg>
              )}
              AI Image Discovery
            </button>
          </div>
        </div>

        {showImport && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-4 italic">Bulk CSV Import</h3>
            <textarea 
              value={csvInput} 
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="Maker,Name,Type,Shop,URL..."
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-[11px] text-white outline-none font-mono mb-4 focus:border-indigo-500 transition-colors"
            />
            <button onClick={handleImport} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20">
              Import CSV Data
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
           <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input type="text" placeholder="アーカイブ内を検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-600 outline-none transition-all" />
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{items.length} ARCHIVED PIECES</p>
          </div>
        </div>

        {editingId ? (
          <div className="bg-slate-900 border border-amber-500/30 rounded-[2rem] p-10 shadow-2xl animate-in slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Edit Metadata</h3>
             </div>
             <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Brand</label>
                      <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Model</label>
                      <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Category</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors">
                      <option value="Microphone">Microphone</option>
                      <option value="Preamp/Interface/Amp">Preamp / Interface / Amp</option>
                      <option value="Speaker">Speaker</option>
                      <option value="Headphone">Headphone</option>
                      <option value="Earphone">Earphone</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Image URL</label>
                    <input type="text" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Store / Info URL</label>
                    <input type="text" value={editPurchaseUrl} onChange={(e) => setEditPurchaseUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Review</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white resize-none focus:border-amber-500 outline-none transition-colors" />
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-xl shadow-amber-600/20 transition-all">UPDATE ARCHIVE</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-xl transition-all">CANCEL</button>
                </div>
             </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Equipment Info</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="text-[8px] font-black text-slate-700">NO IMG</div>}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">{item.brand}</span>
                            <span className="text-white font-bold text-base leading-none">{item.model}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-800 text-[9px] font-black text-slate-400 rounded-lg border border-slate-700 uppercase tracking-widest">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button onClick={() => startEditing(item)} className="px-4 py-2 bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white text-[10px] font-black rounded-lg transition-all border border-slate-700 hover:border-amber-500/50">EDIT</button>
                        <button onClick={() => handleDelete(item.id)} className="px-4 py-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white text-[10px] font-black rounded-lg transition-all border border-slate-700 hover:border-red-500/50">DEL</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-slate-600 font-medium italic">No entries found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageView;
