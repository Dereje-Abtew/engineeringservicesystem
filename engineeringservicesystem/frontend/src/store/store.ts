import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: Omit<User, 'permissions'>, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;

  // Notification State
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  };
  notify: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  closeNotification: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      notification: {
        open: false,
        message: '',
        severity: 'info',
      },

      setAuth: (user, token) => {
        // Extract permissions from JWT token (handling both short and long claim names)
        let permissions: string[] = [];
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));

          // Look for permissions under both 'Permission' and the full XML namespace
          const permissionClaim = payload.Permission || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/permission'];

          if (Array.isArray(permissionClaim)) {
            permissions = permissionClaim;
          } else if (permissionClaim) {
            permissions = [permissionClaim];
          }
        } catch (e) {
          console.error('Failed to parse permissions from token', e);
        }

        set({ user: { ...user, permissions }, token });
      },

      logout: () => set({ user: null, token: null }),

      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
      },

      notify: (message, severity = 'info') => set({
        notification: { open: true, message, severity }
      }),

      closeNotification: () => set((state) => ({
        notification: { ...state.notification, open: false }
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
