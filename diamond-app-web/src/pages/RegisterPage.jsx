import React, { useState } from 'react';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import Lottie from "lottie-react";
import { useNavigate } from 'react-router-dom';

// ## CHANGE: Import the apiClient ##
import apiClient from '../api/axiosConfig'; 
import { useTheme } from '../context/ThemeContext';
import { diamondAnimation } from '../assets/animationData.js';

// --- STYLED COMPONENTS (No changes) ---
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
const BottomLinkContainer = styled.div`
    margin-top: 1.5rem;
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
// Success message popup
const PopupOverlay = styled.div`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex; justify-content: center; align-items: center; z-index: 9998;
`;
const PopupCard = styled.div`
    background: ${props => props.theme.bgSecondary};
    padding: 2.5rem;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    text-align: center;
    max-width: 400px;
    margin: 1rem;
`;
const PopupTitle = styled.h2`
    font-family: 'Clash Display', sans-serif;
    color: ${props => props.theme.textPrimary};
    margin-top: 0;
    margin-bottom: 1rem;
`;
const PopupMessage = styled.p`
    color: ${props => props.theme.textSecondary};
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 2rem;
`;
const PopupButton = styled.button`
    width: 100%; padding: 0.8rem; border: none; border-radius: 12px;
    background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary};
    font-family: 'Clash Display', sans-serif; font-size: 1.1rem; font-weight: 600; cursor: pointer;
`;

// --- The Register Page Component ---

function RegisterPage() {
    const [role, setRole] = useState('trader');
    const [isLoading, setIsLoading] = useState(false);
    const { currentTheme } = useTheme();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const navigate = useNavigate();

    // ## CHANGE: Updated handleRegister function ##
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            // This is the real API call to the backend endpoint we built
            await apiClient.post('/api/auth/register', {
                fullName,
                email,
                password,
                role
            });

            // If the call succeeds (status 201), show the success popup
            setShowSuccessPopup(true);

        } catch (err) {
            // If the API call fails, set the error message from the response
            const message = err.response?.data?.message || "Registration failed. Please try again.";
            setError(message);
        } finally {
            // This runs whether it succeeds or fails, to stop the spinner
            setIsLoading(false);
        }
    };

    const closePopup = () => {
        setShowSuccessPopup(false);
        navigate('/login'); // Redirect to login after closing popup
    };

    if (!currentTheme) return null;

    return (
        <StyledThemeProvider theme={currentTheme}>
            {isLoading && (
                <LoadingOverlay>
                    <Lottie animationData={diamondAnimation} loop={true} style={{ width: 150, height: 150 }}/>
                </LoadingOverlay>
            )}

            {showSuccessPopup && (
                <PopupOverlay>
                    <PopupCard theme={currentTheme}>
                        <PopupTitle>Registration Successful!</PopupTitle>
                        <PopupMessage>
                            You have successfully registered for a <strong>{role}</strong> account.
                            <br /><br />
                            You will be able to login after an admin verifies your user identity.
                        </PopupMessage>
                        <PopupButton onClick={closePopup}>
                            Back to Login
                        </PopupButton>
                    </PopupCard>
                </PopupOverlay>
            )}

            <Container>
                <AuthCard>
                    <Logo>Connect</Logo>
                    <Tagline>Create Your B2B Account</Tagline>
                    <FormCard>
                        <RoleToggle>
                            <ToggleButton $active={role === 'trader'} onClick={() => setRole('trader')}>Trader</ToggleButton>
                            <ToggleButton $active={role === 'broker'} onClick={() => setRole('broker')}>Broker</ToggleButton>
                        </RoleToggle>
                        <form onSubmit={handleRegister}>
                            <InputField 
                                type="text" 
                                placeholder="Full Name" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
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
                            <CtaButton type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Register'}
                            </CtaButton>
                            {error && <ErrorMessage>{error}</ErrorMessage>}
                        </form>
                        
                        <BottomLinkContainer>
                            Already have an account?
                            <StyledLink 
                                type="button" 
                                onClick={() => navigate('/login')} 
                                >
                                Log In
                            </StyledLink>
                        </BottomLinkContainer>

                    </FormCard>
                </AuthCard>
            </Container>
        </StyledThemeProvider>
    );
}
export default RegisterPage;