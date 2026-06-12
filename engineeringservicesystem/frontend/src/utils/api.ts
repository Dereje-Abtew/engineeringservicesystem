import { useAuthStore } from '@/store/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5270/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const { logout, notify } = useAuthStore.getState();

  if (response.ok) {
    if (response.status === 204) return {} as T;
    try {
      return await response.json();
    } catch (e) {
      return {} as T;
    }
  }

  // Handle errors
  let errorMessage = 'An unexpected error occurred';
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.title || errorMessage;
  } catch (e) {
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch (t) { }
  }

  if (response.status === 401) {
    notify('Your session has expired. Please log in again.', 'error');
    logout();
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    notify('Access Denied: You do not have permission for this action.', 'error');
    throw new Error('Forbidden');
  }

  if (response.status >= 500) {
    errorMessage = 'Server Error: We are having trouble connecting to the backend.';
  }

  notify(errorMessage, 'error');
  throw new Error(errorMessage);
}

export const apiClient = {
  get: async <T>(endpoint: string, options: { silent?: boolean } = {}) => {
    const { token } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body: any, options: { silent?: boolean } = {}) => {
    const { token, notify } = useAuthStore.getState();
    const isFormData = body instanceof FormData;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      },
      body: isFormData ? body : JSON.stringify(body),
    });

    const result = await handleResponse<T>(response);
    if (response.ok && !endpoint.includes('login') && !options.silent) {
      notify('Action completed successfully!', 'success');
    }
    return result;
  },

  put: async <T>(endpoint: string, body: any) => {
    const { token, notify } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await handleResponse<T>(response);
    if (response.ok) {
      notify('Changes saved successfully!', 'success');
    }
    return result;
  },

  delete: async <T>(endpoint: string) => {
    const { token, notify } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    const result = await handleResponse<T>(response);
    if (response.ok) {
      notify('Deleted successfully.', 'success');
    }
    return result;
  },
};

export default apiClient;
