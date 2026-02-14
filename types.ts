
export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  description: string;
  imageUrl?: string;
  purchaseUrl?: string;
  date: string;
}

export enum AppTab {
  GALLERY = 'gallery'
}

// Added missing interfaces for ChatView and ImageView
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}
