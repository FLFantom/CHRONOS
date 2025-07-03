import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Calendar, 
  Settings, 
  LogOut, 
  Shield,
  WifiOff,
  Wifi,
  Timer,
  Coffee,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, timeLogsAPI, getTashkentTime, formatTashkentTime } from '../services/api';
import toast from 'react-hot-toast';

const UserDashboard: React.FC = () => {
  const { user, logout, updateUserStatus, impersonating, exitImpersonation } = useAuth();
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTashkentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year} г.`;
  };

  const handleAction = async (action: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await timeLogsAPI.logAction(action, user.id);
      
      // Update user status locally
      let newStatus: 'working' | 'on_break' | 'offline' = 'offline';
      let newBreakStartTime: string | undefined = undefined;
      
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
          break;
        case 'end_work':
          newStatus = 'offline';
          break;
      }

      const updatedUser = {
        ...user,
        status: newStatus,
        break_start_time: newBreakStartTime,
        updated_at: new Date().toISOString()
      };

      if (updateUserStatus) {
        updateUserStatus(updatedUser);
      }

      // Success messages
      const messages = {
        start_work: 'Рабочий день начат! 🚀',
        start_break: 'Перерыв начат. Отдыхайте! ☕',
        end_break: 'Перерыв завершен. Продолжаем работу! 💪',
        end_work: 'Рабочий день завершен! 🎉'
      };

      toast.success(messages[action as keyof typeof messages]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при выполнении действия');
    } finally {
      setIsLoading(false);
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

    if (!user) return;

    try {
      await usersAPI.changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
      toast.success('Пароль успешно изменен');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при смене пароля');
    }
  };

  const getStatusInfo = () => {
    if (!user) return { text: 'Не в сети', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: WifiOff };

    switch (user.status) {
      case 'working':
        return { 
          text: 'В работе', 
          color: 'text-green-600', 
          bgColor: 'bg-green-50 border-green-200', 
          icon: Wifi 
        };
      case 'on_break':
        return { 
          text: 'На перерыве', 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-50 border-orange-200', 
          icon: Coffee 
        };
      case 'offline':
        return { 
          text: 'Не в сети', 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50 border-gray-200', 
          icon: WifiOff 
        };
      default:
        return { 
          text: 'Неизвестно', 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-100', 
          icon: WifiOff 
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Доброе утро, {user.name}!
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(currentTime)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {impersonating && (
              <button
                onClick={exitImpersonation}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                Выйти из режима
              </button>
            )}
            
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200"
            >
              <Settings className="w-4 h-4" />
              Сменить пароль
            </button>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>

            {user.role === 'admin' && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                Админ панель
              </a>
            )}
          </div>
        </div>

        {/* Working Hours Info */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 rounded-xl p-2">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-amber-800 font-semibold">Рабочие часы: 9:00 - 18:00 (Ташкентское время)</p>
            </div>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-white" />
            </div>
            
            <div className="text-6xl font-bold mb-4 font-mono tracking-wider">
              {formatTime(currentTime)}
            </div>
            
            <p className="text-xl text-white/90 mb-6">
              Текущее время (Ташкент)
            </p>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-lg text-white/90">
                Рабочий день еще не начался 📅
              </p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Start Work */}
          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Play className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Начать работу</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Зафиксировать начало рабочего дня и начать отслеживание времени 📝
              </p>
              
              <button
                onClick={() => handleAction('start_work')}
                disabled={isLoading || user.status === 'working' || user.status === 'on_break'}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Обработка...
                  </div>
                ) : (
                  'Начать работу'
                )}
              </button>
            </div>
          </div>

          {/* Break */}
          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Pause className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Перерыв</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Зафиксировать начало перерыва. Максимум 1 час в день ⏰
              </p>
              
              <button
                onClick={() => handleAction(user.status === 'on_break' ? 'end_break' : 'start_break')}
                disabled={isLoading || user.status === 'offline'}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Обработка...
                  </div>
                ) : user.status === 'on_break' ? (
                  'Завершить перерыв'
                ) : user.status === 'offline' ? (
                  'Недоступно'
                ) : (
                  'Начать перерыв'
                )}
              </button>
            </div>
          </div>

          {/* End Work */}
          <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Square className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Завершить день</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Зафиксировать окончание рабочего дня и остановить отслеживание 🎉
              </p>
              
              <button
                onClick={() => handleAction('end_work')}
                disabled={isLoading || user.status === 'offline'}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Обработка...
                  </div>
                ) : user.status === 'offline' ? (
                  'День завершен ✅'
                ) : (
                  'Завершить день'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`${statusInfo.bgColor} border rounded-2xl p-4`}>
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-lg">Статус:</p>
              <p className={`text-2xl font-bold ${statusInfo.color}`}>
                {statusInfo.text} 😊
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <WifiOff className="w-4 h-4" />
            <span>Все действия автоматически логируются и отправляются webhook уведомления</span>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Смена пароля</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Сохранить
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