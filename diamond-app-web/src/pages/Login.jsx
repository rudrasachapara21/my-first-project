import React, { useState, useRef } from 'react';
import styled, { ThemeProvider as StyledThemeProvider, keyframes } from 'styled-components';
import Lottie from "lottie-react";
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import { Gem, Handshake, Eye, EyeOff, Mail, Lock } from 'lucide-react';

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
    min-height: 100vh; 
    background: linear-gradient(to bottom, #0f172a, #1e1b4b);
    font-family: 'Inter', sans-serif; padding: 1rem;
    position: relative;
    z-index: 1;
`;

const AuthCard = styled.div`
    width: 100%; max-width: 450px; text-align: center;
    animation: ${fadeIn} 0.7s ease-out;
`;

const Logo = styled.h1`
    font-family: 'Clash Display', sans-serif; font-size: 5rem; font-weight: 700;
    color: #ffffff; margin-bottom: 0.5rem;
    letter-spacing: -2.5px;
    text-shadow: 0 0 40px rgba(34, 211, 238, 0.5);
`;

const Tagline = styled.p`
    color: #94a3b8; margin-bottom: 2.5rem; 
    font-size: 1.15rem; font-weight: 400; letter-spacing: 0.5px;
    font-family: 'Clash Display', sans-serif;
`;

const FormCard = styled.div`
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px) saturate(120%);
    border-radius: 32px;
    padding: 3.5rem 3rem;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34, 211, 238, 0.1);
    text-align: left;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        inset: -2px;
        background: linear-gradient(135deg, rgba(34, 211, 238, 0.3), transparent 40%, transparent 60%, rgba(34, 211, 238, 0.3));
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: rgba(30, 27, 75, 0.5);
    border-radius: 16px;
    padding: 6px;
    margin-bottom: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
`;

const ToggleButton = styled.button`
    padding: 1rem 0.9rem;
    border: none;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Clash Display', sans-serif;
    color: ${props => props.$active ? '#ffffff' : '#94a3b8'};
    background: ${props => props.$active ? 'rgba(34, 211, 238, 0.15)' : 'transparent'};
    border: ${props => props.$active ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid transparent'};
    box-shadow: ${props => props.$active ? '0 0 20px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none'};
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
    
    &:hover {
        color: ${props => !props.$active && '#e2e8f0'};
    }
`;

const RoleIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    
    svg {
        width: 100%;
        height: 100%;
    }
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
    color: ${props => props.$focused ? '#22d3ee' : '#64748b'};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    pointer-events: none;
    z-index: 1;
    
    svg {
        width: 18px;
        height: 18px;
    }
`;

const InputField = styled.input`
    width: 100%; padding: 1.2rem 3rem 1.2rem 3.5rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid ${props => props.$focused ? 'rgba(34, 211, 238, 0.5)' : props.$error ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'};
    border-radius: 16px;
    color: #ffffff; font-size: 1rem;
    box-sizing: border-box;
    transition: all 0.3s ease;
    box-shadow: ${props => props.$focused ? '0 0 0 4px rgba(34, 211, 238, 0.1), 0 0 20px rgba(34, 211, 238, 0.2)' : 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'};
    &:focus { outline: none; }
    &::placeholder { color: #64748b; opacity: 0.8; }
`;

const PasswordToggle = styled.button`
    position: absolute;
    right: 1.2rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.2s ease;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
        width: 18px;
        height: 18px;
    }
    
    &:hover { color: #22d3ee; }
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
    background: linear-gradient(135deg, #22d3ee, #06b6d4);
    color: #0f172a;
    font-family: 'Clash Display', sans-serif; font-size: 1.15rem; font-weight: 700; cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex; justify-content: center; align-items: center;
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.4), inset 0 1px 0 rgba(255,255,255,0.3);
    
    &:hover { 
        transform: translateY(-2px); 
        box-shadow: 0 10px 40px rgba(34, 211, 238, 0.6), inset 0 1px 0 rgba(255,255,255,0.3);
    }
    &:active { transform: translateY(0); }
    &:disabled { 
        background: #334155; 
        color: #64748b;
        cursor: not-allowed; 
        transform: none;
        box-shadow: none;
    }
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
    color: #94a3b8;
    font-family: 'Inter', sans-serif;
`;

const StyledLink = styled.button`
    background: none; border: none; color: #22d3ee; 
    font-weight: 600; cursor: pointer; padding: 0; font-size: 0.95rem; margin-left: 8px;
    font-family: 'Clash Display', sans-serif;
    
    &:hover { 
        text-decoration: underline;
        color: #06b6d4;
    }
`;

const GhostButton = styled.button`
    background: transparent; 
    border: 1px solid rgba(255, 255, 255, 0.2); 
    color: #ffffff;
    font-size: 0.9rem; font-weight: 500; cursor: pointer;
    padding: 0.5rem 1rem; border-radius: 10px; transition: all 0.2s;
    font-family: 'Clash Display', sans-serif;
    
    &:hover { 
        color: #22d3ee; 
        background: rgba(34, 211, 238, 0.1);
        border-color: rgba(34, 211, 238, 0.3);
    }
`;

// --- 3D SCENE STYLED COMPONENTS ---
const CanvasContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
`;

const ScrollText = styled.h2`
    font-family: 'Clash Display', sans-serif;
    font-size: 6rem;
    font-weight: 700;
    color: #ffffff;
    text-align: center;
    margin: 0;
    padding: 2rem;
    text-shadow: 0 0 60px rgba(34, 211, 238, 0.8), 0 4px 20px rgba(0, 0, 0, 0.5);
    letter-spacing: -2px;
`;

const AboutCard = styled.div`
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px) saturate(120%);
    border-radius: 24px;
    padding: 2rem;
    margin: 1rem;
    max-width: 400px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34, 211, 238, 0.1);
    
    h3 {
        font-family: 'Clash Display', sans-serif;
        font-size: 1.5rem;
        color: #22d3ee;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        svg {
            width: 24px;
            height: 24px;
        }
    }
    
    p {
        color: #94a3b8;
        line-height: 1.6;
        margin: 0;
        font-family: 'Inter', sans-serif;
    }
