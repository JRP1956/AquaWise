import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Holds the logged-in user and their society for the whole app. On boot it asks
 * /api/auth/me, so a page refresh keeps the session instead of logging the user out.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setSociety(data.society);
    } catch {
      setUser(null);
      setSociety(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    await refresh();
    return data.user;
  }, [refresh]);

  const signup = useCallback(async (payload) => {
    const data = await api.post('/auth/signup', payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    setSociety(null);
  }, []);

  const value = useMemo(() => ({
    user,
    society,
    loading,
    isAdmin: user?.role === 'society_admin' || user?.role === 'system_admin',
    hasSociety: Boolean(user?.society),
    login, signup, logout, refresh, setSociety,
  }), [user, society, loading, login, signup, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
