
import React, { useState, useRef, useEffect } from 'react';
import { VoiceName, GeneratedAudio, SpeechParams, Language, UseCase, SpeakerConfig } from './types';
import { generateSingleSpeakerAudio, generateMultiSpeakerAudio, generateScript } from './services/geminiService';
import { VoiceSelector } from './components/VoiceSelector';
import { AudioCard } from './components/AudioCard';

type Mood = 'Natural' | 'Dramatic' | 'Whisper' | 'Corporate' | 'Cheerful' | 'Deep';
const MOODS: Mood[] = ['Natural', 'Dramatic', 'Whisper', 'Corporate', 'Cheerful', 'Deep'];

const LANGUAGES: Language[] = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 
  'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic', 
  'Portuguese', 'Italian', 'Korean', 'Russian', 'Indonesian', 
  'Turkish', 'Vietnamese', 'Polish', 'Dutch', 'Thai'
];

const USE_CASES: { id: UseCase, label: string }[] = [
  { id: 'Podcast', label: 'Podcast' },
  { id: 'Cinematic', label: 'Cinematic' },
  { id: 'Story', label: 'Story' },
  { id: 'Documentary', label: 'Document' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'Ad', label: 'Ad Copy' },
  { id: 'Education', label: 'E-Learn' }
];

