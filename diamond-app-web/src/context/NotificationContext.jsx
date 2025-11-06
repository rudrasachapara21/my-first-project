import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { socket } = useWebSocket();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
    };
    
    setIsLoading(true);
    try {
      // ## CHANGE: Using apiClient and added /api prefix ##
      const { data } = await apiClient.get('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      return () => socket.off('new_notification');
    }
  }, [socket]);

  const markAsRead = async (notificationIds) => {
    if (!notificationIds || notificationIds.length === 0) return;

    const originalNotifications = [...notifications];
    const originalCount = unreadCount;

    setNotifications(prev => 
        prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
    );
    setUnreadCount(prev => prev > notificationIds.length ? prev - notificationIds.length : 0);

    try {
      // ## CHANGE: Using apiClient and added /api prefix ##
      await apiClient.put('/api/notifications/read', { notificationIds });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      setNotifications(originalNotifications);
      setUnreadCount(originalCount);
    }
  };

  const dismissNotification = async (notificationId) => {
    const originalNotifications = [...notifications];

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => prev - 1);

    try {
      // ## CHANGE: Using apiClient and added /api prefix ##
      await apiClient.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
      setNotifications(originalNotifications);
      setUnreadCount(prev => prev + 1);
    }
  };

  const value = { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    dismissNotification,
    refetch: fetchNotifications 
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};