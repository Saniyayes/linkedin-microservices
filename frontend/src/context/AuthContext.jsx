import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';
import { getUnreadNotificationCount } from '../api/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [userProfile, setUserProfile] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setUserProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      if (data && data.user) {
        setUserProfile(data.user);
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          title: data.user.title,
          headline: data.user.headline,
          avatarUrl: data.user.avatarUrl,
          coverUrl: data.user.coverUrl,
          company: data.user.company,
          connectionsCount: data.user.connectionsCount
        });
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          headline: data.user.headline,
          avatarUrl: data.user.avatarUrl
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshUnreadCounts = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadNotifications(count || 0);
    } catch (e) {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user && user.id) {
      refreshUnreadCounts();
      const interval = setInterval(refreshUnreadCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [user, refreshUnreadCounts]);

  const loginUser = (newToken, authUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    setToken(newToken);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      userProfile,
      unreadNotifications,
      loading,
      login: loginUser,
      logout,
      refreshProfile: fetchProfile,
      refreshUnreadCounts
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
