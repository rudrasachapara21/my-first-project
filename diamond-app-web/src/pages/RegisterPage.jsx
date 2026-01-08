import React, { useState } from 'react';
import styled, { ThemeProvider as StyledThemeProvider, keyframes } from 'styled-components';
import Lottie from "lottie-react";
import { useNavigate } from 'react-router-dom';

import apiClient from '../api/axiosConfig'; 
import { useTheme } from '../context/ThemeContext';
import { diamondAnimation } from '../assets/animationData.js';
import InlineLoader from '../components/InlineLoader';

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
  100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
`;

const checkmarkDraw = keyframes`
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
`;

const scaleIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

// --- STYLED COMPONENTS ---
const LoadingOverlay = styled.div`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(15, 23, 42, 0.7);
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
    animation: ${fadeIn} 0.6s ease-out;
`;

const Logo = styled.h1`
    font-family: 'Clash Display', sans-serif; font-size: 3rem; font-weight: 700;
    color: ${props => props.theme.textPrimary}; margin-bottom: 0.5rem;
    letter-spacing: -1px;
`;

const Tagline = styled.p`
    color: ${props => props.theme.textSecondary}; margin-bottom: 2.5rem; 
    font-size: 1.1rem; font-weight: 400;
`;

const FormCard = styled.div`
    background: ${props => props.theme.surfaceGlass || `${props.theme.bgSecondary}dd`};
    backdrop-filter: blur(20px) saturate(120%);
    border-radius: 32px;
    padding: 3rem;
    box-shadow: ${props => props.theme.cardShadow || '0 20px 50px rgba(0,0,0,0.1)'};
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
    margin-bottom: 2rem;
    border: 1px solid ${props => props.theme.borderColor};
`;

const ToggleButton = styled.button`
    flex: 1;
    padding: 1rem 0.85rem;
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
    width: 100%; padding: 1.1rem 3rem 1.1rem 3.5rem;
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

const CtaButton = styled.button`
    width: 100%; padding: 1.1rem; border: none; border-radius: 16px;
    background: ${props => props.theme.accentPrimary}; color: ${props => props.theme.textMain};
    font-family: 'Clash Display', sans-serif; font-size: 1.1rem; font-weight: 600; cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease;
    &:hover { background: #4338ca; transform: translateY(-2px); }
    &:active { transform: translateY(0); }
    &:disabled { background-color: #94a3b8; cursor: not-allowed; transform: none; }
`;

const ErrorMessage = styled.p`
    color: #ef4444; font-size: 0.85rem; text-align: center; margin-top: 1rem;
    font-weight: 500;
`;

const BottomLinkContainer = styled.div`
    margin-top: 2rem; text-align: center; font-size: 0.95rem;
    color: ${props => props.theme.textSecondary};
`;

const StyledLink = styled.button`
    background: none; border: none; color: ${props => props.theme.accentPrimary}; 
    font-weight: 600; cursor: pointer; padding: 0; font-size: 0.95rem; margin-left: 8px;
    &:hover { text-decoration: underline; }
`;

// --- POPUP REDESIGN (Professional & Sleek) ---
const PopupOverlay = styled.div`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    display: flex; justify-content: center; align-items: center; z-index: 9998;
`;

const PopupCard = styled.div`
    background: ${props => props.theme.bgSecondary};
    padding: 3rem; border-radius: 32px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    text-align: center; width: 90%; max-width: 440px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: ${fadeIn} 0.5s ease-out;
`;

const PopupTitle = styled.h2`
    font-family: 'Clash Display', sans-serif; font-size: 1.8rem;
    color: ${props => props.theme.textPrimary}; margin-bottom: 0.75rem;
`;

const PopupMessage = styled.p`
    color: ${props => props.theme.textSecondary};
    font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;
    strong { color: ${props => props.theme.textPrimary}; }
`;

const OTPInputWrapper = styled.div`
    background: ${props => props.theme.bgPrimary};
    border-radius: 20px; padding: 2rem; margin-bottom: 2rem;
    border: 1px solid ${props => props.theme.borderColor};
`;

const SecondaryButton = styled.button`
    background: transparent; border: 1px solid ${props => props.theme.borderColor};
    color: ${props => props.theme.textSecondary}; width: 100%; padding: 0.9rem;
    border-radius: 14px; font-weight: 600; cursor: pointer; margin-top: 1rem;
    transition: all 0.2s;
    &:hover { background: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; }
`;

const SuccessCheckmark = styled.div`
    width: 80px;
    height: 80px;
    margin: 0 auto 1rem;
    animation: ${scaleIn} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    svg {
        width: 100%;
        height: 100%;
        circle {
            fill: #10b981;
        }
        path {
            fill: none;
            stroke: white;
            stroke-width: 3;
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: ${checkmarkDraw} 0.6s ease-out 0.3s forwards;
        }
    }
`;

