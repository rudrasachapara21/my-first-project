import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- ANIMATIONS ---
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(0.8) rotate(45deg); opacity: 0.5; }
  50% { transform: scale(1.1) rotate(45deg); opacity: 1; }
  100% { transform: scale(0.8) rotate(45deg); opacity: 0.5; }
`;

// --- STYLES ---
const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: ${props => props.$fullScreen ? '80vh' : '200px'};
  width: 100%;
  gap: 1.5rem;
`;

const LoaderWrapper = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// The Spinning Outer Ring
const Ring = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid ${props => props.theme.info}22; /* theme info transparent */
  border-top: 3px solid ${props => props.theme.info}; /* theme info solid */
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// The Inner Diamond (Square rotated 45deg)
const Diamond = styled.div`
  width: 20px;
  height: 20px;
  background: ${props => props.theme.primaryGradient || `linear-gradient(135deg, ${props.theme.accentPrimary}, ${props.theme.accentPrimary})`};
  box-shadow: ${props => props.theme.primaryGlow || `0 0 18px ${props.theme.accentPrimary}55`};
  /* The rotation is inside the pulse animation */
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const LoadingText = styled.p`
  font-family: 'Clash Display', sans-serif;
  font-size: 1rem;
  color: ${props => props.theme.textSecondary};
  letter-spacing: 1px;
  margin: 0;
  opacity: 0.8;
`;

const Loader = ({ fullScreen = false, text = "Loading..." }) => {
    return (
        <Container $fullScreen={fullScreen}>
            <LoaderWrapper>
                <Ring />
                <Diamond />
            </LoaderWrapper>
            <LoadingText>{text}</LoadingText>
        </Container>
    );
};

export default Loader;