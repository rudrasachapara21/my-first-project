import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PiList, PiUserCircle, PiBell } from "react-icons/pi";
import NotificationCenter from './NotificationCenter';
import { useNotifications } from '../context/NotificationContext';

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  /* --- THIS IS THE FIX --- */
  
  /* 1. We remove the simple 'padding' property */
  
  /* 2. We define padding for each side individually */
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 1.5rem;

  /* 3. We use calc() to add the safe area to your existing top padding */
  /* env(safe-area-inset-top) is the height of the status bar (on mobile) */
  /* 1.5rem is the fallback for web browsers */
  padding-top: calc(1.5rem + env(safe-area-inset-top, 0rem));
  
  @media (max-width: 480px) {
    /* 4. We do the same for the mobile media query */
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
    padding-top: calc(1rem + env(safe-area-inset-top, 0rem));
  }
`;

const HeaderTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const HeaderActions = styled.div`
  position: relative; 
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
    const { unreadCount } = useNotifications();
    const { toggleSidebar } = useOutletContext() || {};

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const closeDropdown = () => setIsDropdownOpen(false);

    return (
        <Header>
            <PiList size={32} color="#64748B" onClick={toggleSidebar} style={{ cursor: 'pointer' }} />
            <HeaderTitle>{title}</HeaderTitle>
            <HeaderActions>
                <BellWrapper onClick={() => setIsDropdownOpen(prev => !prev)}>
                    <PiBell size={32} color="#64748B" />
                    {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
                </BellWrapper>
                <PiUserCircle size={36} color="#A5B4FC" onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }} />

                {isDropdownOpen && <NotificationCenter onClose={closeDropdown} />}
            </HeaderActions>
        </Header>
    );
}
export default AppHeader;