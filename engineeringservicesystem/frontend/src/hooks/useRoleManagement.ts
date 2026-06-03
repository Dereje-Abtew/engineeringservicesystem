import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/store';
import api from '@/utils/api';

interface RoleConfig {
  id: string;
  name: string;
  normalizedName: string;
  permissions?: string[];
}

export const useRoleManagement = () => {
  const [availableRoles, setAvailableRoles] = useState<RoleConfig[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      setRolesError(null);
      
      const response = await api.get<any>('/UserManagement/roles');
      
      let rolesArray: any[] = [];
      if (Array.isArray(response)) {
        rolesArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rolesArray = response.data;
      } else if (response?.$values && Array.isArray(response.$values)) {
        rolesArray = response.$values;
      } else {
        rolesArray = [];
      }
      
      const normalizedRoles = rolesArray.map((role: any) => ({
        id: role.id,
        name: role.name,
        normalizedName: role.name.toLowerCase().replace(/\s+/g, ''),
        permissions: role.permissions || []
      }));
      
      setAvailableRoles(normalizedRoles);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      setRolesError(error.message || 'Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const getUserRoleNames = (): string[] => {
    if (!user?.role) return [];
    return Array.isArray(user.role) ? user.role : [user.role];
  };

  const hasRole = (roleName: string): boolean => {
    const userRoles = getUserRoleNames();
    return userRoles.some(r => r.toLowerCase() === roleName.toLowerCase());
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(rn => hasRole(rn));
  };

  const hasAllRoles = (roleNames: string[]): boolean => {
    return roleNames.every(rn => hasRole(rn));
  };

  const getUserRoles = (): RoleConfig[] => {
    const userRoleNames = getUserRoleNames().map(r => r.toLowerCase());
    return availableRoles.filter(role => 
      userRoleNames.includes(role.normalizedName)
    );
  };

  const getUserPermissions = (): string[] => {
    const userRoles = getUserRoles();
    const permissions = new Set<string>();
    userRoles.forEach(role => {
      role.permissions?.forEach(p => permissions.add(p));
    });
    return Array.from(permissions);
  };

  return {
    availableRoles,
    loadingRoles,
    rolesError,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getUserRoleNames,
    getUserRoles,
    getUserPermissions,
    fetchRoles
  };
};
