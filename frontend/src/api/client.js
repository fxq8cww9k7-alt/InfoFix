/**
 * Cliente HTTP ligero y seguro para InfoFIX API
 */
const TOKEN_KEY = 'infofix_token';
const USER_KEY = 'infofix_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = authStorage.getToken();
  const defaultHeaders = {};

  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.campos ? data.campos.map(c => c.mensaje).join(', ') : 'Error inesperado en el servidor');
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Endpoints Auth
export const authApi = {
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  registro: (datos) => apiRequest('/api/auth/registro', { method: 'POST', body: datos }),
  recuperar: (email) => apiRequest('/api/auth/recuperar', { method: 'POST', body: { email } }),
  restablecer: (datos) => apiRequest('/api/auth/restablecer', { method: 'POST', body: datos }),
  me: () => apiRequest('/api/auth/me'),
};

// Endpoints Públicos (sin token)
export const publicApi = {
  consultarEstatus: (token) => apiRequest(`/api/estatus/${token}`),
  verificarCertificado: (token) => apiRequest(`/api/verificar/${token}`),
};
