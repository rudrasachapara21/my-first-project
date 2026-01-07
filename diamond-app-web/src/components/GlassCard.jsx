import styled from 'styled-components';

// Reusable glass / frosted card used across the app
const GlassCard = styled.div`
  background: ${props => props.theme.surfaceGlass || props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.glassBorder || 'rgba(255,255,255,0.06)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: ${props => props.$radius || '16px'};
  box-shadow: ${props => props.theme.cardShadow || '0 8px 30px rgba(2,6,23,0.6)'};
  padding: ${props => props.$padding || '1rem'};
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

export default GlassCard;
