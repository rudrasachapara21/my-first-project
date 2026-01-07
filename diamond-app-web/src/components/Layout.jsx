import React, { useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const LayoutShell = styled.div`
  display: flex;
  width: 100%;
  /* Fix height to 100 viewport height to ensure sidebar logout is visible */
  height: 100dvh; 
  overflow: hidden; /* Prevents the whole body from scrolling */
  background: ${props => props.theme.bgPrimary};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Only the content area scrolls */
  position: relative;
  
  /* Safe area for mobile navigation if needed */
  padding-bottom: env(safe-area-inset-bottom);
`;

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const context = useOutletContext();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <LayoutShell>
      {/* 💎 Sidebar is now part of the structure, ensuring it fills 100% height */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <MainContent id="main-scroll-container">
        {/* Pass the toggle function and context to all pages */}
        <Outlet context={{ ...context, toggleSidebar }} />
      </MainContent>
    </LayoutShell>
  );
};

export default Layout;