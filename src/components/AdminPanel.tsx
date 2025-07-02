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
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, timeLogsAPI } from '../services/api';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Редактировать сотрудника</h2>
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
              Имя
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Роль
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">Пользователь</option>
              <option value="admin">Админ</option>
            </select>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Сброс пароля для {user.name}
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
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите новый пароль"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                placeholder="Подтвердите пароль"
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
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-red-600">Удалить сотрудника</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Вы точно хотите удалить этого сотрудника?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-medium text-red-800">{user.name}</div>
            <div className="text-red-600 text-sm">{user.email}</div>
          </div>
          <p className="text-red-600 text-sm mt-2">
            ⚠️ Это действие нельзя отменить. Все данные пользователя будут удалены.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
      case 'start_work': return 'bg-green-100 text-green-800';
      case 'start_break': return 'bg-orange-100 text-orange-800';
      case 'end_break': return 'bg-blue-100 text-blue-800';
      case 'end_work': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Логи активности - {user.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPeriod('day')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За день
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За месяц
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все время
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Загрузка...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </span>
                    <span className="text-gray-600">
                      {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
      case 'start_work': return 'bg-green-100 text-green-800';
      case 'start_break': return 'bg-orange-100 text-orange-800';
      case 'end_break': return 'bg-blue-100 text-blue-800';
      case 'end_work': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Все логи активности
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPeriod('day')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За день
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За месяц
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все время
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Загрузка...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-gray-800">
                      {log.users?.name || 'Неизвестный пользователь'}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </span>
                    <span className="text-gray-600">
                      {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
        return 'text-green-600 bg-green-100';
      case 'on_break':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBreakTime = (employee: User) => {
    if (employee.status !== 'on_break' || !employee.break_start_time) {
      return '—';
    }
    
    const start = new Date(employee.break_start_time);
    const currentBreakDuration = Math.floor((Date.now() - start.getTime()) / 1000);
    const totalBreakTime = (employee.daily_break_time || 0) + currentBreakDuration;
    
    const hours = Math.floor(totalBreakTime / 3600);
    const minutes = Math.floor((totalBreakTime % 3600) / 60);
    
    if (totalBreakTime > 3600) {
      const excessTime = totalBreakTime - 3600;
      const excessHours = Math.floor(excessTime / 3600);
      const excessMinutes = Math.floor((excessTime % 3600) / 60);
      return (
        <span className="text-red-600 font-semibold">
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600">
            У вас нет прав для доступа к админ-панели
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-600">
                Админ-панель
              </h1>
              <p className="text-gray-600">
                Управление сотрудниками и учет рабочего времени
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button 
              onClick={() => setAllLogsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Все логи
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">На работе</h3>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold">{stats.workingUsers}</div>
          </div>

          <div className="bg-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">На перерыве</h3>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold">{stats.onBreakUsers}</div>
          </div>

          <div className="bg-gray-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Не в сети</h3>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold">{stats.offlineUsers}</div>
          </div>

          <div className="bg-blue-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Всего</h3>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Список сотрудников ({users.length})
              </h2>
              <p className="text-sm text-gray-500">
                Автообновление каждые 30 секунд
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                    Сотрудник
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                    Текущий перерыв
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                    Перерыв за день
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                    Роль
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-800">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee.status)}`}>
                        {getStatusText(employee.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatBreakTime(employee)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`${
                        (employee.daily_break_time || 0) > 3600 ? 'text-red-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {formatDailyBreakTime(employee.daily_break_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        employee.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {employee.role === 'admin' ? 'Админ' : 'Пользователь'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleImpersonateUser(employee.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Войти как пользователь"
                        >
                          <LoginIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(employee)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewLogs(employee)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Логи"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(employee)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          title="Сбросить пароль"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(employee)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
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

      {/* Reset Password Modal */}
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

      {/* Delete Confirmation Modal */}
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

      {/* User Logs Modal */}
      <LogsModal
        user={selectedUser}
        isOpen={logsModalOpen}
        onClose={() => {
          setLogsModalOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* All Logs Modal */}
      <AllLogsModal
        isOpen={allLogsModalOpen}
        onClose={() => setAllLogsModalOpen(false)}
      />
    </div>
  );
};

export default AdminPanel;