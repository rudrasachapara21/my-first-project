import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';

const themeData = [
  { key: 'theme-carbon-black', name: 'Carbon Black', bgColor: '#111827', accentColor: '#38BDF8' },
  { key: 'theme-glacier-white', name: 'Glacier White', bgColor: '#F9FAFB', accentColor: '#4F46E5' },
  { key: 'theme-sapphire-blue', name: 'Sapphire Blue', bgColor: '#F0F5FF', accentColor: '#1D4ED8' },
  { key: 'theme-emerald-lux', name: 'Emerald Lux', bgColor: '#F0FAF5', accentColor: '#D97706' },
  { key: 'theme-sandstone-bronze', name: 'Sandstone & Bronze', bgColor: '#FFFBF5', accentColor: '#92400E' },
];

const Container = styled.div` font-family: 'Inter', sans-serif; `;
const ThemePicker = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
`;
const ThemeOption = styled.div`
  cursor: pointer;
  text-align: center;
`;
const ThemePreview = styled.div`
  width: 100%;
  height: 80px;
  border-radius: 12px;
  background-color: ${props => props.$bgColor};
  border: 3px solid ${props => props.$accentColor};
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active ? `0 0 0 4px ${props.theme.accentPrimary}` : 'none'};
  transform: ${props => props.$active ? 'scale(1.05)' : 'scale(1)'};
`;
const ThemeName = styled.p`
  color: ${props => props.theme.textPrimary};
  font-weight: 500;
`;

function AppTheme() {
  const { themeKey, changeTheme } = useTheme();

  return (
    <Container>
      <PageHeader title="App Theme" />
      <ThemePicker>
        {themeData.map((theme) => (
          <ThemeOption key={theme.key} onClick={() => changeTheme(theme.key)}>
            <ThemePreview 
              $bgColor={theme.bgColor} 
              $accentColor={theme.accentColor}
              $active={themeKey === theme.key}
            />
            <ThemeName>{theme.name}</ThemeName>
          </ThemeOption>
        ))}
      </ThemePicker>
    </Container>
  );
}

export default AppTheme;