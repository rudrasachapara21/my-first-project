// src/components/PageHeader.jsx

import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PiArrowLeft } from 'react-icons/pi';

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

  return (
    <HeaderContainer>
      <ActionWrapper onClick={() => navigate(-1)}>
        <PiArrowLeft size={32} color="#64748B" />
      </ActionWrapper>
      <Title>{title}</Title>
      <ActionWrapper />
    </HeaderContainer>
  );
};

export default PageHeader;