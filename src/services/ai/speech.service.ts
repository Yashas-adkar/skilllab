export interface SpeechService {
  transcribeAudio(audioBlob: Blob): Promise<string>;
  synthesizeSpeech(text: string): Promise<ArrayBuffer>;
}
