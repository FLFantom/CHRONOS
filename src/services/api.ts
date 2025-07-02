import { createClient } from '@supabase/supabase-js';
import { User, LoginCredentials, TimeStats, TimeLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data for development
const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    status: 'offline',
    daily_break_time: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'hvlad@example.com',
    name: 'Vlad H',
    role: 'user',
    status: 'offline',
    daily_break_time: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let currentUser: User | null = null;

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    // Mock authentication
    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Mock password validation
    const validPasswords: Record<string, string> = {
      'admin@example.com': 'admin123',
      'hvlad@example.com': 'user123',
    };

    if (validPasswords[credentials.email] !== credentials.password) {
      throw new Error('Неверный пароль');
    }

    currentUser = user;
    return {
      user,
      token: 'mock-jwt-token',
    };
  },
};

export const usersAPI = {
  async getAll(): Promise<User[]> {
    return mockUsers;
  },

  async getById(id: number): Promise<User | null> {
    return mockUsers.find(u => u.id === id) || null;
  },

  async getStats(): Promise<TimeStats> {
    return {
      totalUsers: mockUsers.length,
      workingUsers: mockUsers.filter(u => u.status === 'working').length,
      onBreakUsers: mockUsers.filter(u => u.status === 'on_break').length,
      offlineUsers: mockUsers.filter(u => u.status === 'offline').length,
    };
  },

  async update(id: number, userData: Partial<User>): Promise<User> {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...userData,
      updated_at: new Date().toISOString(),
    };

    return mockUsers[userIndex];
  },

  async delete(id: number): Promise<void> {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }
    mockUsers.splice(userIndex, 1);
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    // Mock password reset
    console.log(`Password reset for user ${id}: ${newPassword}`);
  },
};

export const timeLogsAPI = {
  async logAction(action: string, userId: number): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const now = new Date();

    switch (action) {
      case 'start_work':
        user.status = 'working';
        user.work_start_time = now.toISOString();
        break;
      case 'start_break':
        user.status = 'on_break';
        user.break_start_time = now.toISOString();
        break;
      case 'end_break':
        if (user.break_start_time) {
          const breakDuration = Math.floor((now.getTime() - new Date(user.break_start_time).getTime()) / 1000);
          user.daily_break_time = (user.daily_break_time || 0) + breakDuration;
        }
        user.status = 'working';
        user.break_start_time = undefined;
        break;
      case 'end_work':
        user.status = 'offline';
        user.work_start_time = undefined;
        user.break_start_time = undefined;
        user.daily_break_time = 0; // Reset for next day
        break;
    }

    user.updated_at = now.toISOString();
  },

  async getUserLogs(userId: number, period: 'day' | 'month' | 'all'): Promise<TimeLog[]> {
    // Mock logs data
    return [
      {
        id: 1,
        user_id: userId,
        action: 'start_work',
        timestamp: new Date().toISOString(),
      },
    ];
  },

  async getAllLogs(period: 'day' | 'month' | 'all'): Promise<any[]> {
    // Mock all logs data
    return [
      {
        id: 1,
        user_id: 1,
        action: 'start_work',
        timestamp: new Date().toISOString(),
        users: { name: 'Admin User' },
      },
    ];
  },
};