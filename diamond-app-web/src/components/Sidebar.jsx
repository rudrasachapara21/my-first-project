import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const SidebarContainer = styled.div`
  height: 100%;
  width: ${props => props.$isOpen ? '250px' : '0'};
  position: fixed;
  z-index: 2000;
  top: 0;
  left: 0;
  background-color: ${props => props.theme.bgSecondary};
  overflow-x: hidden;
  white-space: nowrap;
  transition: width 0.3s ease;
  padding-top: ${props => props.$isOpen ? '60px' : '0'};
  border-right: ${props => props.$isOpen ? `1px solid ${props.theme.borderColor}` : 'none'};
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
`;
const SidebarLink = styled.a`
  padding: 10px 15px 10px 32px;
  text-decoration: none;
  font-size: 1.2rem;
  color: ${props => props.theme.textSecondary};
  display: block;
  transition: 0.3s;
  cursor: pointer;
  &:hover {
    color: ${props => props.theme.accentPrimary};
  }
`;
const CloseButton = styled.a`
  position: absolute;
  top: 20px;
  right: 25px;
  font-size: 36px;
  text-decoration: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
`;
const SidebarHeader = styled.div`
  padding: 10px 32px;
  margin-bottom: 1rem;
  color: ${props => props.theme.textPrimary};
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
`;

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  // --- THE FIX: A proper logout function ---
  const handleLogout = () => {
    // 1. Clear the user's session from browser storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Navigate to the login page and force a refresh to clear all application state
    window.location.href = '/';
  };

  return (
    <SidebarContainer $isOpen={isOpen}>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <SidebarHeader>Connect</SidebarHeader>
      <SidebarLink onClick={() => handleNavigate('/chats')}>Messages</SidebarLink>
      <SidebarLink onClick={() => handleNavigate('/watchlist')}>My Watchlist</SidebarLink>
      <SidebarLink onClick={() => handleNavigate('/ai-pricing')}>AI Pricing</SidebarLink>
      <SidebarLink onClick={() => handleNavigate('/news')}>News</SidebarLink>
      <SidebarLink onClick={() => handleNavigate('/settings')}>Settings</SidebarLink>
      <SidebarLink onClick={() => handleNavigate('/help')}>Help/Support</SidebarLink>
      {/* THE FIX: Connect the Logout link to the new handleLogout function */}
      <SidebarLink onClick={handleLogout}>Logout</SidebarLink>
    </SidebarContainer>
  );
}
export default Sidebar;