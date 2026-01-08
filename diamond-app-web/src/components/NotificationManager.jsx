import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const NotificationManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket with environment-aware URL
    const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log("🔌 Connected to Notification Service");
      socket.emit('join_room', user.user_id || user.id);
    });

    socket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
    });

    // Play notification sound
    const playNotificationSound = () => {
      const audio = new Audio(NOTIFICATION_SOUND_URL);
      audio.volume = 0.5;
      audio.play().catch(err => console.log("Audio blocked:", err));
    };

    // Handle incoming notifications
    socket.on('notification', (data) => {
      console.log("🔔 Notification:", data);
      playNotificationSound();

      toast(data.message || 'New notification', {
        icon: '💎',
        duration: 4000,
        position: 'top-right',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: '',
        duration: 4000,
        
        // --- AGGRESSIVE GLASS STYLING (FORCE VISIBILITY) ---
        style: {
          // DARK GLASS BACKGROUND
          background: 'rgba(20, 20, 30, 0.95)',
          color: '#ffffff',
          
          // GLASS EFFECT
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          
          // PREMIUM BORDER
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '16px',
          
          // STRONG SHADOW
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.15)',
          
          // SPACING
          padding: '16px 20px',
          minWidth: '300px',
          maxWidth: '400px',
          
          // FONT
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontSize: '0.95rem',
          fontWeight: '500',
          lineHeight: '1.5',
        },
        
        // --- SUCCESS VARIANT ---
        success: {
          style: {
            background: 'rgba(16, 185, 129, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderLeft: '4px solid #10B981',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(16, 185, 129, 0.3)',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
        },
        
        // --- ERROR VARIANT ---
        error: {
          style: {
            background: 'rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderLeft: '4px solid #EF4444',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(239, 68, 68, 0.3)',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
        },
        
        // --- LOADING VARIANT ---
        loading: {
          style: {
            background: 'rgba(59, 130, 246, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderLeft: '4px solid #3B82F6',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(59, 130, 246, 0.3)',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
};

export default NotificationManager;