`;

// --- 3D DIAMOND COMPONENT ---
function AnimatedDiamond() {
    const meshRef = useRef();
    const scroll = useScroll();
    
    useFrame((state) => {
        if (!meshRef.current) return;
        
        const offset = scroll.offset;
        
        // Page 1 (0 - 0.33): Slow rotation
        // Page 2 (0.33 - 0.66): Move left
        // Page 3 (0.66 - 1): Scale up massively + blur effect
        
        if (offset < 0.33) {
            // Page 1: Gentle rotation
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
            meshRef.current.position.x = 0;
            meshRef.current.position.z = 0;
            meshRef.current.scale.set(1, 1, 1);
        } else if (offset < 0.66) {
            // Page 2: Move to the left
            const progress = (offset - 0.33) / 0.33;
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
            meshRef.current.position.x = -3 * progress;
            meshRef.current.position.z = 0;
            meshRef.current.scale.set(1, 1, 1);
        } else {
            // Page 3: Scale up dramatically (20x)
            const progress = (offset - 0.66) / 0.34;
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
            meshRef.current.position.x = 0;
            meshRef.current.position.z = 2 * progress;
            const scale = 1 + 19 * progress; // From 1 to 20
            meshRef.current.scale.set(scale, scale, scale);
        }
    });
    
    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <icosahedronGeometry args={[1.5, 0]} />
            <MeshTransmissionMaterial
                color="#c0ebff"
                transmission={1}
                roughness={0}
                thickness={2}
                ior={2.4}
                chromaticAberration={1.5}
                backside
            />
        </mesh>
    );
}

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
            
            {/* 3D Background Canvas */}
            <CanvasContainer>
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <ScrollControls pages={3} damping={0.2}>
                        <ambientLight intensity={1.2} />
                        <directionalLight position={[10, 10, 5]} intensity={2} />
                        <directionalLight position={[-10, -10, -5]} intensity={1.5} />
                        <Environment preset="city" />
                        <AnimatedDiamond />
                    </ScrollControls>
                </Canvas>
            </CanvasContainer>

            {/* Scrollable Content */}
            <Canvas style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                <ScrollControls pages={3} damping={0.2}>
                    <Scroll html style={{ width: '100%' }}>
                        {/* Page 1: Discover Brilliance */}
                        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ScrollText>Discover Brilliance</ScrollText>
                        </div>

                        {/* Page 2: About Cards */}
                        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '5rem' }}>
                            <div>
                                <AboutCard>
                                    <h3><Gem /> Premium Quality</h3>
                                    <p>Access the world's finest diamonds through our verified B2B marketplace.</p>
                                </AboutCard>
                                <AboutCard>
                                    <h3><Lock /> Secure Trading</h3>
                                    <p>Trade with confidence using our encrypted and verified platform.</p>
                                </AboutCard>
                            </div>
                        </div>

                        {/* Page 3: Login Form */}
                        <Container style={{ height: '100vh' }}>
                            <AuthCard>
                                <Logo>Connect</Logo>
                                <Tagline>Premier B2B Diamond Exchange</Tagline>
                                <FormCard>
                                    <RoleToggle>
                                        <ToggleButton $active={activeRole === 'trader'} onClick={() => setActiveRole('trader')}>
                                            <RoleIcon><Gem /></RoleIcon>
                                            <div>
                                                <div>Trader</div>
                                                <RoleDescription>Buy & Sell Diamonds</RoleDescription>
                                            </div>
                                        </ToggleButton>
                                        <ToggleButton $active={activeRole === 'broker'} onClick={() => setActiveRole('broker')}>
                                            <RoleIcon><Handshake /></RoleIcon>
                                            <div>
                                                <div>Broker</div>
                                                <RoleDescription>Facilitate Deals</RoleDescription>
                                            </div>
                                        </ToggleButton>
                                    </RoleToggle>
                                    
                                    <form onSubmit={handleLogin}>
                                        <InputWrapper>
                                            <InputIcon $focused={emailFocused}><Mail /></InputIcon>
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
                                            <InputIcon $focused={passwordFocused}><Lock /></InputIcon>
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
                                                {showPassword ? <Eye /> : <EyeOff />}
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
                    </Scroll>
                </ScrollControls>
            </Canvas>
        </StyledThemeProvider>
    );
}

export default Login;