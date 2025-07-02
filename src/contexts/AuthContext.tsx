import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types';
import { authAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('currentUser');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user: loggedInUser, token } = await authAPI.login(credentials);
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      toast.success('Успешный вход в систему');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setUser(null);
    setImpersonating(false);
    setOriginalUser(null);
    toast.success('Вы вышли из системы');
  };

  const impersonateUser = async (userId: number) => {
    try {
      const targetUser = await usersAPI.getById(userId);
      
      if (targetUser && user) {
        setOriginalUser(user);
        setUser(targetUser);
        setImpersonating(true);
        localStorage.setItem('currentUser', JSON.stringify(targetUser));
        toast.success(`Вход как ${targetUser.name}`);
      }
    } catch (error) {
      toast.error('Ошибка при входе в аккаунт пользователя');
    }
  };

  const exitImpersonation = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      setImpersonating(false);
      localStorage.setItem('currentUser', JSON.stringify(originalUser));
      toast.success('Возвращение в admin панель');
    }
  };

  const updateUserStatus = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    impersonating,
    impersonateUser,
    exitImpersonation,
    updateUserStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};