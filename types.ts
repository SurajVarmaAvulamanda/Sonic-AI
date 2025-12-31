
export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type Language = 
  | 'English' 
  | 'Hindi' 
  | 'Telugu' 
  | 'Tamil' 
  | 'Kannada' 
  | 'Malayalam' 
  | 'Spanish' 
  | 'French' 
  | 'German' 
  | 'Japanese' 
  | 'Chinese' 
  | 'Arabic' 
  | 'Portuguese' 
  | 'Italian' 
  | 'Korean' 
  | 'Russian' 
  | 'Indonesian' 
  | 'Turkish' 
  | 'Vietnamese' 
  | 'Polish' 
  | 'Dutch' 
  | 'Thai';

export type UseCase = 'YouTube' | 'Ad' | 'Education' | 'Podcast' | 'Cinematic' | 'Story' | 'Documentary' | 'Gaming';

export interface SpeechParams {
  rate: number;
  volume: number;
  pitch: number;
  pauseIntensity: number;
  naturalness: number;
  stability: number;
  clarity: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  timestamp: number;
  voiceName: string;
  type: 'single' | 'multi';
  audioData?: string; // Base64 PCM for voice
  params?: SpeechParams;
  language?: Language;
}

export interface SpeakerConfig {
  id: string;
  name: string;
  voice: VoiceName;
}
