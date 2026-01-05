
import React from 'react';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selected: VoiceName;
  onSelect: (voice: VoiceName) => void;
  label?: string;
}

const VOICES: { name: VoiceName; description: string; accent: string }[] = [
  { name: 'Kore', description: 'Commanding', accent: 'from-blue-600' },
  { name: 'Puck', description: 'Youthful', accent: 'from-green-500' },
  { name: 'Charon', description: 'Profound', accent: 'from-purple-600' },
  { name: 'Fenrir', description: 'Vibrant', accent: 'from-orange-500' },
  { name: 'Zephyr', description: 'Polished', accent: 'from-pink-600' },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selected, onSelect, label }) => {
  return (
    <div className="flex flex-col gap-5">
      {label && (
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] pl-3">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {VOICES.map((v) => {
          const isActive = selected === v.name;
          return (
            <button
              key={v.name}
              onClick={() => onSelect(v.name)}
              className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all duration-500 h-32 text-center group relative overflow-hidden ${
                isActive
                  ? 'bg-white/[0.08] border-white/20 text-white shadow-2xl scale-[1.05]'
                  : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.04] hover:border-white/10'
              }`}
            >
              {/* Animated Glow Backing for active selection */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${v.accent} to-transparent opacity-20 blur-2xl animate-pulse`}></div>
              )}
              
              <div className={`w-2 h-2 rounded-full mb-3 transition-all duration-500 ${isActive ? 'bg-white scale-125' : 'bg-white/10 group-hover:bg-white/30'}`}></div>

              <span className={`text-sm font-black tracking-tighter mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-300'}`}>
                {v.name.toUpperCase()}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>
                {v.description}
              </span>

              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
