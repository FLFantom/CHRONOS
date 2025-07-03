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
const TASHKENT_OFFSET_HOURS = 5; // UTC+5

// НОВОЕ: Хранилище пользователей, превысивших лимит перерыва
const usersExceededBreakLimit = new Set<number>();

// Get current time in Tashkent timezone - ИСПРАВЛЕНО: правильный расчет
const getTashkentTime = () => {
  const now = new Date();
  // Создаем новую дату с учетом смещения UTC+5
  const tashkentTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tashkent"}));
  return tashkentTime;
};

// Format date for Tashkent timezone in webhook format - ИСПРАВЛЕНО: правильный формат
const formatTashkentTime = (date: Date) => {
  // Конвертируем в Ташкентское время если это UTC дата
  const tashkentTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Tashkent"}));
  
  const day = String(tashkentTime.getDate()).padStart(2, '0');
  const month = String(tashkentTime.getMonth() + 1).padStart(2, '0');
  const year = tashkentTime.getFullYear();
  const hours = String(tashkentTime.getHours()).padStart(2, '0');
  const minutes = String(tashkentTime.getMinutes()).padStart(2, '0');
  const seconds = String(tashkentTime.getSeconds()).padStart(2, '0');
  
  // ИСПРАВЛЕНО: используем "в" вместо "на" как в вашем примере
  return `${day}.${month}.${year} в ${hours}:${minutes}:${seconds}`;
};

// Convert UTC time to Tashkent time - ИСПРАВЛЕНО: правильная конвертация
const convertToTashkentTime = (utcDate: Date | string) => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // Используем правильную конвертацию в Ташкентское время
  return new Date(date.toLocaleString("en-US", {timeZone: "Asia/Tashkent"}));
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

// КРИТИЧЕСКИ ИСПРАВЛЕНО: Улучшенная отправка webhook с правильными заголовками
const sendWebhook = async (url: string, data: any, webhookType: string) => {
  try {
    console.log(`🔔 Sending ${webhookType} webhook:`, { url, data, timestamp: new Date().toISOString() });
    
    // ИСПРАВЛЕНО: Добавляем заголовки для ngrok
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CHRONOS-TimeTracking-System/1.0',
        'X-Webhook-Type': webhookType,
        'X-Timestamp': new Date().toISOString(),
        // КРИТИЧЕСКИ ВАЖНО: Добавляем заголовок для ngrok
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data), // ИСПРАВЛЕНО: отправляем только нужные данные
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${webhookType} webhook sent successfully:`, {
        status: response.status,
        statusText: response.statusText,
        url,
        data,
        response: responseText
      });
    } else {
      console.error(`❌ ${webhookType} webhook failed:`, {
        status: response.status,
        statusText: response.statusText,
        url,
        data,
        response: responseText
      });
    }
  } catch (error) {
    console.error(`🚨 ${webhookType} webhook error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      data,
      timestamp: new Date().toISOString()
    });
  }
};

// Check if user is late for work - ИСПРАВЛЕНО: правильная проверка опоздания
const checkLateness = (startTime: Date, userName: string) => {
  const tashkentTime = convertToTashkentTime(startTime);
  const workStartTime = new Date(tashkentTime);
  workStartTime.setHours(WORK_START_HOUR, 0, 0, 0);
  
  console.log(`🕐 Checking lateness for ${userName}:`, {
    startTime: formatTashkentTime(startTime),
    workStartTime: formatTashkentTime(workStartTime),
    isLate: tashkentTime > workStartTime
  });
  
  if (tashkentTime > workStartTime) {
    // User is late, send webhook with Tashkent time format
    const webhookData = {
      userName,
      startTime: formatTashkentTime(startTime),
    };
    
    console.log(`⏰ User ${userName} is late! Sending lateness webhook...`);
    sendWebhook(WEBHOOK_LATENESS_URL, webhookData, 'lateness-report');
  } else {
    console.log(`✅ User ${userName} is on time.`);
  }
};

