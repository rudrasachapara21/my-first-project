import React from 'react';
import styled from 'styled-components';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PiList, PiUserCircle, PiBell } from "react-icons/pi";
import NotificationCenter from './NotificationCenter';

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  
  // FIX: Reduced padding slightly on smaller screens
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const HeaderTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;

  // FIX: Added a media query to reduce font size on small screens.
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BellWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #EF4444;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function AppHeader({ title }) {
    const navigate = useNavigate();
    const { 
        toggleSidebar, 
        notifications = [], 
        isNotificationsOpen, 
        toggleNotifications 
    } = useOutletContext() || {};

    return (
        <Header>
            <PiList size={32} color="#64748B" onClick={toggleSidebar} style={{ cursor: 'pointer' }} />
            <HeaderTitle>{title}</HeaderTitle>
            <HeaderActions>
                <BellWrapper onClick={toggleNotifications}>
                    <PiBell size={32} color="#64748B" />
                    {notifications.length > 0 && <NotificationBadge>{notifications.length}</NotificationBadge>}
                    {isNotificationsOpen && <NotificationCenter notifications={notifications} />}
                </BellWrapper>
                <PiUserCircle size={36} color="#A5B4FC" onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }} />
            </HeaderActions>
        </Header>
    );
}
export default AppHeader;