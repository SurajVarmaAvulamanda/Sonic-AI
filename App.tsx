
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
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Application State
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

  // Apply Theme
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

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
    <div className="min-h-screen pb-32 px-6 pt-16 max-w-7xl mx-auto relative z-10">
      {/* Motion Background */}
      <div className="motion-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header className="mb-16 flex flex-col items-center relative">
        <div className="absolute right-0 top-0">
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-full glass-panel hover:bg-white/10 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>

        <div className="inline-block mb-6 animate-float">
          <div className="relative p-6 glass-panel rounded-full shadow-2xl">
            <svg className="w-10 h-10 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 uppercase italic leading-none bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] drop-shadow-sm">
          Sonic Studio
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg font-medium">
          Premium AI Voice Studio. Generate studio-quality narrations and multi-speaker dialogues.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-12">

          {/* Phase 01: Concept & Setup */}
          <section className="glass-panel section-primary p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[var(--bg-tertiary)] p-1 rounded-2xl flex border border-[var(--border-color)]">
                    <button onClick={() => setStudioMode('single')} className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${studioMode === 'single' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>SOLO NARRATOR</button>
                    <button onClick={() => setStudioMode('conversation')} className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${studioMode === 'conversation' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>CONVERSATION</button>
                  </div>
                </div>
                <div className="bg-[var(--bg-tertiary)] p-1.5 rounded-2xl flex border border-[var(--border-color)]">
                  <button onClick={() => setScriptStrategy('short')} className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${scriptStrategy === 'short' ? 'bg-[var(--accent-secondary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>SHORT (500)</button>
                  <button onClick={() => setScriptStrategy('long')} className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all ${scriptStrategy === 'long' ? 'bg-[var(--accent-secondary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>LONG (2000)</button>
                </div>
              </div>

              {studioMode === 'conversation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  {speakers.map((speaker, idx) => (
                    <div key={speaker.id} className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest">Speaker {idx + 1}</span>
                        <input
                          value={speaker.name}
                          onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                          className="bg-transparent text-right text-xs font-bold text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-[var(--accent-primary)]"
                          placeholder="Name"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as VoiceName[]).map(v => (
                          <button
                            key={v}
                            onClick={() => updateSpeaker(speaker.id, { voice: v })}
                            className={`p-2 rounded-lg text-[8px] font-black border transition-all ${speaker.voice === v ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
                          >
                            {v.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4 bg-[var(--bg-tertiary)] p-6 rounded-3xl border border-[var(--border-color)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Creative Mode</label>
                    <span className="text-[var(--accent-primary)] font-black text-[10px] italic">{useCase} Mode</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {USE_CASES.map(item => (
                      <button key={item.id} onClick={() => setUseCase(item.id)} className={`py-2 rounded-xl text-[8px] font-black border transition-all truncate ${useCase === item.id ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-lg' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)]'}`} title={item.label}>{item.label.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4 bg-[var(--bg-tertiary)] p-6 rounded-3xl border border-[var(--border-color)]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Target Length</label>
                    <span className="text-[var(--accent-secondary)] font-black text-[10px] italic">{targetWords} Words</span>
                  </div>
                  <input
                    type="range"
                    min={scriptStrategy === 'short' ? 10 : 501}
                    max={scriptStrategy === 'short' ? 500 : 2000}
                    step={10}
                    value={targetWords}
                    onChange={(e) => setTargetWords(parseInt(e.target.value))}
                    className="w-full accent-[var(--accent-secondary)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Target Language</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[140px] overflow-y-auto p-2 custom-scrollbar border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)]">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`py-2 px-2 rounded-xl text-[8px] font-black border transition-all truncate ${selectedLanguage === lang ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                      title={lang}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`Concept: ${useCase === 'Cinematic' ? 'The fall of an ancient empire...' : useCase === 'Podcast' ? 'Discussing the future of Mars...' : 'Describe your project...'}`}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl py-6 px-8 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-lg min-h-[120px] resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleCreateScript}
                disabled={isGeneratingScript || !topic.trim()}
                className="w-full sonic-button py-6 rounded-3xl font-black text-xl tracking-tighter uppercase italic flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingScript ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>{`Drafting ${useCase} Masterpiece...`}</span>
                  </>
                ) : `Generate ${useCase} Script`}
              </button>
            </div>
          </section>

          {/* Phase 02: Editor & Synthesis */}
          <section ref={editorRef} className={`glass-panel p-10 rounded-[2.5rem] transition-all duration-700 ${!scriptTitle && 'opacity-30 pointer-events-none grayscale'}`}>
            <div className="flex flex-col gap-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[10px] font-black tracking-[0.4em] text-[var(--accent-secondary)] uppercase">Phase 02</h2>
                    <span className="text-[10px] text-[var(--text-muted)] font-black tracking-widest italic">• {studioMode.toUpperCase()} STUDIO ACTIVE</span>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter italic text-[var(--text-primary)] drop-shadow-sm">{scriptTitle || "Editor Master"}</h3>
                </div>
                <button
                  onClick={handleCreateScript}
                  disabled={isGeneratingScript}
                  title="Regenerate with different flow"
                  className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-all group"
                >
                  <svg className={`w-6 h-6 ${isGeneratingScript ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>

              {studioMode === 'single' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <VoiceSelector selected={singleVoice} onSelect={setSingleVoice} label="Solo Voice Archetype" />
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-1">Vocal Dynamics</label>
                    <div className="grid grid-cols-6 gap-2">
                      {MOODS.map(m => (
                        <button key={m} onClick={() => setSingleMood(m)} className={`px-2 py-3 rounded-xl text-[9px] font-black border transition-all ${singleMood === m ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-lg' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>{m.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--border-color)]">
                {[
                  { label: 'Naturalness', field: 'naturalness' },
                  { label: 'Stability', field: 'stability' },
                  { label: 'Clarity', field: 'clarity' }
                ].map(p => (
                  <div key={p.label} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase"><label className="text-[var(--accent-primary)]">{p.label}</label><span className="text-[var(--text-primary)]">{Math.round((params as any)[p.field] * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.05" value={(params as any)[p.field]} onChange={(e) => updateParam(p.field as any, +e.target.value)} className="w-full accent-[var(--accent-primary)]" />
                  </div>
                ))}
              </div>

              {/* High Contrast Light Editor Area */}
              <div className="relative group/editor">
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-[2rem] blur opacity-25 group-hover/editor:opacity-50 transition duration-1000"></div>
                <textarea
                  value={singleText}
                  onChange={(e) => setSingleText(e.target.value)}
                  className="relative w-full h-[450px] bg-slate-50 dark:bg-slate-900 rounded-3xl p-10 border border-[var(--border-color)] text-slate-800 dark:text-slate-200 text-xl leading-relaxed focus:outline-none resize-none font-serif italic shadow-inner custom-scrollbar selection:bg-blue-200 dark:selection:bg-blue-800"
                  placeholder="The script will appear here for final artistic refinement..."
                />
              </div>

              <div className="grid grid-cols-4 gap-4 p-8 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--border-color)]">
                {[
                  { label: 'Pace', field: 'rate', min: 0.5, max: 2, step: 0.1 },
                  { label: 'Tone', field: 'pitch', min: 0.5, max: 1.5, step: 0.05 },
                  { label: 'Power', field: 'volume', min: 0.2, max: 2, step: 0.1 },
                  { label: 'Breath', field: 'pauseIntensity', min: 0, max: 2, step: 0.1 }
                ].map(p => (
                  <div key={p.label} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase"><label>{p.label}</label><span className="text-[var(--text-primary)]">{(params as any)[p.field]}x</span></div>
                    <input type="range" min={p.min} max={p.max} step={p.step} value={(params as any)[p.field]} onChange={(e) => updateParam(p.field as any, +e.target.value)} className="w-full accent-[var(--accent-primary)]" />
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateAudio}
                disabled={isLoading || !singleText.trim() || isGeneratingScript}
                className="w-full sonic-button py-8 rounded-3xl font-black text-3xl tracking-tighter shadow-lg transition-all disabled:opacity-50 text-white uppercase italic flex items-center justify-center gap-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>{`Mastering ${useCase} Output...`}</span>
                  </>
                ) : `Engage Vocal Engine`}
              </button>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Studio Vault</h2>
            <span className="text-[10px] text-[var(--accent-primary)] font-black tracking-widest">{history.length} MASTER FILES</span>
          </div>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="glass-panel p-20 rounded-3xl border-dashed border border-[var(--border-color)] flex flex-col items-center opacity-40 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Studio vault empty</p>
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-pulse border border-red-400">
          <span className="font-black text-[10px] uppercase tracking-widest">{error}</span>
          <button onClick={() => setError(null)} className="hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
