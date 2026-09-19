import { AIService, AIOptions } from './ai-service.interface';

/**
 * Deterministic Mock AI Provider for local testing and architectural validation
 */
export class MockAIService implements AIService {
  providerName = 'MockAIService';

  async generateText(prompt: string, options?: AIOptions): Promise<string> {
    return `[Mock AI Response for prompt: "${prompt.slice(0, 50)}..."]`;
  }

  async generateStructured<T>(prompt: string, schema: object, options?: AIOptions): Promise<T> {
    return {
      status: 'success',
      mockData: true,
      promptReceived: prompt.slice(0, 50),
    } as unknown as T;
  }
}

/**
 * AI Service Factory resolving provider based on environment configuration
 */
export class AIServiceFactory {
  private static instance: AIService | null = null;

  static getAIService(): AIService {
    if (!this.instance) {
      // Future: instantiate GeminiAIService or OpenAIService based on process.env.AI_PROVIDER
      this.instance = new MockAIService();
    }
    return this.instance;
  }
}
