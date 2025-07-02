export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'working' | 'on_break' | 'offline';
  break_start_time?: string;
  daily_break_time?: number; // Total break time in seconds for the day
  work_start_time?: string; // When work started today
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: number;
  user_id: number;
  action: 'start_work' | 'start_break' | 'end_break' | 'end_work';
  timestamp: string;
  break_duration?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  impersonating: boolean;
  impersonateUser: (userId: number) => Promise<void>;
  exitImpersonation: () => void;
  updateUserStatus?: (user: User) => void;
}

export interface TimeStats {
  totalUsers: number;
  workingUsers: number;
  onBreakUsers: number;
  offlineUsers: number;
}

export interface WebhookData {
  userName: string;
  startTime: string;
}