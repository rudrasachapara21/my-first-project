import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styled from 'styled-components';

// --- Initial Data (Updated with imageUrl) ---
const initialUsers = [
  { id: 1, name: 'John Doe', email: 'john.d@example.com', phone: '123-456-7890', role: 'Trader' },
  { id: 2, name: 'Jane Smith', email: 'jane.s@example.com', phone: '098-765-4321', role: 'Broker' },
];

const initialNews = [
    { id: 1, title: 'Global Diamond Prices See Slight Increase', content: 'Analysts report a 1.2% increase...', createdAt: '2025-09-05', imageUrl: 'https://placehold.co/600x400/a5b4fc/1e293b?text=Market+Trends' },
    { id: 2, title: 'New Certification Standards Announced', content: 'The International Gemological Institute has announced new standards...', createdAt: '2025-09-02', imageUrl: 'https://placehold.co/600x400/a5b4fc/1e293b?text=Certification' },
];

// --- Styled Components ---
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
  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }
`;

const SidebarTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin-bottom: 3rem;
`;

const StyledNavLink = styled(NavLink)`
  color: #94a3b8;
  text-decoration: none;
  font-size: 1.1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s, color 0.2s;
  &:hover { background-color: #334155; color: #fff; }
  &.active { background-color: #4f46e5; color: #fff; font-weight: 500; }
`;

const MainContent = styled.main`
  flex-grow: 1;
  padding: 2rem;
  overflow-x: auto;
  font-family: 'Inter', sans-serif; /* Font applied here */
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
  background: none; border: none; cursor: pointer; padding: 0.5rem;
`;

const HamburgerIcon = styled.div`
  width: 24px; height: 2px; background: #1e293b; position: relative;
  &::before, &::after {
    content: ''; position: absolute; width: 24px; height: 2px; background: #1e293b; left: 0;
  }
  &::before { top: -8px; }
  &::after { bottom: -8px; }
`;

const MobileTitle = styled.h2`
  font-family: 'Clash Display', sans-serif; font-size: 1.5rem; color: #1e293b; margin: 0;
`;

const Backdrop = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block; position: fixed; top: 0; left: 0;
    width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 950;
  }
`;

function AdminLayout() {
  const [users, setUsers] = useState(initialUsers);
  const [news, setNews] = useState(initialNews);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminWrapper>
      <Sidebar $isOpen={isMobileNavOpen} onClick={() => setMobileNavOpen(false)}>
        <SidebarTitle>Diamond Connect</SidebarTitle>
        <StyledNavLink to="/admin/dashboard">Dashboard</StyledNavLink>
        <StyledNavLink to="/admin/users">Manage Users</StyledNavLink>
        <StyledNavLink to="/admin/news">Manage News</StyledNavLink>
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