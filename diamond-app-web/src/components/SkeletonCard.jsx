import React from 'react';
import styled, { keyframes } from 'styled-components';

// ✨ Enhanced shimmer animation with smooth wave effect
const shimmer = keyframes`
  0% { 
    background-position: -1000px 0; 
  }
  100% { 
    background-position: 1000px 0; 
  }
`;

// 🎭 Pulse animation for subtle breathing effect
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

const SkeletonWrapper = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: ${props => props.theme.cardShadow || '0 4px 15px rgba(0,0,0,0.05)'};
  overflow: hidden;
  position: relative;
  
  /* Subtle breathing effect */
  animation: ${pulse} 2s ease-in-out infinite;
`;

const SkeletonLine = styled.div`
  height: ${props => props.$height || '1rem'};
  width: ${props => props.$width || '100%'};
  margin-bottom: ${props => props.$mb || '0.75rem'};
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  
  /* Theme-aware base color */
  background-color: ${props => props.theme.bgPrimary};
  
  /* Beautiful gradient shimmer that adapts to theme */
  background-image: linear-gradient(
    90deg,
    ${props => props.theme.bgPrimary} 0%,
    ${props => props.theme.borderColor} 20%,
    ${props => props.theme.accentPrimary}15 40%,
    ${props => props.theme.borderColor} 60%,
    ${props => props.theme.bgPrimary} 100%
  );
  background-repeat: no-repeat;
  background-size: 1000px 100%;
  animation: ${shimmer} 2s ease-in-out infinite;
  
  /* Add subtle inner glow */
  box-shadow: inset 0 0 10px ${props => props.theme.borderColor};
`;

const SkeletonImage = styled(SkeletonLine)`
  height: 250px;
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 16px;
  
  /* Enhanced shimmer for images */
  background-image: linear-gradient(
    90deg,
    ${props => props.theme.bgPrimary} 0%,
    ${props => props.theme.borderColor} 15%,
    ${props => props.theme.accentPrimary}20 35%,
    ${props => props.theme.accentPrimary}25 50%,
    ${props => props.theme.accentPrimary}20 65%,
    ${props => props.theme.borderColor} 85%,
    ${props => props.theme.bgPrimary} 100%
  );
`;

export function SkeletonListingCard() {
    return (
        <SkeletonWrapper>
            <SkeletonImage />
            <SkeletonLine $height="1.2rem" $width="60%" $mb="1rem"/>
            <SkeletonLine $height="1rem" $width="40%" $mb="1rem"/>
            <SkeletonLine $height="0.9rem" $width="80%" $mb="1.5rem"/>
            <SkeletonLine $height="3rem" $width="100%" $mb="0"/>
        </SkeletonWrapper>
    )
}

export function SkeletonDemandCard() {
  return (
    <SkeletonWrapper>
      <SkeletonLine $height="1.4rem" $width="70%" $mb="1.5rem" />
      <SkeletonLine $height="1.1rem" $width="40%" $mb="1.5rem"/>
      <SkeletonLine $height="0.9rem" $width="50%" $mb="1.5rem" />
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <SkeletonLine $height="1.5rem" $width="40%" $mb="0" />
        <SkeletonLine $height="2.5rem" $width="40%" $mb="0" />
      </div>
    </SkeletonWrapper>
  );
}