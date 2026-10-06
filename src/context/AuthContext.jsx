import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { getLanguageLocale, getTimezoneIdentifier } from '../utils/preferences';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyUserPreferences = useCallback((preferences = {}) => {
    if (typeof document === 'undefined') return;

    const appearance = preferences.appearance || {};
    const general = preferences.general || {};

    const darkModeEnabled = appearance.darkMode !== false;
    document.body.classList.toggle('theme-light', !darkModeEnabled);
    document.documentElement.setAttribute('data-theme', darkModeEnabled ? 'dark' : 'light');

    const compactEnabled = !!appearance.compactLayout;
    document.body.classList.toggle('compact-layout', compactEnabled);
    document.documentElement.classList.toggle('compact-layout', compactEnabled);

    const locale = getLanguageLocale(general.language);
    document.documentElement.lang = locale.split('-')[0] || 'en';

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'cx-preferred-timezone',
        getTimezoneIdentifier(general.timezone)
      );
      window.localStorage.setItem(
        'cx-auto-updates',
        appearance.autoUpdates === false ? 'off' : 'on'
      );
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
        applyUserPreferences(response.data.user?.preferences);
        connectSocket(response.data.user.id);
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, [applyUserPreferences]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    applyUserPreferences(newUser.preferences);
      connectSocket(newUser.id);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      const { token, user: loggedInUser } = response.data;
      
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    applyUserPreferences(loggedInUser.preferences);
      connectSocket(loggedInUser.id);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      disconnectSocket();
      if (typeof document !== 'undefined') {
        document.body.classList.remove('theme-light', 'compact-layout');
        document.documentElement.classList.remove('compact-layout');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      applyUserPreferences(updatedUser.preferences);
      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      return { success: false, error: errorMessage };
    }
  };

  const savePreferences = async (section, data) => {
    try {
      const response = await authAPI.updatePreferences(section, data);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      applyUserPreferences(updatedUser.preferences);
      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update preferences';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    savePreferences,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
