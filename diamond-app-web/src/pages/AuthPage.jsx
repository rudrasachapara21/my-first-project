import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import { Gem, Handshake, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

// --- KEYFRAMES ---
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeBlur = keyframes`
  0% { opacity: 1; filter: blur(0px); }
  100% { opacity: 0; filter: blur(10px); }
`;

// --- PAGE WRAPPER ---
const PageWrapper = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(to bottom, #0f172a, #1e1b4b);
`;

// --- PERSISTENT 3D CANVAS ---
const FixedCanvas = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;

// --- CONTENT LAYER ---
const ContentLayer = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

// --- INTRO SECTION (No Frames) ---
const IntroSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  
  @media (max-width: 1023px) {
    min-height: 60vh;
  }
  
  @media (min-width: 1024px) {
    padding: 4rem;
  }
`;

const IntroText = styled(motion.h1)`
  font-family: 'Clash Display', sans-serif;
  font-size: clamp(3rem, 8vw, 7rem);
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin: 1rem 0;
  letter-spacing: -3px;
  text-shadow: 0 0 80px rgba(34, 211, 238, 0.6);
  background: linear-gradient(135deg, #ffffff 0%, #22d3ee 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -20px;
    background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=');
    opacity: 0.3;
    pointer-events: none;
    z-index: -1;
  }
`;

// --- FORM SECTION (Mobile Bottom Sheet, Desktop Right Panel) ---
const FormSection = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  
  @media (min-width: 1024px) {
    align-items: center;
    padding: 2rem;
  }
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 500px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px 32px 0 0;
  padding: 1.5rem;
  box-shadow: 0 -10px 60px rgba(0, 0, 0, 0.6);
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  @media (min-width: 1024px) {
    border-radius: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    padding: 2.5rem;
  }
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 30px rgba(34, 211, 238, 0.4);
`;

const FormSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
`;

// --- MODE TOGGLE (Login / Register) ---
const ModeToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: rgba(30, 27, 75, 0.4);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ModeButton = styled.button`
  flex: 1;
  padding: 0.8rem;
  font-family: 'Clash Display', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  background: ${props => props.$active ? 'rgba(34, 211, 238, 0.15)' : 'transparent'};
  border: ${props => props.$active ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid transparent'};
  border-radius: 12px;
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active ? '0 0 20px rgba(34, 211, 238, 0.2)' : 'none'};
  
  &:hover {
    color: ${props => !props.$active && '#e2e8f0'};
    background: ${props => !props.$active && 'rgba(255, 255, 255, 0.05)'};
  }
`;

// --- ROLE TOGGLE ---
const RoleToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const RoleButton = styled.button`
  padding: 1rem;
  font-family: 'Clash Display', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${props => props.$active ? 'rgba(34, 211, 238, 0.15)' : 'rgba(30, 27, 75, 0.4)'};
  border: 1px solid ${props => props.$active ? 'rgba(34, 211, 238, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 12px;
  color: ${props => props.$active ? '#ffffff' : '#94a3b8'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: ${props => props.$active ? '0 0 20px rgba(34, 211, 238, 0.2)' : 'none'};
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    color: ${props => !props.$active && '#e2e8f0'};
    border-color: ${props => !props.$active && 'rgba(255, 255, 255, 0.15)'};
    background: ${props => !props.$active && 'rgba(30, 27, 75, 0.6)'};
  }
`;

// --- DARK GLASS INPUTS ---
const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.$focused ? '#22d3ee' : '#64748b'};
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
  z-index: 1;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Input = styled.input`
  width: 100%;
  max-width: 100%;
  height: 48px;
  padding: 0 3rem 0 3rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.$focused ? 'rgba(34, 211, 238, 0.5)' : props.$error ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  box-shadow: ${props => props.$focused ? '0 0 0 4px rgba(34, 211, 238, 0.1)' : 'none'};
  
  &::placeholder {
    color: #64748b;
  }
  
  &:focus {
    background: rgba(0, 0, 0, 0.4);
  }
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
    padding: 0 2.8rem 0 2.8rem;
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  transition: color 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    color: #22d3ee;
  }
`;

const ErrorText = styled.p`
  color: #ef4444;
  font-size: 0.8rem;
  margin: 0.5rem 0 0 0.5rem;
  font-family: 'Inter', sans-serif;
`;

// --- CTA BUTTON ---
const SubmitButton = styled.button`
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #22d3ee, #06b6d4);
  border: none;
  border-radius: 12px;
  color: #0f172a;
  font-family: 'Clash Display', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(34, 211, 238, 0.6);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #334155;
    color: #64748b;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(15, 23, 42, 0.3);
  border-top: 3px solid #0f172a;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

// --- FOOTER LINKS ---
const FooterLinks = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #94a3b8;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #22d3ee;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  font-family: 'Clash Display', sans-serif;
  
  &:hover {
    text-decoration: underline;
    color: #06b6d4;
  }
`;

const AdminLink = styled.div`
  margin-top: 1rem;
  text-align: center;
`;

const GhostButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: 'Clash Display', sans-serif;
  transition: all 0.2s ease;
  
  &:hover {
    color: #22d3ee;
    background: rgba(34, 211, 238, 0.1);
    border-color: rgba(34, 211, 238, 0.3);
  }
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
  font-family: 'Inter', sans-serif;
`;

// --- OTP POPUP COMPONENTS ---
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const PopupCard = styled.div`
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(40px);
  padding: 3rem;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  text-align: center;
  width: 90%;
  max-width: 440px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PopupTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  color: #ffffff;
  margin-bottom: 0.75rem;
  text-shadow: 0 0 30px rgba(34, 211, 238, 0.4);
`;

const PopupMessage = styled.p`
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-family: 'Inter', sans-serif;
  
  strong {
    color: #22d3ee;
  }
`;

const OTPInputWrapper = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  
  span {
    color: #22d3ee;
    font-weight: 600;
  }
  
  &:hover span {
    text-decoration: underline;
  }
`;

const SuccessBadge = styled.div`
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%);
  border: 2px solid #10b981;
  color: #10b981;
  padding: 2rem 1.5rem;
  border-radius: 24px;
  margin-top: 1.5rem;
  box-shadow: 0 10px 40px rgba(16, 185, 129, 0.2);
  
  h3 {
    margin: 0 0 0.75rem 0;
    font-family: 'Clash Display', sans-serif;
    font-size: 1.3rem;
  }
  
  p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    opacity: 0.9;
    line-height: 1.5;
  }
`;

const SuccessCheckmark = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  
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
    }
  }
