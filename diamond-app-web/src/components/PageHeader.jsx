import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PiArrowLeft } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext'; // --- CHANGE 1: Import useAuth to know the user's role ---

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.borderColor};
`;
const ActionWrapper = styled.div`
  width: 32px;
  cursor: pointer;
`;
const Title = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
  text-align: center;
  flex-grow: 1;
`;

function PageHeader({ title }) {
  const navigate = useNavigate();
  const { user } = useAuth(); // --- CHANGE 2: Get the current user ---

  // --- CHANGE 3: Create a smart navigation handler ---
  const handleBackNavigation = () => {
    // Determine the correct home page based on the user's role
    const homePath = user?.role === 'trader' ? '/trader-home' : '/broker-home';
    navigate(homePath);
  };

  return (
    <HeaderContainer>
      {/* --- CHANGE 4: Update the onClick to use the new smart handler --- */}
      <ActionWrapper onClick={handleBackNavigation}>
        <PiArrowLeft size={32} color="#64748B" />
      </ActionWrapper>
      <Title>{title}</Title>
      {/* This empty wrapper keeps the title perfectly centered */}
      <ActionWrapper /> 
    </HeaderContainer>
  );
};

export default PageHeader;