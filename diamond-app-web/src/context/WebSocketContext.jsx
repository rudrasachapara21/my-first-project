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
            // This is a good change to ensure you connect to the base URL
            const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
            
            socketRef.current = io(SOCKET_URL, {
                auth: { token }
            });

            socketRef.current.on('connect', () => {
                console.log('WebSocket Connected via Context');
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                console.log('WebSocket Disconnected via Context');
                setIsConnected(false);
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('WebSocket Connection Error via Context:', err.message);
            });

            return () => {
                socketRef.current.disconnect();
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