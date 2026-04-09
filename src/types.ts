export interface UserProfile {
  id: string;
  nickname: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  activity: string;
  climate: string;
  goal: string;
  wakeUp?: string;
  bedTime?: string;
  password?: string;
}

export interface Friend {
  id: string;
  name: string;
  dept: string;
  wp: number;
  streak: number;
  isMe: boolean;
}

export interface SearchResult {
  id: string;
  nickname: string;
}

export interface LocalWaterEntry {
  id: string;
  amount: number;
  actual_ml?: number;
  name: string;
  timestamp: number;
  note?: string;
}
