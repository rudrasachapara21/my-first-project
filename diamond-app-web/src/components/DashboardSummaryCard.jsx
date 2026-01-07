import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Card = styled.div`
  /* ✨ GLASS FRAGMENT ARCHITECTURE */
  background: ${props => props.theme.bgSecondary};
  backdrop-filter: ${props => props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.glassEffect};
  border-radius: 24px;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid ${props => props.theme.borderColor};
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;

  /* Subtle inner light reflection */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: ${props => props.theme.accentPrimary}66;
    box-shadow: ${props => props.theme.cardShadow};
    background: rgba(255, 255, 255, 0.05);
  }

  ${props => props.$isFullWidth && `grid-column: 1 / -1;`}
`;

const IconWrapper = styled.div`
  font-size: 2.2rem;
  color: ${props => props.theme.accentPrimary};
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 10px ${props => props.theme.accentPrimary}44);
  transition: transform 0.4s ease;

  ${Card}:hover & {
    transform: scale(1.1) rotate(5deg);
  }
`;

const Value = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3.2rem; 
  font-weight: 700;
  letter-spacing: -2px;
  color: ${props => props.theme.textPrimary};
  line-height: 1;
  /* Shimmer effect for the text */
  background: linear-gradient(90deg, ${props => props.theme.textPrimary}, ${props => props.theme.accentPrimary}, ${props => props.theme.textPrimary});
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${shimmer} 6s linear infinite;
`;

const Label = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: ${props => props.theme.textSecondary};
  font-weight: 600;
  margin-top: 0.5rem;
  opacity: 0.8;
`;

const SkeletonLine = styled.div`
  width: 60%;
  height: 2rem;
  background: ${props => props.theme.textPrimary}0D;
  border-radius: 10px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, ${props => props.theme.textPrimary}0D, transparent);
    animation: ${shimmer} 1.5s infinite;
  }
`;

function DashboardSummaryCard({ icon, value, label, isLoading, isFullWidth }) {
  if (isLoading) {
    return (
      <Card $isFullWidth={isFullWidth}>
        <SkeletonLine style={{ width: '40px', height: '40px', marginBottom: '1rem' }} />
        <SkeletonLine style={{ width: '100px' }} />
        <SkeletonLine style={{ width: '60px', marginTop: '1rem' }} />
      </Card>
    );
  }

  return (
    <Card $isFullWidth={isFullWidth}>
      <IconWrapper>{icon}</IconWrapper>
      <Value>{value ?? '0'}</Value>
      <Label>{label}</Label>
    </Card>
  );
}

export default DashboardSummaryCard;