import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, LogOut, KeyRound, Wifi, WifiOff, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogsAPI, usersAPI } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UserDashboard: React.FC = () => {
  const { user, logout, impersonating, exitImpersonation, updateUserStatus } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [currentBreakDuration, setCurrentBreakDuration] = useState(0);

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
    const dailyBreakTime = user?.daily_break_time || 0;
    return dailyBreakTime + currentBreakDuration;
  };

  const formatBreakDuration = (seconds: number) => {
    const totalSeconds = getTotalBreakTime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    // If total break time exceeds 1 hour, show negative time
    if (totalSeconds > 3600) {
      const excessSeconds = totalSeconds - 3600;
      const excessHours = Math.floor(excessSeconds / 3600);
      const excessMinutes = Math.floor((excessSeconds % 3600) / 60);
      const excessSecs = excessSeconds % 60;
      return `-${String(excessHours).padStart(2, '0')}:${String(excessMinutes).padStart(2, '0')}:${String(excessSecs).padStart(2, '0')}`;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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

  if (!user) return null;

  if (user.status === 'on_break') {
    const totalBreakTime = getTotalBreakTime();
    const isExceeded = totalBreakTime > 3600;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-red-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Перерыв в процессе
            </h1>
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

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className={`rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 ${
              isExceeded 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-orange-400 to-red-500'
            }`}>
              <Pause className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Вы на перерыве
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Общее время перерыва за день:
              </p>
              <div className={`text-6xl font-mono mb-4 ${isExceeded ? 'text-red-500' : 'text-orange-500'}`}>
                {formatBreakDuration(totalBreakTime)}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Текущий перерыв:
              </p>
              <div className="text-2xl font-mono text-gray-700">
                {String(Math.floor(currentBreakDuration / 3600)).padStart(2, '0')}:
                {String(Math.floor((currentBreakDuration % 3600) / 60)).padStart(2, '0')}:
                {String(currentBreakDuration % 60).padStart(2, '0')}
              </div>
            </div>
            
            {isExceeded && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-medium">
                  ⚠️ Превышен лимит перерыва в 1 час! Администратор уведомлен.
                </p>
                <p className="text-red-600 text-sm mt-1">
                  Рекомендуется немедленно завершить перерыв.
                </p>
              </div>
            )}
            
            <button
              onClick={handleEndBreak}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              {getGreeting()}, {user.name}!
            </h1>
            <p className="text-gray-600 capitalize">
              {formatDate(currentTime)}
            </p>
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
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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

        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-2xl shadow-xl p-8 mb-8 text-white text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <div className="text-6xl font-mono font-bold mb-2">
            {formatTime(currentTime)}
          </div>
          <p className="text-blue-100 text-lg">
            Текущее время
          </p>
        </div>

        {/* Break time summary */}
        {user.daily_break_time && user.daily_break_time > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Время перерыва за сегодня
            </h3>
            <div className={`text-3xl font-mono ${
              user.daily_break_time > 3600 ? 'text-red-500' : 'text-orange-500'
            }`}>
              {String(Math.floor(user.daily_break_time / 3600)).padStart(2, '0')}:
              {String(Math.floor((user.daily_break_time % 3600) / 60)).padStart(2, '0')}:
              {String(user.daily_break_time % 60).padStart(2, '0')}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Лимит: 01:00:00 в день
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Начать работу
            </h3>
            <p className="text-gray-600 mb-6">
              Зафиксировать начало рабочего дня
            </p>
            <button
              onClick={handleStartWork}
              disabled={user.status === 'working'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              Начать работу
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Pause className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Перерыв
            </h3>
            <p className="text-gray-600 mb-6">
              Зафиксировать начало перерыва
            </p>
            <button
              onClick={handleStartBreak}
              disabled={user.status !== 'working'}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              Начать перерыв
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Square className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Завершить день
            </h3>
            <p className="text-gray-600 mb-6">
              Зафиксировать окончание рабочего дня
            </p>
            <button
              onClick={handleEndWork}
              disabled={user.status === 'offline'}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              Завершить день
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            {user.status === 'offline' ? (
              <>
                <WifiOff className="w-5 h-5" />
                <span>Статус: Не в сети</span>
              </>
            ) : user.status === 'working' ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span>Статус: На работе</span>
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 text-orange-500" />
                <span>Статус: На перерыве</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;