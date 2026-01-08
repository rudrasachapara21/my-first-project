import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- ANIMATIONS ---
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
`;

// ✨ NEW: Shimmer animation for glow effect
const shimmer = keyframes`
  0% { box-shadow: 0 0 20px ${props => props.theme?.accentPrimary || '#FFD700'}40, 0 0 40px ${props => props.theme?.accentPrimary || '#FFD700'}20; }
  50% { box-shadow: 0 0 40px ${props => props.theme?.accentPrimary || '#FFD700'}80, 0 0 80px ${props => props.theme?.accentPrimary || '#FFD700'}40; }
  100% { box-shadow: 0 0 20px ${props => props.theme?.accentPrimary || '#FFD700'}40, 0 0 40px ${props => props.theme?.accentPrimary || '#FFD700'}20; }
`;

// ✨ NEW: Gradient rotation for spinner
const gradientSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// --- AGGRESSIVE OVERLAY (FORCE VISIBILITY) ---
const FullScreenOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999999;
  
  /* Theme-aware background with enhanced blur */
  background: ${props => props.theme?.bgPrimary || '#0a0a0a'}dd;
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  pointer-events: auto;
`;

// --- ENHANCED THEME-AWARE SPINNER ---
const Spinner = styled.div`
  width: 70px;
  height: 70px;
  border: 5px solid transparent;
  border-top: 5px solid ${props => props.theme?.accentPrimary || '#FFD700'};
  border-right: 5px solid ${props => props.theme?.accentPrimary || '#FFD700'}80;
  border-radius: 50%;
  animation: ${spin} 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  position: relative;
  
  /* ✨ Enhanced shimmer glow that pulses */
  animation: ${spin} 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite,
             ${shimmer} 2s ease-in-out infinite;
  
  /* Gradient border effect */
  &::before {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    padding: 5px;
    background: linear-gradient(
      45deg,
      ${props => props.theme?.accentPrimary || '#FFD700'},
      transparent,
      ${props => props.theme?.accentPrimary || '#FFD700'}
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: ${gradientSpin} 2s linear infinite;
    opacity: 0.3;
  }
`;

// --- ENHANCED DIAMOND CORE WITH SHIMMER ---
const DiamondCore = styled.div`
  position: absolute;
  width: 18px;
  height: 18px;
  background: ${props => props.theme?.primaryGradient || 
    `linear-gradient(135deg, ${props.theme?.accentPrimary || '#FFD700'}, ${props.theme?.accentSecondary || '#FFA500'})`};
  transform: rotate(45deg);
  animation: ${pulse} 1.8s ease-in-out infinite;
  border-radius: 3px;
  
  /* ✨ Enhanced glow effect */
  box-shadow: 
    0 0 15px ${props => props.theme?.accentPrimary || '#FFD700'}80,
    0 0 30px ${props => props.theme?.accentPrimary || '#FFD700'}40,
    inset 0 0 10px ${props => props.theme?.accentPrimary || '#FFD700'}60;
`;

const SpinnerContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 70px;
`;

// --- ENHANCED TEXT WITH THEME COLORS ---
const LoadingText = styled.p`
  color: ${props => props.theme?.textPrimary || '#FFFFFF'};
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Clash Display', -apple-system, sans-serif;
  letter-spacing: 0.5px;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  
  /* ✨ Subtle shimmer on text */
  animation: ${pulse} 2s ease-in-out infinite;
`;

// ✨ NEW: Shimmer wrapper for inline loaders
const InlineSpinner = styled(Spinner)`
  width: 50px;
  height: 50px;
  border-width: 4px;
`;

// --- INLINE LOADER (FOR NON-FULLSCREEN) ---
const InlineContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  gap: 1rem;
`;

const Loader = ({ fullScreen = false, text = "Processing..." }) => {
  if (fullScreen) {
    return (
      <FullScreenOverlay>
        <SpinnerContainer>
          <Spinner />
          <DiamondCore />
        </SpinnerContainer>
        <LoadingText>{text}</LoadingText>
      </FullScreenOverlay>
    );
  }

  // Inline version (for content areas)
  return (
    <InlineContainer>
      <SpinnerContainer style={{ width: '50px', height: '50px' }}>
        <InlineSpinner />
        <DiamondCore style={{ width: '14px', height: '14px' }} />
      </SpinnerContainer>
      <LoadingText style={{ textShadow: 'none', fontSize: '1rem' }}>{text}</LoadingText>
    </InlineContainer>
  );
};

export default Loader;