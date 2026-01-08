
export type Screen = 'SPLASH' | 'GENERATOR' | 'HISTORY' | 'PRESETS';

export interface Voice {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  personality: string;
  prebuiltName: string; // Used for Gemini API
}

export interface Generation {
  id: string;
  text: string;
  voiceId: string;
  timestamp: number;
  audioUrl?: string;
  settings: GenerationSettings;
}

export interface GenerationSettings {
  language: 'bangla' | 'english' | 'banglish';
  accent: 'dhaka' | 'chittagong' | 'sylheti' | 'trendy' | 'news';
  speed: number;
  emotion: number;
  pitch: number;
}
