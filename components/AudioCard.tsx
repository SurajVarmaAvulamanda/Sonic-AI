
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedAudio } from '../types';
import { decodeBase64, decodeAudioData, playAudioBuffer, pcmToWav, getAudioContext } from '../utils/audioUtils';

interface AudioCardProps {
  audio: GeneratedAudio;
  onDelete: (id: string) => void;
}

export const AudioCard: React.FC<AudioCardProps> = ({ audio, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const handleTogglePlayback = async () => {
    if (!audio.audioData) return;

    if (isPlaying) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
        sourceRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      const audioCtx = getAudioContext();
      const bytes = decodeBase64(audio.audioData);
      const buffer = await decodeAudioData(bytes, audioCtx);
      const source = await playAudioBuffer(buffer, audioCtx);
      
      sourceRef.current = source;
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audio.audioData) return;

    const bytes = decodeBase64(audio.audioData);
    const wavBlob = pcmToWav(bytes, 24000);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonic_ai_${audio.voiceName.replace(/[()]/g, '').replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(audio.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`glass-panel p-6 rounded-[2rem] flex flex-col gap-4 group border-l-4 transition-all hover:bg-white/[0.04] animate-in fade-in slide-in-from-right-4 duration-500 border-l-blue-500/80`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
              {audio.type === 'single' ? `Master: ${audio.voiceName}` : 'Conversation'}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/10'}`}></div>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            {new Date(audio.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
            onClick={handleCopyText}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Copy Text"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
          <button 
            onClick={() => onDelete(audio.id)}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
            title="Archive"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 line-clamp-2 italic font-light leading-relaxed">
        "{audio.text}"
      </p>

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleTogglePlayback}
          className={`flex-[3] py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 ${
            isPlaying 
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
              : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
          }`}
        >
          {isPlaying ? (
            <>
              <div className="flex gap-1 h-3 items-center">
                <div className="w-1 bg-white animate-[pulse_1s_infinite]"></div>
                <div className="w-1 bg-white animate-[pulse_1s_infinite_0.2s]"></div>
                <div className="w-1 bg-white animate-[pulse_1s_infinite_0.4s]"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Suspending</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Initialize Master</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex-1 py-3.5 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-all flex items-center justify-center active:scale-90"
          title="Export WAV"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
