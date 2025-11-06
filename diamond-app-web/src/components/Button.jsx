import React from 'react';
import styled, { css } from 'styled-components';

const buttonVariants = {
  primary: css`
    background-color: ${props => props.theme.accentPrimary};
    color: white;
    border: 1px solid ${props => props.theme.accentPrimary};
  `,
  success: css`
    background-color: #22c55e;
    color: white;
    border: 1px solid #22c55e;
  `,
  danger: css`
    background-color: ${props => props.theme.bgPrimary};
    color: #ef4444;
    border: 1px solid #fca5a5;
  `,
  secondary: css`
    background-color: ${props => props.theme.bgSecondary};
    color: ${props => props.theme.textPrimary};
    border: 1px solid ${props => props.theme.borderColor};
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;

  /* Apply styles based on the $variant prop */
  ${props => buttonVariants[props.$variant] || buttonVariants.secondary}

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: ${props => props.theme.borderColor};
    color: ${props => props.theme.textSecondary};
    border-color: ${props => props.theme.borderColor};
  }

  /* Responsive Styling for smaller screens */
  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
`;

const Button = ({ children, variant = 'secondary', icon, ...props }) => {
  return (
    <StyledButton $variant={variant} {...props}>
      {icon}
      {children}
    </StyledButton>
  );
};

export default Button;