import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles, Shield, Zap, Clock, Star, Heart, Waves, Wind } from 'lucide-react';
import { LoginCredentials } from '../types';
import { useAuth } from '../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Ошибка входа',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* ИСПРАВЛЕНО: Улучшено позиционирование плавающих элементов */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-32 right-32 w-3 h-3 bg-purple-400 rounded-full opacity-25 animate-bounce"></div>
        <div className="absolute bottom-20 left-24 w-1 h-1 bg-pink-400 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-32 right-24 w-2 h-2 bg-indigo-400 rounded-full opacity-30 animate-bounce"></div>
        
        {/* ИСПРАВЛЕНО: Перемещены декоративные иконки в безопасные зоны */}
        <div className="absolute top-16 right-16 animate-float opacity-20">
          <Star className="w-4 h-4 text-yellow-300" />
        </div>
        <div className="absolute bottom-16 left-16 animate-float-delayed opacity-20">
          <Heart className="w-5 h-5 text-pink-300" />
        </div>
        <div className="absolute top-40 left-32 animate-float opacity-15">
          <Waves className="w-3 h-3 text-cyan-300" />
        </div>
        <div className="absolute bottom-40 right-32 animate-float-delayed opacity-15">
          <Wind className="w-4 h-4 text-blue-300" />
        </div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02]">
        {/* Enhanced header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-50 animate-pulse"></div>
              <LogIn className="w-10 h-10 text-white relative z-10" />
            </div>
            {/* ИСПРАВЛЕНО: Уменьшены размеры и улучшено позиционирование декоративных иконок */}
            <div className="absolute -top-1 -right-1 opacity-60">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -left-1 opacity-60">
              <Zap className="w-4 h-4 text-blue-400 animate-bounce" />
            </div>
            <div className="absolute top-1 left-1 opacity-50">
              <Star className="w-3 h-3 text-pink-400 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
            CHRONOS
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-300" />
            <p className="text-white/90 text-lg font-medium">
              Система учета времени
            </p>
          </div>
          <p className="text-white/70 text-sm mb-4">
            Войдите в свой аккаунт для продолжения работы
          </p>
          
          {/* Enhanced security badge */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/20 hover:bg-white/15 transition-all duration-200">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-white/80 text-xs font-medium">Защищенный вход</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Email адрес
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-blue-400 transition-colors duration-200" />
              <input
                type="email"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Неверный формат email',
                  },
                })}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 group-hover:shadow-lg"
                placeholder="example@company.com"
                disabled={isSubmitting}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            {errors.email && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-2 bg-red-500/10 rounded-lg p-2 border border-red-500/20 animate-slide-up">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              Пароль
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 group-focus-within:text-blue-400 transition-colors duration-200" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен содержать минимум 6 символов',
                  },
                })}
                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 group-hover:shadow-lg"
                placeholder="Введите пароль"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-2 bg-red-500/10 rounded-lg p-2 border border-red-500/20 animate-slide-up">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm animate-bounce-in">
              <p className="text-red-300 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                {errors.root.message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Вход в систему...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Войти в систему
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Enhanced animated shine effect */}
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine"></div>
          </button>
        </form>

        {/* Enhanced footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <Clock className="w-4 h-4" />
            <span>Система работает в Ташкентском времени (UTC+5)</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
            <div className="flex items-center gap-1 hover:text-white/60 transition-colors">
              <Shield className="w-3 h-3" />
              <span>Безопасно</span>
            </div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="flex items-center gap-1 hover:text-white/60 transition-colors">
              <Zap className="w-3 h-3" />
              <span>Быстро</span>
            </div>
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
            <div className="flex items-center gap-1 hover:text-white/60 transition-colors">
              <Sparkles className="w-3 h-3" />
              <span>Надежно</span>
            </div>
          </div>
          
          {/* Enhanced version info */}
          <div className="mt-6 text-white/30 text-xs">
            <p>CHRONOS v1.0 • Система учета рабочего времени</p>
            <p className="mt-1">Все webhook уведомления работают автоматически</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;