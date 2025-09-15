// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    // Set the auth token for all axios requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (email, password, role) => {
        try {
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                email,
                password,
            });

            if (response.data && response.data.token && response.data.user) {
                // Check if the user's role matches the selected role on the form
                if (response.data.user.role !== role) {
                    throw new Error(`You are not registered as a ${role}.`);
                }

                const { token, user } = response.data;

                // Store in state and local storage
                setToken(token);
                setUser(user);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Navigate to the correct dashboard
                if (user.role === 'trader') {
                    navigate('/trader-home');
                } else if (user.role === 'broker') {
                    navigate('/broker-home');
                }
                
                return { success: true };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
            return { success: false, message: errorMessage };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const value = { user, token, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};