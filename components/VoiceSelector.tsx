import React from 'react';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selected: VoiceName;
  onSelect: (voice: VoiceName) => void;
  label?: string;
}

const VOICES: { name: VoiceName; description: string }[] = [
  { name: 'Kore', description: 'Deep & Commanding' },
  { name: 'Puck', description: 'Bright & Youthful' },
  { name: 'Charon', description: 'Mature & Steady' },
  { name: 'Fenrir', description: 'Energetic & Vibrant' },
  { name: 'Zephyr', description: 'Smooth & Professional' },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selected, onSelect, label }) => {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] pl-1">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {VOICES.map((v) => {
          const isActive = selected === v.name;
          return (
            <button
              key={v.name}
              onClick={() => onSelect(v.name)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 h-24 text-center group relative overflow-hidden ${isActive
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-lg scale-[1.02]'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]'
                }`}
            >
              {/* Liquid glow effect behind active */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent blur-xl opacity-50 -z-10 animate-pulse"></div>
              )}

              <span className={`text-xs font-black tracking-tighter mb-1 line-clamp-1 w-full ${isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                {v.name.toUpperCase()}
              </span>
              <span className={`text-[8px] font-bold uppercase tracking-widest leading-none line-clamp-2 px-1 ${isActive ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                {v.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
