import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  apiOnline: boolean;
  apiChecking: boolean;
  lastSuccessfulPingAt: number | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkApiStatus: () => Promise<void>;
};

const TOKEN_KEY = 'dinlipi_jwt_token';
const DEMO_TOKEN_PREFIX = 'demo-offline-token';
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [apiChecking, setApiChecking] = useState(false);
  const [lastSuccessfulPingAt, setLastSuccessfulPingAt] = useState<number | null>(null);

  const checkApiStatus = async () => {
    setApiChecking(true);
    try {
      await apiRequest('/health');
      setApiOnline(true);
      setLastSuccessfulPingAt(Date.now());
    } catch {
      setApiOnline(false);
    } finally {
      setApiChecking(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
          return;
        }
        if (storedToken.startsWith(DEMO_TOKEN_PREFIX)) {
          setToken(storedToken);
          setUser({
            id: 'demo-user',
            name: 'Omar',
            email: 'demo@dinlipi.app',
          });
          return;
        }
        const me = await apiRequest<AuthUser>('/auth/me', { token: storedToken });
        setToken(storedToken);
        setUser(me);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkApiStatus().catch(() => undefined);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return;
    } catch {
      // Offline-first fallback for local app preview without backend.
      const demoToken = `${DEMO_TOKEN_PREFIX}-${Date.now()}`;
      const fallbackUser: AuthUser = {
        id: 'demo-user',
        name: email.split('@')[0] || 'Omar',
        email,
      };
      await AsyncStorage.setItem(TOKEN_KEY, demoToken);
      setToken(demoToken);
      setUser(fallbackUser);
    }
  };
  const register = async (name: string, email: string, password: string, phone?: string) => {
    const response = await apiRequest<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: { name, email, password, phone },
    });
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isLoggedIn: Boolean(token),
      apiOnline,
      apiChecking,
      lastSuccessfulPingAt,
      login,
      register,
      logout,
      checkApiStatus,
    }),
    [token, user, loading, apiOnline, apiChecking, lastSuccessfulPingAt],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
