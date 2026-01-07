import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; 

const NotificationManager = () => {
  const { user } = useAuth();
  const { currentTheme } = useTheme() || {};

  useEffect(() => {
    if (!user) return;

    // ✅ FIX: Force WebSocket transport to prevent 400 Bad Request (Polling) errors
    const socket = io('http://localhost:5001', {
      transports: ['websocket'], 
      upgrade: false,
      reconnectionAttempts: 5
    });

    // Logging connection for debugging
    socket.on('connect', () => {
      console.log("🚀 Premium System Connected to Real-time Engine");
      socket.emit('join_room', user.user_id || user.id);
    });

    socket.on('receive_message', (data) => {
      if (data.sender_id === (user.user_id || user.id)) return;
      playSound();

      toast((t) => (
        <div style={{ minWidth: '220px' }}>
            <div style={{ fontWeight: '700', color: currentTheme?.textPrimary, marginBottom: '4px' }}>
               New Message
            </div>
            <div style={{ fontSize: '0.85rem', color: currentTheme?.textSecondary }}>
               {data.message.substring(0, 45)}{data.message.length > 45 ? '...' : ''}
            </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-right',
        style: {
          background: currentTheme?.surfaceGlass || currentTheme?.bgSecondary,
          borderRadius: '12px',
          borderLeft: `5px solid ${currentTheme?.accentPrimary}`,
          padding: '16px',
          boxShadow: `${currentTheme?.primaryGlow || ''}, ${currentTheme?.cardShadow || ''}`,
          border: currentTheme?.glassBorder
        },
      });
    });

    socket.on('new_notification', (data) => {
        playSound();
        toast.success(data.message, {
            position: 'bottom-right',
            duration: 5000,
            style: {
              borderRadius: '12px',
              background: currentTheme?.surfaceGlass || currentTheme?.bgSecondary,
              color: currentTheme?.textPrimary,
              boxShadow: `${currentTheme?.primaryGlow || ''}, ${currentTheme?.cardShadow || ''}`,
              border: currentTheme?.glassBorder
            }
        });
    });

    socket.on('connect_error', (err) => {
      console.error("❌ Connection Sync Error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const playSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.4; 
        audio.play().catch(() => {}); 
    } catch (err) {}
  };

  return (
    <Toaster
      toastOptions={{
        // Default options applied to all toasts; individual toasts can override
        position: 'top-right',
        duration: 4000,
        style: {
          background: currentTheme?.bgSecondary,
          color: currentTheme?.textPrimary,
          borderRadius: '12px',
          boxShadow: currentTheme?.cardShadow
        }
        ,
        success: {
          style: {
            background: currentTheme?.surfaceGlass || currentTheme?.bgSecondary,
            color: currentTheme?.textPrimary,
            borderLeft: `5px solid ${currentTheme?.success}`,
            boxShadow: `${currentTheme?.primaryGlow || ''}, ${currentTheme?.cardShadow || ''}`,
            border: currentTheme?.glassBorder
          }
        },
        error: {
          style: {
            background: currentTheme?.bgSecondary,
            color: currentTheme?.textPrimary,
            borderLeft: `5px solid ${currentTheme?.error}`,
            boxShadow: currentTheme?.cardShadow
          }
        },
        loading: {
          style: {
            background: currentTheme?.bgSecondary,
            color: currentTheme?.textPrimary,
            borderLeft: `5px solid ${currentTheme?.info}`,
            boxShadow: currentTheme?.cardShadow
          }
        }
      }}
    />
  );
};

export default NotificationManager;