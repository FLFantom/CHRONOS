import { createClient } from '@supabase/supabase-js';
import { User, TimeLog, LoginCredentials, TimeStats, WebhookData } from '../types';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get Tashkent time
const getTashkentTime = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};

export const webhookAPI = {
  sendLatenessReport: async (data: WebhookData): Promise<void> => {
    try {
      await fetch('https://gelding-able-sailfish.ngrok-free.app/webhook/lateness-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: data.userName,
          startTime: getTashkentTime(new Date(data.startTime)),
        }),
      });
    } catch (error) {
      console.error('Failed to send lateness report:', error);
    }
  },

  sendBreakExceededNotification: async (data: WebhookData): Promise<void> => {
    try {
      await fetch('https://gelding-able-sailfish.ngrok-free.app/webhook/notify-break-exceeded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: data.userName,
          startTime: getTashkentTime(new Date(data.startTime)),
        }),
      });
    } catch (error) {
      console.error('Failed to send break exceeded notification:', error);
    }
  },
};

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (error || !data) {
      throw new Error('Неверные учетные данные');
    }

    // In a real app, you would verify the password hash
    // For now, we'll use simple password comparison
    const validPasswords: { [key: string]: string } = {
      'admin@example.com': 'admin123',
      'hvlad@example.com': 'user123',
      'user@example.com': 'user123'
    };

    if (validPasswords[credentials.email] !== credentials.password) {
      throw new Error('Неверные учетные данные');
    }

    const token = 'mock-jwt-token';
    return { user: data as User, token };
  },

  getCurrentUser: async (): Promise<User> => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      throw new Error('User not authenticated');
    }
    return JSON.parse(userData);
  },
};

// Store for tracking break exceeded notifications
const breakExceededNotifications = new Set<number>();

export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Ошибка загрузки пользователей');
    }

    return data as User[];
  },

  getById: async (id: number): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data as User;
  },

  updateStatus: async (id: number, status: User['status'], breakStartTime?: string): Promise<User> => {
    const now = new Date();
    const today = now.toDateString();

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      throw new Error('User not found');
    }

    // Reset daily break time if it's a new day
    const lastUpdate = new Date(currentUser.updated_at);
    let dailyBreakTime = currentUser.daily_break_time || 0;
    
    if (lastUpdate.toDateString() !== today) {
      dailyBreakTime = 0;
      breakExceededNotifications.delete(id);
    }

    // Handle break time accumulation
    if (status === 'working' && currentUser.status === 'on_break' && currentUser.break_start_time) {
      const breakStart = new Date(currentUser.break_start_time);
      const breakDuration = Math.floor((now.getTime() - breakStart.getTime()) / 1000);
      dailyBreakTime = dailyBreakTime + breakDuration;
    }

    const updateData: any = {
      status,
      updated_at: now.toISOString(),
      daily_break_time: dailyBreakTime,
    };

    if (breakStartTime) {
      updateData.break_start_time = breakStartTime;
    } else if (status !== 'on_break') {
      updateData.break_start_time = null;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Ошибка обновления статуса пользователя');
    }

    return data as User;
  },

  updateWorkStartTime: async (id: number, workStartTime: string): Promise<User> => {
    const now = new Date();
    const workStart = new Date(workStartTime);
    
    // Convert to Tashkent timezone for comparison
    const tashkentTime = new Date(workStart.toLocaleString("en-US", {timeZone: "Asia/Tashkent"}));
    const expectedStart = new Date(tashkentTime);
    expectedStart.setHours(9, 0, 0, 0); // 9:00 AM Tashkent time

    // Get user data for webhook
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', id)
      .single();

    // Check if user is late (after 9:00 AM Tashkent time)
    if (tashkentTime > expectedStart && userData) {
      await webhookAPI.sendLatenessReport({
        userName: userData.name,
        startTime: workStartTime,
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        work_start_time: workStartTime,
        updated_at: now.toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Ошибка обновления времени начала работы');
    }

    return data as User;
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Ошибка обновления пользователя');
    }

    return data as User;
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Ошибка удаления пользователя');
    }
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    // In a real app, you would hash the password
    // For now, we'll just log it
    console.log(`Password reset for user ${id} to: ${newPassword}`);
    
    // Update the password in the database (in real app, hash it first)
    const { error } = await supabase
      .from('users')
      .update({
        password: newPassword, // In real app: await bcrypt.hash(newPassword, 12)
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error('Ошибка сброса пароля');
    }
  },

  getStats: async (): Promise<TimeStats> => {
    const { data, error } = await supabase
      .from('users')
      .select('status');

    if (error) {
      throw new Error('Ошибка загрузки статистики');
    }

    const totalUsers = data.length;
    const workingUsers = data.filter(u => u.status === 'working').length;
    const onBreakUsers = data.filter(u => u.status === 'on_break').length;
    const offlineUsers = data.filter(u => u.status === 'offline').length;

    return {
      totalUsers,
      workingUsers,
      onBreakUsers,
      offlineUsers,
    };
  },

  checkBreakExceeded: async (userId: number): Promise<void> => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user || user.status !== 'on_break' || !user.break_start_time) {
      return;
    }

    const now = new Date();
    const breakStart = new Date(user.break_start_time);
    const currentBreakDuration = Math.floor((now.getTime() - breakStart.getTime()) / 1000);
    const totalBreakTime = (user.daily_break_time || 0) + currentBreakDuration;

    // Check if total break time exceeds 1 hour (3600 seconds) and notification not sent yet
    if (totalBreakTime > 3600 && !breakExceededNotifications.has(userId)) {
      breakExceededNotifications.add(userId);
      await webhookAPI.sendBreakExceededNotification({
        userName: user.name,
        startTime: user.break_start_time,
      });
    }
  },
};

