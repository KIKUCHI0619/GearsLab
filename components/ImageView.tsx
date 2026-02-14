
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { GeneratedImage } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const imageUrl = await generateImage(prompt);
      const newImg: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: new Date()
      };
      setImages(prev => [newImg, ...prev]);
      setPrompt('');
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please ensure your API key supports Gemini 2.5 Flash Image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
      <section className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Visual Creator</h2>
        <p className="text-slate-400 mb-6 text-sm">Bring your imagination to life with Gemini 2.5 Flash Image.</p>
        
        <form onSubmit={handleGenerate} className="flex flex-col space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create in detail..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating Magic...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11l-8 8-4-4 8-8 4 4z" />
                </svg>
                <span>Create Image</span>
              </>
            )}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all">
            <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <p className="text-xs font-medium text-slate-300 line-clamp-2">{img.prompt}</p>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = img.url;
                  link.download = `gemini-gen-${img.id}.png`;
                  link.click();
                }}
                className="mt-2 text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-full w-fit hover:bg-indigo-500"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl">Your generated images will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageView;
