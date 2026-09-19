export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIService {
  providerName: string;
  generateText(prompt: string, options?: AIOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: object, options?: AIOptions): Promise<T>;
  streamText?(prompt: string, onChunk: (chunk: string) => void, options?: AIOptions): Promise<string>;
}
