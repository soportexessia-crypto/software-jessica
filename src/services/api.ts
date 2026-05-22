// Cliente de API REST para XESSIA
const API_URL = import.meta.env.VITE_API_URL || 'https://software-jessica-production.up.railway.app/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('xessia_token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Algo salió mal. Por favor intenta de nuevo.');
  }

  return data;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options?: RequestInit) => 
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: any, options?: RequestInit) => 
    request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
};
