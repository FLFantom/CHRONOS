import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { User, LoginCredentials, TimeStats, TimeLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL environment variable.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Hash password using bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password using bcrypt
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Enhanced error handling function
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase error in ${operation}:`, error);
  
  if (error.message?.includes('Failed to fetch')) {
    throw new Error(`Не удается подключиться к серверу. Проверьте подключение к интернету и настройки Supabase.`);
  }
  
  if (error.message?.includes('Invalid API key')) {
    throw new Error(`Неверный API ключ Supabase. Проверьте настройки окружения.`);
  }
  
  if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
    throw new Error(`Таблица базы данных не найдена. Убедитесь, что миграции выполнены.`);
  }
  
  throw new Error(error.message || `Ошибка при выполнении операции: ${operation}`);
};

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Не удается подключиться к серверу. Проверьте подключение к интернету.');
      }

      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (userError) {
        handleSupabaseError(userError, 'login - get user');
      }

      if (!user) {
        throw new Error('Неверный email или пароль');
      }

      // Verify password
      const isValidPassword = await verifyPassword(credentials.password, user.password);
      
      if (!isValidPassword) {
        throw new Error('Неверный email или пароль');
      }

      // Generate simple JWT-like token (in production use proper JWT)
      const token = `jwt-token-${user.id}-${Date.now()}`;

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword as User,
        token,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'login');
    }
  },
};

export const usersAPI = {
  async getAll(): Promise<User[]> {
    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Не удается подключиться к серверу. Проверьте подключение к интернету.');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        handleSupabaseError(error, 'getAll users');
      }

      // Calculate daily break time for each user
      const usersWithBreakTime = await Promise.all(
        (data || []).map(async (user) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { data: todayLogs, error: logsError } = await supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('timestamp', today.toISOString())
            .order('timestamp', { ascending: true });

          if (logsError) {
            console.error('Error fetching logs:', logsError);
            return { ...user, daily_break_time: 0 };
          }

          let dailyBreakTime = 0;
          let currentBreakStart: Date | null = null;

          todayLogs?.forEach((log) => {
            if (log.action === 'start_break') {
              currentBreakStart = new Date(log.timestamp);
            } else if (log.action === 'end_break' && currentBreakStart) {
              const breakEnd = new Date(log.timestamp);
              dailyBreakTime += Math.floor((breakEnd.getTime() - currentBreakStart.getTime()) / 1000);
              currentBreakStart = null;
            }
          });

          // If user is currently on break, add current break time
          if (user.status === 'on_break' && user.break_start_time) {
            const currentBreakDuration = Math.floor((Date.now() - new Date(user.break_start_time).getTime()) / 1000);
            dailyBreakTime += currentBreakDuration;
          }

          // Remove password from response
          const { password, ...userWithoutPassword } = user;

          return {
            ...userWithoutPassword,
            daily_break_time: dailyBreakTime,
          };
        })
      );

      return usersWithBreakTime;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'getAll users');
    }
  },

  async getById(id: number): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleSupabaseError(error, 'getById user');
      }

      // Calculate daily break time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayLogs, error: logsError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', id)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: true });

      let dailyBreakTime = 0;
      let currentBreakStart: Date | null = null;

      todayLogs?.forEach((log) => {
        if (log.action === 'start_break') {
          currentBreakStart = new Date(log.timestamp);
        } else if (log.action === 'end_break' && currentBreakStart) {
          const breakEnd = new Date(log.timestamp);
          dailyBreakTime += Math.floor((breakEnd.getTime() - currentBreakStart.getTime()) / 1000);
          currentBreakStart = null;
        }
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = data;

      return {
        ...userWithoutPassword,
        daily_break_time: dailyBreakTime,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'getById user');
      return null;
    }
  },

  async getStats(): Promise<TimeStats> {
    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Не удается подключиться к серверу. Проверьте подключение к интернету.');
      }

      const { data, error } = await supabase
        .from('users')
        .select('status');

      if (error) {
        handleSupabaseError(error, 'getStats');
      }

      const stats = {
        totalUsers: data?.length || 0,
        workingUsers: data?.filter(u => u.status === 'working').length || 0,
        onBreakUsers: data?.filter(u => u.status === 'on_break').length || 0,
        offlineUsers: data?.filter(u => u.status === 'offline').length || 0,
      };

      return stats;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'getStats');
    }
  },

  async update(id: number, userData: Partial<User>): Promise<User> {
    try {
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
        handleSupabaseError(error, 'update user');
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = data;
      return userWithoutPassword as User;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'update user');
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, 'delete user');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'delete user');
    }
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    try {
      // Hash the password before storing
      const hashedPassword = await hashPassword(newPassword);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        handleSupabaseError(error, 'reset password');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'reset password');
    }
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get current user data to verify current password
      const { data: user, error: getUserError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (getUserError) {
        handleSupabaseError(getUserError, 'change password - get user');
      }

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Verify current password
      const isValidCurrentPassword = await verifyPassword(currentPassword, user.password);

      if (!isValidCurrentPassword) {
        throw new Error('Неверный текущий пароль');
      }

      // Hash the new password before storing
      const hashedPassword = await hashPassword(newPassword);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        handleSupabaseError(error, 'change password - update');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'change password');
    }
  },
};

export const timeLogsAPI = {
  async logAction(action: string, userId: number): Promise<void> {
    try {
      // Insert log entry
      const { error: logError } = await supabase
        .from('time_logs')
        .insert({
          user_id: userId,
          action,
          timestamp: new Date().toISOString(),
        });

      if (logError) {
        handleSupabaseError(logError, 'log action - insert');
      }

      // Update user status - only update fields that exist in your schema
      const now = new Date().toISOString();
      let updateData: any = { updated_at: now };

      switch (action) {
        case 'start_work':
          updateData.status = 'working';
          break;
        case 'start_break':
          updateData.status = 'on_break';
          updateData.break_start_time = now;
          break;
        case 'end_break':
          updateData.status = 'working';
          updateData.break_start_time = null;
          break;
        case 'end_work':
          updateData.status = 'offline';
          updateData.break_start_time = null;
          break;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        handleSupabaseError(updateError, 'log action - update user');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'log action');
    }
  },

  async getUserLogs(userId: number, period: 'day' | 'month' | 'all'): Promise<TimeLog[]> {
    try {
      let query = supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      const now = new Date();
      
      if (period === 'day') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('timestamp', startOfDay.toISOString());
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('timestamp', startOfMonth.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error, 'get user logs');
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'get user logs');
      return [];
    }
  },

  async getAllLogs(period: 'day' | 'month' | 'all'): Promise<any[]> {
    try {
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

      const now = new Date();
      
      if (period === 'day') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('timestamp', startOfDay.toISOString());
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('timestamp', startOfMonth.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error, 'get all logs');
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      handleSupabaseError(error, 'get all logs');
      return [];
    }
  },
};