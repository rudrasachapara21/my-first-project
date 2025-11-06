import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${props => props.theme.bgPrimary || '#FFF'};
`;

const MainContent = styled.div`
  flex-grow: 1;
  width: 100%;
`;

const Backdrop = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999;
  }
`;

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const { currentTheme } = useTheme();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <StyledThemeProvider theme={currentTheme || {}}>
        <AppContainer>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          {isSidebarOpen && window.innerWidth <= 768 && <Backdrop onClick={closeSidebar} />}
          <MainContent>
            <Outlet context={{ toggleSidebar }} />
          </MainContent>
        </AppContainer>
    </StyledThemeProvider>
  );
}

export default App;