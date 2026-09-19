export interface ApiErrorPayload {
  code: string;
  message: string;
  campos?: Record<string, string>;
}

/**
 * Error tipado devuelto por la API según las convenciones de 03-api-rest.md
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly campos?: Record<string, string>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.campos = payload.campos;
  }
}

async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const esOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const esErrorRed =
      err instanceof TypeError ||
      (err instanceof Error &&
        (err.name === 'TypeError' ||
          err.message.includes('fetch') ||
          err.message.includes('Network')));

    if (esOffline || esErrorRed) {
      throw new Error(
        'No se pudo conectar con el servidor. Verificá tu conexión a internet.'
      );
    }
    throw err;
  }

  if (!response.ok) {
    let errorPayload: ApiErrorPayload = {
      code: 'error_desconocido',
      message: response.statusText || 'Error en la petición al servidor',
    };

    try {
      const data = await response.json();
      if (data && typeof data === 'object' && 'error' in data) {
        errorPayload = {
          code: data.error.code || 'error_servidor',
          message: data.error.message || 'Error en la petición al servidor',
          campos: data.error.campos,
        };
      }
    } catch {
      // El cuerpo no es JSON (ej. error 500 del servidor web o timeout)
    }

    throw new ApiError(response.status, errorPayload);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const http = {
  get: <T>(url: string, init?: RequestInit): Promise<T> =>
    request<T>(url, 'GET', undefined, init),

  post: <T>(url: string, body?: unknown, init?: RequestInit): Promise<T> =>
    request<T>(url, 'POST', body, init),

  patch: <T>(url: string, body?: unknown, init?: RequestInit): Promise<T> =>
    request<T>(url, 'PATCH', body, init),

  delete: <T>(url: string, init?: RequestInit): Promise<T> =>
    request<T>(url, 'DELETE', undefined, init),
};

export default http;
