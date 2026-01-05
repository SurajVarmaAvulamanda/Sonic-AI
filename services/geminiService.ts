
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VoiceName, SpeechParams, DialogueLine, Language, UseCase, SpeakerConfig } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateScript(
  topic: string, 
  mode: 'short' | 'long', 
  language: Language, 
  targetWordCount: number,
  useCase: UseCase = 'YouTube',
  studioMode: 'single' | 'conversation' = 'single',
  speakers?: SpeakerConfig[]
): Promise<any> {
  const ai = getAIClient();
  
  const toneMap = {
    YouTube: "conversational, energetic, and community-driven",
    Ad: "persuasive, high-impact, and premium",
    Education: "clear, authoritative, and patient",
    Podcast: "unscripted, relaxed, friendly, and engaging podcast dialogue",
    Cinematic: "dramatic, atmospheric, intense, and high-stakes cinematic narration",
    Story: "immersive, expressive, narrative-driven storytelling",
    Documentary: "informative, steady, profound, and observant",
    Gaming: "dynamic, character-driven, and high-energy game dialogue"
  };

  const speakerContext = studioMode === 'conversation' && speakers 
    ? `Available Speakers: ${speakers.map(s => `${s.name} (assigned voice archetype: ${s.voice})`).join(', ')}.`
    : '';

  let modeSpecifics = '';
  if (useCase === 'Podcast') {
    modeSpecifics = `
PODCAST ENGINE ACTIVE:
- Style: Sound relaxed and unscripted. 
- Structure: Use short sentences and natural phrasing.
- Interaction: Include natural interruptions and reactive dialogue (e.g., "Right," "Exactly").
- Pacing: Heavily utilize [Breath] and [Soft Pause] tags.`;
  } else if (useCase === 'Cinematic') {
    modeSpecifics = `
CINEMATIC ENGINE ACTIVE:
- Style: Atmospheric and heavy. 
- Structure: Deliberate, powerful sentences.
- Pacing: Long [Pause] tags for dramatic tension.
- Tone: Deep and resonant. Use [Confident] and [Calm] markers frequently.`;
  } else if (useCase === 'Story') {
    modeSpecifics = `
STORYTELLING ENGINE ACTIVE:
- Style: Immersive and warm.
- Structure: Narrative flow with descriptive imagery.
- Tone: Varied. Shift between [Calm] for exposition and [Excited] for action.
- Pacing: Use [Soft Pause] to let the listener absorb the setting.`;
  } else if (useCase === 'Gaming') {
    modeSpecifics = `
GAMING ENGINE ACTIVE:
- Style: Intense and character-specific.
- Structure: Short, punchy lines suitable for barks or cutscenes.
- Tone: Use [Excited] or [Confident] for combat/action contexts.`;
  }

  const systemInstruction = `You are an advanced AI Voice Naturalization & Creative Script Engine for "Sonic Studio".
Your task is to generate ultra-natural, human-like, voice-ready scripts optimized for neural TTS.

${studioMode === 'conversation' ? `STUDIO MODE: MULTI-SPEAKER DIALOGUE.
FORMAT: Each line must start with "Speaker Name: [Tag] text".
${speakerContext}
${modeSpecifics}
Ensure a natural back-and-forth flow.` : `STUDIO MODE: SOLO NARRATOR. ${modeSpecifics}`}

RULES:
1. Output ONLY the final script within the JSON structure.
2. Use-Case: ${useCase} (${toneMap[useCase]}).
3. Language: ${language}.
4. Target Word Count: Approximately ${targetWordCount} words.
5. Voice Tags (VITAL): 
   - [Breath]: Natural quick breath between thoughts.
   - [Pause]: Meaningful silence for emphasis.
   - [Soft Pause]: Micro-pause for conversational rhythm.
6. Emotional Markers: Use [Calm], [Confident], or [Excited] to transition the delivery tone.
7. Realism: Avoid robotic or formal structures. Simulate human breathing and conversational flow.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      script: { type: Type.STRING },
      tone: { type: Type.STRING },
      actualWordCount: { type: Type.INTEGER }
    },
    required: ['title', 'script', 'tone', 'actualWordCount']
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: `Topic/Concept: ${topic}\nLanguage: ${language}\nLength: ${targetWordCount} words.` }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  if (!response.text) throw new Error("Synthesis service unavailable.");
  return JSON.parse(response.text.trim());
}

export async function generateSingleSpeakerAudio(
  text: string, 
  voice: VoiceName, 
  style: string,
  params: SpeechParams,
  language: Language = 'English'
): Promise<string> {
  const ai = getAIClient();
  
  // We keep the tags like [Breath] and [Pause] because Gemini TTS can interpret them 
  // if instructed correctly in the prompt below.
  const prompt = `ACT AS AN ULTRA-NATURAL ${language.toUpperCase()} VOICE.
Context: Performing a script in ${style} style.
Performance: Naturalness ${params.naturalness}, Stability ${params.stability}, Clarity ${params.clarity}.
Speed: ${params.rate}x. Volume: ${params.volume}x. Pitch: ${params.pitch}x.
CRITICAL PERFORMANCE INSTRUCTION: 
Whenever you see [Breath], [Pause], or [Soft Pause] tags, do not speak them. Instead, perform the action they describe.
Perform [Breath] as a quick inhaled breath.
Perform [Pause] as a 1-second silence.
Perform [Soft Pause] as a micro-silence for rhythm.
Text to Perform: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  if (!data) throw new Error("Audio synthesis failed.");
  return data;
}

export async function generateMultiSpeakerAudio(
  text: string, 
  speakers: SpeakerConfig[],
  params: SpeechParams,
  language: Language = 'English'
): Promise<string> {
  const ai = getAIClient();
  
  const prompt = `PERFORM AS A HIGH-QUALITY ${language.toUpperCase()} NATURAL CONVERSATION.
Pacing: ${params.rate}x speed. 
Whenever you see performance tags like [Breath] or [Pause], execute them as vocal actions, do not speak them.
Goal: Human flow with appropriate emotional transitions using [Calm], [Confident], or [Excited].
Script:
${text}`;

  const speakerConfigs = speakers.slice(0, 2).map((s) => ({
    speaker: s.name,
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: s.voice }
    }
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerConfigs
        }
      }
    }
  });

  const data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
  if (!data) throw new Error("Conversation synthesis failed.");
  return data;
}
