import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';

// ✅ THE PRECISION 5 DATA: Unique, Modern, and Work-Focused
const themeData = [
  { 
    key: 'theme-midnight-cobalt', 
    name: 'Midnight Cobalt', 
    bgColor: '#0B1120', 
    accentColor: '#38BDF8', 
    label: 'TERMINAL' 
  },
  { 
    key: 'theme-arctic-tech', 
    name: 'Arctic Tech', 
    bgColor: '#F1F5F9', 
    accentColor: '#0EA5E9', 
    label: 'CLEAN' 
  },
  { 
    key: 'theme-forest-mint', 
    name: 'Forest Mint', 
    bgColor: '#0F172A', 
    accentColor: '#10B981', 
    label: 'GROWTH' 
  },
  { 
    key: 'theme-modern-studio', 
    name: 'Modern Studio', 
    bgColor: '#18181B', 
    accentColor: '#8B5CF6', 
    label: 'CREATIVE' 
  },
  { 
    key: 'theme-carbon-slate', 
    name: 'Carbon Slate', 
    bgColor: '#111111', 
    accentColor: '#F59E0B', 
    label: 'UTILITY' 
  },
];

const sweep = keyframes`
  0% { left: -100%; opacity: 0; }
  50% { opacity: 0.4; }
  100% { left: 100%; opacity: 0; }
`;

const Container = styled.div` 
  min-height: 100vh;
  padding-bottom: 4rem;
`;

const HeaderSection = styled.div`
  padding: 1rem 1.5rem 2.5rem;
  
  h2 {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 0.5rem;
  background: ${props => `linear-gradient(to right, ${props.theme.textMain}, ${props.theme.textSecondary})`};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    opacity: 0.7;
    font-size: 0.95rem;
  }
`;

const ThemePicker = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  padding: 0 1.5rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ThemeOption = styled.div`
  cursor: pointer;
`;

const ThemePreview = styled.div`
  width: 100%;
  height: 140px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: ${props => props.$bgColor};
  border: 1px solid ${props => props.$active ? props.$accentColor : 'rgba(255, 255, 255, 0.1)'};
  
  /* 🎇 THE PREMIUM INTERACTIVE GLOW */
  box-shadow: ${props => props.$active 
    ? `0 15px 35px -10px ${props.$accentColor}66` 
    : '0 8px 20px rgba(0,0,0,0.2)'};

  transform: ${props => props.$active ? 'translateY(-12px) scale(1.03)' : 'scale(1)'};

  /* Light Sweep Animation on Hover */
  &:hover::after {
    content: '';
    position: absolute;
    top: 0;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    transform: skewX(-30deg);
    animation: ${sweep} 0.7s ease-in-out;
  }

  /* Theme Label Tag */
  &::before {
    content: '${props => props.$label}';
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 1.5px;
  color: ${props => props.theme.textMain};
    background: rgba(0,0,0,0.5);
    padding: 4px 12px;
    border-radius: 6px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1);
  }
`;

const ThemeName = styled.p`
  color: ${props => props.$active ? props.$accentColor : props.theme.textPrimary};
  margin-top: 1rem;
  font-weight: 700;
  font-size: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &::after {
    content: '';
    display: ${props => props.$active ? 'block' : 'none'};
    width: 6px;
    height: 6px;
    background: ${props => props.$accentColor};
    border-radius: 50%;
    box-shadow: 0 0 8px ${props => props.$accentColor};
  }
`;

function AppTheme() {
  const { themeKey, changeTheme } = useTheme();

  return (
    <Container>
      <PageHeader title="Visual Environment" />
      
      <HeaderSection>
        <h2>Workspace Focus</h2>
        <p>Switch between precision-tuned environments for better productivity.</p>
      </HeaderSection>

      <ThemePicker>
        {themeData.map((theme) => (
          <ThemeOption key={theme.key} onClick={() => changeTheme(theme.key)}>
            <ThemePreview 
              $bgColor={theme.bgColor} 
              $accentColor={theme.accentColor}
              $active={themeKey === theme.key}
              $label={theme.label}
            />
            <ThemeName $active={themeKey === theme.key} $accentColor={theme.accentColor}>
              {theme.name}
            </ThemeName>
          </ThemeOption>
        ))}
      </ThemePicker>
    </Container>
  );
}

export default AppTheme;