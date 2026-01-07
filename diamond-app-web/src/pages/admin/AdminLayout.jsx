import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styled from 'styled-components';
import apiClient from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

const AdminWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f1f5f9;
`;

const Sidebar = styled.nav`
  width: 250px;
  background: #1e293b;
  color: #e2e8f0;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.3s ease-in-out;
  box-sizing: border-box; /* Ensures padding doesn't affect width */

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    
    /* ✅ FIX 1: Use 100dvh to respect mobile browser bars */
    height: 100dvh; 
    
    z-index: 1000;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    
    /* ✅ FIX 2: Add padding for iPhone Home Indicator/Gesture Bar */
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
    
    /* ✅ FIX 3: Allow scrolling if the menu is taller than the screen */
    overflow-y: auto; 
  }
`;

const SidebarTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin-bottom: 3rem;
  flex-shrink: 0; /* Prevents title from squashing */
`;

const StyledNavLink = styled(NavLink)`
  color: #94a3b8;
  text-decoration: none;
  font-size: 1.1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s, color 0.2s;
  flex-shrink: 0; /* Prevents links from squashing */

  &:hover {
    background-color: #334155;
    color: #fff;
  }

  &.active {
    background-color: #4f46e5;
    color: #fff;
    font-weight: 500;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  text-decoration: none;
  font-size: 1.1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: inherit;
  flex-shrink: 0; /* Prevents button from disappearing */

  &:hover {
    background-color: #334155;
    color: #fff;
  }

  /* Pushes button to bottom, but sidebar scrolling handles overflow now */
  margin-top: auto; 
`;

const MainContent = styled.main`
  flex-grow: 1;
  padding: 2rem;
  overflow-x: auto;
  font-family: 'Inter', sans-serif;
  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 5rem;
  }
`;

const MobileHeader = styled.header`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 900;
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
`;

const HamburgerIcon = styled.div`
  width: 24px;
  height: 2px;
  background: #1e293b;
  position: relative;
  &::before, &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background: #1e293b;
    left: 0;
  }
  &::before { top: -8px; }
  &::after { bottom: -8px; }
`;

const MobileTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
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
    background: rgba(0,0,0,0.4);
    z-index: 950;
  }
`;

function AdminLayout() {
  const [users, setUsers] = useState([]);
  const [news, setNews] = useState([]);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, logout } = useAuth();
  
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchData = async () => {
      try {
        const [usersResponse, newsResponse] = await Promise.all([
          apiClient.get('/api/users'),
          apiClient.get('/api/news')
        ]);
        setUsers(usersResponse.data);
        setNews(newsResponse.data);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      }
    };
    fetchData();
  }, [user]);

  return (
    <AdminWrapper>
      <Sidebar $isOpen={isMobileNavOpen}>
        <SidebarTitle>Diamond Connect</SidebarTitle>
        <StyledNavLink to="/admin" end onClick={() => setMobileNavOpen(false)}>Dashboard</StyledNavLink>
        <StyledNavLink to="/admin/users" onClick={() => setMobileNavOpen(false)}>Manage Users</StyledNavLink>
        <StyledNavLink to="/admin/user-monitoring" onClick={() => setMobileNavOpen(false)}>User Monitoring</StyledNavLink>
        <StyledNavLink to="/admin/news" onClick={() => setMobileNavOpen(false)}>Manage News</StyledNavLink>
        
        <LogoutButton onClick={logout}>
          Log Out
        </LogoutButton>
      </Sidebar>
      
      {isMobileNavOpen && <Backdrop onClick={() => setMobileNavOpen(false)} />}
      
      <MainContent>
        <MobileHeader>
          <HamburgerButton onClick={() => setMobileNavOpen(true)}>
            <HamburgerIcon />
          </HamburgerButton>
          <MobileTitle>Admin Panel</MobileTitle>
          <div style={{width: '24px'}}></div>
        </MobileHeader>
        <Outlet context={{ users, setUsers, news, setNews }} />
      </MainContent>
    </AdminWrapper>
  );
}

export default AdminLayout;