import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import config from '../config';

const BlockContext = createContext();

export const BlockProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Fetch blocked users
  const fetchBlockedUsers = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const response = await fetch(`${config.API_URL}/api/block`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch blocked users');
      const data = await response.json();
      setBlockedUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  }, [user]);

  // Block user
  const blockUser = useCallback(async (userInput) => {
    if (!user || !user.token) throw new Error('User not authenticated');
    
    // Handle both userId (string) and userDetails (object)
    const userId = typeof userInput === 'string' ? userInput : userInput?._id;
    if (!userId) throw new Error('Invalid user ID');
  
    try {
      const response = await fetch(`${config.API_URL}/api/block`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to block user');
      }
      const data = await response.json();
      setBlockedUsers((prev) => [...prev, data.data.blockedUser]);
      return data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }, [user]);
  // Unblock user
  const unblockUser = useCallback(async (userId) => {
    if (!user || !user.token) throw new Error('User not authenticated');
    try {
      const response = await fetch(`${config.API_URL}/api/block/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to unblock user');
      const data = await response.json();
      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
      return data;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }, [user]);

  // Check block status
  const checkBlockStatus = useCallback(async (userId) => {
    if (!user || !user.token) throw new Error('User not authenticated');
    try {
      const response = await fetch(`${config.API_URL}/api/block/check/${userId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to check block status');
      const data = await response.json();
      return data.isBlocked;
    } catch (error) {
      console.error('Error checking block status:', error);
      throw error;
    }
  }, [user]);

  // BlockContext.js
  const isBlockedByUser = useCallback(async (userId) => {
    if (!user || !user.token) throw new Error('User not authenticated');
    try {
      const response = await fetch(`${config.API_URL}/api/block/is-blocked-by/${userId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to check if blocked by user: ${response.status} ${response.statusText} - ${
            errorData.message || 'Unknown error'
          }`
        );
      }
      const data = await response.json();
      return data.isBlockedByUser;
    } catch (error) {
      console.error('Error checking if blocked by user:', error.message);
      throw error;
    }
  }, [user]);

  // Fetch blocked users when user is authenticated
  useEffect(() => {
    if (!loading && user?.token) {
      fetchBlockedUsers();
    }
  }, [loading, user?.token, fetchBlockedUsers]);

  return (
    <BlockContext.Provider
      value={{
        blockedUsers,
        fetchBlockedUsers,
        blockUser,
        unblockUser,
        checkBlockStatus,
        isBlockedByUser,
      }}
    >
      {children}
    </BlockContext.Provider>
  );
};

export const useBlock = () => {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
};