export interface SessionRecord {
  id: string;
  screenId: string | number;
  screenName: string; // Added to preserve name in history
  startTime: number;
  endTime: number;
  durationSeconds: number;
  totalCost: number;
  hourlyRate: number;
}

export interface Screen {
  id: string;
  name: string;
}

export interface ScreenState {
  id: number;
  isActive: boolean;
  startTime: number | null;
  hourlyRate: number;
  customerName: string;
}