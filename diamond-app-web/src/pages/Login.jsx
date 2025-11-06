import React, { useState } from 'react';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import Lottie from "lottie-react";

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { diamondAnimation } from '../assets/animationData.js';

// --- STYLED COMPONENTS (No changes here) ---
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
const ErrorMessage = styled.p`
    color: #e53e3e; font-size: 0.9rem; text-align: center; margin-top: 1rem;
`;
const AdminLinkContainer = styled.div`
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
`;

const RegisterLinkContainer = styled.div`
    margin-top: 1rem;
    text-align: center;
    font-size: 0.9rem;
    color: ${props => props.theme.textSecondary};
`;
const StyledLink = styled.button`
    background: none;
    border: none;
    color: ${props => props.theme.textPrimary}; 
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: 0.9rem;
    margin-left: 5px;
`;


function Login() {
    const [activeRole, setActiveRole] = useState('trader');
    const [isLoading, setIsLoading] = useState(false);
    const { currentTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await login(email, password, activeRole);
        if (!result.success) {
            setError(result.message);
        }
        setIsLoading(false);
    };

    if (!currentTheme) return null;

    return (
        <StyledThemeProvider theme={currentTheme}>
            {isLoading && (
                <LoadingOverlay>
                    <Lottie animationData={diamondAnimation} loop={true} style={{ width: 150, height: 150 }}/>
                    
                    {/* ## FIX: Corrected the closing tag from </OpeningOverlay> to </LoadingOverlay> ## */}
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
                            
                            {/* ## FIX: Corrected the closing tag from </CToButton> to </CtaButton> ## */}
                            <CtaButton type="submit" disabled={isLoading}>
                                {isLoading ? 'Logging In...' : 'Login'}
                            </CtaButton>
                            
                            {error && <ErrorMessage>{error}</ErrorMessage>}
                        </form>
                        
                        <AdminLinkContainer>
                            <button 
                                type="button" 
                                onClick={() => navigate('/admin/login')} 
                                style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}
                                >
                                Admin Portal
                            </button>
                        </AdminLinkContainer>

                        <RegisterLinkContainer>
                            Don't have an account?
                            <StyledLink 
                                type="button" 
                                onClick={() => navigate('/register')} 
                                >
                                Register
                            </StyledLink>
                        </RegisterLinkContainer>

                    </FormCard>
                </AuthCard>
            </Container>
        </StyledThemeProvider>
    );
}
export default Login;