const App: React.FC = () => {
  const [studioMode, setStudioMode] = useState<'single' | 'conversation'>('single');
  const [scriptStrategy, setScriptStrategy] = useState<'short' | 'long'>('short');
  const [useCase, setUseCase] = useState<UseCase>('Podcast');
  const [targetWords, setTargetWords] = useState(100);
  const [topic, setTopic] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptTitle, setScriptTitle] = useState('');
  const [singleText, setSingleText] = useState('');
  
  const [speakers, setSpeakers] = useState<SpeakerConfig[]>([
    { id: '1', name: 'Host', voice: 'Zephyr' },
    { id: '2', name: 'Guest', voice: 'Puck' }
  ]);
  
  const [singleVoice, setSingleVoice] = useState<VoiceName>('Zephyr');
  const [singleMood, setSingleMood] = useState<Mood>('Natural');
  const [params, setParams] = useState<SpeechParams>({
    rate: 1.0, volume: 1.0, pitch: 1.0, pauseIntensity: 1.0,
    naturalness: 0.85, stability: 0.60, clarity: 0.9
  });

  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Sync defaults based on UseCase
  useEffect(() => {
    if (useCase === 'Podcast' || useCase === 'Cinematic' || useCase === 'Story') {
      setScriptStrategy('long');
      setTargetWords(prev => (prev < 500 ? 1000 : prev));
      if (useCase === 'Podcast') setStudioMode('conversation');
    }
  }, [useCase]);

  useEffect(() => {
    if (scriptStrategy === 'short') {
      setTargetWords(prev => (prev > 500 ? 250 : prev));
    } else {
      setTargetWords(prev => (prev < 500 ? 1000 : prev));
    }
  }, [scriptStrategy]);

  const handleCreateScript = async () => {
    if (!topic.trim()) return;
    setIsGeneratingScript(true);
    setError(null);
    try {
      const result = await generateScript(topic, scriptStrategy, selectedLanguage, targetWords, useCase, studioMode, speakers);
      setScriptTitle(result.title);
      setSingleText(result.script);
      editorRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError("Script generation failed. Try a different topic.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!singleText.trim()) return;
      let base64 = '';
      if (studioMode === 'single') {
        base64 = await generateSingleSpeakerAudio(singleText, singleVoice, singleMood, params, selectedLanguage);
      } else {
        base64 = await generateMultiSpeakerAudio(singleText, speakers, params, selectedLanguage);
      }

      const newAudio: GeneratedAudio = {
        id: crypto.randomUUID(),
        text: singleText.slice(0, 100) + '...',
        timestamp: Date.now(),
        voiceName: studioMode === 'single' ? `${singleVoice} (${singleMood})` : `${speakers.length} Speakers`,
        type: studioMode === 'single' ? 'single' : 'multi',
        audioData: base64,
        params,
        language: selectedLanguage
      };
      
      setHistory(prev => [newAudio, ...prev]);
    } catch (err: any) {
      setError(err.message || "Synthesis error.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSpeaker = (id: string, updates: Partial<SpeakerConfig>) => {
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateParam = (field: keyof SpeechParams, val: number) => setParams(p => ({ ...p, [field]: val }));

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-8 pt-12 max-w-[1400px] mx-auto">
      {/* Premium Header */}
      <header className="mb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-8 animate-float shadow-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Next-Gen Audio Engine
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-6 sonic-text italic uppercase leading-[0.9]">
          Sonic Studio
        </h1>
        
        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium tracking-tight opacity-70">
          Orchestrate studio-quality narrations with ultra-natural AI. 
          The pinnacle of neural text-to-speech synthesis.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-12">
          
          {/* Phase 01: The Blueprint */}
          <section className="glass-panel p-8 sm:p-12 rounded-[3rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
            
            <div className="flex flex-col gap-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.5em] text-gray-500 uppercase mb-2">Phase 01</span>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">The Blueprint</h2>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-black/40 p-1.5 rounded-2xl flex border border-white/5 shadow-inner">
                    <button 
                      onClick={() => setStudioMode('single')} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${studioMode === 'single' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
                    >SOLO</button>
                    <button 
                      onClick={() => setStudioMode('conversation')} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${studioMode === 'conversation' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
                    >DUET</button>
                  </div>
                </div>
              </div>

              {studioMode === 'conversation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                  {speakers.map((speaker, idx) => (
                    <div key={speaker.id} className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] flex flex-col gap-6 hover:bg-white/[0.05] transition-all group">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest">Speaker 0{idx + 1}</span>
                        <input 
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                          className="bg-transparent text-right text-sm font-bold text-white focus:outline-none border-b border-transparent focus:border-blue-500/50 transition-all px-2"
                          placeholder="Cast Name"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as VoiceName[]).map(v => (
                          <button 
                            key={v}
                            onClick={() => updateSpeaker(speaker.id, { voice: v })}
                            className={`py-3 rounded-xl text-[9px] font-black border transition-all duration-300 ${speaker.voice === v ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black/30 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'}`}
                          >
                            {v.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Genre / Tone</label>
                    <span className="text-blue-400 font-bold text-[10px] uppercase">{useCase}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {USE_CASES.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => setUseCase(item.id)} 
                        className={`py-3 rounded-xl text-[8px] font-black border transition-all truncate ${useCase === item.id ? 'bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                      >
                        {item.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Word Count Limit</label>
                    <span className="text-pink-400 font-bold text-[10px] uppercase">{targetWords} Words</span>
                  </div>
                  <div className="pt-2">
                    <input 
                      type="range" 
                      min={scriptStrategy === 'short' ? 10 : 501} 
                      max={scriptStrategy === 'short' ? 500 : 2000} 
                      step={10} 
                      value={targetWords} 
                      onChange={(e) => setTargetWords(parseInt(e.target.value))} 
                      className="w-full" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Vocal Dialect</label>
                <div className="flex flex-wrap gap-2 p-3 bg-black/30 rounded-3xl border border-white/5">
                  {LANGUAGES.map(lang => (
                    <button 
                      key={lang} 
                      onClick={() => setSelectedLanguage(lang)} 
                      className={`px-4 py-2.5 rounded-xl text-[9px] font-black border transition-all ${selectedLanguage === lang ? 'bg-blue-600 text-white border-blue-400' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-pink-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`Brief your creative concept here... (e.g., "A tense sci-fi monologue about a space traveler")`}
                  className="relative w-full bg-black/60 border border-white/10 rounded-[2rem] py-8 px-10 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all text-xl min-h-[160px] resize-none leading-relaxed font-light"
                />
              </div>

              <button
                onClick={handleCreateScript}
                disabled={isGeneratingScript || !topic.trim()}
                className="btn-shine w-full bg-white text-black hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 py-8 rounded-[2rem] font-black text-2xl tracking-tighter transition-all uppercase italic shadow-2xl flex items-center justify-center gap-4 group"
              >
                {isGeneratingScript ? (
                  <>
                    <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                    <span className="animate-pulse">Architecting Script...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Creative Script</span>
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Phase 02: Editor Master - Premium Clarity */}
          <section ref={editorRef} className={`glass-panel p-10 sm:p-14 rounded-[3.5rem] transition-all duration-1000 ${!scriptTitle ? 'opacity-10 scale-95 pointer-events-none grayscale' : 'opacity-100 scale-100'}`}>
            <div className="flex flex-col gap-12">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.5em] text-blue-400 uppercase mb-2">Phase 02</span>
                  <h3 className="text-5xl font-black text-white italic uppercase tracking-tight">{scriptTitle || "Directing Master"}</h3>
                </div>
                <button 
                  onClick={handleCreateScript}
                  disabled={isGeneratingScript}
                  className="p-5 bg-white/5 border border-white/10 rounded-3xl text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
                >
                  <svg className={`w-8 h-8 ${isGeneratingScript ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>

              {studioMode === 'single' && (
                <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
                  <VoiceSelector selected={singleVoice} onSelect={setSingleVoice} label="Primary Voice Model" />
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Vocal Inflection</label>
                    <div className="flex flex-wrap gap-3">
                      {MOODS.map(m => (
                        <button 
                          key={m} 
                          onClick={() => setSingleMood(m)} 
                          className={`px-8 py-4 rounded-2xl text-[10px] font-black border transition-all duration-300 ${singleMood === m ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
                        >
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-black/40 rounded-[2.5rem] border border-white/5">
                {[
                  { label: 'Naturalness', field: 'naturalness', color: 'blue' },
                  { label: 'Stability', field: 'stability', color: 'pink' },
                  { label: 'Clarity', field: 'clarity', color: 'purple' }
                ].map(p => (
                  <div key={p.label} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{p.label}</label>
                      <span className="text-white font-black text-xs">{Math.round((params as any)[p.field] * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={(params as any)[p.field]} onChange={(e) => updateParam(p.field as any, +e.target.value)} className="w-full" />
                  </div>
                ))}
              </div>

              {/* Ultra Clear Editor Master Area */}
              <div className="relative group/editor">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/30 to-pink-500/30 rounded-[3rem] blur-2xl opacity-0 group-hover/editor:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 shadow-2xl">
                   <div className="absolute top-0 left-0 w-full h-12 bg-white/90 backdrop-blur flex items-center px-6 border-b border-black/10 z-10">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                      </div>
                      <span className="ml-auto text-[8px] font-black text-black/40 uppercase tracking-widest">Master Script Editor</span>
                   </div>
                   <textarea
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    className="w-full h-[500px] bg-[#f8fafc] text-[#0f172a] p-10 pt-16 text-2xl font-medium leading-relaxed focus:outline-none resize-none selection:bg-blue-100 custom-scrollbar"
                    placeholder="Refine your script here..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-10 bg-white/5 rounded-[2.5rem] border border-white/10">
                {[
                  { label: 'Speed', field: 'rate', min: 0.5, max: 2, step: 0.1 },
                  { label: 'Pitch', field: 'pitch', min: 0.5, max: 1.5, step: 0.05 },
                  { label: 'Volume', field: 'volume', min: 0.2, max: 2, step: 0.1 },
                  { label: 'Breath', field: 'pauseIntensity', min: 0, max: 2, step: 0.1 }
                ].map(p => (
                  <div key={p.label} className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{p.label}</label>
                      <span className="text-blue-400 font-bold text-[10px]">{(params as any)[p.field]}x</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} step={p.step} value={(params as any)[p.field]} onChange={(e) => updateParam(p.field as any, +e.target.value)} className="w-full" />
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateAudio}
                disabled={isLoading || !singleText.trim() || isGeneratingScript}
                className="btn-shine w-full sonic-gradient py-10 rounded-[2.5rem] font-black text-4xl tracking-tighter shadow-[0_30px_60px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 text-white uppercase italic flex items-center justify-center gap-6"
              >
                {isLoading ? (
                   <>
                    <div className="w-10 h-10 border-6 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">Mastering Audio...</span>
                   </>
                ) : (
                  <>
                    <span>Perform Studio Master</span>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Studio Vault Sidebar */}
        <aside className="xl:col-span-4 space-y-8 h-fit sticky top-12">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">Studio Vault</h2>
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400">
              {history.length} MASTERS
            </div>
          </div>
          
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto px-2 custom-scrollbar pb-10">
            {history.length === 0 ? (
              <div className="glass-panel p-20 rounded-[2.5rem] border-dashed border border-white/10 flex flex-col items-center opacity-30 text-center scale-95">
                <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Archive is empty</p>
              </div>
            ) : (
              history.map(audio => (
                <AudioCard key={audio.id} audio={audio} onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))} />
              ))
            )}
          </div>
        </aside>
      </div>

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 bg-red-600/90 backdrop-blur-xl text-white rounded-3xl shadow-[0_20px_50px_rgba(220,38,38,0.5)] flex items-center gap-6 z-50 border border-red-400 animate-in fade-in slide-in-from-bottom-8">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Engine Warning</span>
            <span className="font-bold text-sm tracking-tight">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-4 hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
