import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API_BASE_URL from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'owner' | 'manager' | 'employee' | 'user';
  ownedCarwashes: string[];
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  clearStorage: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateUserRole: (role: User['role']) => Promise<void>;
  addToOwnedCarwashes: (carwashId: string) => Promise<void>;
  removeFromOwnedCarwashes: (carwashId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // მონაცემების ჩატვირთვა AsyncStorage-დან
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      console.log('🔍 [USERCONTEXT] Loading user from storage...');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('✅ [USERCONTEXT] User loaded from storage:', parsedUser);
        console.log('🔍 [USERCONTEXT] User role:', parsedUser.role);
        console.log('🔍 [USERCONTEXT] User ownedCarwashes:', parsedUser.ownedCarwashes);
        console.log('🔍 [USERCONTEXT] User ownedCarwashes length:', parsedUser.ownedCarwashes?.length);
        setUser(parsedUser);
      } else {
        // No user found, wait for login
        console.log('❌ [USERCONTEXT] No user found in storage, waiting for login...');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [USERCONTEXT] Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const login = async (userData: any) => {
    try {
      setLoading(true);
      
      // Convert backend user data to frontend User format
      const frontendUser: User = {
        id: userData.id,
        name: userData.firstName || 'მომხმარებელი',
        email: userData.email || '',
        phone: userData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: userData.role || 'customer',
        ownedCarwashes: userData.ownedCarwashes || [],
      };
      
      console.log('🔍 [LOGIN] Creating user with ID:', frontendUser.id);
      console.log('🔍 [LOGIN] User details:', {
        id: frontendUser.id,
        name: frontendUser.name,
        email: frontendUser.email,
        phone: frontendUser.phone,
        role: frontendUser.role,
        ownedCarwashes: frontendUser.ownedCarwashes
      });
      console.log('🔍 [LOGIN] User role:', frontendUser.role);
      console.log('🔍 [LOGIN] User ownedCarwashes:', frontendUser.ownedCarwashes);
      console.log('🔍 [LOGIN] User ownedCarwashes length:', frontendUser.ownedCarwashes?.length);

      setUser(frontendUser);
      await saveUserToStorage(frontendUser);
      
      console.log('Login: User saved to storage and state updated');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      
      // Convert backend user data to frontend User format
      const frontendUser: User = {
        id: userData.id,
        name: userData.firstName || 'მომხმარებელი',
        email: userData.email || '',
        phone: userData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: userData.role || 'customer',
        ownedCarwashes: userData.ownedCarwashes || [],
      };
      
      console.log('🔍 [REGISTER] Creating user with ID:', frontendUser.id);
      console.log('🔍 [REGISTER] User details:', {
        id: frontendUser.id,
        name: frontendUser.name,
        email: frontendUser.email,
        phone: frontendUser.phone,
        role: frontendUser.role,
        ownedCarwashes: frontendUser.ownedCarwashes
      });
      console.log('🔍 [REGISTER] User role:', frontendUser.role);
      console.log('🔍 [REGISTER] User ownedCarwashes:', frontendUser.ownedCarwashes);
      console.log('🔍 [REGISTER] User ownedCarwashes length:', frontendUser.ownedCarwashes?.length);

      setUser(frontendUser);
      await saveUserToStorage(frontendUser);
      
      console.log('Register: User saved to storage and state updated');
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      console.log('User logged out and storage cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      console.log('All storage cleared');
    } catch (error) {
      console.error('Clear storage error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: User['role']) => {
    if (!user) return;
    
    try {
      console.log('🔄 [UPDATE_ROLE] Updating user role to:', role);
      
      // Update role in backend
      const response = await fetch(`${API_BASE_URL}/auth/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: role
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [UPDATE_ROLE] Backend response:', result);
      
      // Update local state
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('✅ [UPDATE_ROLE] User role updated locally to:', role);
    } catch (error) {
      console.error('❌ [UPDATE_ROLE] Error updating user role:', error);
      throw error;
    }
  };

  const addToOwnedCarwashes = async (carwashId: string) => {
    if (!user) return;
    
    try {
      console.log('🔍 [ADD_CARWASH] Adding carwash to owned list:', carwashId);
      console.log('🔍 [ADD_CARWASH] Current ownedCarwashes:', user.ownedCarwashes);
      
      // Update ownedCarwashes in backend
      const response = await fetch(`${API_BASE_URL}/auth/update-owned-carwashes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          carwashId: carwashId,
          action: 'add'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [ADD_CARWASH] Backend response:', result);
      
      // Update local state
      const updatedOwnedCarwashes = [...user.ownedCarwashes, carwashId];
      console.log('🔍 [ADD_CARWASH] Updated ownedCarwashes:', updatedOwnedCarwashes);
      const updatedUser = { ...user, ownedCarwashes: updatedOwnedCarwashes };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('✅ [ADD_CARWASH] Added carwash to owned list:', carwashId);
      console.log('✅ [ADD_CARWASH] User role after update:', updatedUser.role);
      console.log('✅ [ADD_CARWASH] User ownedCarwashes after update:', updatedUser.ownedCarwashes);
    } catch (error) {
      console.error('❌ [ADD_CARWASH] Add to owned carwashes error:', error);
      throw error;
    }
  };

  const removeFromOwnedCarwashes = async (carwashId: string) => {
    if (!user) return;
    
    try {
      const updatedOwnedCarwashes = user.ownedCarwashes.filter(id => id !== carwashId);
      const updatedUser = { ...user, ownedCarwashes: updatedOwnedCarwashes };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      console.log('Removed carwash from owned list:', carwashId);
    } catch (error) {
      console.error('Remove from owned carwashes error:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      clearStorage,
      updateProfile,
      updateUserRole,
      addToOwnedCarwashes,
      removeFromOwnedCarwashes,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}