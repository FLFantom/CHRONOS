import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  BarChart3, 
  Settings, 
  LogOut, 
  User, 
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Coffee,
  Activity,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  Timer,
  Home,
  Lock,
  Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, timeLogsAPI, getTashkentTime, formatTashkentTime, WORK_START_HOUR, WORK_END_HOUR, MAX_BREAK_TIME } from '../services/api';
import { User as UserType, TimeStats } from '../types';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin';
  password?: string;
}

interface PasswordResetForm {
  newPassword: string;
  confirmPassword: string;
}

const AdminPanel: React.FC = () => {
  const { user, logout, impersonateUser, impersonating, exitImpersonation } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState<TimeStats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [logsPeriod, setLogsPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(getTashkentTime());

  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    formState: { errors: userErrors, isSubmitting: isUserSubmitting },
    reset: resetUserForm,
    setValue: setUserValue
  } = useForm<UserFormData>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
    watch: watchPassword
  } = useForm<PasswordResetForm>();

  const newPassword = watchPassword('newPassword');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTashkentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadLogs();
    }
  }, [logsPeriod, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const logsData = await timeLogsAPI.getAllLogs(logsPeriod);
      setLogs(logsData);
    } catch (error) {
      toast.error('Ошибка загрузки логов');
    }
  };

  const onUserSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await usersAPI.update(editingUser.id, {
          name: data.name,
          email: data.email,
          role: data.role
        });
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
        toast.success('Пользователь обновлен');
      } else {
        // Create new user - this would need to be implemented in the API
        toast.info('Создание новых пользователей пока не реализовано');
      }
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения пользователя');
    }
  };

  const onPasswordSubmit = async (data: PasswordResetForm) => {
    if (!selectedUserId) return;

    try {
      await usersAPI.resetPassword(selectedUserId, data.newPassword);
      toast.success('Пароль успешно сброшен');
      setShowPasswordModal(false);
      setSelectedUserId(null);
      resetPasswordForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сброса пароля');
    }
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setUserValue('name', user.name);
    setUserValue('email', user.email);
    setUserValue('role', user.role);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      await usersAPI.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('Пользователь удален');
    } catch (error) {
      toast.error('Ошибка удаления пользователя');
    }
  };

  const handleResetPassword = (userId: number) => {
    setSelectedUserId(userId);
    setShowPasswordModal(true);
  };

  const handleImpersonate = async (userId: number) => {
    if (impersonateUser) {
      await impersonateUser(userId);
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
        return 'Работает';
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав администратора</p>
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
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-2">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Панель администратора
                </h1>
                <p className="text-sm text-gray-600">Управление системой CHRONOS</p>
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

              <a
                href="/"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Главная</span>
              </a>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.name}</span>
                <Shield className="w-4 h-4 text-purple-600" />
              </div>

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
        {/* Current Time */}
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatTime(currentTime)}
          </div>
          <p className="text-gray-600">{formatDate(currentTime)} (Ташкентское время)</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего сотрудников</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Работают</p>
                  <p className="text-3xl font-bold text-green-600">{stats.workingUsers}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">На перерыве</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.onBreakUsers}</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <Coffee className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Не в сети</p>
                  <p className="text-3xl font-bold text-gray-600">{stats.offlineUsers}</p>
                </div>
                <div className="bg-gray-100 rounded-full p-3">
                  <UserX className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Управление сотрудниками</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadData}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Обновить"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="working">Работают</option>
                <option value="on_break">На перерыве</option>
                <option value="offline">Не в сети</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Сотрудник</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Статус</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Роль</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Перерыв сегодня</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(u.status)}`}></div>
                        <span className="text-sm font-medium">{getStatusText(u.status)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-900">
                        {u.daily_break_time ? formatDuration(u.daily_break_time) : '0м'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleImpersonate(u.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Войти как пользователь"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.id)}
                          className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                          title="Сбросить пароль"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Пользователи не найдены</p>
            </div>
          )}
        </div>

        {/* Activity Logs */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Логи активности</h2>
            <div className="flex items-center space-x-3">
              <select
                value={logsPeriod}
                onChange={(e) => setLogsPeriod(e.target.value as 'day' | 'month' | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Сегодня</option>
                <option value="month">Этот месяц</option>
                <option value="all">Все время</option>
              </select>
              <button
                onClick={loadLogs}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Обновить"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    log.action === 'start_work' ? 'bg-green-500' :
                    log.action === 'start_break' ? 'bg-yellow-500' :
                    log.action === 'end_break' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}></div>
                  <div>
                    <span className="font-medium text-gray-900">
                      {log.users?.name || 'Неизвестный пользователь'}
                    </span>
                    <span className="text-gray-600 ml-2">{getActionText(log.action)}</span>
                  </div>
                </div>
                <span className="text-gray-600 text-sm">
                  {formatTashkentTime(new Date(log.timestamp))}
                </span>
              </div>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Логи активности не найдены</p>
            </div>
          )}
        </div>
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit(onUserSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  {...registerUser('name', { required: 'Введите имя' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите имя"
                />
                {userErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{userErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...registerUser('email', { 
                    required: 'Введите email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Неверный формат email'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите email"
                />
                {userErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{userErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Роль
                </label>
                <select
                  {...registerUser('role', { required: 'Выберите роль' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
                {userErrors.role && (
                  <p className="text-red-500 text-sm mt-1">{userErrors.role.message}</p>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...registerUser('password', { 
                        required: 'Введите пароль',
                        minLength: {
                          value: 6,
                          message: 'Пароль должен содержать минимум 6 символов'
                        }
                      })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {userErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{userErrors.password.message}</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetUserForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isUserSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isUserSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Сохранить</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Сброс пароля</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUserId(null);
                  resetPasswordForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  {...registerPassword('newPassword', {
                    required: 'Введите новый пароль',
                    minLength: {
                      value: 6,
                      message: 'Пароль должен содержать минимум 6 символов'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите новый пароль"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  {...registerPassword('confirmPassword', {
                    required: 'Подтвердите пароль',
                    validate: value => value === newPassword || 'Пароли не совпадают'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Подтвердите пароль"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUserId(null);
                    resetPasswordForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isPasswordSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Сбросить</span>
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

export default AdminPanel;