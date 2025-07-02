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
  Timer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI, isWithinWorkingHours, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME } from '../services/api';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Смена пароля
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текущий пароль
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите текущий пароль"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите новый пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Подтвердите новый пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (breakStartTime) {
        const duration = Math.floor((Date.now() - breakStartTime.getTime()) / 1000);
        setCurrentBreakDuration(duration);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [breakStartTime]);

  useEffect(() => {
    // Initialize break time if user is on break
    if (user?.status === 'on_break' && user.break_start_time) {
      setBreakStartTime(new Date(user.break_start_time));
    } else {
      setBreakStartTime(null);
      setCurrentBreakDuration(0);
    }
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 17) return 'Добрый день';
    return 'Добрый вечер';
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm:ss');
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy г.', { locale: ru });
  };

  const getTotalBreakTime = () => {
    return user?.daily_break_time || 0;
  };

  const formatBreakDuration = (seconds: number) => {
    const totalSeconds = getTotalBreakTime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (totalSeconds > MAX_BREAK_TIME) {
      const excessSeconds = totalSeconds - MAX_BREAK_TIME;
      const excessHours = Math.floor(excessSeconds / 3600);
      const excessMinutes = Math.floor((excessSeconds % 3600) / 60);
      const excessSecs = excessSeconds % 60;
      return `-${String(excessHours).padStart(2, '0')}:${String(excessMinutes).padStart(2, '0')}:${String(excessSecs).padStart(2, '0')}`;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatCurrentBreakDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isWorkingHours = isWithinWorkingHours();
  const currentHour = currentTime.getHours();

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
        setBreakStartTime(new Date());
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
        setBreakStartTime(null);
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
        setBreakStartTime(null);
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

  // Break screen with enhanced design
  if (user.status === 'on_break') {
    const totalBreakTime = getTotalBreakTime();
    const isExceeded = totalBreakTime > MAX_BREAK_TIME;
    const remainingTime = MAX_BREAK_TIME - totalBreakTime;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
                isExceeded ? 'bg-red-500' : 'bg-orange-500'
              }`}>
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Перерыв в процессе
                </h1>
                <p className="text-gray-600">
                  {isExceeded ? 'Время превышено!' : `Осталось: ${formatCurrentBreakDuration(remainingTime)}`}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              {user.role === 'admin' && !impersonating && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Админ панель
                </button>
              )}
              {impersonating && (
                <button
                  onClick={exitImpersonation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Назад к панели
                </button>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
            
            <div className={`rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 ${
              isExceeded 
                ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' 
                : 'bg-gradient-to-br from-orange-400 to-red-500'
            }`}>
              <Timer className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Вы на перерыве
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-sm text-gray-600 mb-2">
                  Общее время перерыва за день:
                </p>
                <div className={`text-4xl font-mono font-bold mb-2 ${isExceeded ? 'text-red-500' : 'text-orange-500'}`}>
                  {formatBreakDuration(totalBreakTime)}
                </div>
                <p className="text-xs text-gray-500">
                  Лимит: 01:00:00
                </p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6">
                <p className="text-sm text-gray-600 mb-2">
                  Текущий перерыв:
                </p>
                <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
                  {formatCurrentBreakDuration(currentBreakDuration)}
                </div>
                <p className="text-xs text-gray-500">
                  Начат в {breakStartTime ? format(breakStartTime, 'HH:mm', { locale: ru }) : '--:--'}
                </p>
              </div>
            </div>
            
            {isExceeded && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-bold text-red-700">
                    Превышен лимит перерыва!
                  </h3>
                </div>
                <p className="text-red-600 mb-2">
                  Вы превысили максимально допустимое время перерыва в 1 час.
                </p>
                <p className="text-red-500 text-sm">
                  Администратор уведомлен. Рекомендуется немедленно завершить перерыв.
                </p>
              </div>
            )}
            
            <button
              onClick={handleEndBreak}
              className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                isExceeded
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
              }`}
            >
              Закончить перерыв
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard with enhanced design
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {getGreeting()}, {user.name}!
            </h1>
            <p className="text-gray-600 text-lg capitalize">
              {formatDate(currentTime)}
            </p>
            {!isWorkingHours && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  Рабочие часы: {WORK_START_HOUR}:00 - {WORK_END_HOUR}:00
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {user.role === 'admin' && !impersonating && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Админ панель
              </button>
            )}
            {impersonating && (
              <button
                onClick={exitImpersonation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Назад к панели
              </button>
            )}
            <button 
              onClick={() => setChangePasswordModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Сменить пароль
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>

        {/* Enhanced time display */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-3xl shadow-2xl p-8 mb-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          
          <Clock className="w-20 h-20 mx-auto mb-6 opacity-90" />
          <div className="text-7xl font-mono font-bold mb-4 tracking-wider">
            {formatTime(currentTime)}
          </div>
          <p className="text-blue-100 text-xl">
            Текущее время
          </p>
          
          {!isWorkingHours && (
            <div className="mt-4 bg-amber-500 bg-opacity-20 rounded-lg p-3">
              <p className="text-amber-100 text-sm">
                {currentHour < WORK_START_HOUR ? 'Рабочий день еще не начался' : 'Рабочий день завершен'}
              </p>
            </div>
          )}
        </div>

        {/* Break time summary with enhanced design */}
        {user.daily_break_time && user.daily_break_time > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center border-l-4 border-orange-400">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coffee className="w-6 h-6 text-orange-500" />
              <h3 className="text-xl font-bold text-gray-800">
                Время перерыва за сегодня
              </h3>
            </div>
            <div className={`text-4xl font-mono font-bold mb-2 ${
              user.daily_break_time > MAX_BREAK_TIME ? 'text-red-500' : 'text-orange-500'
            }`}>
              {String(Math.floor(user.daily_break_time / 3600)).padStart(2, '0')}:
              {String(Math.floor((user.daily_break_time % 3600) / 60)).padStart(2, '0')}:
              {String(user.daily_break_time % 60).padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span>Лимит: 01:00:00 в день</span>
              {user.daily_break_time > MAX_BREAK_TIME && (
                <span className="text-red-500 font-medium">
                  Превышение: {formatCurrentBreakDuration(user.daily_break_time - MAX_BREAK_TIME)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Enhanced action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Начать работу
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Зафиксировать начало рабочего дня и начать отслеживание времени
            </p>
            <button
              onClick={handleStartWork}
              disabled={user.status === 'working'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {user.status === 'working' ? 'Уже работаете' : 'Начать работу'}
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Pause className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Перерыв
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Зафиксировать начало перерыва. Максимум 1 час в день
            </p>
            <button
              onClick={handleStartBreak}
              disabled={user.status !== 'working'}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {user.status === 'working' ? 'Начать перерыв' : 'Недоступно'}
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Square className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Завершить день
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Зафиксировать окончание рабочего дня и остановить отслеживание
            </p>
            <button
              onClick={handleEndWork}
              disabled={user.status === 'offline'}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {user.status === 'offline' ? 'День завершен' : 'Завершить день'}
            </button>
          </div>
        </div>

        {/* Enhanced status display */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-lg">
            {user.status === 'offline' ? (
              <>
                <WifiOff className="w-6 h-6 text-gray-500" />
                <span className="text-gray-600 font-medium">Статус: Не в сети</span>
              </>
            ) : user.status === 'working' ? (
              <>
                <Wifi className="w-6 h-6 text-green-500" />
                <span className="text-green-600 font-medium">Статус: На работе</span>
              </>
            ) : (
              <>
                <Coffee className="w-6 h-6 text-orange-500" />
                <span className="text-orange-600 font-medium">Статус: На перерыве</span>
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