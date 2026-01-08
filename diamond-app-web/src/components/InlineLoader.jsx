import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

// Lightweight inline loader (no overlay)
const SpinnerContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
`;

const Spinner = styled.div`
  width: ${props => props.$size || '20px'};
  height: ${props => props.$size || '20px'};
  border: 3px solid ${props => props.theme?.borderColor || '#334155'};
  border-top-color: ${props => props.theme?.accentPrimary || '#FFD700'};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.span`
  font-size: ${props => props.$fontSize || '0.95rem'};
  color: ${props => props.theme?.textSecondary || '#94a3b8'};
  font-weight: 500;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

// Lightweight progress bar (alternative)
const ProgressContainer = styled.div`
  width: 100%;
  max-width: ${props => props.$maxWidth || '300px'};
  height: 4px;
  background: ${props => props.theme?.borderColor || '#334155'};
  border-radius: 2px;
  overflow: hidden;
  margin: ${props => props.$margin || '0'};
`;

const progressSlide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const ProgressBar = styled.div`
  width: 50%;
  height: 100%;
  background: ${props => props.theme?.accentPrimary || '#FFD700'};
  animation: ${progressSlide} 1.5s ease-in-out infinite;
`;

/**
 * Inline Loader - Non-intrusive loading indicator
 * @param {string} text - Optional loading text
 * @param {string} size - Spinner size (default: '20px')
 * @param {string} fontSize - Text font size (default: '0.95rem')
 * @param {boolean} showBar - Show progress bar instead of spinner
 * @param {string} barMaxWidth - Max width of progress bar
 */
const InlineLoader = ({ 
  text = '', 
  size = '20px', 
  fontSize = '0.95rem',
  showBar = false,
  barMaxWidth = '300px',
  barMargin = '0.5rem auto'
}) => {
  if (showBar) {
    return (
      <div style={{ textAlign: 'center' }}>
        {text && <LoadingText $fontSize={fontSize}>{text}</LoadingText>}
        <ProgressContainer $maxWidth={barMaxWidth} $margin={barMargin}>
          <ProgressBar />
        </ProgressContainer>
      </div>
    );
  }

  return (
    <SpinnerContainer>
      <Spinner $size={size} />
      {text && <LoadingText $fontSize={fontSize}>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default InlineLoader;
