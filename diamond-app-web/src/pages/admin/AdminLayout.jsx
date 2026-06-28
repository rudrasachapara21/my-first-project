import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import apiClient from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { PiHouse, PiUsers, PiEye, PiNewspaper, PiSignOut, PiDiamond } from 'react-icons/pi';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const AdminWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(14, 165, 233, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const Sidebar = styled.nav`
  width: 280px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px) saturate(120%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #4f46e5, #0ea5e9, #8b5cf6);
    background-size: 200% auto;
    animation: ${shimmer} 3s linear infinite;
  }

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100dvh;
    z-index: 1000;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
    overflow-y: auto;
    box-shadow: ${props => props.$isOpen ? '10px 0 30px rgba(0, 0, 0, 0.5)' : 'none'};
  }
`;

const SidebarHeader = styled.div`
  margin-bottom: 3rem;
  flex-shrink: 0;
  animation: ${fadeIn} 0.5s ease-out;
`;

const SidebarTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const DiamondIcon = styled(PiDiamond)`
  font-size: 2rem;
  color: #4f46e5;
  filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.5));
`;

const AdminBadge = styled.div`
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  color: white;
  font-size: 0.7rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  text-align: center;
  margin-top: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
`;

const NavLinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const StyledNavLink = styled(NavLink)`
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background: linear-gradient(180deg, #4f46e5, #8b5cf6);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }
  
  svg {
    font-size: 1.4rem;
    transition: transform 0.3s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    transform: translateX(4px);
    
    svg {
      transform: scale(1.1);
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(139, 92, 246, 0.2));
    color: #fff;
    border: 1px solid rgba(79, 70, 229, 0.3);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
    font-weight: 600;
    
    &::before {
      transform: scaleY(1);
    }
    
    svg {
      color: #818cf8;
    }
  }
`;

const LogoutButton = styled.button`
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-top: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: 'Inter', sans-serif;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  svg {
    font-size: 1.4rem;
    transition: transform 0.3s ease;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    
    svg {
      transform: translateX(4px);
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MainContent = styled.main`
  flex-grow: 1;
  padding: 2.5rem;
  overflow-x: auto;
  font-family: 'Inter', sans-serif;
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 0.5s ease-out 0.2s both;
  
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
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 900;
  }
`;

const HamburgerButton = styled.button`
  background: rgba(79, 70, 229, 0.1);
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 8px;
  cursor: pointer;
  padding: 0.6rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(79, 70, 229, 0.2);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const HamburgerIcon = styled.div`
  width: 24px;
  height: 2px;
  background: #818cf8;
  position: relative;
  transition: all 0.3s ease;
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background: #818cf8;
    left: 0;
    transition: all 0.3s ease;
  }
  &::before { top: -8px; }
  &::after { bottom: -8px; }
`;

const MobileTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  font-weight: 700;
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
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 950;
    animation: ${fadeIn} 0.2s ease-out;
  }
`;

function AdminLayout() {
  const [users, setUsers] = useState([]);
  const [news, setNews] = useState([]);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [usersResponse, newsResponse] = await Promise.all([
          apiClient.get('/api/users'),
          apiClient.get('/api/news')
        ]);
        setUsers(usersResponse.data || []);
        setNews(newsResponse.data || []);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        setError(error.response?.data?.message || 'Failed to load admin data');
        // Set empty arrays on error to prevent crashes
        setUsers([]);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <AdminWrapper>
      <Sidebar $isOpen={isMobileNavOpen}>
        <SidebarHeader>
          <SidebarTitle>
            <DiamondIcon />
            Diamond Connect
          </SidebarTitle>
          <AdminBadge>ADMIN PANEL</AdminBadge>
        </SidebarHeader>
        
        <NavLinksContainer>
          <StyledNavLink to="/admin" end onClick={() => setMobileNavOpen(false)}>
            <PiHouse />
            Dashboard
          </StyledNavLink>
          <StyledNavLink to="/admin/users" onClick={() => setMobileNavOpen(false)}>
            <PiUsers />
            Manage Users
          </StyledNavLink>
          <StyledNavLink to="/admin/user-monitoring" onClick={() => setMobileNavOpen(false)}>
            <PiEye />
            User Monitoring
          </StyledNavLink>
          <StyledNavLink to="/admin/news" onClick={() => setMobileNavOpen(false)}>
            <PiNewspaper />
            Manage News
          </StyledNavLink>
        </NavLinksContainer>
        
        <LogoutButton onClick={logout}>
          <PiSignOut />
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
        <Outlet context={{ users, setUsers, news, setNews, isLoading, error }} />
      </MainContent>
    </AdminWrapper>
  );
}

export default AdminLayout;