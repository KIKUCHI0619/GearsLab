
import React, { useState, useEffect, useRef } from 'react';
import { fetchGearMetadata } from '../services/geminiService';

const ManageView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing form state
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editDescription, setEditDescription] = useState('');
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
          id: `${Date.now()}${index}`,
          brand: brand || 'Unknown',
          model: model,
          category: categoryMap[type] || 'Microphone',
          rating: 5,
          description: `${shop || 'カタログ'}掲載。`,
          purchaseUrl: url || '',
          date: new Date().toLocaleDateString()
        });
      }
    });

    saveToStorage([...newGears, ...items]);
    setCsvInput('');
    setShowImport(false);
    alert(`${newGears.length} items imported.`);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `gear_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          saveToStorage(json);
          alert("Restore complete.");
        }
      } catch (err) { alert("Invalid JSON file."); }
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
    setEditPurchaseUrl(item.purchaseUrl || '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const updated = items.map(item => item.id === editingId ? {
      ...item, brand: editBrand, model: editModel, category: editCategory,
      rating: editRating, description: editDescription, purchaseUrl: editPurchaseUrl
    } : item);
    saveToStorage(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this archive entry?')) {
      saveToStorage(items.filter(i => i.id !== id));
    }
  };

  const filteredItems = items.filter(i => 
    `${i.brand} ${i.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 md:p-10 bg-slate-950/20">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Database Admin</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your gear archive without the hassle of visual assets.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowImport(!showImport)} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all">CSV Import</button>
            <button onClick={handleExportJSON} className="px-5 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all border border-indigo-500/30">Export JSON</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all">Import JSON</button>
            <input type="file" ref={fileInputRef} onChange={handleRestoreJSON} accept=".json" className="hidden" />
          </div>
        </div>

        {showImport && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-white mb-2">CSV Bulk Load</h3>
            <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest">Format: Brand,Model,Category,Shop,URL</p>
            <textarea 
              value={csvInput} 
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="e.g. Sony,MDR-CD900ST,Headphone,Sound House,https://..."
              className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-[11px] text-white outline-none font-mono mb-4 focus:border-indigo-500 transition-colors"
            />
            <button onClick={handleImport} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase tracking-widest text-xs">Execute Import</button>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
           <div className="relative w-full max-w-md">
            <input type="text" placeholder="Filter database..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-600 outline-none" />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{items.length} TOTAL ITEMS</p>
        </div>

        {editingId ? (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4">
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Modify Gear Entry</h3>
             <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Brand</label>
                      <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Model</label>
                      <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Category</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none">
                      <option value="Microphone">Microphone</option>
                      <option value="Preamp/Interface/Amp">Preamp / Interface / Amp</option>
                      <option value="Speaker">Speaker</option>
                      <option value="Headphone">Headphone</option>
                      <option value="Earphone">Earphone</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Rating (1-5)</label>
                    <input type="number" min="1" max="5" value={editRating} onChange={(e) => setEditRating(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Review Notes</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white resize-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Store URL</label>
                    <input type="text" value={editPurchaseUrl} onChange={(e) => setEditPurchaseUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-xl shadow-amber-600/20">SAVE CHANGES</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-xl">CANCEL</button>
                </div>
             </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand & Model</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-[11px] font-mono text-slate-500">#{item.id.slice(-8)}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">{item.brand}</span>
                          <span className="text-white font-bold text-base">{item.model}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button onClick={() => startEditing(item)} className="px-4 py-2 bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white text-[10px] font-black rounded-lg transition-all">EDIT</button>
                        <button onClick={() => handleDelete(item.id)} className="px-4 py-2 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white text-[10px] font-black rounded-lg transition-all">DELETE</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageView;
