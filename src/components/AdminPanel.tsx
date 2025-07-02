import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  RefreshCw, 
  FileText, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  LogIn as LoginIcon, 
  RotateCcw, 
  Calendar,
  LogOut,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Coffee,
  Timer,
  Search,
  Sparkles,
  TrendingUp,
  Activity,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, timeLogsAPI, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME, getTashkentTime, formatTashkentTime, convertToTashkentTime } from '../services/api';
import { User, TimeStats, TimeLog } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  });

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-2">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Редактировать сотрудника
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
              Имя
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Роль
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            >
              <option value="user">Пользователь</option>
              <option value="admin">Админ</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ResetPasswordModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onReset: (newPassword: string) => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user, isOpen, onClose, onReset }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    onReset(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-2">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Сброс пароля
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-orange-800 font-medium">
            Сброс пароля для: <span className="font-bold">{user.name}</span>
          </p>
          <p className="text-orange-600 text-sm">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Введите новый пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Подтвердите пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Сбросить пароль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ user, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-2">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-600">Удалить сотрудника</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-8">
          <p className="text-gray-700 mb-6 text-lg">
            Вы точно хотите удалить этого сотрудника?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="font-bold text-red-800 text-lg">{user.name}</div>
            <div className="text-red-600">{user.email}</div>
            <div className="text-red-500 text-sm mt-2">
              Роль: {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
            </div>
          </div>
          <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Внимание!</span>
            </div>
            <p className="text-red-600 text-sm mt-2">
              Это действие нельзя отменить. Все данные пользователя будут удалены навсегда.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

interface LogsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const LogsModal: React.FC<LogsModalProps> = ({ user, isOpen, onClose }) => {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [period, setPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchLogs();
    }
  }, [isOpen, user, period]);

  const fetchLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await timeLogsAPI.getUserLogs(user.id, period);
      setLogs(data);
    } catch (error) {
      toast.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'start_work': return 'bg-green-100 text-green-800 border-green-200';
      case 'start_break': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'end_break': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'end_work': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLogTime = (timestamp: string) => {
    const tashkentTime = convertToTashkentTime(new Date(timestamp));
    return format(tashkentTime, 'dd.MM.yyyy HH:mm:ss', { locale: ru });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Логи активности - {user.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setPeriod('day')}
            className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              period === 'day' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За день
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              period === 'month' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За месяц
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              period === 'all' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все время
          </button>
        </div>

        <div className="overflow-y-auto max-h-96 bg-gray-50 rounded-2xl p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Загрузка логов...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium text-lg">Нет данных за выбранный период</p>
              <p className="text-gray-500 text-sm">Попробуйте выбрать другой период</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </span>
                    <span className="text-gray-600 font-medium">
                      {formatLogTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

interface AllLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AllLogsModal: React.FC<AllLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, period]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await timeLogsAPI.getAllLogs(period);
      setLogs(data);
    } catch (error) {
      toast.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'start_work': return 'bg-green-100 text-green-800 border-green-200';
      case 'start_break': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'end_break': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'end_work': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatLogTime = (timestamp: string) => {
    const tashkentTime = convertToTashkentTime(new Date(timestamp));
    return format(tashkentTime, 'dd.MM.yyyy HH:mm:ss', { locale: ru });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-6xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-600"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-2">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Все логи активности
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setPeriod('day')}
            className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              period === 'day' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За день
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              period === 'month' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За месяц
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
              period === 'all' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все время
          </button>
        </div>

        <div className="overflow-y-auto max-h-96 bg-gray-50 rounded-2xl p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Загрузка логов...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium text-lg">Нет данных за выбранный период</p>
              <p className="text-gray-500 text-sm">Попробуйте выбрать другой период</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-gray-800 min-w-[180px] bg-gray-50 px-3 py-2 rounded-lg">
                      {log.users?.name || 'Неизвестный пользователь'}
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </span>
                    <span className="text-gray-600 font-medium">
                      {formatLogTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { user, logout, impersonateUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<TimeStats>({
    totalUsers: 0,
    workingUsers: 0,
    onBreakUsers: 0,
    offlineUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [allLogsModalOpen, setAllLogsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await usersAPI.delete(selectedUser.id);
      await fetchData();
      setDeleteModalOpen(false);
      setSelectedUser(null);
      toast.success('Пользователь удален');
    } catch (error) {
      toast.error('Ошибка удаления пользователя');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;

    try {
      await usersAPI.update(selectedUser.id, userData);
      await fetchData();
      setEditModalOpen(false);
      setSelectedUser(null);
      toast.success('Данные пользователя обновлены');
    } catch (error) {
      toast.error('Ошибка обновления пользователя');
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
  };

  const handlePasswordReset = async (newPassword: string) => {
    if (!selectedUser) return;

    try {
      await usersAPI.resetPassword(selectedUser.id, newPassword);
      setResetPasswordModalOpen(false);
      setSelectedUser(null);
      toast.success('Пароль успешно сброшен');
    } catch (error) {
      toast.error('Ошибка сброса пароля');
    }
  };

  const handleViewLogs = (user: User) => {
    setSelectedUser(user);
    setLogsModalOpen(true);
  };

  const handleImpersonateUser = async (userId: number) => {
    await impersonateUser(userId);
    navigate('/');
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'working':
        return 'На работе';
      case 'on_break':
        return 'На перерыве';
      default:
        return 'Не в сети';
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'working':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'on_break':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatBreakTime = (employee: User) => {
    if (employee.status !== 'on_break' || !employee.break_start_time) {
      return '—';
    }
    
    const breakStartTime = new Date(employee.break_start_time).getTime();
    const currentTime = Date.now();
    const currentBreakDuration = Math.floor((currentTime - breakStartTime) / 1000);
    const totalBreakTime = (employee.daily_break_time || 0) + currentBreakDuration;
    
    const hours = Math.floor(totalBreakTime / 3600);
    const minutes = Math.floor((totalBreakTime % 3600) / 60);
    
    if (totalBreakTime > MAX_BREAK_TIME) {
      const excessTime = totalBreakTime - MAX_BREAK_TIME;
      const excessHours = Math.floor(excessTime / 3600);
      const excessMinutes = Math.floor((excessTime % 3600) / 60);
      return (
        <span className="text-red-600 font-semibold flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          -{excessHours}ч {excessMinutes}м (превышение!)
        </span>
      );
    }
    
    return `${hours}ч ${minutes}м`;
  };

  const formatDailyBreakTime = (dailyBreakTime?: number) => {
    if (!dailyBreakTime) return '0ч 0м';
    
    const hours = Math.floor(dailyBreakTime / 3600);
    const minutes = Math.floor((dailyBreakTime % 3600) / 60);
    
    return `${hours}ч ${minutes}м`;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-12 shadow-2xl border border-red-200">
          <div className="bg-red-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 text-lg">
            У вас нет прав для доступа к админ-панели
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-200 rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-5 animate-pulse"></div>
      </div>

      <div className="max-w-full mx-auto relative z-10">
        {/* Enhanced header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl w-16 h-16 flex items-center justify-center hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <ArrowLeft className="w-8 h-8 text-white" />
            </button>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-xl">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                Админ-панель
                <Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
              </h1>
              <p className="text-gray-600 text-xl">
                Управление сотрудниками и учет рабочего времени
              </p>
              <p className="text-gray-500 mt-2 bg-gray-100 rounded-lg px-4 py-2 inline-block">
                Рабочие часы: {WORK_START_HOUR}:00 - {WORK_END_HOUR}:00 (Ташкентское время) | Лимит перерыва: 1 час
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button 
              onClick={() => setAllLogsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FileText className="w-5 h-5" />
              Все логи
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

        {/* Enhanced stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">На работе</h3>
              <div className="bg-white bg-opacity-20 rounded-2xl p-3">
                <UserCheck className="w-8 h-8" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.workingUsers}</div>
            <p className="text-green-100 font-medium">активных сотрудников</p>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">На перерыве</h3>
              <div className="bg-white bg-opacity-20 rounded-2xl p-3">
                <Coffee className="w-8 h-8" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.onBreakUsers}</div>
            <p className="text-orange-100 font-medium">в перерыве</p>
          </div>

          <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Не в сети</h3>
              <div className="bg-white bg-opacity-20 rounded-2xl p-3">
                <UserX className="w-8 h-8" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.offlineUsers}</div>
            <p className="text-gray-100 font-medium">офлайн</p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Всего</h3>
              <div className="bg-white bg-opacity-20 rounded-2xl p-3">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="text-4xl font-bold mb-2">{stats.totalUsers}</div>
            <p className="text-blue-100 font-medium">сотрудников</p>
          </div>
        </div>

        {/* ИСПРАВЛЕНО: Расширенная таблица сотрудников на всю ширину экрана */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-800">
                  Список сотрудников ({filteredUsers.length}{searchQuery && ` из ${users.length}`})
                </h2>
              </div>
              <div className="flex items-center gap-3 text-gray-500 bg-white/60 rounded-xl px-4 py-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Автообновление каждые 30 секунд</span>
              </div>
            </div>

            {/* Enhanced search bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-lg text-lg"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="mt-4 text-gray-600 bg-white/60 rounded-xl px-4 py-3">
                {filteredUsers.length === 0 ? (
                  <span className="text-red-600 font-medium">Сотрудники не найдены</span>
                ) : (
                  <span className="font-medium">
                    Найдено: <span className="text-blue-600 font-bold">{filteredUsers.length}</span> сотрудник{filteredUsers.length === 1 ? '' : filteredUsers.length < 5 ? 'а' : 'ов'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ИСПРАВЛЕНО: Увеличена высота таблицы и расширена на всю ширину */}
          <div className="overflow-x-auto w-full" style={{ height: '70vh' }}>
            <div className="overflow-y-auto h-full">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[250px]">
                      Сотрудник
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[150px]">
                      Статус
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[180px]">
                      Текущий перерыв
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[180px]">
                      Перерыв за день
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">
                      Роль
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[300px]">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <div className="text-gray-500">
                          {searchQuery ? (
                            <div>
                              <Search className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                              <p className="text-2xl font-bold mb-3">Сотрудники не найдены</p>
                              <p className="text-lg">Попробуйте изменить поисковый запрос</p>
                            </div>
                          ) : (
                            <div>
                              <Users className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                              <p className="text-2xl font-bold">Нет сотрудников</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50/80 transition-all duration-200">
                        <td className="px-6 py-6">
                          <div>
                            <div className="font-bold text-gray-800 text-lg">
                              {employee.name}
                            </div>
                            <div className="text-gray-500 font-medium">
                              {employee.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(employee.status)}`}>
                            {employee.status === 'working' && <Timer className="w-4 h-4" />}
                            {employee.status === 'on_break' && <Coffee className="w-4 h-4" />}
                            {getStatusText(employee.status)}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-gray-600 font-medium">
                          {formatBreakTime(employee)}
                        </td>
                        <td className="px-6 py-6">
                          <span className={`font-bold ${
                            (employee.daily_break_time || 0) > MAX_BREAK_TIME ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {formatDailyBreakTime(employee.daily_break_time)}
                            {(employee.daily_break_time || 0) > MAX_BREAK_TIME && (
                              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg">(превышение)</span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-bold border ${
                            employee.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {employee.role === 'admin' ? 'Админ' : 'Пользователь'}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleImpersonateUser(employee.id)}
                              className="p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-110"
                              title="Войти как пользователь"
                            >
                              <LoginIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditUser(employee)}
                              className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-110"
                              title="Редактировать"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleViewLogs(employee)}
                              className="p-3 text-purple-600 hover:bg-purple-100 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-110"
                              title="Логи"
                            >
                              <Calendar className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(employee)}
                              className="p-3 text-orange-600 hover:bg-orange-100 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-110"
                              title="Сбросить пароль"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(employee)}
                              className="p-3 text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-110"
                              title="Удалить"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          isOpen={resetPasswordModalOpen}
          onClose={() => {
            setResetPasswordModalOpen(false);
            setSelectedUser(null);
          }}
          onReset={handlePasswordReset}
        />
      )}

      {selectedUser && (
        <DeleteConfirmModal
          user={selectedUser}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmDeleteUser}
        />
      )}

      <LogsModal
        user={selectedUser}
        isOpen={logsModalOpen}
        onClose={() => {
          setLogsModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <AllLogsModal
        isOpen={allLogsModalOpen}
        onClose={() => setAllLogsModalOpen(false)}
      />
    </div>
  );
};

export default AdminPanel;