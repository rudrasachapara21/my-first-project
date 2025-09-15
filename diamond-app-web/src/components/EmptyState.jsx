import React from 'react';
import styled from 'styled-components';
import { PiPackage } from "react-icons/pi";

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
  border: 2px dashed ${props => props.theme.borderColor};
  border-radius: 16px;
  margin: 1rem 1.5rem;
`;
const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
  color: ${props => props.theme.textSecondary};
`;
const EmptyTitle = styled.h3`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.5rem;
  color: ${props => props.theme.textPrimary};
  margin: 0 0 0.5rem 0;
`;
const EmptyMessage = styled.p`
  margin: 0;
  max-width: 300px;
`;

function EmptyState({ icon, title, message }) {
  const IconComponent = icon || PiPackage;
  return (
    <EmptyContainer>
      <EmptyIcon><IconComponent /></EmptyIcon>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyMessage>{message}</EmptyMessage>
    </EmptyContainer>
  );
}
export default EmptyState;