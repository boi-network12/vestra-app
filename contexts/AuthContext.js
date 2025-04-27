import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';  // Import AsyncStorage
import config from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const [token, storedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user')
        ]);
  
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
  
        // Verify token with backend
        const response = await fetch(`${config.API_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (response.status === 401) {
          await Promise.all([
            AsyncStorage.removeItem('token'),
            AsyncStorage.removeItem('user')
          ]);
          setUser(null);
          setLoading(false);
          return;
        }
  
        if (!response.ok) throw new Error('Auth check failed');
  
        const serverUserData = await response.json();

        const userWithToken = {...serverUserData.data, token}
        await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
        setUser(userWithToken);
      } catch (err) {
        console.error('Auth error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
  
    // Add small delay to ensure AsyncStorage is ready
    const timer = setTimeout(checkAuthStatus, 100);
    return () => clearTimeout(timer);
  }, []);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('token Response:', data);

      if (!response.ok) {
        // Handle validation errors or other issues
        if (data.errors) {
          // Backend returned validation errors
          throw new Error(data.errors.map(err => err.message).join(', '));
        }
        throw new Error(data.message || 'Registration failed');
      }
  
      // Make sure token exists before storing
      if (!data.token) {
        throw new Error('No authentication token received');
      }

      const userWithToken = { ...data.data, token: data.token };
  
      await Promise.all([
        AsyncStorage.setItem('token', data.token),
        AsyncStorage.setItem('user', JSON.stringify(userWithToken))
      ]);

      setUser(userWithToken);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  // In your login function:
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data atomically
      const userWithToken = { ...data.data, token: data.token };
      await Promise.all([
        AsyncStorage.setItem('token', data.token),
        AsyncStorage.setItem('user', JSON.stringify(userWithToken))
      ]);

      setUser(userWithToken);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Only call backend logout if we have a token
      if (token) {
        try {
          await fetch(`${config.API_URL}/api/users/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (err) {
          console.error('Backend logout error:', err);
          // Continue with local logout even if backend fails
        }
      }
      
      // Clear local storage regardless
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user')
      ]);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout from all devices
  const logoutAllDevices = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        const response = await fetch(`${config.API_URL}/api/users/logout-all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Logout from all devices failed');
        }
      }
      
      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user')
      ]);
      setUser(null);

      return { success: true, message: 'Logged out from all devices successfully' };
    } catch (err) {
      console.error('Logout all error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }
  
      // Merge settings properly when updating user
      const updatedUser = { 
        ...user, 
        ...data.data,
        token,
        settings: {
          ...user.settings,
          ...data.data.settings
        }
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
  
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/users/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Delete failed');
      }

      await logout();
      alert('Account deleted successfully');
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const printAsyncStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const result = items.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
      console.log("🔐 AsyncStorage Contents:", result);
    } catch (error) {
      console.error("Error reading AsyncStorage:", error);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const response = await fetch(`${config.API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to refresh user data');
      }
  
      const data = await response.json();
      const userWithToken = { ...data.data, token };
      await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      return data.data;
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        deleteAccount,
        refreshUser,
        logoutAllDevices
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
