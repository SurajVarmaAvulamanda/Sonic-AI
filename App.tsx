
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

  // Synchronize defaults based on selected Use Case
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
      // Wait for React to render the newly visible section
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Script generation failed. Our neural engine is recalibrating.");
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
      console.error(err);
      setError(err.message || "Voice synthesis error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSpeaker = (id: string, updates: Partial<SpeakerConfig>) => {
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateParam = (field: keyof SpeechParams, val: number) => setParams(p => ({ ...p, [field]: val }));

  return (
    <div className="min-h-screen pb-32 px-4 sm:px-8 pt-12 max-w-[1400px] mx-auto selection:bg-blue-500/30">
      {/* Premium Header */}
      <header className="mb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-10 animate-float shadow-2xl backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Neural Soundworks 2.5
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-8 sonic-text italic uppercase leading-[0.85] filter drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          Sonic Studio
        </h1>
        
        <p className="text-gray-400 max-w-2xl mx-auto text-xl font-medium tracking-tight opacity-80 leading-relaxed">
          The world's most sophisticated AI voice engine. 
          <span className="block text-gray-500 text-base mt-2 font-normal">Generate studio-ready narrations with native emotional intelligence.</span>
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-16">
          
          {/* Phase 01: The Blueprint (Landing UI) */}
          <section className="glass-panel p-10 sm:p-14 rounded-[4rem] relative overflow-hidden group/blueprint">
            <div className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-blue-500 via-pink-500 to-transparent"></div>
            
            <div className="flex flex-col gap-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black tracking-[0.6em] text-blue-500 uppercase">Phase 01</span>
                    <div className="h-px w-8 bg-blue-500/30"></div>
                  </div>
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">The Blueprint</h2>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-black/40 p-1.5 rounded-[1.5rem] flex border border-white/5 shadow-2xl backdrop-blur-xl">
                    <button 
                      onClick={() => setStudioMode('single')} 
                      className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-500 ${studioMode === 'single' ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
                    >SOLO</button>
                    <button 
                      onClick={() => setStudioMode('conversation')} 
                      className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-500 ${studioMode === 'conversation' ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
                    >DUET</button>
                  </div>
                </div>
              </div>

              {studioMode === 'conversation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                  {speakers.map((speaker, idx) => (
                    <div key={speaker.id} className="p-10 bg-white/[0.03] border border-white/5 rounded-[3rem] flex flex-col gap-8 hover:bg-white/[0.05] transition-all duration-500 group/speaker shadow-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-[0.3em]">Actor 0{idx + 1}</span>
                        <input 
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                          className="bg-transparent text-right text-base font-bold text-white focus:outline-none border-b border-transparent focus:border-blue-500/50 transition-all px-2 placeholder:text-gray-700"
                          placeholder="Assign Name"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as VoiceName[]).map(v => (
                          <button 
                            key={v}
                            onClick={() => updateSpeaker(speaker.id, { voice: v })}
                            className={`aspect-square rounded-2xl text-[10px] font-black border transition-all duration-300 flex items-center justify-center ${speaker.voice === v ? 'bg-blue-600 border-blue-400 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'bg-black/30 border-white/5 text-gray-600 hover:text-gray-300 hover:border-white/10'}`}
                            title={v}
                          >
                            {v.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Acoustic Logic</label>
                    <span className="text-blue-400 font-black text-[10px] uppercase italic">{useCase} Style</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {USE_CASES.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => setUseCase(item.id)} 
                        className={`py-3.5 rounded-2xl text-[9px] font-black border transition-all duration-300 truncate ${useCase === item.id ? 'bg-white text-black border-white shadow-[0_15px_30px_rgba(255,255,255,0.15)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10'}`}
                      >
                        {item.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Synthesized Length</label>
                    <span className="text-pink-400 font-black text-[10px] uppercase italic">{targetWords} Words</span>
                  </div>
                  <div className="pt-3 px-2">
                    <input 
                      type="range" 
                      min={scriptStrategy === 'short' ? 10 : 501} 
                      max={scriptStrategy === 'short' ? 500 : 2000} 
                      step={10} 
                      value={targetWords} 
                      onChange={(e) => setTargetWords(parseInt(e.target.value))} 
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] pl-4">Linguistic Matrix</label>
                <div className="flex flex-wrap gap-2.5 p-5 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner">
                  {LANGUAGES.map(lang => (
                    <button 
                      key={lang} 
                      onClick={() => setSelectedLanguage(lang)} 
                      className={`px-5 py-3 rounded-xl text-[10px] font-black border transition-all duration-300 ${selectedLanguage === lang ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-transparent border-transparent text-gray-600 hover:text-gray-300'}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group/topic">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-600 rounded-[3rem] blur opacity-10 group-hover/topic:opacity-25 transition duration-1000"></div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`Concept: A late-night radio host discusses the discovery of extraterrestrial life...`}
                  className="relative w-full bg-black/70 border border-white/10 rounded-[2.5rem] py-10 px-12 text-white placeholder:text-gray-800 focus:outline-none focus:border-white/20 transition-all text-2xl min-h-[200px] resize-none leading-relaxed font-light shadow-2xl"
                />
              </div>

              <button
                onClick={handleCreateScript}
                disabled={isGeneratingScript || !topic.trim()}
                className="btn-shine w-full bg-white text-black hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 py-10 rounded-[3rem] font-black text-3xl tracking-tighter transition-all uppercase italic shadow-[0_40px_80px_-20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-6 group"
              >
                {isGeneratingScript ? (
                  <>
                    <div className="w-8 h-8 border-6 border-black/10 border-t-black rounded-full animate-spin"></div>
                    <span className="animate-pulse">Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Creative Script</span>
                    <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Phase 02: Editor Master */}
          <section ref={editorRef} className={`glass-panel p-10 sm:p-16 rounded-[5rem] transition-all duration-1000 ${!scriptTitle ? 'opacity-5 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <div className="flex flex-col gap-14">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.6em] text-pink-500 uppercase">Phase 02</span>
                    <div className="h-px w-8 bg-pink-500/30"></div>
                  </div>
                  <h3 className="text-6xl font-black text-white italic uppercase tracking-tight leading-none">{scriptTitle || "Directing Room"}</h3>
                </div>
                <button 
                  onClick={handleCreateScript}
                  disabled={isGeneratingScript}
                  className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-gray-500 hover:text-white hover:bg-white/10 transition-all group"
                  title="Rewrite Script"
                >
                  <svg className={`w-10 h-10 ${isGeneratingScript ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>

              {studioMode === 'single' && (
                <div className="space-y-14 animate-in fade-in zoom-in-95 duration-1000">
                  <VoiceSelector selected={singleVoice} onSelect={setSingleVoice} label="Master Vocal Archetype" />
                  
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] pl-4">Emotional Modulation</label>
                    <div className="flex flex-wrap gap-4">
                      {MOODS.map(m => (
                        <button 
                          key={m} 
                          onClick={() => setSingleMood(m)} 
                          className={`px-10 py-5 rounded-[1.5rem] text-xs font-black border transition-all duration-500 ${singleMood === m ? 'bg-blue-600 border-blue-400 text-white shadow-2xl scale-110' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}
                        >
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tuning */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-12 bg-black/50 rounded-[3.5rem] border border-white/5 shadow-inner">
                {[
                  { label: 'Naturalness', field: 'naturalness' },
                  { label: 'Stability', field: 'stability' },
                  { label: 'Clarity', field: 'clarity' }
                ].map(p => (
                  <div key={p.label} className="space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{p.label}</label>
                      <span className="text-white font-black text-sm">{Math.round((params as any)[p.field] * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={(params as any)[p.field]} onChange={(e) => updateParam(p.field as any, +e.target.value)} className="w-full" />
                  </div>
                ))}
              </div>

              {/* Ultra High Clarity Script Editor */}
              <div className="relative group/editor">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/40 to-pink-500/40 rounded-[4rem] blur-3xl opacity-0 group-hover/editor:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative overflow-hidden rounded-[3.5rem] border-4 border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                   <div className="absolute top-0 left-0 w-full h-16 bg-white flex items-center px-10 border-b border-black/5 z-20">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <span className="ml-auto text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Master Studio Terminal</span>
                   </div>
                   <textarea
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    className="w-full h-[600px] bg-slate-50 text-slate-900 p-12 pt-24 text-2xl font-medium leading-relaxed focus:outline-none resize-none selection:bg-blue-200 custom-scrollbar font-serif italic shadow-inner"
                    placeholder="Refining creative output..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-12 bg-white/5 rounded-[3.5rem] border border-white/10">
                {[
                  { label: 'Cadence', field: 'rate', min: 0.5, max: 2, step: 0.1 },
                  { label: 'Frequency', field: 'pitch', min: 0.5, max: 1.5, step: 0.05 },
                  { label: 'Amplify', field: 'volume', min: 0.2, max: 2, step: 0.1 },
                  { label: 'Tension', field: 'pauseIntensity', min: 0, max: 2, step: 0.1 }
                ].map(p => (
                  <div key={p.label} className="space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{p.label}</label>
                      <span className="text-blue-400 font-bold text-xs">{(params as any)[p.field]}x</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} step={p.step} value={(params as any)[p.field]} onChange={(e) => updateParam(p.field as any, +e.target.value)} className="w-full" />
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateAudio}
                disabled={isLoading || !singleText.trim() || isGeneratingScript}
                className="btn-shine w-full sonic-gradient py-12 rounded-[3.5rem] font-black text-5xl tracking-tighter shadow-[0_40px_100px_-20px_rgba(59,130,246,0.5)] transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-20 text-white uppercase italic flex items-center justify-center gap-8"
              >
                {isLoading ? (
                   <>
                    <div className="w-14 h-14 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">Synthesizing...</span>
                   </>
                ) : (
                  <>
                    <span>Perform Studio Master</span>
                    <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Studio Vault Sidebar */}
        <aside className="xl:col-span-4 space-y-10 h-fit sticky top-12 pb-20">
          <div className="flex items-center justify-between px-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em]">Archives</span>
              <h4 className="text-2xl font-black italic text-white uppercase tracking-tight">Studio Vault</h4>
            </div>
            <div className="px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs font-black text-blue-400 shadow-xl">
              {history.length} FILES
            </div>
          </div>
          
          <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto px-4 custom-scrollbar">
            {history.length === 0 ? (
              <div className="glass-panel p-24 rounded-[4rem] border-dashed border-2 border-white/5 flex flex-col items-center opacity-30 text-center group/empty transition-all hover:opacity-50">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover/empty:scale-110 transition-transform duration-700">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">No master tapes found in the current session</p>
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
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-12 py-6 bg-red-600/90 backdrop-blur-3xl text-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(220,38,38,0.6)] flex items-center gap-8 z-50 border border-red-400/50 animate-in fade-in slide-in-from-bottom-12 duration-500">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Engine Halt</span>
            <span className="font-bold text-lg tracking-tight">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-6 p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
