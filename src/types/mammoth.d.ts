declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface MammothOptions {
    buffer: Buffer;
  }

  export function extractRawText(options: MammothOptions): Promise<MammothResult>;
}
