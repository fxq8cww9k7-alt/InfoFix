import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage, authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (authStorage.getToken() ? authStorage.getUser() : null));
  const [loading, setLoading] = useState(() => Boolean(authStorage.getToken()));
  const [sesionExpirada, setSesionExpirada] = useState(false);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      authStorage.clear();
      return;
    }
    const persist = authStorage.isPersistent();
    authApi
      .me()
      .then((res) => {
        setUser(res.usuario);
        authStorage.setUser(res.usuario, persist);
        setSesionExpirada(false);
      })
      .catch(() => {
        authStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setSesionExpirada(true);
    };
    window.addEventListener('infofix:sesion-expirada', onExpired);
    return () => window.removeEventListener('infofix:sesion-expirada', onExpired);
  }, []);

  const login = async (email, password, mantenerSesion = true) => {
    const res = await authApi.login(email, password);
    authStorage.setToken(res.token, mantenerSesion);
    authStorage.setUser(res.usuario, mantenerSesion);
    setUser(res.usuario);
    setSesionExpirada(false);
    return res.usuario;
  };

  const registro = async (datos) => {
    const res = await authApi.registro(datos);
    if (res.token) {
      authStorage.setToken(res.token, true);
      authStorage.setUser(res.usuario, true);
      setUser(res.usuario);
    }
    return res.usuario;
  };

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    setSesionExpirada(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sesionExpirada,
        login,
        registro,
        logout,
        isAuthenticated: Boolean(user && authStorage.getToken()),
      }}
    >
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
