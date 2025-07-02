import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  LogOut, 
  KeyRound, 
  Wifi, 
  WifiOff, 
  Settings, 
  Eye, 
  EyeOff, 
  X,
  AlertTriangle,
  Coffee,
  Timer,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  Zap,
  CheckCircle,
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Shield,
  Award,
  BarChart3,
  Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI, isWithinWorkingHours, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME, getTashkentTime, convertToTashkentTime } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    onSubmit(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Enhanced decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-3 shadow-lg">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Смена пароля
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Текущий пароль
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
                placeholder="Введите текущий пароль"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
                placeholder="Введите новый пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Подтвердите новый пароль
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
                placeholder="Подтвердите пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 hover:border-gray-400"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Сменить пароль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserDashboard: React.FC = () => {
  const { user, logout, impersonating, exitImpersonation, updateUserStatus } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const tashkentTime = getTashkentTime();
      setCurrentTime(tashkentTime);
      
      // Calculate current break duration if user is on break
      if (user?.status === 'on_break' && user.break_start_time) {
        const breakStartTime = new Date(user.break_start_time).getTime();
        const currentTime = Date.now();
        const duration = Math.floor((currentTime - breakStartTime) / 1000);
        setCurrentBreakDuration(Math.max(0, duration));
      } else {
        setCurrentBreakDuration(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  // Initialize break duration when component mounts or user changes
  useEffect(() => {
    if (user?.status === 'on_break' && user.break_start_time) {
      const breakStartTime = new Date(user.break_start_time).getTime();
      const currentTime = Date.now();
      const duration = Math.floor((currentTime - breakStartTime) / 1000);
      setCurrentBreakDuration(Math.max(0, duration));
    } else {
      setCurrentBreakDuration(0);
    }
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Доброе утро', icon: Sunrise, color: 'from-orange-400 via-yellow-400 to-orange-500' };
    if (hour < 17) return { text: 'Добрый день', icon: Sun, color: 'from-blue-400 via-cyan-400 to-blue-500' };
    return { text: 'Добрый вечер', icon: Moon, color: 'from-purple-400 via-pink-400 to-purple-500' };
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm:ss');
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy г.', { locale: ru });
  };

  // Get total break time for the day (from database)
  const getTotalBreakTime = () => {
    return user?.daily_break_time || 0;
  };

  // Get current total break time including current break
  const getCurrentTotalBreakTime = () => {
    const dailyBreakTime = getTotalBreakTime();
    if (user?.status === 'on_break') {
      return dailyBreakTime + currentBreakDuration;
    }
    return dailyBreakTime;
  };

  // Format break duration in HH:MM:SS
  const formatBreakDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isWorkingHours = isWithinWorkingHours();
  const currentHour = currentTime.getHours();
  const greeting = getGreeting();

  const handleStartWork = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('start_work', user.id);
      const updatedUser = await usersAPI.getById(user.id);
      if (updatedUser && updateUserStatus) {
        updateUserStatus(updatedUser);
      }
      toast.success('Рабочий день начат');
    } catch (error) {
      toast.error('Ошибка при начале работы');
    }
  };

  const handleStartBreak = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('start_break', user.id);
      const updatedUser = await usersAPI.getById(user.id);
      if (updatedUser && updateUserStatus) {
        updateUserStatus(updatedUser);
        setCurrentBreakDuration(0);
      }
      toast.success('Перерыв начат');
    } catch (error) {
      toast.error('Ошибка при начале перерыва');
    }
  };

  const handleEndBreak = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('end_break', user.id);
      const updatedUser = await usersAPI.getById(user.id);
      if (updatedUser && updateUserStatus) {
        updateUserStatus(updatedUser);
        setCurrentBreakDuration(0);
      }
      toast.success('Перерыв закончен');
    } catch (error) {
      toast.error('Ошибка при окончании перерыва');
    }
  };

  const handleEndWork = async () => {
    if (!user) return;
    
    try {
      await timeLogsAPI.logAction('end_work', user.id);
      const updatedUser = await usersAPI.getById(user.id);
      if (updatedUser && updateUserStatus) {
        updateUserStatus(updatedUser);
        setCurrentBreakDuration(0);
      }
      toast.success('Рабочий день завершен');
    } catch (error) {
      toast.error('Ошибка при завершении работы');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return;

    try {
      await usersAPI.changePassword(user.id, currentPassword, newPassword);
      setChangePasswordModalOpen(false);
      toast.success('Пароль успешно изменен');
    } catch (error) {
      toast.error('Ошибка при смене пароля');
    }
  };

  if (!user) return null;

  // Enhanced break screen with real-time updates
  if (user.status === 'on_break') {
    const currentTotalBreakTime = getCurrentTotalBreakTime();
    const isExceeded = currentTotalBreakTime > MAX_BREAK_TIME;
    const remainingTime = Math.max(0, MAX_BREAK_TIME - currentTotalBreakTime);
    const progressPercentage = Math.min(100, (currentTotalBreakTime / MAX_BREAK_TIME) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 p-4 relative overflow-hidden">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-red-200 rounded-full opacity-30 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-amber-200 rounded-full opacity-15 animate-pulse"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-orange-300 rounded-full opacity-25 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-100 to-red-100 rounded-full opacity-10 animate-pulse"></div>
          
          {/* Floating coffee icons */}
          <div className="absolute top-1/4 left-1/4 animate-float">
            <Coffee className="w-8 h-8 text-orange-300 opacity-30" />
          </div>
          <div className="absolute top-3/4 right-1/4 animate-float-delayed">
            <Timer className="w-6 h-6 text-red-300 opacity-40" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Enhanced header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-6">
              <div className={`rounded-2xl w-20 h-20 flex items-center justify-center shadow-xl relative overflow-hidden ${
                isExceeded ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' : 'bg-gradient-to-br from-orange-400 to-red-500'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
                <Coffee className="w-10 h-10 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  Перерыв в процессе
                  <div className="flex gap-1">
                    <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                    <Coffee className="w-6 h-6 text-amber-500 animate-bounce" />
                  </div>
                </h1>
                <p className="text-gray-600 text-xl capitalize">
                  {format(currentTime, 'EEEE, d MMMM yyyy г.', { locale: ru })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-500 font-medium">
                    Текущее время: {formatTime(currentTime)} (Ташкент)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              {user.role === 'admin' && !impersonating && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Settings className="w-5 h-5" />
                  Админ панель
                </button>
              )}
              {impersonating && (
                <button
                  onClick={exitImpersonation}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Назад к панели
                </button>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
                Выйти
              </button>
            </div>
          </div>

          {/* Main break content with enhanced design */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Central timer display */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center relative overflow-hidden border border-white/50">
                {/* Enhanced background decoration */}
                <div className={`absolute top-0 left-0 w-full h-2 ${
                  isExceeded 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-orange-400 to-red-500'
                }`}></div>
                
                <div className={`rounded-3xl w-40 h-40 flex items-center justify-center mx-auto mb-10 shadow-2xl relative overflow-hidden ${
                  isExceeded 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse shadow-glow-red' 
                    : 'bg-gradient-to-br from-orange-400 to-red-500 shadow-glow-orange'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
                  <Timer className="w-20 h-20 text-white relative z-10" />
                </div>
                
                <h2 className="text-5xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Вы на перерыве
                </h2>
                
                {/* Current break timer */}
                <div className="mb-10">
                  <p className="text-lg text-gray-600 mb-4 font-medium">
                    Текущий перерыв:
                  </p>
                  <div className="text-8xl font-mono font-bold text-blue-600 mb-4 tracking-wider text-shadow-lg">
                    {formatBreakDuration(currentBreakDuration)}
                  </div>
                  <p className="text-gray-500 bg-gray-100 rounded-lg px-4 py-2 inline-block">
                    Начат в {user.break_start_time ? format(convertToTashkentTime(user.break_start_time), 'HH:mm', { locale: ru }) : '--:--'} (Ташкент)
                  </p>
                </div>

                {/* Enhanced progress bar */}
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-gray-600 font-medium">Использовано времени</span>
                    <span className="text-xl font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 shadow-lg ${
                        isExceeded 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
                          : progressPercentage > 80 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-green-500 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Enhanced action button */}
                <button
                  onClick={handleEndBreak}
                  className={`px-16 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl ripple ${
                    isExceeded
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 animate-pulse shadow-glow-red'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-glow-green'
                  }`}
                >
                  {isExceeded ? 'Срочно завершить перерыв!' : 'Закончить перерыв'}
                </button>
              </div>
            </div>

            {/* Enhanced side statistics */}
            <div className="space-y-6">
              {/* Daily break summary */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-3 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Общее время за день</h3>
                </div>
                <div className={`text-4xl font-mono font-bold mb-4 ${isExceeded ? 'text-red-500' : 'text-orange-500'}`}>
                  {formatBreakDuration(currentTotalBreakTime)}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <span className="font-medium">Лимит: 01:00:00</span>
                  {!isExceeded && (
                    <span className="text-green-600 font-bold">
                      Осталось: {formatBreakDuration(remainingTime)}
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced break tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-6 border border-blue-200 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Советы для перерыва</h3>
                </div>
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Выпейте стакан воды</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Сделайте легкую разминку</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Отдохните глазам от экрана</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Проветрите помещение</span>
                  </div>
                </div>
              </div>

              {/* Enhanced quick stats */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-3 shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Статистика</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-gray-600 font-medium">Рабочие часы</span>
                    <span className="font-bold text-gray-800">{WORK_START_HOUR}:00 - {WORK_END_HOUR}:00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Статус</span>
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Coffee className="w-4 h-4" />
                      На перерыве
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-gray-600 font-medium">Сегодня</span>
                    <span className="font-bold text-gray-800">{format(currentTime, 'dd.MM.yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced warning message */}
          {isExceeded && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-3xl p-8 mb-8 shadow-2xl animate-glow">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="bg-red-500 rounded-2xl p-4 animate-pulse shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-red-700 flex items-center gap-2">
                  Превышен лимит перерыва!
                  <Flame className="w-8 h-8 text-red-600 animate-bounce" />
                </h3>
              </div>
              <div className="text-center space-y-4">
                <p className="text-red-600 font-semibold text-lg">
                  Вы превысили максимально допустимое время перерыва в 1 час.
                </p>
                <p className="text-red-500">
                  Администратор уведомлен. Рекомендуется немедленно завершить перерыв.
                </p>
                <div className="mt-6 p-4 bg-red-200 rounded-xl">
                  <p className="text-red-800 font-bold text-lg">
                    Превышение: {formatBreakDuration(currentTotalBreakTime - MAX_BREAK_TIME)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced footer */}
          <div className="text-center text-gray-500">
            <p className="text-lg">Система автоматически отслеживает время перерыва</p>
            <p className="mt-2 font-medium">Максимальное время перерыва в день: 1 час</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-200 rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-5 animate-pulse"></div>
        
        {/* Floating work icons */}
        <div className="absolute top-1/4 left-1/4 animate-float">
          <Shield className="w-8 h-8 text-blue-300 opacity-30" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-float-delayed">
          <Award className="w-6 h-6 text-purple-300 opacity-40" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-float">
          <BarChart3 className="w-7 h-7 text-indigo-300 opacity-35" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`bg-gradient-to-r ${greeting.color} rounded-2xl p-4 shadow-xl relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
                <greeting.icon className="w-10 h-10 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {greeting.text}, {user.name}!
                </h1>
                <p className="text-gray-600 text-xl capitalize flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {formatDate(currentTime)}
                </p>
              </div>
            </div>
            {!isWorkingHours && (
              <div className="flex items-center gap-3 mt-4 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-xl p-4 shadow-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  Рабочие часы: {WORK_START_HOUR}:00 - {WORK_END_HOUR}:00 (Ташкентское время)
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {user.role === 'admin' && !impersonating && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Settings className="w-5 h-5" />
                Админ панель
              </button>
            )}
            {impersonating && (
              <button
                onClick={exitImpersonation}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Назад к панели
              </button>
            )}
            <button 
              onClick={() => setChangePasswordModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <KeyRound className="w-5 h-5" />
              Сменить пароль
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <LogOut className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>

        {/* Enhanced time display */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl p-10 mb-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white opacity-5 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="bg-white/20 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Clock className="w-12 h-12 opacity-90" />
            </div>
            <div className="text-8xl font-mono font-bold mb-6 tracking-wider text-shadow-lg">
              {formatTime(currentTime)}
            </div>
            <p className="text-blue-100 text-2xl font-medium">
              Текущее время (Ташкент)
            </p>
            
            {!isWorkingHours && (
              <div className="mt-6 bg-amber-500 bg-opacity-20 rounded-xl p-4">
                <p className="text-amber-100 font-medium">
                  {currentHour < WORK_START_HOUR ? 'Рабочий день еще не начался' : 'Рабочий день завершен'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Break time summary */}
        {user.daily_break_time && user.daily_break_time > 60 && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-10 text-center border-l-4 border-orange-400 card-hover">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-3 shadow-lg">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Время перерыва за сегодня
              </h3>
            </div>
            <div className={`text-5xl font-mono font-bold mb-4 ${
              getCurrentTotalBreakTime() > MAX_BREAK_TIME ? 'text-red-500' : 'text-orange-500'
            }`}>
              {formatBreakDuration(getCurrentTotalBreakTime())}
            </div>
            <div className="flex items-center justify-center gap-6 text-gray-600 bg-gray-50 rounded-xl p-4">
              <span className="font-medium">Лимит: 01:00:00 в день</span>
              {getCurrentTotalBreakTime() > MAX_BREAK_TIME && (
                <span className="text-red-500 font-bold">
                  Превышение: {formatBreakDuration(getCurrentTotalBreakTime() - MAX_BREAK_TIME)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Enhanced action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-10 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50 card-hover">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
              <Play className="w-12 h-12 text-white relative z-10" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Начать работу
            </h3>
            <p className="text-gray-600 mb-10 leading-relaxed text-lg">
              Зафиксировать начало рабочего дня и начать отслеживание времени
            </p>
            <button
              onClick={handleStartWork}
              disabled={user.status === 'working'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ripple"
            >
              {user.status === 'working' ? 'Уже работаете' : 'Начать работу'}
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-10 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50 card-hover">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
              <Pause className="w-12 h-12 text-white relative z-10" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Перерыв
            </h3>
            <p className="text-gray-600 mb-10 leading-relaxed text-lg">
              Зафиксировать начало перерыва. Максимум 1 час в день
            </p>
            <button
              onClick={handleStartBreak}
              disabled={user.status !== 'working'}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ripple"
            >
              {user.status === 'working' ? 'Начать перерыв' : 'Недоступно'}
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-10 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50 card-hover">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
              <Square className="w-12 h-12 text-white relative z-10" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Завершить день
            </h3>
            <p className="text-gray-600 mb-10 leading-relaxed text-lg">
              Зафиксировать окончание рабочего дня и остановить отслеживание
            </p>
            <button
              onClick={handleEndWork}
              disabled={user.status === 'offline'}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ripple"
            >
              {user.status === 'offline' ? 'День завершен' : 'Завершить день'}
            </button>
          </div>
        </div>

        {/* Enhanced status display */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-white/50 card-hover">
          <div className="flex items-center justify-center gap-4 text-xl">
            {user.status === 'offline' ? (
              <>
                <div className="bg-gray-500 rounded-full p-2">
                  <WifiOff className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-600 font-semibold">Статус: Не в сети</span>
              </>
            ) : user.status === 'working' ? (
              <>
                <div className="bg-green-500 rounded-full p-2 animate-pulse">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-600 font-semibold">Статус: На работе</span>
              </>
            ) : (
              <>
                <div className="bg-orange-500 rounded-full p-2">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <span className="text-orange-600 font-semibold">Статус: На перерыве</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
};

export default UserDashboard;