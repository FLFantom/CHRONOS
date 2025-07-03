import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  Settings, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  RotateCcw, 
  LogIn, 
  ArrowLeft,
  Shield,
  Crown,
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  Wifi,
  WifiOff,
  Coffee,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  KeyRound,
  Mail,
  User as UserIcon,
  Sparkles,
  Star,
  Heart,
  Waves,
  Wind,
  Target,
  Award,
  Flame,
  Snowflake,
  FileText,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, timeLogsAPI, getTashkentTime, formatTashkentTime, convertToTashkentTime, MAX_BREAK_TIME } from '../services/api';
import { User, TimeStats } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden transform transition-all duration-300 scale-100">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-3 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              <Edit className="w-6 h-6 text-white relative z-10" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Редактировать пользователя
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 hover:bg-gray-100 rounded-lg hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-500" />
              Имя пользователя
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
              placeholder="Введите имя"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500" />
              Email адрес
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
              placeholder="Введите email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Роль пользователя
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
              disabled={isSubmitting}
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 hover:border-gray-400 hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Сохранение...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Сохранить
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ДОБАВЛЕНО: Модальное окно для сброса пароля
interface ResetPasswordModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, user, onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden transform transition-all duration-300 scale-100">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-gradient"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl p-3 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              <KeyRound className="w-6 h-6 text-white relative z-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Сброс пароля
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Пользователь: {user.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 hover:bg-gray-100 rounded-lg hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Новый пароль
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300 group-hover:shadow-md"
                placeholder="Введите новый пароль"
                required
                minLength={6}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                disabled={isSubmitting}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Минимум 6 символов
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Подтвердите пароль
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300 group-hover:shadow-md"
                placeholder="Подтвердите новый пароль"
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-semibold mb-1">Внимание!</p>
                <p>Новый пароль будет установлен для пользователя <strong>{user.name}</strong>. Обязательно сообщите ему новый пароль.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 hover:border-gray-400 hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Сброс...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Сбросить пароль
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { user, logout, impersonateUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<TimeStats>({ totalUsers: 0, workingUsers: 0, onBreakUsers: 0, offlineUsers: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'on_break' | 'offline'>('all');
  const [logPeriod, setLogPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTashkentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [logPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, logsData] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getStats(),
        timeLogsAPI.getAllLogs(logPeriod)
      ]);
      
      setUsers(usersData);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      await usersAPI.update(selectedUser.id, userData);
      toast.success('Пользователь обновлен');
      loadData();
    } catch (error) {
      toast.error('Ошибка обновления пользователя');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      await usersAPI.delete(userId);
      toast.success('Пользователь удален');
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления пользователя');
    }
  };

  // ИСПРАВЛЕНО: Используем модальное окно вместо prompt
  const handleResetPassword = async (newPassword: string) => {
    if (!selectedUser) return;
    
    try {
      await usersAPI.resetPassword(selectedUser.id, newPassword);
      toast.success(`Пароль для ${selectedUser.name} успешно сброшен! 🔐`);
    } catch (error) {
      toast.error('Ошибка сброса пароля');
      throw error;
    }
  };

  // ИСПРАВЛЕНО: Проверяем права доступа только для оригинального пользователя
  const canAccessAdminPanel = () => {
    return user && user.role === 'admin';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatBreakDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'on_break':
        return <Coffee className="w-4 h-4 text-orange-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on_break':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'start_work':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'start_break':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'end_break':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'end_work':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'start_work':
        return 'Начал работу';
      case 'start_break':
        return 'Начал перерыв';
      case 'end_break':
        return 'Закончил перерыв';
      case 'end_work':
        return 'Закончил работу';
      default:
        return action;
    }
  };

  // ИСПРАВЛЕНО: Используем правильную проверку прав доступа
  if (!canAccessAdminPanel()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="bg-red-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">У вас нет прав администратора для доступа к этой панели.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Вернуться на главную
          </button>
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
        
        {/* Enhanced floating admin icons */}
        <div className="absolute top-1/4 left-1/4 animate-float">
          <Crown className="w-8 h-8 text-yellow-300 opacity-30" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-float-delayed">
          <Shield className="w-6 h-6 text-blue-300 opacity-40" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-float">
          <Award className="w-7 h-7 text-purple-300 opacity-35" />
        </div>
        <div className="absolute top-1/3 right-1/5 animate-float-delayed">
          <Star className="w-5 h-5 text-pink-300 opacity-30" />
        </div>
        <div className="absolute bottom-1/3 right-1/4 animate-float">
          <Sparkles className="w-6 h-6 text-indigo-300 opacity-25" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl w-20 h-20 flex items-center justify-center shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50 animate-pulse"></div>
              <Crown className="w-10 h-10 text-white relative z-10" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-yellow-800" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                Админ панель
                <div className="flex gap-1">
                  <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
                  <Shield className="w-6 h-6 text-blue-500 animate-bounce" />
                </div>
              </h1>
              <p className="text-gray-600 text-xl capitalize flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {format(currentTime, 'EEEE, d MMMM yyyy г.', { locale: ru })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-500 font-medium">
                  Текущее время: {format(currentTime, 'HH:mm:ss')} (Ташкент)
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              К дашборду
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <LogIn className="w-5 h-5" />
              Выйти
            </button>
          </div>
        </div>

        {/* Enhanced navigation tabs */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-2 mb-8 border border-white/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex-1 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Обзор системы</span>
              {activeTab === 'overview' && <Sparkles className="w-4 h-4 animate-pulse" />}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex-1 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Управление пользователями</span>
              <div className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {users.length}
              </div>
              {activeTab === 'users' && <Crown className="w-4 h-4 animate-pulse" />}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex-1 ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Журнал активности</span>
              <div className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                {logs.length}
              </div>
              {activeTab === 'logs' && <FileText className="w-4 h-4 animate-pulse" />}
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced statistics cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-500 font-medium">Всего пользователей</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Активная система</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 shadow-lg">
                    <Wifi className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{stats.workingUsers}</div>
                    <div className="text-sm text-gray-500 font-medium">Работают</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Активные сотрудники</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3 shadow-lg">
                    <Coffee className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600">{stats.onBreakUsers}</div>
                    <div className="text-sm text-gray-500 font-medium">На перерыве</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg p-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Отдыхают</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 card-hover relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500 to-gray-600"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl p-3 shadow-lg">
                    <WifiOff className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-600">{stats.offlineUsers}</div>
                    <div className="text-sm text-gray-500 font-medium">Не в сети</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Офлайн</span>
                </div>
              </div>
            </div>

            {/* Quick overview */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 shadow-lg">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Быстрый обзор системы
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Активность сегодня</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Начали работу</span>
                      <span className="font-bold text-green-600">
                        {logs.filter(log => log.action === 'start_work').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Взяли перерыв</span>
                      <span className="font-bold text-orange-600">
                        {logs.filter(log => log.action === 'start_break').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Завершили работу</span>
                      <span className="font-bold text-red-600">
                        {logs.filter(log => log.action === 'end_work').length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Система</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Рабочие часы</span>
                      <span className="font-bold text-blue-600">9:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Лимит перерыва</span>
                      <span className="font-bold text-purple-600">1 час</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                      <span className="text-gray-700 font-medium">Часовой пояс</span>
                      <span className="font-bold text-indigo-600">Ташкент (UTC+5)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-3 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Управление пользователями
                </h2>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                  Обновить
                </button>
              </div>
            </div>

            {/* Enhanced filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по имени или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
                  />
                </div>
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-12 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300 appearance-none cursor-pointer"
                >
                  <option value="all">Все статусы</option>
                  <option value="working">Работают</option>
                  <option value="on_break">На перерыве</option>
                  <option value="offline">Не в сети</option>
                </select>
              </div>
            </div>

            {/* Enhanced users table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Пользователь</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Роль</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Время перерыва</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                          <span className="text-gray-500 font-medium">Загрузка пользователей...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="w-12 h-12 text-gray-300" />
                          <span className="text-gray-500 font-medium">Пользователи не найдены</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                              user.role === 'admin' 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                                : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}>
                              {user.role === 'admin' ? (
                                <Crown className="w-5 h-5" />
                              ) : (
                                user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {user.name}
                                {user.role === 'admin' && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(user.status)}`}>
                            {getStatusIcon(user.status)}
                            {user.status === 'working' ? 'Работает' : 
                             user.status === 'on_break' ? 'На перерыве' : 'Не в сети'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {user.role === 'admin' ? (
                              <>
                                <Crown className="w-4 h-4" />
                                Администратор
                              </>
                            ) : (
                              <>
                                <UserIcon className="w-4 h-4" />
                                Пользователь
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {user.daily_break_time ? (
                              <div className={`font-mono font-bold ${
                                user.daily_break_time > MAX_BREAK_TIME ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {formatBreakDuration(user.daily_break_time)}
                                {user.daily_break_time > MAX_BREAK_TIME && (
                                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Превышение
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">00:00:00</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => impersonateUser(user.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Войти как пользователь"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditModalOpen(true);
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Редактировать"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setResetPasswordModalOpen(true);
                              }}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Сбросить пароль"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
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
        )}

        {activeTab === 'logs' && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 shadow-lg">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Журнал активности
                </h2>
              </div>
              <div className="flex gap-4">
                <select
                  value={logPeriod}
                  onChange={(e) => setLogPeriod(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:border-gray-300"
                >
                  <option value="day">Сегодня</option>
                  <option value="month">Этот месяц</option>
                  <option value="all">Все время</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Пользователь</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Действие</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Время</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                          <span className="text-gray-500 font-medium">Загрузка логов...</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Activity className="w-12 h-12 text-gray-300" />
                          <span className="text-gray-500 font-medium">Нет записей за выбранный период</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {log.users?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{log.users?.name || 'Неизвестный'}</div>
                              <div className="text-sm text-gray-500">{log.users?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(log.action)}`}>
                            {getActionText(log.action)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-mono">
                            {formatTashkentTime(convertToTashkentTime(log.timestamp))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {logs.length > 100 && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Показано первые 100 записей из {logs.length}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModalOpen}
        user={selectedUser}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleEditUser}
      />

      {/* ДОБАВЛЕНО: Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        user={selectedUser}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleResetPassword}
      />
    </div>
  );
};

export default AdminPanel;