export const timeLogsAPI = {
  getUserLogs: async (userId: number, period?: 'day' | 'month' | 'all'): Promise<TimeLog[]> => {
    let query = supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (period === 'day') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('timestamp', today.toISOString());
    } else if (period === 'month') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      query = query.gte('timestamp', monthStart.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Ошибка загрузки логов');
    }

    return data as TimeLog[];
  },

  getAllLogs: async (period?: 'day' | 'month' | 'all'): Promise<TimeLog[]> => {
    let query = supabase
      .from('time_logs')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order('timestamp', { ascending: false });

    if (period === 'day') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('timestamp', today.toISOString());
    } else if (period === 'month') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      query = query.gte('timestamp', monthStart.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Ошибка загрузки логов');
    }

    return data as TimeLog[];
  },

  logAction: async (action: TimeLog['action'], userId?: number): Promise<void> => {
    // Get current user ID from localStorage or context
    const currentUserId = userId || getCurrentUserId();
    
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString();

    // Insert log entry
    const { error: logError } = await supabase
      .from('time_logs')
      .insert({
        user_id: currentUserId,
        action,
        timestamp: now,
      });

    if (logError) {
      throw new Error('Ошибка записи лога');
    }

    // Update user status based on action
    switch (action) {
      case 'start_work':
        await usersAPI.updateStatus(currentUserId, 'working');
        await usersAPI.updateWorkStartTime(currentUserId, now);
        break;
      case 'start_break':
        await usersAPI.updateStatus(currentUserId, 'on_break', now);
        break;
      case 'end_break':
        await usersAPI.updateStatus(currentUserId, 'working');
        break;
      case 'end_work':
        await usersAPI.updateStatus(currentUserId, 'offline');
        break;
    }
  },
};

// Helper function to get current user ID
function getCurrentUserId(): number | null {
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    const user = JSON.parse(userData);
    return user.id;
  }
  
  return null;
}

// Start break monitoring interval
setInterval(async () => {
  try {
    const users = await usersAPI.getAll();
    for (const user of users) {
      if (user.status === 'on_break') {
        await usersAPI.checkBreakExceeded(user.id);
      }
    }
  } catch (error) {
    console.error('Error checking break exceeded:', error);
  }
}, 60000); // Check every minute