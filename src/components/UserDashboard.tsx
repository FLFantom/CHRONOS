import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  User, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Activity,
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI, getTashkentTime, formatTashkentTime, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME } from '../services/api';
import { TimeLog } from '../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserDashboard: React.FC = () => {
  const { user, logout, updateUserStatus, impersonating, exitImpersonation } = useAuth();
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [logs, setLogs] = useState<TimeLog[]>([]);
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
    setError
  } = useForm<PasswordChangeForm>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTashkentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      loadUserLogs();
    }
  }, [user]);

  const loadUserLogs = async () => {
    if (!user) return;
    
    try {
      const userLogs = await timeLogsAPI.getUserLogs(user.id, 'day');
      setLogs(userLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Ошибка загрузки логов');
    }
  };

  const handleAction = async (action: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await timeLogsAPI.logAction(action, user.id);
      
      // Update user status locally
      let newStatus: 'working' | 'on_break' | 'offline' = user.status;
      let newBreakStartTime = user.break_start_time;

      switch (action) {
        case 'start_work':
          newStatus = 'working';
          break;
        case 'start_break':
          newStatus = 'on_break';
          newBreakStartTime = new Date().toISOString();
          break;
        case 'end_break':
          newStatus = 'working';
          newBreakStartTime = undefined;
          break;
        case 'end_work':
          newStatus = 'offline';
          newBreakStartTime = undefined;
          break;
      }

      const updatedUser = {
        ...user,
        status: newStatus,
        break_start_time: newBreakStartTime
      };

      if (updateUserStatus) {
        updateUserStatus(updatedUser);
      }

      await loadUserLogs();
      
      const actionMessages = {
        start_work: 'Рабочий день начат',
        start_break: 'Перерыв начат',
        end_break: 'Перерыв завершен',
        end_work: 'Рабочий день завершен'
      };
      
      toast.success(actionMessages[action as keyof typeof actionMessages]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка выполнения действия');
    } finally {
      setLoading(false);
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
      setError('root', {
        message: error instanceof Error ? error.message : 'Ошибка смены пароля'
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Tashkent'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tashkent'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-500';
      case 'on_break':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return 'Работаю';
      case 'on_break':
        return 'На перерыве';
      case 'offline':
        return 'Не в сети';
      default:
        return 'Неизвестно';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'start_work':
        return 'Начал работу';
      case 'start_break':
        return 'Начал перерыв';
      case 'end_break':
        return 'Завершил перерыв';
      case 'end_work':
        return 'Завершил работу';
      default:
        return action;
    }
  };

  const getCurrentBreakDuration = () => {
    if (!user?.break_start_time) return 0;
    const breakStart = new Date(user.break_start_time);
    const now = new Date();
    return Math.floor((now.getTime() - breakStart.getTime()) / 1000);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  const isWorkingHours = () => {
    const hour = currentTime.getHours();
    return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
  };

  const currentBreakDuration = getCurrentBreakDuration();
  const isBreakExceeded = currentBreakDuration > MAX_BREAK_TIME;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-2">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CHRONOS
                </h1>
                <p className="text-sm text-gray-600">Система учета времени</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {impersonating && (
                <button
                  onClick={exitImpersonation}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Выйти из режима просмотра</span>
                </button>
              )}

              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status)} animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">{getStatusText(user.status)}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
                {user.role === 'admin' && (
                  <Shield className="w-4 h-4 text-purple-600" />
                )}
              </div>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Сменить пароль"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Доброе утро, {user.name}!
          </h2>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>{formatDate(currentTime)}</span>
          </div>
          
          {!isWorkingHours() && (
            <div className="mt-4 bg-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800 font-medium">
                  Рабочие часы: {WORK_START_HOUR}:00 - {WORK_END_HOUR}:00 (Ташкентское время)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Current Time Display */}
        <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <div className="text-center">
            <div className="bg-white/20 rounded-2xl p-4 mb-6 inline-block">
              <Clock className="w-12 h-12 text-white mx-auto" />
            </div>
            <div className="text-6xl font-bold mb-4 font-mono tracking-wider">
              {formatTime(currentTime)}
            </div>
            <p className="text-xl opacity-90">Текущее время (Ташкент)</p>
            
            {user.status === 'offline' && (
              <div className="mt-6 bg-white/20 rounded-xl p-4">
                <p className="text-lg">Рабочий день еще не начался 📅</p>
              </div>
            )}
          </div>
        </div>

        {/* Break Time Warning */}
        {user.status === 'on_break' && isBreakExceeded && (
          <div className="mb-6 bg-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">
                Превышено время перерыва! Текущий перерыв: {formatDuration(currentBreakDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => handleAction('start_work')}
            disabled={loading || user.status === 'working' || user.status === 'on_break'}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Play className="w-8 h-8 mx-auto mb-3" />
            <span className="block text-lg font-semibold">Начать работу</span>
          </button>

          <button
            onClick={() => handleAction('start_break')}
            disabled={loading || user.status !== 'working'}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-2xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Coffee className="w-8 h-8 mx-auto mb-3" />
            <span className="block text-lg font-semibold">Начать перерыв</span>
          </button>

          <button
            onClick={() => handleAction('end_break')}
            disabled={loading || user.status !== 'on_break'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Pause className="w-8 h-8 mx-auto mb-3" />
            <span className="block text-lg font-semibold">Завершить перерыв</span>
          </button>

          <button
            onClick={() => handleAction('end_work')}
            disabled={loading || user.status === 'offline'}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-2xl hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Square className="w-8 h-8 mx-auto mb-3" />
            <span className="block text-lg font-semibold">Завершить работу</span>
          </button>
        </div>

        {/* Current Break Timer */}
        {user.status === 'on_break' && user.break_start_time && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 rounded-full p-3">
                  <Timer className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Текущий перерыв</h3>
                  <p className="text-gray-600">Начат в {formatTime(new Date(user.break_start_time))}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isBreakExceeded ? 'text-red-600' : 'text-yellow-600'}`}>
                  {formatDuration(currentBreakDuration)}
                </div>
                <p className="text-sm text-gray-500">
                  Лимит: {formatDuration(MAX_BREAK_TIME)}
                </p>
              </div>
            </div>
            
            {isBreakExceeded && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  ⚠️ Время перерыва превышено на {formatDuration(currentBreakDuration - MAX_BREAK_TIME)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Admin Panel Link */}
        {user.role === 'admin' && (
          <div className="mb-8">
            <a
              href="/admin"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Shield className="w-5 h-5" />
              <span>Панель администратора</span>
            </a>
          </div>
        )}

        {/* Today's Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 rounded-full p-3">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Активность за сегодня</h3>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      log.action === 'start_work' ? 'bg-green-500' :
                      log.action === 'start_break' ? 'bg-yellow-500' :
                      log.action === 'end_break' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900">{getActionText(log.action)}</span>
                  </div>
                  <span className="text-gray-600">
                    {formatTime(new Date(log.timestamp))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Сегодня активности пока нет</p>
            </div>
          )}
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Смена пароля</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  reset();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текущий пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    {...register('currentPassword', {
                      required: 'Введите текущий пароль'
                    })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    {...register('newPassword', {
                      required: 'Введите новый пароль',
                      minLength: {
                        value: 6,
                        message: 'Пароль должен содержать минимум 6 символов'
                      }
                    })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Подтвердите новый пароль',
                      validate: value => value === newPassword || 'Пароли не совпадают'
                    })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{errors.root.message}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    reset();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Сохранить</span>
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