// КРИТИЧЕСКИ ИСПРАВЛЕНО: Проверка превышения перерыва с блокировкой
const checkBreakExceeded = (breakStartTime: Date, userName: string, userId: number) => {
  const webhookData = {
    userName,
    startTime: formatTashkentTime(breakStartTime),
  };
  
  console.log(`🚨 Break time exceeded for ${userName}! Sending break exceeded webhook...`, webhookData);
  sendWebhook(WEBHOOK_BREAK_EXCEEDED_URL, webhookData, 'notify-break-exceeded');
  
  // НОВОЕ: Добавляем пользователя в список превысивших лимит
  usersExceededBreakLimit.add(userId);
  console.log(`🚫 User ${userName} (${userId}) added to break limit exceeded list. Total users: ${usersExceededBreakLimit.size}`);
};

// КРИТИЧЕСКИ ИСПРАВЛЕНО: Система мониторинга перерывов
const activeBreakTimers = new Map<number, NodeJS.Timeout>();

const monitorBreakTime = async (userId: number, userName: string, breakStartTime: Date) => {
  console.log(`⏱️ Starting break monitoring for ${userName} (${userId}):`, {
    breakStartTime: formatTashkentTime(breakStartTime),
    maxBreakTime: `${MAX_BREAK_TIME} seconds (1 hour)`,
    willCheckAt: formatTashkentTime(new Date(breakStartTime.getTime() + MAX_BREAK_TIME * 1000))
  });
  
  // Очищаем предыдущий таймер если он существует
  if (activeBreakTimers.has(userId)) {
    clearTimeout(activeBreakTimers.get(userId)!);
    console.log(`🔄 Cleared previous break timer for user ${userId}`);
  }
  
  // КРИТИЧЕСКИ ВАЖНО: Устанавливаем таймер на точно 1 час (3600 секунд)
  const timerId = setTimeout(async () => {
    try {
      console.log(`🔍 Checking break status for ${userName} after exactly 1 hour...`);
      
      // Проверяем текущий статус пользователя
      const { data: user, error } = await supabase
        .from('users')
        .select('status, break_start_time, name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`❌ Error checking break status for ${userName}:`, error);
        activeBreakTimers.delete(userId);
        return;
      }

      if (user) {
        console.log(`📊 Break status check result for ${userName}:`, {
          currentStatus: user.status,
          breakStartTime: user.break_start_time,
          isStillOnBreak: user.status === 'on_break'
        });
        
        if (user.status === 'on_break' && user.break_start_time) {
          // КРИТИЧЕСКИ ВАЖНО: Проверяем, что это тот же перерыв
          const currentBreakStart = new Date(user.break_start_time);
          const originalBreakStart = breakStartTime;
          
          // Сравниваем времена с точностью до 10 секунд
          const timeDiff = Math.abs(currentBreakStart.getTime() - originalBreakStart.getTime());
          
          if (timeDiff < 10000) { // Разница менее 10 секунд - это тот же перерыв
            console.log(`🚨 ${userName} is still on the same break after 1 hour! Triggering webhook NOW...`);
            
            // КРИТИЧЕСКИ ВАЖНО: Отправляем webhook немедленно с блокировкой
            checkBreakExceeded(originalBreakStart, user.name, userId);
          } else {
            console.log(`ℹ️ ${userName} started a new break. Original monitoring cancelled.`);
          }
        } else {
          console.log(`✅ ${userName} has already ended their break. No webhook needed.`);
        }
      }
      
      // Удаляем таймер из активных
      activeBreakTimers.delete(userId);
      console.log(`🗑️ Removed timer for user ${userId}. Active timers: ${activeBreakTimers.size}`);
      
    } catch (error) {
      console.error(`🚨 Error in break monitoring for ${userName}:`, error);
      activeBreakTimers.delete(userId);
    }
  }, MAX_BREAK_TIME * 1000); // ТОЧНО 1 час = 3600000 миллисекунд
  
  // Сохраняем таймер
  activeBreakTimers.set(userId, timerId);
  console.log(`✅ Break timer set for user ${userId}. Active timers: ${activeBreakTimers.size}`);
  console.log(`⏰ Timer will fire in exactly ${MAX_BREAK_TIME} seconds (${MAX_BREAK_TIME / 60} minutes)`);
};

