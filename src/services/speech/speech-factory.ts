'use client';

import { SpeechToTextService, WebSpeechSTTService } from './speech-to-text.service';
import { TextToSpeechService, WebSpeechTTSService } from './text-to-speech.service';

export class SpeechServiceFactory {
  private static sttInstance: SpeechToTextService | null = null;
  private static ttsInstance: TextToSpeechService | null = null;

  static getSTTService(): SpeechToTextService {
    if (!this.sttInstance) {
      this.sttInstance = new WebSpeechSTTService();
    }
    return this.sttInstance;
  }

  static getTTSService(): TextToSpeechService {
    if (!this.ttsInstance) {
      this.ttsInstance = new WebSpeechTTSService();
    }
    return this.ttsInstance;
  }
}
