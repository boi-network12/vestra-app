// contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import config from '../config';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load notifications from AsyncStorage on mount
  const loadNotifications = useCallback(async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const storedNotifications = await AsyncStorage.getItem(`notifications_${user._id}`);
      const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      setNotifications(parsedNotifications);
      setUnreadCount(parsedNotifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    if (!user?._id || !user.token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${config.API_URL}/api/notifications?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      // Merge with existing notifications
      const newNotifications = data.data;
      setNotifications(prev => {
        const updated = [...prev, ...newNotifications].reduce((acc, curr) => {
          if (!acc.find(n => n._id === curr._id)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      // Update AsyncStorage
      await AsyncStorage.setItem(
        `notifications_${user._id}`,
        JSON.stringify(newNotifications)
      );

      // Update unread count
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.token]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.token || !notificationId) { 
      console.error('Missing user token or notification ID');
      return;
    }

    try {
      const response = await fetch(
        `${config.API_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to mark notification as read');
      }
  
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1)); // Ensure count doesn't go negative
  
      // Update AsyncStorage
      try {
        const storedNotifications = await AsyncStorage.getItem(`notifications_${user._id}`);
        const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
        const updatedNotifications = parsedNotifications.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        );
        await AsyncStorage.setItem(
          `notifications_${user._id}`,
          JSON.stringify(updatedNotifications)
        );
      } catch (storageError) {
        console.error('AsyncStorage update error:', storageError);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  }, [user?._id, user?.token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.token) return;

    try {
      const response = await fetch(
        `${config.API_URL}/api/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark all notifications as read');
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // Update AsyncStorage
      const storedNotifications = await AsyncStorage.getItem(`notifications_${user._id}`);
      const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      const updatedNotifications = parsedNotifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(
        `notifications_${user._id}`,
        JSON.stringify(updatedNotifications)
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
    }
  }, [user?._id, user?.token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?.token) return;

    try {
      const response = await fetch(
        `${config.API_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete notification');
      }

      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev =>
        prev - (notifications.find(n => n._id === notificationId && !n.read) ? 1 : 0)
      );

      // Update AsyncStorage
      const storedNotifications = await AsyncStorage.getItem(`notifications_${user._id}`);
      const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      const updatedNotifications = parsedNotifications.filter(n => n._id !== notificationId);
      await AsyncStorage.setItem(
        `notifications_${user._id}`,
        JSON.stringify(updatedNotifications)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    }
  }, [user?._id, user?.token, notifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!user?.token) return;

    try {
      const response = await fetch(
        `${config.API_URL}/api/notifications`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete all notifications');
      }

      setNotifications([]);
      setUnreadCount(0);

      // Clear AsyncStorage
      await AsyncStorage.removeItem(`notifications_${user._id}`);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      setError(err.message);
    }
  }, [user?._id, user?.token]);

  // Handle real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    socket.on('new-notification', async (notification) => {
      try {
        setNotifications(prev => {
          const updated = [notification, ...prev].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          return updated;
        });

        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }

        // Update AsyncStorage
        const storedNotifications = await AsyncStorage.getItem(`notifications_${user._id}`);
        const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
        const updatedNotifications = [notification, ...parsedNotifications].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        await AsyncStorage.setItem(
          `notifications_${user._id}`,
          JSON.stringify(updatedNotifications)
        );
      } catch (err) {
        console.error('Error processing new notification:', err);
        setError(err.message);
      }
    });

    return () => {
      socket.off('new-notification');
    };
  }, [socket, isConnected, user?._id]);

  // Initial load and fetch
  useEffect(() => {
    if (user?._id) {
      loadNotifications();
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?._id, loadNotifications, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);