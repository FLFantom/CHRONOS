import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Calendar,
  Settings,
  LogOut,
  Key,
  Shield,
  User,
  Activity,
  Coffee,
  Briefcase,
  Timer,
  TrendingUp,
  BarChart3,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI, getTashkentTime, formatTashkentTime, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME } from '../services/api';
import { TimeLog } from '../types';
import toast from 'react-hot-toast';

const UserDashboard: React.FC = () => {
  const { user, logout, impersonating, exitImpersonation, updateUserStatus } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
      const interval = setInterval(loadUserData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user logs for today
      const todayLogs = await timeLogsAPI.getUserLogs(user.id, 'day');
      setLogs(todayLogs);

      // Get updated user data
      const updatedUser = await usersAPI.getById(user.id);
      if (updatedUser && updateUserStatus) {
        updateUserStatus(updatedUser);
        setDailyBreakTime(updatedUser.daily_break_time || 0);
        
        // Find work start time from today's logs
        const startWorkLog = todayLogs.find(log => log.action === 'start_work');
        if (startWorkLog) {
          setWorkStartTime(new Date(startWorkLog.timestamp));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAction = async (action: string) => {
    if (!user) return;

    try {
      await timeLogsAPI.logAction(action, user.id);
      await loadUserData();
      
      const actionMessages = {
        start_work: 'Рабочий день начат',
        start_break: 'Перерыв начат',
        end_break: 'Перерыв завершен',
        end_work: 'Рабочий день завершен'
      };
      
      toast.success(actionMessages[action as keyof typeof actionMessages] || 'Действие выполнено');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при выполнении действия');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Новые пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setIsChangingPassword(true);

    try {
      await usersAPI.changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
      toast.success('Пароль успешно изменен');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при смене пароля');
    } finally {
      setIsChangingPassword(false);
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
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'from-green-500 to-emerald-600';
      case 'on_break':
        return 'from-orange-500 to-amber-600';
      case 'offline':
        return 'from-gray-500 to-slate-600';
      default:
        return 'from-gray-500 to-slate-600';
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

  const isWorkingHours = () => {
    const hour = currentTime.getHours();
    return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
  };

  const getBreakTimeRemaining = () => {
    const remaining = MAX_BREAK_TIME - dailyBreakTime;
    return Math.max(0, remaining);
  };

  const isBreakTimeExceeded = () => {
    return dailyBreakTime >= MAX_BREAK_TIME;
  };

  const getCurrentBreakDuration = () => {
    if (user?.status === 'on_break' && user.break_start_time) {
      const breakStart = new Date(user.break_start_time);
      const now = new Date();
      return Math.floor((now.getTime() - breakStart.getTime()) / 1000);
    }
    return 0;
  };

  const getTotalWorkTime = () => {
    if (!workStartTime) return 0;
    
    const now = new Date();
    let totalWorkTime = Math.floor((now.getTime() - workStartTime.getTime()) / 1000);
    
    // Subtract break time from total work time
    totalWorkTime -= dailyBreakTime;
    
    // If currently on break, don't subtract current break time as it's already included in dailyBreakTime calculation
    
    return Math.max(0, totalWorkTime);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Доброе утро, {user.name}!
                </h1>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {impersonating && (
                <button
                  onClick={exitImpersonation}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Eye className="w-4 h-4" />
                  Назад к панели
                </button>
              )}

              {user.role === 'admin' && !impersonating && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Shield className="w-4 h-4" />
                  Назад к панели
                </button>
              )}

              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Key className="w-4 h-4" />
                Сменить пароль
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Time Display */}
        <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-3xl p-8 mb-8 text-center text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
          <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div className="text-6xl font-bold mb-2 font-mono tracking-wider">
            {formatTime(currentTime)}
          </div>
          <p className="text-xl opacity-90 font-medium">
            Текущее время (Ташкент)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => handleAction('start_work')}
            disabled={user.status === 'working' || user.status === 'on_break'}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-2xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
          >
            <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all duration-300">
              <Play className="w-8 h-8" />
            </div>
            Начать работу
          </button>

          <button
            onClick={() => user.status === 'working' ? handleAction('start_break') : handleAction('end_break')}
            disabled={user.status === 'offline'}
            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-8 rounded-2xl font-semibold text-lg hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
          >
            <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all duration-300">
              <Pause className="w-8 h-8" />
            </div>
            {user.status === 'working' ? 'Перерыв' : 'Завершить перерыв'}
          </button>

          <button
            onClick={() => handleAction('end_work')}
            disabled={user.status === 'offline'}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-8 rounded-2xl font-semibold text-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
          >
            <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all duration-300">
              <Square className="w-8 h-8" />
            </div>
            Завершить день
          </button>
        </div>

        {/* Status and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Activity className="w-6 h-6 mr-3 text-blue-600" />
              Текущий статус
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className={`px-4 py-2 rounded-full text-white font-medium bg-gradient-to-r ${getStatusColor(user.status)}`}>
                  {getStatusText(user.status)}
                </span>
              </div>
              
              {user.status === 'working' && workStartTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Время работы:</span>
                  <span className="font-mono text-lg font-bold text-green-600">
                    {formatDuration(getTotalWorkTime())}
                  </span>
                </div>
              )}

              {user.status === 'on_break' && user.break_start_time && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Текущий перерыв:</span>
                  <span className="font-mono text-lg font-bold text-orange-600">
                    {formatDuration(getCurrentBreakDuration())}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Время перерывов за день:</span>
                <span className={`font-mono text-lg font-bold ${isBreakTimeExceeded() ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatDuration(dailyBreakTime)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Осталось времени на перерыв:</span>
                <span className={`font-mono text-lg font-bold ${getBreakTimeRemaining() === 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatDuration(getBreakTimeRemaining())}
                </span>
              </div>

              {isBreakTimeExceeded() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm font-medium">
                    ⚠️ Превышен лимит времени на перерыв (1 час в день)
                  </p>
                </div>
              )}

              {!isWorkingHours() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-amber-700 text-sm font-medium">
                    ⏰ Сейчас нерабочее время (рабочие часы: {WORK_START_HOUR}:00 - {WORK_END_HOUR}:00)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Stats */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-purple-600" />
              Статистика за день
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Общее время работы:
                </span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {workStartTime ? formatDuration(getTotalWorkTime()) : '00:00:00'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Coffee className="w-4 h-4 mr-2" />
                  Время на перерывах:
                </span>
                <span className="font-mono text-lg font-bold text-orange-600">
                  {formatDuration(dailyBreakTime)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Timer className="w-4 h-4 mr-2" />
                  Количество действий:
                </span>
                <span className="font-mono text-lg font-bold text-purple-600">
                  {logs.length}
                </span>
              </div>

              {workStartTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Начало работы:
                  </span>
                  <span className="font-mono text-lg font-bold text-green-600">
                    {formatTime(workStartTime)}
                  </span>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Прогресс рабочего дня</span>
                  <span className="text-sm font-bold text-blue-600">
                    {workStartTime ? Math.round((getTotalWorkTime() / (8 * 3600)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${workStartTime ? Math.min((getTotalWorkTime() / (8 * 3600)) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-indigo-600" />
            Активность за сегодня
          </h3>
          
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">Нет активности за сегодня</p>
              <p className="text-gray-400 text-sm mt-2">Начните работу, чтобы увидеть логи активности</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {logs.map((log, index) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      log.action === 'start_work' ? 'bg-green-500' :
                      log.action === 'start_break' ? 'bg-orange-500' :
                      log.action === 'end_break' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-800">
                      {getActionText(log.action)}
                    </span>
                  </div>
                  <span className="text-gray-600 font-mono text-sm">
                    {new Date(log.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'Asia/Tashkent'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Key className="w-6 h-6 mr-3 text-blue-600" />
              Смена пароля
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текущий пароль
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={isChangingPassword}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Изменение...' : 'Изменить пароль'}
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