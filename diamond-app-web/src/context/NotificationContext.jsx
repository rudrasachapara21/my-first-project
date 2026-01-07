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

  // 1. Fetching Logic with user-check
  const fetchNotifications = useCallback(async () => {
    if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/api/notifications');
      // Sort notifications by date (newest first)
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(sortedData);
      
      // Calculate unread count correctly from data
      const unread = sortedData.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 2. WebSocket Real-time Sync
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const handleNewArticle = (article) => {
        const newsNotification = {
            id: `news-${article.news_id}-${Date.now()}`, 
            type: 'news',
            message: `📰 News: ${article.title}`,
            created_at: new Date().toISOString(),
            is_read: false,
            link: `/news/${article.news_id}` 
        };

        setNotifications(prev => [newsNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('new-article', handleNewArticle);

    return () => {
        socket.off('new_notification', handleNewNotification);
        socket.off('new-article', handleNewArticle);
    };
  }, [socket, user]);

  // 3. Mark as Read Logic (Optimistic UI Update)
  const markAsRead = async (notificationIds) => {
    if (!notificationIds || notificationIds.length === 0) return;

    // Filter out IDs that are already marked as read in the UI
    const targetIds = notificationIds.filter(id => {
        const n = notifications.find(notif => notif.id === id);
        return n && !n.is_read;
    });

    if (targetIds.length === 0) return;

    setNotifications(prev => 
        prev.map(n => targetIds.includes(n.id) ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - targetIds.length));

    try {
        const realIds = targetIds.filter(id => 
            typeof id === 'number' || (typeof id === 'string' && !id.startsWith('news-'))
        );
        
        if (realIds.length > 0) {
            await apiClient.put('/api/notifications/read', { notificationIds: realIds });
        }
    } catch (error) {
      console.error("Failed to sync read status:", error);
      fetchNotifications(); // Rollback to server state
    }
  };

  const dismissNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Decrement count only if it was unread
    const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const isReal = typeof notificationId === 'number' || (typeof notificationId === 'string' && !notificationId.startsWith('news-'));
      if (isReal) {
          await apiClient.put(`/api/notifications/${notificationId}/read`);
      }
    } catch (error) {
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider value={{ 
        notifications, 
        unreadCount, 
        isLoading, 
        markAsRead, 
        dismissNotification,
        refetch: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};