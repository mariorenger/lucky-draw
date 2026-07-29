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
  enableTease?: boolean; // Hiệu ứng mừng hụt (mặc định false - quay thẳng ra người trúng)
  adminPin?: string; // Mật khẩu quản trị Admin Setup
}

export interface RiggedSetting {
  prizeId: string;
  employeeId: string; // The selected employee ID who is rigged to win this prize
}