// Функция для отмены мониторинга перерыва
const cancelBreakMonitoring = (userId: number) => {
  if (activeBreakTimers.has(userId)) {
    clearTimeout(activeBreakTimers.get(userId)!);
    activeBreakTimers.delete(userId);
    console.log(`🛑 Break monitoring cancelled for user ${userId}. Active timers: ${activeBreakTimers.size}`);
  }
};

// КРИТИЧЕСКИ ВАЖНО: Проверка лимита перерыва с блокировкой
const canUserStartBreak = async (userId: number): Promise<{ canStart: boolean; reason?: string; dailyBreakTime?: number }> => {
  try {
    // Проверяем, превысил ли пользователь лимит
    if (usersExceededBreakLimit.has(userId)) {
      console.log(`🚫 User ${userId} is blocked from starting breaks - exceeded daily limit`);
      return { 
        canStart: false, 
        reason: 'Вы превысили дневной лимит перерыва (60 минут). Новые перерывы заблокированы до завтра.' 
      };
    }

    // Вычисляем общее время перерыва за сегодня
    const tashkentNow = getTashkentTime();
    const today = new Date(tashkentNow);
    today.setHours(0, 0, 0, 0);
    
    // Convert back to UTC for database query
    const todayUTC = new Date(today.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
    
    const { data: todayLogs, error: logsError } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', todayUTC.toISOString())
      .order('timestamp', { ascending: true });

    if (logsError) {
      console.error('Error fetching logs for break check:', logsError);
      return { canStart: true }; // В случае ошибки разрешаем
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

    // Проверяем текущий статус пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('status, break_start_time')
      .eq('id', userId)
      .single();

    if (!userError && user && user.status === 'on_break' && user.break_start_time) {
      const currentBreakDuration = Math.floor((Date.now() - new Date(user.break_start_time).getTime()) / 1000);
      dailyBreakTime += currentBreakDuration;
    }

    const dailyBreakMinutes = Math.floor(dailyBreakTime / 60);
    const maxBreakMinutes = Math.floor(MAX_BREAK_TIME / 60);

    console.log(`📊 Break check for user ${userId}: ${dailyBreakMinutes}/${maxBreakMinutes} minutes used`);

    if (dailyBreakTime >= MAX_BREAK_TIME) {
      // Добавляем в список превысивших лимит
      usersExceededBreakLimit.add(userId);
      console.log(`🚫 User ${userId} exceeded daily break limit: ${dailyBreakMinutes} minutes`);
      
      return { 
        canStart: false, 
        reason: `Вы уже использовали ${dailyBreakMinutes} минут перерыва сегодня. Лимит: ${maxBreakMinutes} минут.`,
        dailyBreakTime: dailyBreakMinutes
      };
    }

    return { 
      canStart: true, 
      dailyBreakTime: dailyBreakMinutes 
    };

  } catch (error) {
    console.error('Error checking break limit:', error);
    return { canStart: true }; // В случае ошибки разрешаем
  }
};

// НОВОЕ: Сброс лимитов в начале нового дня
const resetDailyBreakLimits = () => {
  const previousSize = usersExceededBreakLimit.size;
  usersExceededBreakLimit.clear();
  console.log(`🔄 Daily break limits reset. Cleared ${previousSize} users from exceeded list.`);
};

// НОВОЕ: Инициализация сброса лимитов в полночь
const initializeDailyReset = () => {
  const now = getTashkentTime();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  console.log(`⏰ Setting up daily reset in ${Math.floor(msUntilMidnight / 1000 / 60)} minutes`);
  
  setTimeout(() => {
    resetDailyBreakLimits();
    // Устанавливаем повторяющийся сброс каждые 24 часа
    setInterval(resetDailyBreakLimits, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
};

// КРИТИЧЕСКИ ИСПРАВЛЕНО: Инициализация мониторинга для существующих перерывов
const initializeBreakMonitoring = async () => {
  try {
    console.log('🔄 Initializing break monitoring for existing breaks...');
    
    const { data: usersOnBreak, error } = await supabase
      .from('users')
      .select('id, name, break_start_time')
      .eq('status', 'on_break')
      .not('break_start_time', 'is', null);

    if (error) {
      console.error('Error fetching users on break:', error);
      return;
    }

    if (usersOnBreak && usersOnBreak.length > 0) {
      console.log(`📋 Found ${usersOnBreak.length} users currently on break`);
      
      for (const user of usersOnBreak) {
        const breakStartTime = new Date(user.break_start_time);
        const now = new Date();
        const breakDuration = Math.floor((now.getTime() - breakStartTime.getTime()) / 1000);
        
        console.log(`👤 User ${user.name} (${user.id}): break duration ${breakDuration}s`);
        
        if (breakDuration >= MAX_BREAK_TIME) {
          // КРИТИЧЕСКИ ВАЖНО: Перерыв уже превысил лимит, отправляем уведомление немедленно
          console.log(`🚨 ${user.name} has already exceeded break limit by ${breakDuration - MAX_BREAK_TIME}s! Sending immediate webhook...`);
          checkBreakExceeded(breakStartTime, user.name, user.id);
        } else {
          // Перерыв еще не превысил лимит, устанавливаем мониторинг на оставшееся время
          const remainingTime = MAX_BREAK_TIME - breakDuration;
          console.log(`⏰ Setting up monitoring for ${user.name} with ${remainingTime}s remaining`);
          
          const timerId = setTimeout(async () => {
            try {
              // Проверяем статус пользователя
              const { data: currentUser, error: checkError } = await supabase
                .from('users')
                .select('status, break_start_time, name')
                .eq('id', user.id)
                .single();

              if (!checkError && currentUser && currentUser.status === 'on_break' && currentUser.break_start_time) {
                // Проверяем, что это тот же перерыв
                const currentBreakStart = new Date(currentUser.break_start_time);
                const timeDiff = Math.abs(currentBreakStart.getTime() - breakStartTime.getTime());
                
                if (timeDiff < 10000) { // Тот же перерыв
                  console.log(`🚨 ${currentUser.name} exceeded break limit! Sending webhook...`);
                  checkBreakExceeded(breakStartTime, currentUser.name, user.id);
                }
              }
              
              activeBreakTimers.delete(user.id);
            } catch (error) {
              console.error(`Error in delayed break check for ${user.name}:`, error);
              activeBreakTimers.delete(user.id);
            }
          }, remainingTime * 1000);
          
          activeBreakTimers.set(user.id, timerId);
        }
      }
      
      console.log(`✅ Break monitoring initialized. Active timers: ${activeBreakTimers.size}`);
    } else {
      console.log('📋 No users currently on break');
    }
  } catch (error) {
    console.error('Error initializing break monitoring:', error);
  }
};

// Check if current time is within working hours (Tashkent time) - ИСПРАВЛЕНО
const isWithinWorkingHours = () => {
  const tashkentTime = getTashkentTime();
  const currentHour = tashkentTime.getHours(); // Используем getHours() для Ташкентского времени
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
      console.log(`🔐 Login attempt for: ${credentials.email}`);
      
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
        console.error('❌ User lookup failed:', userError);
        handleSupabaseError(userError, 'login - get user');
      }

      if (!user) {
        console.log('❌ User not found for email:', credentials.email);
        throw new Error('Неверный email или пароль');
      }

      // Verify password
      const isValidPassword = await verifyPassword(credentials.password, user.password);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', credentials.email);
        throw new Error('Неверный email или пароль');
      }

      // Generate simple JWT-like token (in production use proper JWT)
      const token = `jwt-token-${user.id}-${Date.now()}`;

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      console.log(`✅ Login successful for: ${credentials.email} (${user.name})`);

      // КРИТИЧЕСКИ ВАЖНО: Инициализируем мониторинг перерывов при входе
      setTimeout(() => {
        initializeBreakMonitoring();
        initializeDailyReset(); // НОВОЕ: Инициализируем сброс лимитов
      }, 500);

      return {
        user: userWithoutPassword as User,
        token,
      };
    } catch (error) {
      console.error('🚨 Login error:', error);
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
          const todayUTC = new Date(today.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
          
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
      const todayUTC = new Date(today.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
      
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
      
      console.log(`📝 Logging action: ${action} for user ${userId} at ${formatTashkentTime(now)}`);
      
      // КРИТИЧЕСКИ ВАЖНО: Проверяем лимит перерыва перед началом
      if (action === 'start_break') {
        const breakCheck = await canUserStartBreak(userId);
        if (!breakCheck.canStart) {
          console.log(`🚫 Break start blocked for user ${userId}: ${breakCheck.reason}`);
          throw new Error(breakCheck.reason || 'Превышен лимит перерыва');
        }
        console.log(`✅ User ${userId} can start break - ${breakCheck.dailyBreakTime || 0} minutes used today`);
      }
      
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
          
          // НОВОЕ: Убираем пользователя из списка превысивших лимит при начале работы
          if (usersExceededBreakLimit.has(userId)) {
            usersExceededBreakLimit.delete(userId);
            console.log(`🔄 User ${userId} removed from break limit exceeded list (started work)`);
          }
          
          // Check for lateness using Tashkent time
          if (user) {
            console.log(`🔍 Checking lateness for ${user.name}...`);
            checkLateness(now, user.name);
          }
          break;
          
        case 'start_break':
          updateData.status = 'on_break';
          updateData.break_start_time = now.toISOString();
          
          // КРИТИЧЕСКИ ВАЖНО: Устанавливаем мониторинг перерыва
          if (user) {
            console.log(`⏱️ Setting up break monitoring for ${user.name}...`);
            monitorBreakTime(userId, user.name, now);
          }
          break;
          
        case 'end_break':
          updateData.status = 'working';
          updateData.break_start_time = null;
          
          // Отменяем мониторинг перерыва
          console.log(`🛑 Cancelling break monitoring for user ${userId}...`);
          cancelBreakMonitoring(userId);
          break;
          
        case 'end_work':
          updateData.status = 'offline';
          updateData.break_start_time = null;
          // Only set work_start_time if the column exists
          if (workStartTimeExists) {
            updateData.work_start_time = null;
          }
          
          // Отменяем мониторинг перерыва при завершении работы
          console.log(`🛑 Cancelling break monitoring for user ${userId} (end work)...`);
          cancelBreakMonitoring(userId);
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

      console.log(`✅ Action ${action} logged successfully for user ${userId}`);
    } catch (error) {
      console.error(`🚨 Error logging action ${action} for user ${userId}:`, error);
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
        const startOfDayUTC = new Date(startOfDay.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
        query = query.gte('timestamp', startOfDayUTC.toISOString());
      } else if (period === 'month') {
        const startOfMonth = new Date(tashkentNow.getFullYear(), tashkentNow.getMonth(), 1);
        // Convert back to UTC for database query
        const startOfMonthUTC = new Date(startOfMonth.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
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
        const startOfDayUTC = new Date(startOfDay.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
        query = query.gte('timestamp', startOfDayUTC.toISOString());
      } else if (period === 'month') {
        const startOfMonth = new Date(tashkentNow.getFullYear(), tashkentNow.getMonth(), 1);
        // Convert back to UTC for database query
        const startOfMonthUTC = new Date(startOfMonth.getTime() - (TASHKENT_OFFSET_HOURS * 60 * 60 * 1000));
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
export { 
  isWithinWorkingHours, 
  WORK_START_HOUR, 
  WORK_END_HOUR, 
  MAX_BREAK_TIME, 
  getTashkentTime, 
  formatTashkentTime, 
  convertToTashkentTime,
  canUserStartBreak // НОВОЕ: Экспортируем функцию проверки
};