import { createContext, useContext, useState, useEffect } from 'react';
import { getUser as fetchUser, login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetchUser();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const loginRes = await apiLogin(email, password);
    setUser(loginRes.data.data.user);
    return loginRes;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
