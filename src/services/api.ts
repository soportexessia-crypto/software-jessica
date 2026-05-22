// Cliente de API REST para XESSIA - Versión robusta con timeout y retry para Android
const API_URL = import.meta.env.VITE_API_URL || 'https://software-jessica-production.up.railway.app/api';

// Timeout de 15 segundos para conexiones móviles lentas
const REQUEST_TIMEOUT_MS = 15000;

async function requestWithTimeout(url: string, config: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, { ...config, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado. Verifica tu conexión a internet.');
    }
    // Mejorar mensajes de error de red para el usuario
    if (err.message === 'Failed to fetch' || err.message?.includes('Network request failed')) {
      throw new Error('Sin conexión al servidor. Verifica que tienes internet activo.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

  const response = await requestWithTimeout(`${API_URL}${endpoint}`, config);
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
