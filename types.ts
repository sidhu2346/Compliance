export enum View {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  MEDIA = 'MEDIA'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
