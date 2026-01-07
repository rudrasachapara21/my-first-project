import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (token) {
            // Logic to clean the URL
            const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
            
            // ✅ FIX: Force WebSocket transport & explicit Auth handshake
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket'], // Prevents 400 Bad Request
                upgrade: false,
                auth: { token } // Sends token for backend 'socket.handshake.auth.token'
            });

            socketRef.current.on('connect', () => {
                console.log('🚀 WebSocket Authenticated & Connected');
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('❌ WebSocket Auth Error:', err.message);
            });

            return () => {
                if (socketRef.current) socketRef.current.disconnect();
            };
        } else if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, [token]);

    const sendMessage = useCallback((eventName, data, callback) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(eventName, data, callback);
        } else {
            console.error("Cannot send message, socket is not connected.");
        }
    }, []);

    const value = {
        socket: socketRef.current,
        isConnected,
        sendMessage,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};