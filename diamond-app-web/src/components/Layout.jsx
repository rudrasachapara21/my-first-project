import React from 'react';
import styled from 'styled-components';
import { Outlet, useNavigate } from 'react-router-dom';
import { PiList, PiGear } from "react-icons/pi";

const AppContainer = styled.div`
  background-color: #EEF2FF;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background-color: #FFFFFF;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const HeaderTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: #3730A3;
  margin: 0;
`;

const MainContent = styled.main`
  padding: 1.5rem;
`;


function Layout() {
  const navigate = useNavigate();
  return (
    <AppContainer>
      <Header>
        <PiList size={32} color="#64748B" style={{ cursor: 'pointer' }} />
        <HeaderTitle>Connect</HeaderTitle>
        <PiGear size={32} color="#64748B" onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }} />
      </Header>
      <MainContent>
        {/* All our other pages will be rendered here */}
        <Outlet />
      </MainContent>
    </AppContainer>
  );
}

export default Layout;