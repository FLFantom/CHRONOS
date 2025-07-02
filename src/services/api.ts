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

// Webhook URLs - ИСПРАВЛЕНЫ СОГЛАСНО ВАШИМ ТРЕБОВАНИЯМ
const WEBHOOK_LATENESS_URL = 'https://gelding-able-sailfish.ngrok-free.app/webhook/lateness-report';
const WEBHOOK_BREAK_EXCEEDED_URL = 'https://gelding-able-sailfish.ngrok-free.app/webhook/notify-break-exceeded';

// Working hours configuration
const WORK_START_HOUR = 9; // 9:00
const WORK_END_HOUR = 18; // 18:00
const MAX_BREAK_TIME = 3600; // 1 hour in seconds

// Tashkent timezone offset (UTC+5) - КРИТИЧЕСКИ ВАЖНО: НЕ ИЗМЕНЯТЬ!
const TASHKENT_OFFSET = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

// Get current time in Tashkent timezone - ИСПРАВЛЕНО: работаем с UTC временем
const getTashkentTime = () => {
  const utcNow = new Date();
  // Получаем UTC время и добавляем смещение Ташкента (+5 часов)
  return new Date(utcNow.getTime() + TASHKENT_OFFSET);
};

// Format date for Tashkent timezone in webhook format - ФОРМАТ ДЛЯ WEBHOOK
const formatTashkentTime = (date: Date) => {
  // Если дата уже в Ташкентском времени, используем её как есть
  // Если это UTC дата, конвертируем в Ташкентское время
  const tashkentTime = date.getTimezoneOffset ? convertToTashkentTime(date) : date;
  
  const day = String(tashkentTime.getDate()).padStart(2, '0');
  const month = String(tashkentTime.getMonth() + 1).padStart(2, '0');
  const year = tashkentTime.getFullYear();
  const hours = String(tashkentTime.getHours()).padStart(2, '0');
  const minutes = String(tashkentTime.getMinutes()).padStart(2, '0');
  const seconds = String(tashkentTime.getSeconds()).padStart(2, '0');
  
  return `${day}.${month}.${year} в ${hours}:${minutes}:${seconds}`;
};

// Convert UTC time to Tashkent time - ИСПРАВЛЕНО: правильная конвертация
const convertToTashkentTime = (utcDate: Date | string) => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // Добавляем смещение UTC+5 к UTC времени
  return new Date(date.getTime() + TASHKENT_OFFSET);
};

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
  
  // Handle column not found errors gracefully
  if (error.message?.includes('Could not find') && error.message?.includes('column')) {
    console.warn(`Column not found: ${error.message}. Continuing without this field.`);
    return; // Don't throw, just log and continue
  }
  
  throw new Error(error.message || `Ошибка при выполнении операции: ${operation}`);
};

// Send webhook notification
const sendWebhook = async (url: string, data: any) => {
  try {
    console.log('Sending webhook:', { url, data });
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Webhook error:', error);
  }
};

// Check if user is late for work - ИСПРАВЛЕНО: правильная проверка опоздания
const checkLateness = (startTime: Date, userName: string) => {
  const tashkentTime = convertToTashkentTime(startTime);
  const workStartTime = new Date(tashkentTime);
  workStartTime.setHours(WORK_START_HOUR, 0, 0, 0);
  
  if (tashkentTime > workStartTime) {
    // User is late, send webhook with Tashkent time format
    sendWebhook(WEBHOOK_LATENESS_URL, {
      userName,
      startTime: formatTashkentTime(startTime),
    });
  }
};

// Check if break time is exceeded - ПРОВЕРКА ПРЕВЫШЕНИЯ ПЕРЕРЫВА
const checkBreakExceeded = (breakStartTime: Date, userName: string) => {
  // Send webhook with Tashkent time format
  sendWebhook(WEBHOOK_BREAK_EXCEEDED_URL, {
    userName,
    startTime: formatTashkentTime(breakStartTime),
  });
};

// Monitor break time and send notification when exceeded - МОНИТОРИНГ ПЕРЕРЫВА
const monitorBreakTime = async (userId: number, userName: string, breakStartTime: Date) => {
  // Set timeout for MAX_BREAK_TIME (1 hour)
  setTimeout(async () => {
    try {
      // Check if user is still on break
      const { data: user, error } = await supabase
        .from('users')
        .select('status')
        .eq('id', userId)
        .single();

      if (!error && user && user.status === 'on_break') {
        // User is still on break after 1 hour, send notification
        checkBreakExceeded(breakStartTime, userName);
      }
    } catch (error) {
      console.error('Error checking break status:', error);
    }
  }, MAX_BREAK_TIME * 1000); // 1 hour in milliseconds
};

// Check if current time is within working hours (Tashkent time) - ИСПРАВЛЕНО
const isWithinWorkingHours = () => {
  const tashkentTime = getTashkentTime();
  const currentHour = tashkentTime.getHours(); // Используем getHours() вместо getUTCHours()
  return currentHour >= WORK_START_HOUR && currentHour < WORK_END_HOUR;
};

