import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PiArrowLeft } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 1.5rem;
  padding-top: calc(1.5rem + env(safe-area-inset-top, 0rem));
  border-bottom: 1px solid ${props => props.theme.borderColor};

  @media (max-width: 480px) {
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
    padding-top: calc(1rem + env(safe-area-inset-top, 0rem));
  }
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

function PageHeader({ title, backTo, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackNavigation = () => {
    if (onBack) return onBack();

    // 1) If an explicit back target is provided
    if (typeof backTo !== 'undefined') {
      // support numeric history delta (e.g., -1)
      if (typeof backTo === 'number') return navigate(backTo);
      return navigate(backTo);
    }

    // 2) Default: try going back on the history stack
    // window.history.length > 1 is a robust way in web to check if we can go back
    if (window.history.length > 1) {
      return navigate(-1);
    }

    // 3) Fallback to role-based home if no history entry exists
    const homePath = user?.role === 'trader' ? '/trader-home' : '/broker-home';
    return navigate(homePath);
  };

  return (
    <HeaderContainer>
      <ActionWrapper onClick={handleBackNavigation}>
        <PiArrowLeft size={32} color="#64748B" />
      </ActionWrapper>
      <Title>{title}</Title>
      <ActionWrapper />
    </HeaderContainer>
  );
};

export default PageHeader;