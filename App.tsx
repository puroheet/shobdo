
import React, { useState, useEffect, useRef } from 'react';
import { Screen, Voice, Generation, GenerationSettings } from './types';
import { VOICES, ICONS } from './constants';
import { Button } from './components/ui/Button';
import { BottomSheet } from './components/ui/BottomSheet';
import { generateTTS } from './services/geminiService';

const ACCENTS: { id: GenerationSettings['accent']; label: string; color: string }[] = [
  { id: 'dhaka', label: 'DHAKA', color: 'blue' },
  { id: 'chittagong', label: 'CHITTAGONG', color: 'violet' },
  { id: 'sylheti', label: 'SYLHETI', color: 'emerald' },
  { id: 'trendy', label: 'TRENDY YOUTH', color: 'rose' },
  { id: 'news', label: 'NEWS REPORTER', color: 'amber' },
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice>(VOICES[0]);
  const [settings, setSettings] = useState<GenerationSettings>({
    language: 'bangla',
    accent: 'dhaka',
    speed: 1,
    emotion: 0.5,
    pitch: 1
  });
  const [history, setHistory] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (currentScreen === 'SPLASH') {
      const timer = setTimeout(() => setCurrentScreen('GENERATOR'), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const { buffer, blob } = await generateTTS(text, selectedVoice.prebuiltName);
      const audioUrl = URL.createObjectURL(blob);
      
      const newGeneration: Generation = {
        id: Date.now().toString(),
        text,
        voiceId: selectedVoice.id,
        timestamp: Date.now(),
        audioUrl: audioUrl,
        settings: { ...settings }
      };

      setHistory(prev => [newGeneration, ...prev]);

      // Play audio immediately
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();

    } catch (error) {
      console.error("Failed to generate voice:", error);
      alert("Something went wrong. High load maybe?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (item: Generation) => {
    if (!item.audioUrl) return;
    const link = document.createElement('a');
    link.href = item.audioUrl;
    link.download = `shobdo_voice_${item.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSplashScreen = () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-violet-600/20 blur-[100px] rounded-full delay-700"></div>
      
      <div className="z-10 text-center flex flex-col items-center gap-6">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
          <span className="text-4xl font-black text-black">SH</span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter gradient-text uppercase">SHOBDO</h1>
        <p className="text-neutral-500 font-medium tracking-widest text-sm animate-bounce">
          BANGLA, BUT NEXT-GEN.
        </p>
      </div>
    </div>
  );

  const renderGenerator = () => (
    <div className="min-h-screen max-w-md mx-auto flex flex-col bg-[#050505] p-6 pb-24 relative overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black gradient-text">SHOBDO</h2>
          <p className="text-xs text-neutral-500 font-medium">Make it hit different.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentScreen('HISTORY')}>
            <ICONS.History className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentScreen('PRESETS')}>
            <ICONS.Bookmark className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Input Area */}
      <div className="glass rounded-[32px] p-6 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="এখানে বাংলা বা English লিখুন..."
          className="w-full h-40 bg-transparent border-none outline-none text-xl font-medium placeholder:text-neutral-700 resize-none font-bangla"
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['bangla', 'english', 'banglish'].map(lang => (
              <button
                key={lang}
                onClick={() => setSettings(s => ({ ...s, language: lang as any }))}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${settings.language === lang ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-600 font-mono">{text.length}/500</p>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-neutral-400">VOICE VIBE</h3>
          <button onClick={() => setIsVoicePickerOpen(true)} className="text-xs font-bold text-blue-500">SEE ALL</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {VOICES.slice(0, 3).map(voice => (
            <div 
              key={voice.id}
              onClick={() => setSelectedVoice(voice)}
              className={`flex-shrink-0 w-28 p-3 rounded-3xl transition-all cursor-pointer ${selectedVoice.id === voice.id ? 'glass border-white/20' : 'bg-transparent border border-transparent'}`}
            >
              <img src={voice.avatar} className="w-14 h-14 rounded-2xl mb-2 object-cover" />
              <h4 className="text-sm font-bold truncate">{voice.name}</h4>
              <p className="text-[10px] text-neutral-500 truncate">{voice.tagline}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Settings */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-neutral-400">STYLE LAB</h3>
          <button onClick={() => setIsLabOpen(true)} className="p-2 bg-neutral-900 rounded-full">
            <ICONS.Settings className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ACCENTS.map(acc => {
            const isActive = settings.accent === acc.id;
            const colorClasses: Record<string, string> = {
              blue: isActive ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500',
              violet: isActive ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500',
              emerald: isActive ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500',
              rose: isActive ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500',
              amber: isActive ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500',
            };
            
            return (
              <button
                key={acc.id}
                onClick={() => setSettings(s => ({ ...s, accent: acc.id }))}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black tracking-wider transition-all border ${colorClasses[acc.color]}`}
              >
                {acc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-48px)] z-40">
        <div className="glass p-3 rounded-[32px] flex gap-3 items-center shadow-2xl">
          <Button 
            variant="neon" 
            size="lg" 
            fullWidth 
            onClick={handleGenerate}
            disabled={isLoading || !text.trim()}
            className="rounded-2xl h-14"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                COOKING...
              </span>
            ) : (
              <span className="flex items-center gap-2 tracking-widest uppercase">
                <ICONS.Play className="w-5 h-5" /> VOICE, WITH FEELING.
              </span>
            )}
          </Button>
          <Button variant="secondary" size="icon" className="h-14 w-16 flex-shrink-0">
            <ICONS.Regenerate className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <BottomSheet isOpen={isVoicePickerOpen} onClose={() => setIsVoicePickerOpen(false)} title="Pick Your Persona">
        <div className="grid grid-cols-1 gap-4 mt-4">
          {VOICES.map(voice => (
            <div 
              key={voice.id} 
              onClick={() => { setSelectedVoice(voice); setIsVoicePickerOpen(false); }}
              className={`flex items-center gap-4 p-4 rounded-3xl transition-all cursor-pointer ${selectedVoice.id === voice.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <img src={voice.avatar} className="w-16 h-16 rounded-2xl object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-lg">{voice.name}</h4>
                <p className="text-sm text-neutral-400">{voice.personality}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg uppercase">
                  {voice.tagline}
                </div>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={isLabOpen} onClose={() => setIsLabOpen(false)} title="Style & Emotion Lab">
        <div className="space-y-8 mt-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Speed (গতি)</label>
              <span className="text-xs font-mono">{settings.speed}x</span>
            </div>
            <input 
              type="range" min="0.5" max="2" step="0.1" 
              value={settings.speed} 
              onChange={(e) => setSettings(s => ({ ...s, speed: parseFloat(e.target.value) }))}
              className="w-full accent-blue-500 h-1 bg-neutral-800 rounded-lg appearance-none" 
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Emotion (আবেগ)</label>
              <span className="text-xs font-mono">{Math.round(settings.emotion * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={settings.emotion} 
              onChange={(e) => setSettings(s => ({ ...s, emotion: parseFloat(e.target.value) }))}
              className="w-full accent-violet-500 h-1 bg-neutral-800 rounded-lg appearance-none" 
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Pitch (স্বর)</label>
              <span className="text-xs font-mono">{settings.pitch}</span>
            </div>
            <input 
              type="range" min="0.5" max="1.5" step="0.1" 
              value={settings.pitch} 
              onChange={(e) => setSettings(s => ({ ...s, pitch: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-lg appearance-none" 
            />
          </div>
          <Button variant="primary" fullWidth size="lg" onClick={() => setIsLabOpen(false)}>
            DONE, BESTIE
          </Button>
        </div>
      </BottomSheet>
    </div>
  );

  const renderHistory = () => (
    <div className="min-h-screen max-w-md mx-auto bg-[#050505] p-6 pb-12 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setCurrentScreen('GENERATOR')}>
          <ICONS.ChevronLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl font-black">History</h2>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
          <ICONS.Mic className="w-16 h-16 mb-4 text-neutral-700" />
          <p className="text-lg font-bold">Empty Vibe.</p>
          <p className="text-sm">Start generating some heat in the generator.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(item => {
            const voice = VOICES.find(v => v.id === item.voiceId) || VOICES[0];
            return (
              <div key={item.id} className="glass p-4 rounded-3xl flex items-center gap-4 group">
                <img src={voice.avatar} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate font-bangla">{item.text}</p>
                  <p className="text-[10px] text-neutral-500">{new Date(item.timestamp).toLocaleTimeString()} • {voice.name}</p>
                </div>
                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-10 h-10 hover:bg-emerald-500/20 hover:text-emerald-400"
                    onClick={() => handleDownload(item)}
                    title="Download Audio"
                  >
                    <ICONS.Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="rounded-full w-10 h-10"
                    onClick={async () => {
                      if (item.audioUrl) {
                        const response = await fetch(item.audioUrl);
                        const blob = await response.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
                        const source = ctx.createBufferSource();
                        source.buffer = decodedBuffer;
                        source.connect(ctx.destination);
                        source.start();
                      }
                    }}
                  >
                    <ICONS.Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPresets = () => (
    <div className="min-h-screen max-w-md mx-auto bg-[#050505] p-6 pb-12 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setCurrentScreen('GENERATOR')}>
          <ICONS.ChevronLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl font-black">Saved Presets</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Lo-Fi Chill', color: 'bg-blue-600/20 text-blue-400' },
          { name: 'Angry Rant', color: 'bg-red-600/20 text-red-400' },
          { name: 'Poetry Night', color: 'bg-violet-600/20 text-violet-400' },
          { name: 'News Desk', color: 'bg-emerald-600/20 text-emerald-400' }
        ].map(preset => (
          <div key={preset.name} className={`glass p-6 rounded-[32px] flex flex-col items-center gap-4 cursor-pointer hover:border-white/20 transition-all`}>
            <div className={`w-12 h-12 rounded-full ${preset.color} flex items-center justify-center`}>
              <ICONS.Bookmark className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">{preset.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  switch (currentScreen) {
    case 'SPLASH': return renderSplashScreen();
    case 'GENERATOR': return renderGenerator();
    case 'HISTORY': return renderHistory();
    case 'PRESETS': return renderPresets();
    default: return renderGenerator();
  }
};

export default App;
