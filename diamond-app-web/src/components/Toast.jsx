import React from 'react';
import styled, { keyframes, css } from 'styled-components';

// --- Animations ---
const slideUp = keyframes`
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
`;

const slideOut = keyframes`
  to { transform: translate(-50%, 100%); opacity: 0; }
`;

// --- Styled Component ---
const ToastOverlay = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 450px;
  padding: 1.25rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  backdrop-filter: blur(15px);
  animation: ${slideUp} 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  font-weight: 600;
  font-size: 1rem;

  ${props => props.$isExiting && css`
    animation: ${slideOut} 0.3s ease-out forwards;
  `}

  ${props => props.$type === 'success' && css`
    background: ${props.theme.accentPrimary}22;
    color: ${props.theme.accentPrimary};
    border-color: ${props.theme.accentPrimary}33;
  `}
  
  ${props => props.$type === 'error' && css`
    background: ${props.theme.accentSecondary || props.theme.error}22;
    color: ${props.theme.accentSecondary || props.theme.error};
    border-color: ${props.theme.accentSecondary || props.theme.error}33;
  `}
  
  ${props => props.$type === 'info' && css`
    background: ${props.theme.accentPrimary}22;
    color: ${props.theme.accentPrimary};
    border-color: ${props.theme.accentPrimary}33;
  `}

  ${props => props.$type === 'warning' && css`
    background: ${props.theme.accentSecondary || props.theme.accentPrimary}22;
    color: ${props.theme.accentSecondary || props.theme.accentPrimary};
    border-color: ${props.theme.accentSecondary || props.theme.accentPrimary}33;
  `}
`;

const ToastIcon = styled.div`
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const ToastMessage = styled.div`
  flex: 1;
`;

/**
 * Toast Component - Glassmorphism notification toast
 * @param {boolean} show - Controls visibility
 * @param {string} message - Toast message text
 * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
 * @param {boolean} isExiting - Triggers exit animation
 */
function Toast({ show, message, type = 'success', isExiting = false }) {
  if (!show && !isExiting) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return '✨';
    }
  };

  return (
    <ToastOverlay $type={type} $isExiting={isExiting}>
      <ToastIcon>{getIcon()}</ToastIcon>
      <ToastMessage>{message}</ToastMessage>
    </ToastOverlay>
  );
}

export default Toast;
