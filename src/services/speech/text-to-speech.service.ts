'use client';

export interface TextToSpeechService {
  isSupported(): boolean;
  speak(text: string, onStart?: () => void, onEnd?: () => void): void;
  stop(): void;
  isSpeaking(): boolean;
}

export class WebSpeechTTSService implements TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  isSupported(): boolean {
    return Boolean(this.synth);
  }

  isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    this.stop();

    // Clean text of markdown characters before speaking
    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    try {
      this.synth.speak(utterance);
    } catch {
      onEnd?.();
    }
  }

  stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }
  }
}