// Check if a column exists in the users table
const checkColumnExists = async (columnName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(columnName)
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
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

      // Calculate daily break time for each user using Tashkent time
      const usersWithBreakTime = await Promise.all(
        (data || []).map(async (user) => {
          // Use Tashkent time for today calculation
          const tashkentNow = getTashkentTime();
          const today = new Date(tashkentNow);
          today.setHours(0, 0, 0, 0);
          
          // Convert back to UTC for database query
          const todayUTC = new Date(today.getTime() - TASHKENT_OFFSET);
          
          const { data: todayLogs, error: logsError } = await supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('timestamp', todayUTC.toISOString())
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

      // Calculate daily break time using Tashkent time
      const tashkentNow = getTashkentTime();
      const today = new Date(tashkentNow);
      today.setHours(0, 0, 0, 0);
      
      // Convert back to UTC for database query
      const todayUTC = new Date(today.getTime() - TASHKENT_OFFSET);
      
      const { data: todayLogs, error: logsError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', id)
        .gte('timestamp', todayUTC.toISOString())
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
      const now = new Date();
      
      // Get user data for webhook notifications
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name, break_start_time')
        .eq('id', userId)
        .single();

      if (userError) {
        handleSupabaseError(userError, 'log action - get user');
      }

      // Insert log entry
      const { error: logError } = await supabase
        .from('time_logs')
        .insert({
          user_id: userId,
          action,
          timestamp: now.toISOString(),
        });

      if (logError) {
        handleSupabaseError(logError, 'log action - insert');
      }

      // Check if work_start_time column exists before using it
      const workStartTimeExists = await checkColumnExists('work_start_time');

      // Update user status and handle webhook notifications
      let updateData: any = { updated_at: now.toISOString() };

      switch (action) {
        case 'start_work':
          updateData.status = 'working';
          // Only set work_start_time if the column exists
          if (workStartTimeExists) {
            updateData.work_start_time = now.toISOString();
          }
          
          // Check for lateness using Tashkent time - ВОССТАНОВЛЕНО
          if (user) {
            checkLateness(now, user.name);
          }
          break;
          
        case 'start_break':
          updateData.status = 'on_break';
          updateData.break_start_time = now.toISOString();
          
          // Set up monitoring for break time exceeded - ВОССТАНОВЛЕНО
          if (user) {
            monitorBreakTime(userId, user.name, now);
          }
          break;
          
        case 'end_break':
          updateData.status = 'working';
          updateData.break_start_time = null;
          break;
          
        case 'end_work':
          updateData.status = 'offline';
          updateData.break_start_time = null;
          // Only set work_start_time if the column exists
          if (workStartTimeExists) {
            updateData.work_start_time = null;
          }
          break;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        // Handle column not found errors gracefully
        if (updateError.message?.includes('Could not find') && updateError.message?.includes('work_start_time')) {
          console.warn('work_start_time column not found, continuing without it');
          // Retry update without work_start_time
          const { work_start_time, ...updateDataWithoutWorkStartTime } = updateData;
          const { error: retryError } = await supabase
            .from('users')
            .update(updateDataWithoutWorkStartTime)
            .eq('id', userId);
          
          if (retryError) {
            handleSupabaseError(retryError, 'log action - retry update user');
          }
        } else {
          handleSupabaseError(updateError, 'log action - update user');
        }
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

      const tashkentNow = getTashkentTime();
      
      if (period === 'day') {
        const startOfDay = new Date(tashkentNow);
        startOfDay.setHours(0, 0, 0, 0);
        // Convert back to UTC for database query
        const startOfDayUTC = new Date(startOfDay.getTime() - TASHKENT_OFFSET);
        query = query.gte('timestamp', startOfDayUTC.toISOString());
      } else if (period === 'month') {
        const startOfMonth = new Date(tashkentNow.getFullYear(), tashkentNow.getMonth(), 1);
        // Convert back to UTC for database query
        const startOfMonthUTC = new Date(startOfMonth.getTime() - TASHKENT_OFFSET);
        query = query.gte('timestamp', startOfMonthUTC.toISOString());
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

      const tashkentNow = getTashkentTime();
      
      if (period === 'day') {
        const startOfDay = new Date(tashkentNow);
        startOfDay.setHours(0, 0, 0, 0);
        // Convert back to UTC for database query
        const startOfDayUTC = new Date(startOfDay.getTime() - TASHKENT_OFFSET);
        query = query.gte('timestamp', startOfDayUTC.toISOString());
      } else if (period === 'month') {
        const startOfMonth = new Date(tashkentNow.getFullYear(), tashkentNow.getMonth(), 1);
        // Convert back to UTC for database query
        const startOfMonthUTC = new Date(startOfMonth.getTime() - TASHKENT_OFFSET);
        query = query.gte('timestamp', startOfMonthUTC.toISOString());
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

// Export utility functions
export { isWithinWorkingHours, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME, getTashkentTime, formatTashkentTime, convertToTashkentTime };