import { createClient } from '@supabase/supabase-js';
import { User, LoginCredentials, TimeStats, TimeLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      // Get user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (userError || !users) {
        throw new Error('Пользователь не найден');
      }

      // For demo purposes, we'll use simple password comparison
      // In production, you should use proper password hashing
      const validPasswords: Record<string, string> = {
        'admin@example.com': 'admin123',
        'hvlad@example.com': 'user123',
      };

      if (validPasswords[credentials.email] !== credentials.password) {
        throw new Error('Неверный пароль');
      }

      return {
        user: users,
        token: 'jwt-token-' + users.id,
      };
    } catch (error) {
      throw error;
    }
  },
};

export const usersAPI = {
  async getAll(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

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

          return {
            ...user,
            daily_break_time: dailyBreakTime,
          };
        })
      );

      return usersWithBreakTime;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

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

      return {
        ...data,
        daily_break_time: dailyBreakTime,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async getStats(): Promise<TimeStats> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('status');

      if (error) throw error;

      const stats = {
        totalUsers: data?.length || 0,
        workingUsers: data?.filter(u => u.status === 'working').length || 0,
        onBreakUsers: data?.filter(u => u.status === 'on_break').length || 0,
        offlineUsers: data?.filter(u => u.status === 'offline').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    try {
      // For demo purposes, we'll update the password directly
      // In production, you should hash the password properly
      const { error } = await supabase
        .from('users')
        .update({ 
          password: newPassword, // In production, hash this password
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // For demo purposes, we'll update the password directly
      // In production, you should verify current password and hash the new one
      const { error } = await supabase
        .from('users')
        .update({ 
          password: newPassword, // In production, hash this password
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
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

      if (logError) throw logError;

      // Update user status - only update fields that exist in your schema
      const now = new Date().toISOString();
      let updateData: any = { updated_at: now };

      switch (action) {
        case 'start_work':
          updateData.status = 'working';
          // Remove work_start_time since it doesn't exist in your schema
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
          // Remove work_start_time since it doesn't exist in your schema
          break;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error logging action:', error);
      throw error;
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user logs:', error);
      throw error;
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

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  },
};