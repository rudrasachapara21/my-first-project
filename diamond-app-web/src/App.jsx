import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import NotificationManager from './components/NotificationManager';

const AppContainer = styled.div`
  display: flex;
  /* 🛑 Use 100dvh to ensure it fills exactly the screen height on all devices */
  height: 100dvh; 
  width: 100vw;
  overflow: hidden; 
  background-color: ${props => props.theme.bgPrimary || props.theme.background};
  transition: background-color 0.3s ease;
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  height: 100%;
  overflow-y: auto; 
  overflow-x: hidden;
  
  /* Standard padding for content, not too much, not too little */
  padding-bottom: 80px; 
  
  -webkit-overflow-scrolling: touch;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
`;

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const { currentTheme } = useTheme();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <StyledThemeProvider theme={currentTheme || {}}>
        <NotificationManager />

        <AppContainer>
          {/* Sidebar logic is now protected inside the Flex Container */}
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          
          {/* Mobile Backdrop */}
          {isSidebarOpen && window.innerWidth <= 1024 && (
            <Backdrop onClick={closeSidebar} />
          )}
          
          <MainContent id="main-scroll-container">
            <Outlet context={{ toggleSidebar }} />
          </MainContent>
        </AppContainer>
    </StyledThemeProvider>
  );
}

export default App;