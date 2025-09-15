import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import { useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import { useWebSocket } from './context/WebSocketContext';

const GlobalStyle = createGlobalStyle`
  body, html, #root {
    margin: 0; padding: 0; width: 100%; min-height: 100vh;
    box-sizing: border-box; background-color: ${props => props.theme.bgPrimary};
  }
`;
const AppContainer = styled.div`
  background-color: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary};
  min-height: 100vh; transition: background-color 0.4s ease, color 0.4s ease;
  font-family: 'Inter', sans-serif; overflow-x: hidden;
`;
const MainContent = styled.div`
  transition: margin-left 0.3s ease-in-out;
  margin-left: ${props => (props.$isSidebarOpen ? '250px' : '0')};
  @media (max-width: 768px) { margin-left: 0; }
`;

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { currentTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const { ws } = useWebSocket();

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        if(data.type === 'NEW_DEMAND' || data.type === 'NEW_INTEREST') {
            setNotifications(prev => [data, ...prev]);
        }
    };
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleNotifications = useCallback(() => {
    setNotificationsOpen(prev => !prev);
  }, []);
  const toggleWatchlist = (item, type) => {
    setWatchlist(currentWatchlist => {
      const isItemSaved = currentWatchlist.some(i => i.id === item.id && i.type === type);
      if (isItemSaved) {
        return currentWatchlist.filter(i => !(i.id === item.id && i.type === type));
      } else {
        return [...currentWatchlist, { ...item, type }];
      }
    });
  };

  if (!currentTheme) return null;

  return (
    <StyledThemeProvider theme={currentTheme}>
      <GlobalStyle theme={currentTheme} />
      <AppContainer>
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        <MainContent $isSidebarOpen={isSidebarOpen}>
          <Outlet context={{ 
            toggleSidebar, notifications, isNotificationsOpen, toggleNotifications,
            watchlist, toggleWatchlist 
          }} />
        </MainContent>
      </AppContainer>
    </StyledThemeProvider>
  );
}
export default App;