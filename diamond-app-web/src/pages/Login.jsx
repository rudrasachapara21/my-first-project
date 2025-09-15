// src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import Lottie from "lottie-react";
import axios from 'axios'; // ADDED: To make API calls

import { useTheme } from '../context/ThemeContext';
import { diamondAnimation } from '../assets/animationData.js';

// --- Styled Components (No changes here, they are the same as your original file) ---
const LoadingOverlay = styled.div`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex; justify-content: center; align-items: center; z-index: 9999;
`;
const Container = styled.div`
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh; background-color: ${props => props.theme.bgPrimary};
    font-family: 'Inter', sans-serif; padding: 1rem;
`;
const AuthCard = styled.div`width: 100%; max-width: 400px; text-align: center;`;
const Logo = styled.h1`
    font-family: 'Clash Display', sans-serif; font-size: 2.8rem; font-weight: 700;
    color: ${props => props.theme.textPrimary}; margin-bottom: 0.5rem;
`;
const Tagline = styled.p`
    color: ${props => props.theme.textSecondary}; margin-bottom: 2rem; font-size: 1.1rem;
`;
const FormCard = styled.div`
    background-color: ${props => props.theme.bgSecondary}; border-radius: 24px;
    padding: 2.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.07); text-align: left;
`;
const RoleToggle = styled.div`
    display: flex; background-color: ${props => props.theme.bgPrimary};
    border-radius: 12px; padding: 5px; margin-bottom: 2rem;
`;
const ToggleButton = styled.button`
    flex: 1; padding: 0.75rem; border: none; font-size: 1rem; font-weight: 500;
    border-radius: 8px; cursor: pointer; transition: all 0.3s ease;
    font-family: 'Clash Display', sans-serif;
    color: ${props => props.$active ? '#FFFFFF' : props.theme.textSecondary};
    background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
`;
const InputField = styled.input`
    width: 100%; padding: 1rem; background-color: ${props => props.theme.bgPrimary};
    border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px;
    color: ${props => props.theme.textPrimary}; font-size: 1rem;
    box-sizing: border-box; margin-bottom: 1.5rem;
    &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; }
`;
const CtaButton = styled.button`
    width: 100%; padding: 1rem; border: none; border-radius: 12px;
    background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary};
    font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer;
    &:disabled { background-color: #ccc; cursor: not-allowed; }
`;
// ADDED: A new styled component for displaying error messages
const ErrorMessage = styled.p`
    color: #e53e3e; font-size: 0.9rem; text-align: center; margin-top: 1rem;
`;


function Login() {
    const [activeRole, setActiveRole] = useState('trader');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    
    // ADDED: State to hold form input and any login errors
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // MODIFIED: The entire handleLogin function is now async and calls the backend
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(''); // Clear previous errors

        try {
            const response = await axios.post('http://localhost:5001/api/auth/login', {
                email,
                password,
            });

            // Check if the API call was successful
            if (response.data && response.data.token && response.data.user) {
                const { token, user } = response.data;
                
                // IMPORTANT: Check if the logged-in user's role matches the selected toggle
                if (user.role !== activeRole) {
                    throw new Error(`Incorrect login type. Please log in as a ${user.role}.`);
                }

                // Save token and user info to the browser's local storage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Navigate to the correct page based on user role
                if (user.role === 'trader') {
                    navigate('/trader-home');
                } else if (user.role === 'broker') {
                    navigate('/broker-home');
                }
            } else {
                 throw new Error('Invalid response from server.');
            }

        } catch (err) {
            // Display a user-friendly error message
            const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
        } finally {
            // This will run whether the login succeeds or fails
            setIsLoading(false);
        }
    };

    if (!currentTheme) return null;

    return (
        <StyledThemeProvider theme={currentTheme}>
            {isLoading && (
                <LoadingOverlay>
                    <Lottie animationData={diamondAnimation} loop={true} style={{ width: 150, height: 150 }}/>
                </LoadingOverlay>
            )}
            <Container>
                <AuthCard>
                    <Logo>Connect</Logo>
                    <Tagline>The Premier B2B Diamond Exchange</Tagline>
                    <FormCard>
                        <RoleToggle>
                            <ToggleButton $active={activeRole === 'trader'} onClick={() => setActiveRole('trader')}>Trader</ToggleButton>
                            <ToggleButton $active={activeRole === 'broker'} onClick={() => setActiveRole('broker')}>Broker</ToggleButton>
                        </RoleToggle>
                        <form onSubmit={handleLogin}>
                            {/* MODIFIED: Input fields are now controlled by React state */}
                            <InputField 
                                type="email" 
                                placeholder="Email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <InputField 
                                type="password" 
                                placeholder="Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {/* MODIFIED: Button is disabled while loading */}
                            <CtaButton type="submit" disabled={isLoading}>
                                {isLoading ? 'Logging In...' : 'Login'}
                            </CtaButton>

                            {/* ADDED: Display the error message if it exists */}
                            {error && <ErrorMessage>{error}</ErrorMessage>}
                        </form>
                    </FormCard>
                </AuthCard>
            </Container>
        </StyledThemeProvider>
    );
}
export default Login;