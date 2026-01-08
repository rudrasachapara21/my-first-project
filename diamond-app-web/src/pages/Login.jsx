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
    background: ${props => props.theme.surfaceGlass || `${props.theme.bgSecondary}dd`};
    backdrop-filter: blur(20px) saturate(120%);
    border-radius: 32px;
    padding: 3.5rem 3rem;
    box-shadow: ${props => props.theme.cardShadow || '0 25px 60px rgba(0,0,0,0.12)'};
    text-align: left;
    border: ${props => props.theme.glassBorder || `1px solid ${props.theme.borderColor}`};
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        inset: -2px;
        background: linear-gradient(135deg, ${props => props.theme.accentPrimary}40, transparent 40%, transparent 60%, ${props => props.theme.accentSecondary || props.theme.accentPrimary}40);
        border-radius: 32px;
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    &:hover::before {
        opacity: 1;
    }
`;

const RoleToggle = styled.div`
    display: flex;
    background-color: ${props => props.theme.bgPrimary};
    border-radius: 16px;
    padding: 6px;
    margin-bottom: 2.5rem;
    border: 1px solid ${props => props.theme.borderColor};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); 
`;

const ToggleButton = styled.button`
    flex: 1;
    padding: 1rem 0.9rem;
    border: none;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Clash Display', sans-serif;
    color: ${props => props.$active ? props.theme.textMain : props.theme.textSecondary};
    background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    
    &:hover {
        color: ${props => !props.$active && props.theme.textPrimary};
        transform: ${props => !props.$active && 'translateY(-2px)'};
    }
`;

const RoleIcon = styled.div`
    font-size: 1.5rem;
    line-height: 1;
`;

const RoleDescription = styled.div`
    font-size: 0.7rem;
    font-weight: 400;
    opacity: 0.8;
    font-family: 'Inter', sans-serif;
`;

const InputWrapper = styled.div`
    position: relative;
    margin-bottom: 1.5rem;
`;

const InputIcon = styled.div`
    position: absolute;
    left: 1.2rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.$focused ? props.theme.accentPrimary : props.theme.textSecondary};
    font-size: 1.2rem;
    transition: all 0.3s ease;
    pointer-events: none;
    z-index: 1;
`;

const InputField = styled.input`
    width: 100%; padding: 1.2rem 3rem 1.2rem 3.5rem;
    background-color: ${props => props.theme.bgPrimary};
    border: 2px solid ${props => props.$focused ? props.theme.accentPrimary : props.$error ? props.theme.error || '#ef4444' : props.theme.borderColor};
    border-radius: 16px;
    color: ${props => props.theme.textPrimary}; font-size: 1rem;
    box-sizing: border-box;
    transition: all 0.3s ease;
    box-shadow: ${props => props.$focused ? `0 0 0 4px ${props.theme.accentPrimary}20, 0 0 20px ${props.theme.accentPrimary}15` : '0 2px 4px rgba(0, 0, 0, 0.05)'};
    &:focus { outline: none; }
    &::placeholder { color: ${props => props.theme.textSecondary}; opacity: 0.6; }
`;

const PasswordToggle = styled.button`
    position: absolute;
    right: 1.2rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: ${props => props.theme.textSecondary};
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.5rem;
    transition: color 0.2s ease;
    z-index: 1;
    &:hover { color: ${props => props.theme.accentPrimary}; }
`;

const ValidationMessage = styled.p`
    color: ${props => props.theme.error || '#ef4444'};
    font-size: 0.75rem;
    margin-top: 0.5rem;
    margin-left: 0.5rem;
    margin-bottom: 0;
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
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [emailError, setEmailError] = useState('');
    const { login } = useAuth();

    const navigate = useNavigate();

    const validateEmail = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            setEmailError('');
            return false;
        }
        if (!emailRegex.test(value)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const result = await login(email, password, activeRole);
            
            if (result && result.success) {
                // ✅ BUG FIX: Explicitly navigate to the correct home route after success
                if (activeRole === 'trader') {
                    navigate('/trader-home');
                } else if (activeRole === 'broker') {
                    navigate('/broker-home');
                } else {
                    navigate('/');
                }
            } else {
                setError(result?.message || 'Login failed.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                            <ToggleButton $active={activeRole === 'trader'} onClick={() => setActiveRole('trader')}>
                                <RoleIcon>💎</RoleIcon>
                                Trader
                                <RoleDescription>Buy & Sell Diamonds</RoleDescription>
                            </ToggleButton>
                            <ToggleButton $active={activeRole === 'broker'} onClick={() => setActiveRole('broker')}>
                                <RoleIcon>🤝</RoleIcon>
                                Broker
                                <RoleDescription>Facilitate Deals</RoleDescription>
                            </ToggleButton>
                        </RoleToggle>
                        
                        <form onSubmit={handleLogin}>
                            <InputWrapper>
                                <InputIcon $focused={emailFocused}>📧</InputIcon>
                                <InputField
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        validateEmail(e.target.value);
                                    }}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    $focused={emailFocused}
                                    $error={emailError}
                                    required
                                />
                                {emailError && <ValidationMessage>{emailError}</ValidationMessage>}
                            </InputWrapper>
                            
                            <InputWrapper>
                                <InputIcon $focused={passwordFocused}>🔒</InputIcon>
                                <InputField
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    $focused={passwordFocused}
                                    required
                                />
                                <PasswordToggle
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </PasswordToggle>
                            </InputWrapper>
                            
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