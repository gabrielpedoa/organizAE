import { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '@/lib/types';
import { api } from '@/lib/api';

type AuthContextType = {
  user: AuthUser | null | undefined;
  setUser: (u: AuthUser | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    api.get<AuthUser>('/auth/me').then(setUser).catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await api.post('/auth/logout', {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
