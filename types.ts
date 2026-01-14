export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface Prize {
  id: string;
  name: string;
  quantity: number;
  originalQuantity: number;
  image?: string; // Optional image URL for the prize
}

export interface Winner {
  id: string;
  employee: Employee;
  prize: Prize;
  timestamp: string;
  aiMessage?: string;
}

export enum AppState {
  SETUP = 'SETUP',
  READY = 'READY',
  SPINNING = 'SPINNING',
  WINNER = 'WINNER',
  FINISHED = 'FINISHED'
}

export interface Settings {
  soundEnabled: boolean;
  demoMode: boolean; // If true, doesn't reduce prize count
  confettiEnabled: boolean;
}
