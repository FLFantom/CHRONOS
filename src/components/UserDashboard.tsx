import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Coffee, 
  User, 
  Calendar, 
  Timer, 
  Activity,
  Settings,
  LogOut,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Zap,
  Star,
  Award,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI, getTashkentTime, formatTashkentTime, MAX_BREAK_TIME } from '../services/api';
import { TimeLog } from '../types';
import toast from 'react-hot-toast';

const UserDashboard: React.FC = () => {
  const { user, logout, updateUserStatus, impersonating, exitImpersonation } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [dailyBreakTime, setDailyBreakTime] = useState(0);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTashkentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadLogs();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const userData = await usersAPI.getById(user.id);
      if (userData) {
        setDailyBreakTime(userData.daily_break_time || 0);
        if (userData.work_start_time) {
          setWorkStartTime(new Date(userData.work_start_time));
        }
        if (updateUserStatus) {
          updateUserStatus(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadLogs = async () => {
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
      let newStatus = user.status;
      let newBreakStartTime = user.break_start_time;
      
      switch (action) {
        case 'start_work':
          newStatus = 'working';
          setWorkStartTime(new Date());
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
          setWorkStartTime(null);
          break;
      }
      
      if (updateUserStatus) {
        updateUserStatus({
          ...user,
          status: newStatus,
          break_start_time: newBreakStartTime
        });
      }
      
      await loadUserData();
      await loadLogs();
      
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    try {
      await usersAPI.changePassword(
        user!.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      toast.success('Пароль успешно изменен');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка смены пароля');
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

  const getCurrentBreakDuration = () => {
    if (user?.status === 'on_break' && user.break_start_time) {
      const breakStart = new Date(user.break_start_time);
      const now = new Date();
      return Math.floor((now.getTime() - breakStart.getTime()) / 1000);
    }
    return 0;
  };

  const getTotalBreakTime = () => {
    return dailyBreakTime + getCurrentBreakDuration();
  };

  const getWorkDuration = () => {
    if (workStartTime && user?.status !== 'offline') {
      const now = new Date();
      return Math.floor((now.getTime() - workStartTime.getTime()) / 1000);
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-green-600 bg-green-100';
      case 'on_break': return 'text-orange-600 bg-orange-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working': return 'Работаю';
      case 'on_break': return 'На перерыве';
      case 'offline': return 'Не в сети';
      default: return 'Неизвестно';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'start_work': return 'Начал работу';
      case 'start_break': return 'Начал перерыв';
      case 'end_break': return 'Закончил перерыв';
      case 'end_work': return 'Закончил работу';
      default: return action;
    }
  };

  const canStartBreak = () => {
    return user?.status === 'working' && getTotalBreakTime() < MAX_BREAK_TIME;
  };

  const isBreakTimeExceeded = () => {
    return getTotalBreakTime() >= MAX_BREAK_TIME;
  };

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
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Доброе утро, {user.name}!
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(currentTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {impersonating && (
                <button
                  onClick={exitImpersonation}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Выйти из режима
                </button>
              )}
              
              {user.role === 'admin' && !impersonating && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Админ панель
                </button>
              )}
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Сменить пароль
              </button>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Working Hours Notice */}
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">
              Рабочие часы: 9:00 - 18:00 (Ташкентское время)
            </span>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
          <div className="text-center">
            <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <div className="text-6xl font-bold mb-4 font-mono tracking-wider">
              {formatTime(currentTime)}
            </div>
            <p className="text-xl opacity-90">Текущее время (Ташкент)</p>
            
            <div className="mt-6 bg-white/10 rounded-xl p-4">
              <p className="text-lg">
                {user.status === 'offline' ? 'Рабочий день еще не начался 📅' : 
                 user.status === 'working' ? 'Продуктивной работы! 💪' :
                 'Приятного перерыва! ☕'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Текущий статус
              </h2>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </div>
                  {user.status === 'on_break' && (
                    <div className="text-sm text-gray-600">
                      Перерыв: {formatDuration(getCurrentBreakDuration())}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                {user.status === 'offline' && (
                  <button
                    onClick={() => handleAction('start_work')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    Начать работу
                  </button>
                )}

                {user.status === 'working' && (
                  <>
                    <button
                      onClick={() => handleAction('start_break')}
                      disabled={loading || !canStartBreak()}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                    >
                      <Coffee className="w-5 h-5" />
                      Начать перерыв
                    </button>
                    <button
                      onClick={() => handleAction('end_work')}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                    >
                      <Square className="w-5 h-5" />
                      Завершить работу
                    </button>
                  </>
                )}

                {user.status === 'on_break' && (
                  <button
                    onClick={() => handleAction('end_break')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 col-span-2"
                  >
                    <Pause className="w-5 h-5" />
                    Завершить перерыв
                  </button>
                )}
              </div>

              {!canStartBreak() && user.status === 'working' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    Лимит перерыва на сегодня исчерпан (1 час)
                  </p>
                </div>
              )}
            </div>

            {/* Today's Activity Logs */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Активность за сегодня
              </h2>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-800">
                          {getActionText(log.action)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatTashkentTime(new Date(log.timestamp))}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Активность за сегодня пока отсутствует</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Daily Statistics */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Статистика дня
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Время работы</span>
                  <span className="text-green-800 font-bold">
                    {formatDuration(getWorkDuration())}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-700 font-medium">Время перерыва</span>
                  <span className="text-orange-800 font-bold">
                    {formatDuration(getTotalBreakTime())}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Осталось перерыва</span>
                  <span className="text-blue-800 font-bold">
                    {formatDuration(Math.max(0, MAX_BREAK_TIME - getTotalBreakTime()))}
                  </span>
                </div>
              </div>
            </div>

            {/* Break Time Progress */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-500" />
                Лимит перерыва
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Использовано</span>
                  <span>{Math.round((getTotalBreakTime() / MAX_BREAK_TIME) * 100)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isBreakTimeExceeded() ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (getTotalBreakTime() / MAX_BREAK_TIME) * 100)}%` 
                    }}
                  ></div>
                </div>
                
                {isBreakTimeExceeded() && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>Лимит превышен!</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Информация
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Роль</span>
                  <span className="font-medium">
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус</span>
                  <span className={`font-medium ${getStatusColor(user.status)} px-2 py-1 rounded text-xs`}>
                    {getStatusText(user.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Смена пароля</h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Отмена
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