const SuccessBadge = styled.div`
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 2px solid #10b981;
    color: #065f46;
    padding: 2rem 1.5rem;
    border-radius: 24px;
    margin-top: 1.5rem;
    animation: ${fadeIn} 0.4s ease-out;
    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.2);
    
    h3 {
        margin: 0 0 0.75rem 0;
        font-family: 'Clash Display', sans-serif;
        font-size: 1.3rem;
        background: linear-gradient(135deg, #059669, #10b981);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        opacity: 0.9;
        line-height: 1.5;
    }
`;

// --- COMPONENT ---

function RegisterPage() {
    const [role, setRole] = useState('trader');
    const [isLoading, setIsLoading] = useState(false);
    const { currentTheme } = useTheme();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [emailError, setEmailError] = useState('');

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [verifySuccess, setVerifySuccess] = useState(false);

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

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setVerifyError('');
        setVerifySuccess(false);
        setOtp('');
        try {
            await apiClient.post('/api/auth/register', {
                fullName, email, password, role
            });
            setRegisteredEmail(email);
            setShowSuccessPopup(true);
        } catch (err) {
            const message = err.response?.data?.message || "Registration failed. Please try again.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!registeredEmail || !otp) {
            setVerifyError('Email and OTP are required');
            return;
        }
        setVerifying(true);
        setVerifyError('');
        try {
            const res = await apiClient.post('/api/auth/verify-otp', {
                email: registeredEmail, otp
            });
            if (res.status === 200) {
                setVerifySuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Verification failed';
            setVerifyError(message);
        } finally {
            setVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        setVerifyError('');
        try {
            await apiClient.post('/api/auth/resend-otp', { email: registeredEmail });
            alert("New OTP sent to your email!");
        } catch (err) {
            setVerifyError(err.response?.data?.message || 'Resend failed');
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

            {showSuccessPopup && (
                <PopupOverlay>
                    <PopupCard theme={currentTheme}>
                        <PopupTitle>Verify Your Account</PopupTitle>
                        <PopupMessage>
                            We've sent a 6-digit verification code to <strong>{registeredEmail}</strong>.
                        </PopupMessage>
                        
                        <OTPInputWrapper theme={currentTheme}>
                            <InputField 
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '1rem' }}
                                type="text" 
                                maxLength="6"
                                placeholder="000000" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            />
                            <CtaButton type="button" onClick={handleVerifyOtp} disabled={verifying}>
                                {verifying ? 'Verifying...' : 'Verify Now'}
                            </CtaButton>
                        </OTPInputWrapper>

                        <StyledLink type="button" onClick={handleResendOtp} style={{ color: currentTheme.textSecondary, textDecoration: 'none' }}>
                            Didn't receive code? <span style={{ color: currentTheme.accentPrimary }}>Resend</span>
                        </StyledLink>

                        {verifyError && <ErrorMessage>{verifyError}</ErrorMessage>}
                        
                        {verifySuccess && (
                            <SuccessBadge>
                                <SuccessCheckmark>
                                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="50" r="45" />
                                        <path d="M 30 50 L 45 65 L 70 35" />
                                    </svg>
                                </SuccessCheckmark>
                                <h3>Verification Successful!</h3>
                                <p>Admin will review and approve your account shortly.</p>
                                <p>Redirecting to login...</p>
                            </SuccessBadge>
                        )}

                        {!verifySuccess && (
                            <SecondaryButton onClick={() => navigate('/login')}>
                                Return to Login
                            </SecondaryButton>
                        )}
                    </PopupCard>
                </PopupOverlay>
            )}

            <Container>
                <AuthCard>
                    <Logo>Connect</Logo>
                    <Tagline>B2B Diamond Trading Platform</Tagline>
                    <FormCard>
                        <RoleToggle>
                            <ToggleButton $active={role === 'trader'} onClick={() => setRole('trader')}>
                                <RoleIcon>💎</RoleIcon>
                                Trader
                                <RoleDescription>Buy & Sell Diamonds</RoleDescription>
                            </ToggleButton>
                            <ToggleButton $active={role === 'broker'} onClick={() => setRole('broker')}>
                                <RoleIcon>🤝</RoleIcon>
                                Broker
                                <RoleDescription>Facilitate Deals</RoleDescription>
                            </ToggleButton>
                        </RoleToggle>
                        <form onSubmit={handleRegister}>
                            <InputWrapper>
                                <InputIcon $focused={nameFocused}>👤</InputIcon>
                                <InputField
                                    type="text"
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    onFocus={() => setNameFocused(true)}
                                    onBlur={() => setNameFocused(false)}
                                    $focused={nameFocused}
                                    required
                                />
                            </InputWrapper>
                            
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
                                {isLoading ? <InlineLoader text="Creating Account..." size="18px" /> : 'Create Account'}
                            </CtaButton>
                            {error && <ErrorMessage>{error}</ErrorMessage>}
                        </form>
                        
                        <BottomLinkContainer>
                            Already member?
                            <StyledLink type="button" onClick={() => navigate('/login')}>Log In</StyledLink>
                        </BottomLinkContainer>
                    </FormCard>
                </AuthCard>
            </Container>
        </StyledThemeProvider>
    );
}
export default RegisterPage;