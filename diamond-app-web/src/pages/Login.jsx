import React, { useState } from 'react';
import styled, { ThemeProvider as StyledThemeProvider, keyframes } from 'styled-components';
import Lottie from "lottie-react";
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { diamondAnimation } from '../assets/animationData.js';

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulseText = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
`;

// --- STYLED COMPONENTS ---
const LoadingOverlay = styled.div`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(8px);
    display: flex; justify-content: center; align-items: center; z-index: 9999;
`;

const Container = styled.div`
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh; background: ${props => props.theme.bgPrimary};
    font-family: 'Inter', sans-serif; padding: 1rem;
`;

const AuthCard = styled.div`
    width: 100%; max-width: 450px; text-align: center;
    animation: ${fadeIn} 0.7s ease-out;
`;

const Logo = styled.h1`
    font-family: 'Clash Display', sans-serif; font-size: 3.2rem; font-weight: 700;
    color: ${props => props.theme.textPrimary}; margin-bottom: 0.5rem;
    letter-spacing: -1.5px;
`;

const Tagline = styled.p`
    color: ${props => props.theme.textSecondary}; margin-bottom: 2.5rem; 
    font-size: 1.15rem; font-weight: 400; letter-spacing: 0.5px;
`;

const FormCard = styled.div`
    background-color: ${props => props.theme.bgSecondary}; border-radius: 32px;
    padding: 3.5rem 3rem; box-shadow: 0 25px 60px rgba(0,0,0,0.12); text-align: left;
    border: 1px solid ${props => props.theme.borderColor};
`;

const RoleToggle = styled.div`
    display: flex; background-color: ${props => props.theme.bgPrimary};
    border-radius: 16px; padding: 6px; margin-bottom: 2.5rem;
    border: 1px solid ${props => props.theme.borderColor};
    /* UNIFIED SHADOW: matching input fields */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); 
`;

const ToggleButton = styled.button`
    flex: 1; padding: 0.9rem; border: none; font-size: 0.95rem; font-weight: 600;
    border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Clash Display', sans-serif;
    color: ${props => props.$active ? props.theme.textMain : props.theme.textSecondary};
    background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
    &:hover { color: ${props => !props.$active && props.theme.textPrimary}; }
`;

const InputField = styled.input`
    width: 100%; padding: 1.2rem; background-color: ${props => props.theme.bgPrimary};
    border: 2px solid ${props => props.theme.borderColor}; border-radius: 16px;
    color: ${props => props.theme.textPrimary}; font-size: 1rem;
    box-sizing: border-box; margin-bottom: 1.5rem;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
`;

const Spinner = styled.div`
    width: 20px; height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid ${props => props.theme.textMain};
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
    display: inline-block;
    margin-right: 10px;
    vertical-align: middle;
`;

const LoadingText = styled.span`
    animation: ${pulseText} 1.5s ease-in-out infinite;
    vertical-align: middle;
`;

const CtaButton = styled.button`
    width: 100%; padding: 1.2rem; border: none; border-radius: 16px;
    background: ${props => props.theme.accentPrimary}; color: ${props => props.theme.textMain};
    font-family: 'Clash Display', sans-serif; font-size: 1.15rem; font-weight: 600; cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    display: flex; justify-content: center; align-items: center;
    &:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); }
    &:active { transform: translateY(0); }
    &:disabled { background-color: #94a3b8; cursor: not-allowed; transform: none; }
`;

const ErrorMessage = styled.p`
    color: #ef4444; font-size: 0.85rem; text-align: center; margin-top: 1.2rem;
    font-weight: 500; background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 10px;
`;

const AdminLinkContainer = styled.div`
    margin-top: 2rem; text-align: center;
`;

const RegisterLinkContainer = styled.div`
    margin-top: 1.2rem; text-align: center; font-size: 0.95rem;
    color: ${props => props.theme.textSecondary};
`;

const StyledLink = styled.button`
    background: none; border: none; color: ${props => props.theme.accentPrimary}; 
    font-weight: 600; cursor: pointer; padding: 0; font-size: 0.95rem; margin-left: 8px;
    &:hover { text-decoration: underline; }
`;

const GhostButton = styled.button`
    background: transparent; border: none; color: ${props => props.theme.textSecondary};
    font-size: 0.9rem; font-weight: 500; cursor: pointer;
    padding: 0.5rem 1rem; border-radius: 10px; transition: all 0.2s;
    &:hover { color: ${props => props.theme.textPrimary}; background: ${props => props.theme.bgPrimary}; }
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
                    <Lottie animationData={diamondAnimation} loop={true} style={{ width: 120, height: 120 }}/>
                </LoadingOverlay>
            )}
            <Container>
                <AuthCard>
                    <Logo>Connect</Logo>
                    <Tagline>Premier B2B Diamond Exchange</Tagline>
                    <FormCard>
                        <RoleToggle>
                            <ToggleButton $active={activeRole === 'trader'} onClick={() => setActiveRole('trader')}>Trader</ToggleButton>
                            <ToggleButton $active={activeRole === 'broker'} onClick={() => setActiveRole('broker')}>Broker</ToggleButton>
                        </RoleToggle>
                        
                        <form onSubmit={handleLogin}>
                            <InputField 
                                type="email" 
                                placeholder="Email Address" 
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
                            
                            <CtaButton type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Spinner />
                                        <LoadingText>Logging In...</LoadingText>
                                    </>
                                ) : 'Login'}
                            </CtaButton>
                            
                            {error && <ErrorMessage>{error}</ErrorMessage>}
                        </form>
                        
                        <AdminLinkContainer>
                            <GhostButton type="button" onClick={() => navigate('/admin/login')}>
                                Admin Portal
                            </GhostButton>
                        </AdminLinkContainer>

                        <RegisterLinkContainer>
                            Don't have an account?
                            <StyledLink type="button" onClick={() => navigate('/register')}>Register</StyledLink>
                        </RegisterLinkContainer>

                    </FormCard>
                </AuthCard>
            </Container>
        </StyledThemeProvider>
    );
}

export default Login;