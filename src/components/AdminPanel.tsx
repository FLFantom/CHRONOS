import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Activity, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Key, 
  UserPlus,
  BarChart3,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Coffee,
  Play,
  Square,
  Timer,
  Target,
  Award,
  Star,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, timeLogsAPI, getTashkentTime, formatTashkentTime, MAX_BREAK_TIME } from '../services/api';
import { User, TimeStats } from '../types';
import toast from 'react-hot-toast';

const AdminPanel: React.FC = () => {
  const { user, logout, impersonateUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<TimeStats>({ totalUsers: 0, workingUsers: 0, onBreakUsers: 0, offlineUsers: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(getTashkentTime());
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'stats'>('users');
  const [logPeriod, setLogPeriod] = useState<'day' | 'month' | 'all'>('day');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

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
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, logPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
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
      const logsData = await timeLogsAPI.getAllLogs(logPeriod);
      setLogs(logsData);
    } catch (error) {
      toast.error('Ошибка загрузки логов');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      toast.success('Пользователь удален');
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления пользователя');
    }
  };

  const handleResetPassword = async () => {
    if (!passwordUserId || !newPassword) return;

    try {
      await usersAPI.resetPassword(passwordUserId, newPassword);
      toast.success('Пароль сброшен');
      setShowPasswordModal(false);
      setPasswordUserId(null);
      setNewPassword('');
    } catch (error) {
      toast.error('Ошибка сброса пароля');
    }
  };

  const handleImpersonate = async (userId: number) => {
    try {
      await impersonateUser(userId);
      navigate('/');
    } catch (error) {
      toast.error('Ошибка входа в аккаунт пользователя');
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
      case 'working': return 'Работает';
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Доступ запрещен</h1>
          <p className="text-red-500">У вас нет прав администратора</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-3 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Панель администратора
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(currentTime)}</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(currentTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Users className="w-4 h-4" />
                Пользователь
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
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

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Работают</p>
                <p className="text-3xl font-bold text-green-600">{stats.workingUsers}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">На перерыве</p>
                <p className="text-3xl font-bold text-orange-600">{stats.onBreakUsers}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Coffee className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Не в сети</p>
                <p className="text-3xl font-bold text-gray-600">{stats.offlineUsers}</p>
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <Square className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'users', label: 'Сотрудники', icon: Users },
                { id: 'logs', label: 'Логи активности', icon: Activity },
                { id: 'stats', label: 'Статистика', icon: BarChart3 }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                {/* Users Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Поиск сотрудников..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={loadData}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Обновить
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сотрудник
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Время перерыва
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Роль
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{u.name}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(u.status)}`}>
                              {getStatusText(u.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{formatDuration(u.daily_break_time || 0)}</span>
                              {(u.daily_break_time || 0) >= MAX_BREAK_TIME && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {u.role === 'admin' ? 'Администратор' : 'Пользователь'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleImpersonate(u.id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Войти как пользователь"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setPasswordUserId(u.id);
                                  setShowPasswordModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded"
                                title="Сбросить пароль"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Удалить пользователя"
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
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Сотрудники не найдены</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                {/* Logs Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <select
                      value={logPeriod}
                      onChange={(e) => setLogPeriod(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="day">За сегодня</option>
                      <option value="month">За месяц</option>
                      <option value="all">Все время</option>
                    </select>
                    <button
                      onClick={loadLogs}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Обновить
                    </button>
                  </div>
                </div>

                {/* Logs List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {log.users?.name || 'Неизвестный пользователь'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {getActionText(log.action)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTashkentTime(new Date(log.timestamp))}
                      </div>
                    </div>
                  ))}
                </div>

                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Логи активности отсутствуют</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Status Overview */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Текущий статус команды
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Работают</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="font-bold text-green-600">{stats.workingUsers}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">На перерыве</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span className="font-bold text-orange-600">{stats.onBreakUsers}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Не в сети</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                        <span className="font-bold text-gray-600">{stats.offlineUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Break Time Analysis */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-orange-500" />
                    Анализ перерывов
                  </h3>
                  
                  <div className="space-y-4">
                    {users.filter(u => (u.daily_break_time || 0) > 0).map(u => (
                      <div key={u.id} className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">{u.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatDuration(u.daily_break_time || 0)}
                          </span>
                          {(u.daily_break_time || 0) >= MAX_BREAK_TIME && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {users.filter(u => (u.daily_break_time || 0) > 0).length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        Сегодня перерывы еще не брались
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Сброс пароля</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Введите новый пароль"
                  minLength={6}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleResetPassword}
                  disabled={!newPassword || newPassword.length < 6}
                  className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  Сбросить пароль
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordUserId(null);
                    setNewPassword('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;