`;

// --- 3D DIAMOND COMPONENT ---
function PersistentDiamond() {
  const diamondRef = useRef();
  
  useFrame((state, delta) => {
    if (!diamondRef.current) return;
    
    // Slow, luxurious spin on Y-axis (like a jewelry display)
    diamondRef.current.rotation.y += delta * 0.2;
    
    // Subtle tilt animation for dynamic light catching
    diamondRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });
  
  // Mobile: smaller, positioned higher
  // Desktop: larger, centered
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const scale = isMobile ? 0.8 : 1.2;
  const position = isMobile ? [0, 1, 0] : [0, 0, 0];
  
  // Brilliant Cut Diamond Material
  const diamondMaterialProps = {
    color: "#f0faff",           // Slight ice blue tint
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 2.42,                  // Real Diamond IOR
    thickness: 2.5,
    specularIntensity: 1,
    chromaticAberration: 1.5,   // Enhanced rainbow fire
    anisotropy: 20,
    flatShading: true           // CRITICAL: Sharp vertical facets that catch light
  };
  
  return (
    <mesh 
      ref={diamondRef} 
      position={position} 
      scale={scale} 
      rotation={[0, 0, 0]}
    >
      {/* SINGLE MESH DIAMOND - NO GAPS POSSIBLE */}
      <latheGeometry
        args={[
          [
            new THREE.Vector2(0, -1),     // Bottom Tip (Culet)
            new THREE.Vector2(1, 0),      // Middle Widest (Girdle)
            new THREE.Vector2(0.7, 0.4),  // Top Edge (Crown)
            new THREE.Vector2(0, 0.4)     // Flat Top Center (Table)
          ],
          16,      // Segments: 16 creates sharp "Cut" look
          0,       // Start Angle
          6.283    // 2*PI (Full rotation)
        ]}
      />
      <MeshTransmissionMaterial
        color="#f0faff"
        transmission={1}
        ior={2.42}
        thickness={2}
        chromaticAberration={1.5}
        anisotropy={20}
        roughness={0}
        flatShading={true}
      />
    </mesh>
  );
}

// --- MAIN COMPONENT ---
function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Mode state (login or register) - initialize from URL
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  
  // Sync state when URL changes (browser back/forward)
  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);
  
  // Form states
  const [activeRole, setActiveRole] = useState('trader');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Validation
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // OTP states
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);
  
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
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setVerifyError('');
    setVerifySuccess(false);
    setOtp('');
    
    try {
      await apiClient.post('/api/auth/register', {
        fullName,
        email,
        password,
        role: activeRole
      });
      
      // Success - show OTP popup
      setError('');
      setRegisteredEmail(email);
      setShowOtpPopup(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
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
        email: registeredEmail,
        otp
      });
      if (res.status === 200) {
        setVerifySuccess(true);
        setTimeout(() => {
          setShowOtpPopup(false);
          setIsRegister(false);
          navigate('/login');
        }, 3000);
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
      alert('New OTP sent to your email!');
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Resend failed');
    }
  };
  
  const introVariants = {
    initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -20, filter: 'blur(10px)' }
  };
  
  return (
    <PageWrapper>
      {/* Persistent 3D Canvas */}
      <FixedCanvas>
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <directionalLight position={[-10, -10, -5]} intensity={1.5} />
          {/* Glint light - creates white flashes as diamond rotates */}
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Environment preset="city" backgroundBlurriness={0.5} />
          <Sparkles count={100} scale={3} size={4} speed={0.4} opacity={0.5} color="white" />
          <PersistentDiamond />
        </Canvas>
      </FixedCanvas>
      
      {/* Content Layer */}
      <ContentLayer>
        {/* Intro Section - Frameless Typography */}
        <IntroSection>
          <AnimatePresence mode="wait">
            <IntroText
              key="intro1"
              variants={introVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0 }}
            >
              Unbreakable<br />Trust.
            </IntroText>
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <IntroText
              key="intro2"
              variants={introVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Flawless<br />Clarity.
            </IntroText>
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <IntroText
              key="intro3"
              variants={introVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.6 }}
              style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}
            >
              Diamond<br />Connect.
            </IntroText>
          </AnimatePresence>
        </IntroSection>
        
        {/* Form Section */}
        <FormSection>
          <FormContainer
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <FormHeader>
              <FormTitle>{isRegister ? 'Create Account' : 'Welcome Back'}</FormTitle>
              <FormSubtitle>
                {isRegister ? 'Join the premier B2B diamond exchange' : 'Sign in to continue'}
              </FormSubtitle>
            </FormHeader>
            
            {/* Mode Toggle */}
            <ModeToggle>
              <ModeButton $active={!isRegister} onClick={() => { setIsRegister(false); navigate('/login'); }}>
                Login
              </ModeButton>
              <ModeButton $active={isRegister} onClick={() => { setIsRegister(true); navigate('/register'); }}>
                Register
              </ModeButton>
            </ModeToggle>
            
            {/* Role Toggle */}
            <RoleToggle>
              <RoleButton $active={activeRole === 'trader'} onClick={() => setActiveRole('trader')}>
                <Gem /> Trader
              </RoleButton>
              <RoleButton $active={activeRole === 'broker'} onClick={() => setActiveRole('broker')}>
                <Handshake /> Broker
              </RoleButton>
            </RoleToggle>
            
            {/* Form */}
            <form onSubmit={isRegister ? handleRegister : handleLogin}>
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="fullname"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InputGroup>
                      <InputWrapper>
                        <InputIcon $focused={nameFocused}><User /></InputIcon>
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setNameFocused(true)}
                          onBlur={() => setNameFocused(false)}
                          $focused={nameFocused}
                          $error={nameError}
                          required
                        />
                      </InputWrapper>
                      {nameError && <ErrorText>{nameError}</ErrorText>}
                    </InputGroup>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <InputGroup>
                <InputWrapper>
                  <InputIcon $focused={emailFocused}><Mail /></InputIcon>
                  <Input
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
                </InputWrapper>
                {emailError && <ErrorText>{emailError}</ErrorText>}
              </InputGroup>
              
              <InputGroup>
                <InputWrapper>
                  <InputIcon $focused={passwordFocused}><Lock /></InputIcon>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    $focused={passwordFocused}
                    required
                  />
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye /> : <EyeOff />}
                  </TogglePasswordButton>
                </InputWrapper>
              </InputGroup>
              
              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner />
                    {isRegister ? 'Creating Account...' : 'Logging In...'}
                  </>
                ) : (
                  isRegister ? 'Create Account' : 'Login'
                )}
              </SubmitButton>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </form>
            
            {/* Footer Links */}
            <FooterLinks>
              {isRegister ? (
                <>
                  Already have an account?
                  <LinkButton onClick={() => { setIsRegister(false); navigate('/login'); }}>Login</LinkButton>
                </>
              ) : (
                <>
                  Don't have an account?
                  <LinkButton onClick={() => { setIsRegister(true); navigate('/register'); }}>Register</LinkButton>
                </>
              )}
            </FooterLinks>
            
            {!isRegister && (
              <AdminLink>
                <GhostButton onClick={() => navigate('/admin/login')}>
                  Admin Portal
                </GhostButton>
              </AdminLink>
            )}
          </FormContainer>
        </FormSection>
      </ContentLayer>
      
      {/* OTP Verification Popup */}
      {showOtpPopup && (
        <PopupOverlay>
          <PopupCard>
            <PopupTitle>Verify Your Account</PopupTitle>
            <PopupMessage>
              We've sent a 6-digit verification code to <strong>{registeredEmail}</strong>.
            </PopupMessage>
            
            <OTPInputWrapper>
              <Input
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', marginBottom: '1rem' }}
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <SubmitButton type="button" onClick={handleVerifyOtp} disabled={verifying}>
                {verifying ? (
                  <>
                    <Spinner />
                    Verifying...
                  </>
                ) : (
                  'Verify Now'
                )}
              </SubmitButton>
            </OTPInputWrapper>
            
            <ResendButton type="button" onClick={handleResendOtp}>
              Didn't receive code? <span>Resend</span>
            </ResendButton>
            
            {verifyError && <ErrorMessage>{verifyError}</ErrorMessage>}
            
            {verifySuccess && (
              <SuccessBadge>
                <SuccessCheckmark>
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" />
                    <path d="M30 50 L45 65 L70 35" />
                  </svg>
                </SuccessCheckmark>
                <h3>Email Verified!</h3>
                <p>Your account is now verified.</p>
                <p>Redirecting to login...</p>
              </SuccessBadge>
            )}
          </PopupCard>
        </PopupOverlay>
      )}
    </PageWrapper>
  );
}

export default AuthPage;
