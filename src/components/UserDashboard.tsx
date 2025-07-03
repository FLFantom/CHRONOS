import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  LogOut, 
  Shield, 
  User as UserIcon,
  Calendar,
  Activity,
  Coffee,
  CheckCircle,
  AlertCircle,
  Timer,
  BarChart3,
  History,
  Eye,
  EyeOff,
  Lock,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI, getTashkentTime, formatTashkentTime, convertToTashkentTime, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME } from '../services/api';
import { TimeLog, User } from '../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserDashboard: React.FC = () => {
  const { user, logout, impersonating, exitImpersonation, updateUserStatus } = useAuth();
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [breakDuration, setBreakDuration] = useState(0);
  const [dailyBreakTime, setDailyBreakTime] = useState(0);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logPeriod, setLogPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setError,
  } = useForm<PasswordChangeForm>();

  const newPassword = watch('newPassword');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTashkentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update break duration if user is on break
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (user?.status === 'on_break' && user.break_start_time) {
      interval = setInterval(() => {
        const breakStart = convertToTashkentTime(user.break_start_time!);
        const now = getTashkentTime();
        const duration = Math.floor((now.getTime() - breakStart.getTime()) / 1000);
        setBreakDuration(duration);
      }, 1000);
    } else {
      setBreakDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.status, user?.break_start_time]);

  // Load daily break time
  useEffect(() => {
    if (user) {
      loadDailyBreakTime();
    }
  }, [user]);

  const loadDailyBreakTime = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await usersAPI.getById(user.id);
      if (updatedUser) {
        setDailyBreakTime(updatedUser.daily_break_time || 0);
      }
    } catch (error) {
      console.error('Error loading daily break time:', error);
    }
  };

  const loadLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userLogs = await timeLogsAPI.getUserLogs(user.id, logPeriod);
      setLogs(userLogs);
    } catch (error) {
      toast.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showLogs) {
      loadLogs();
    }
  }, [showLogs, logPeriod, user]);

  const handleStartWork = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('start_work', user.id);
      const updatedUser = { ...user, status: 'working' as const };
      updateUserStatus?.(updatedUser);
      toast.success('Рабочий день начат');
    } catch (error) {
      toast.error('Ошибка при начале работы');
    }
  };

  const handleStartBreak = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('start_break', user.id);
      const updatedUser = { 
        ...user, 
        status: 'on_break' as const, 
        break_start_time: new Date().toISOString() 
      };
      updateUserStatus?.(updatedUser);
      toast.success('Перерыв начат');
    } catch (error) {
      toast.error('Ошибка при начале перерыва');
    }
  };

  const handleEndBreak = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('end_break', user.id);
      const updatedUser = { 
        ...user, 
        status: 'working' as const, 
        break_start_time: undefined 
      };
      updateUserStatus?.(updatedUser);
      await loadDailyBreakTime();
      toast.success('Перерыв завершен');
    } catch (error) {
      toast.error('Ошибка при завершении перерыва');
    }
  };

  const handleEndWork = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('end_work', user.id);
      const updatedUser = { 
        ...user, 
        status: 'offline' as const, 
        break_start_time: undefined 
      };
      updateUserStatus?.(updatedUser);
      toast.success('Рабочий день завершен');
    } catch (error) {
      toast.error('Ошибка при завершении работы');
    }
  };

  const onPasswordSubmit = async (data: PasswordChangeForm) => {
    if (!user) return;

    try {
      await usersAPI.changePassword(user.id, data.currentPassword, data.newPassword);
      toast.success('Пароль успешно изменен');
      setShowPasswordModal(false);
      reset();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Неверный текущий пароль')) {
          setError('currentPassword', { message: 'Неверный текущий пароль' });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Ошибка при смене пароля');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(Math.abs(seconds) / 3600);
    const minutes = Math.floor((Math.abs(seconds) % 3600) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 17) return 'Добрый день';
    return 'Добрый вечер';
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'start_work': return 'Начало работы';
      case 'start_break': return 'Начало перерыва';
      case 'end_break': return 'Конец перерыва';
      case 'end_work': return 'Конец работы';
      default: return action;
    }
  };

  const isBreakExceeded = breakDuration > MAX_BREAK_TIME;
  const remainingBreakTime = MAX_BREAK_TIME - (dailyBreakTime + breakDuration);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl w-10 h-10 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CHRONOS
                </h1>
                <p className="text-sm text-gray-500">Система учета времени</p>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              {impersonating && (
                <button
                  onClick={exitImpersonation}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Eye className="w-4 h-4" />
                  Выйти из режима
                </button>
              )}
              
              {user.role === 'admin' && !impersonating && (
                <a
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Shield className="w-4 h-4" />
                  Админ панель
                </a>
              )}
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Lock className="w-4 h-4" />
                Сменить пароль
              </button>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {getGreeting()}, {user.name}!
                </h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDisplayDate(currentTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="capitalize">{user.role === 'admin' ? 'Администратор' : 'Сотрудник'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Статус</div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    user.status === 'working' ? 'bg-green-500 animate-pulse' :
                    user.status === 'on_break' ? 'bg-orange-500 animate-pulse' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    {user.status === 'working' ? 'На работе' :
                     user.status === 'on_break' ? 'На перерыве' :
                     'Не в сети'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Display */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500 rounded-3xl p-8 text-white shadow-2xl">
            <div className="text-center">
              <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Clock className="w-8 h-8" />
              </div>
              <div className="text-6xl font-bold mb-2 font-mono tracking-wider">
                {formatDisplayTime(currentTime)}
              </div>
              <p className="text-white/90 text-lg">Текущее время (Ташкент)</p>
            </div>
          </div>
        </div>

        {/* Break Status */}
        {user.status === 'on_break' && (
          <div className="mb-8">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Вы на перерыве</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                    <div className="text-sm text-gray-600 mb-1">Общее время перерыва за день:</div>
                    <div className={`text-3xl font-bold font-mono ${
                      dailyBreakTime + breakDuration > MAX_BREAK_TIME ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {formatTime(dailyBreakTime + breakDuration)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Лимит: {formatTime(MAX_BREAK_TIME)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Текущий перерыв:</div>
                    <div className={`text-3xl font-bold font-mono ${
                      isBreakExceeded ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatTime(breakDuration)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {user.break_start_time && `Начат в ${formatTashkentTime(convertToTashkentTime(user.break_start_time)).split(' в ')[1]}`}
                    </div>
                  </div>
                </div>

                {isBreakExceeded && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">Превышен лимит перерыва!</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      Вы превысили дневной лимит перерыва на {formatTime(Math.abs(remainingBreakTime))}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleEndBreak}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  Закончить перерыв
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={handleStartWork}
              disabled={user.status === 'working' || user.status === 'on_break'}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8 rounded-2xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center gap-4"
            >
              <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center">
                <Play className="w-8 h-8" />
              </div>
              <span>Начать работу</span>
            </button>

            <button
              onClick={handleStartBreak}
              disabled={user.status !== 'working'}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-2xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center gap-4"
            >
              <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center">
                <Pause className="w-8 h-8" />
              </div>
              <span>Перерыв</span>
            </button>

            <button
              onClick={handleEndWork}
              disabled={user.status === 'offline'}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-8 rounded-2xl font-semibold text-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center gap-4"
            >
              <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center">
                <Square className="w-8 h-8" />
              </div>
              <span>Завершить день</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Статистика за сегодня
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Общее время перерыва</div>
                <div className="text-2xl font-bold text-blue-600 font-mono">
                  {formatTime(dailyBreakTime + (user.status === 'on_break' ? breakDuration : 0))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Оставшееся время перерыва</div>
                <div className={`text-2xl font-bold font-mono ${
                  remainingBreakTime < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatTime(remainingBreakTime)}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Рабочие часы</div>
                <div className="text-2xl font-bold text-purple-600">
                  {WORK_START_HOUR}:00 - {WORK_END_HOUR}:00
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-6 h-6" />
                История активности
              </h3>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {showLogs ? 'Скрыть' : 'Показать'}
              </button>
            </div>

            {showLogs && (
              <div>
                <div className="flex gap-2 mb-4">
                  {(['day', 'month', 'all'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setLogPeriod(period)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        logPeriod === period
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {period === 'day' ? 'За день' : period === 'month' ? 'За месяц' : 'Все время'}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка логов...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Нет записей за выбранный период</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            log.action === 'start_work' ? 'bg-green-500' :
                            log.action === 'start_break' ? 'bg-orange-500' :
                            log.action === 'end_break' ? 'bg-blue-500' :
                            'bg-red-500'
                          }`}></div>
                          <span className="font-medium">{getActionText(log.action)}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTashkentTime(convertToTashkentTime(log.timestamp))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Смена пароля
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текущий пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    {...register('currentPassword', {
                      required: 'Введите текущий пароль',
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Введите текущий пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    {...register('newPassword', {
                      required: 'Введите новый пароль',
                      minLength: {
                        value: 6,
                        message: 'Пароль должен содержать минимум 6 символов',
                      },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Введите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Подтвердите новый пароль',
                      validate: (value) =>
                        value === newPassword || 'Пароли не совпадают',
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Подтвердите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    reset();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Сохранить
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;