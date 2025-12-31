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
        try { sourceRef.current.stop(); } catch (e) { }
      }
    };
  }, []);

  const handleTogglePlayback = async () => {
    if (!audio.audioData) return;

    if (isPlaying) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) { }
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
    <div className={`glass-panel p-4 rounded-2xl flex flex-col gap-3 group border-l-4 hover:bg-[var(--bg-tertiary)] transition-all border-l-[var(--accent-primary)]`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
            {audio.type === 'single' ? `Voice: ${audio.voiceName}` : 'Dialogue'}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {new Date(audio.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleCopyText}
            title="Copy content"
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onDelete(audio.id)}
            title="Delete"
            className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 italic font-medium">
        "{audio.text}"
      </p>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleTogglePlayback}
          className={`flex-[2] py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${isPlaying
              ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40'
              : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
        >
          {isPlaying ? (
            <>
              <svg className="w-3.5 h-3.5 fill-current text-[var(--accent-primary)]" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest">Pause</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 fill-current text-[var(--accent-primary)]" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest">Play</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/40 text-blue-300 border-[var(--accent-primary)]/30`}
          title="Save as WAV"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Save</span>
        </button>
      </div>
    </div>
  );
};
