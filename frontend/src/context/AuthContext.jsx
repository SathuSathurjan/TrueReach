import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore user from localStorage (if a token exists)
  useEffect(() => {
    const stored = localStorage.getItem('truereach_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('truereach_token', token);
    localStorage.setItem('truereach_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token, ...userData } = res.data;
    if (token) {
      localStorage.setItem('truereach_token', token);
      localStorage.setItem('truereach_user', JSON.stringify(userData));
      setUser(userData);
    }
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('truereach_token');
    localStorage.removeItem('truereach_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
