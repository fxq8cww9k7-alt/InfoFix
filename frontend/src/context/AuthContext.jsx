import { createContext, useContext, useState, useEffect } from 'react';
import { authStorage, authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authStorage.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al montar, si hay token validamos que la sesión siga activa
    const token = authStorage.getToken();
    if (token) {
      authApi.me()
        .then((res) => {
          setUser(res.usuario);
          authStorage.setUser(res.usuario);
        })
        .catch(() => {
          // Token vencido o revocado
          authStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    authStorage.setToken(res.token);
    authStorage.setUser(res.usuario);
    setUser(res.usuario);
    return res.usuario;
  };

  const registro = async (datos) => {
    const res = await authApi.registro(datos);
    authStorage.setToken(res.token);
    authStorage.setUser(res.usuario);
    setUser(res.usuario);
    return res.usuario;
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registro, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
