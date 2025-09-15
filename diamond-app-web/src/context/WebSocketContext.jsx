import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
    const ws = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !ws.current) {
            ws.current = new WebSocket(`ws://localhost:5001?token=${token}`);
            
            ws.current.onopen = () => {
                console.log("WebSocket Connected via Context");
                setIsConnected(true);
            };

            ws.current.onclose = () => {
                console.log("WebSocket Disconnected via Context");
                setIsConnected(false);
                ws.current = null;
            };

            ws.current.onerror = (error) => {
                console.error("WebSocket Error via Context:", error);
                setIsConnected(false);
            };
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const value = {
        ws: ws.current,
        isConnected,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};