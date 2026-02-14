
import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';

const VoiceView: React.FC = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<{ id: string, text: string, date: Date }[]>([]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const handleSpeak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSpeaking) return;

    setIsSpeaking(true);
    try {
      const audioBase64 = await generateSpeech(text);
      if (audioBase64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decodedBytes = decode(audioBase64);
        const audioBuffer = await decodeAudioData(decodedBytes, audioCtx, 24000, 1);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();

        setHistory(prev => [{ id: Date.now().toString(), text, date: new Date() }, ...prev]);
        setText('');
      }
    } catch (error) {
      console.error(error);
      alert("TTS failed. Please ensure your API key supports Gemini 2.5 Flash Preview TTS.");
      setIsSpeaking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
      <section className="bg-indigo-900/20 rounded-3xl p-8 border border-indigo-500/30 shadow-2xl backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </span>
          Voice Lab
        </h2>
        
        <form onSubmit={handleSpeak} className="space-y-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What should Gemini say?"
            className="w-full bg-slate-900/50 border border-slate-700 text-xl text-white rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSpeaking}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/40 flex items-center justify-center space-x-3 text-lg"
          >
            {isSpeaking ? (
              <div className="flex items-center space-x-2">
                 <div className="flex space-x-1 items-end h-6">
                    <div className="w-1.5 bg-white animate-[bounce_1s_infinite]"></div>
                    <div className="w-1.5 bg-white animate-[bounce_1s_infinite_0.1s]"></div>
                    <div className="w-1.5 bg-white animate-[bounce_1s_infinite_0.2s]"></div>
                    <div className="w-1.5 bg-white animate-[bounce_1s_infinite_0.3s]"></div>
                 </div>
                 <span>Speaking...</span>
              </div>
            ) : (
              <span>Generate Speech</span>
            )}
          </button>
        </form>
      </section>

      <div className="space-y-4">
        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs px-2">Recent Speech</h3>
        {history.map((item) => (
          <div key={item.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors">
            <span className="text-slate-200 truncate pr-4">{item.text}</span>
            <span className="text-xs text-slate-500 whitespace-nowrap">{item.date.toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceView;
