import React, { useState } from 'react';
import styled, { ThemeProvider as StyledThemeProvider, keyframes } from 'styled-components';
import Lottie from "lottie-react";
import { useNavigate } from 'react-router-dom';

import apiClient from '../api/axiosConfig'; 
import { useTheme } from '../context/ThemeContext';
import { diamondAnimation } from '../assets/animationData.js';

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
    background-color: ${props => props.theme.bgSecondary}; border-radius: 32px;
    padding: 3rem; box-shadow: 0 20px 50px rgba(0,0,0,0.1); text-align: left;
    border: 1px solid ${props => props.theme.borderColor};
`;

const RoleToggle = styled.div`
    display: flex; background-color: ${props => props.theme.bgPrimary};
    border-radius: 16px; padding: 6px; margin-bottom: 2rem;
    border: 1px solid ${props => props.theme.borderColor};
`;

const ToggleButton = styled.button`
    flex: 1; padding: 0.85rem; border: none; font-size: 0.95rem; font-weight: 600;
    border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Clash Display', sans-serif;
    color: ${props => props.$active ? props.theme.textMain : props.theme.textSecondary};
    background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
    &:hover { color: ${props => !props.$active && props.theme.textPrimary}; }
`;

const InputField = styled.input`
    width: 100%; padding: 1.1rem; background-color: ${props => props.theme.bgPrimary};
    border: 2px solid ${props => props.theme.borderColor}; border-radius: 16px;
    color: ${props => props.theme.textPrimary}; font-size: 1rem;
    box-sizing: border-box; margin-bottom: 1.5rem;
    transition: all 0.2s ease;
    &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
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

const SuccessBadge = styled.div`
    background: #ecfdf5; border: 1px solid #10b981; color: #065f46;
    padding: 1.5rem; border-radius: 20px; margin-top: 1.5rem;
    animation: ${fadeIn} 0.4s ease-out;
    
    h3 { margin: 0 0 0.5rem 0; font-family: 'Clash Display', sans-serif; font-size: 1.1rem; }
    p { margin: 0.25rem 0; font-size: 0.9rem; opacity: 0.9; }
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

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [verifySuccess, setVerifySuccess] = useState(false);

    const navigate = useNavigate();

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
                                <h3>🎉 Verification Successful!</h3>
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
                            <ToggleButton $active={role === 'trader'} onClick={() => setRole('trader')}>Trader</ToggleButton>
                            <ToggleButton $active={role === 'broker'} onClick={() => setRole('broker')}>Broker</ToggleButton>
                        </RoleToggle>
                        <form onSubmit={handleRegister}>
                            <InputField 
                                type="text" placeholder="Full Name" 
                                value={fullName} onChange={(e) => setFullName(e.target.value)} required
                            />
                            <InputField 
                                type="email" placeholder="Email Address" 
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                            />
                            <InputField 
                                type="password" placeholder="Password" 
                                value={password} onChange={(e) => setPassword(e.target.value)} required
                            />
                            <CtaButton type="submit" disabled={isLoading}>
                                {isLoading ? 'Please wait...' : 'Create Account'}
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