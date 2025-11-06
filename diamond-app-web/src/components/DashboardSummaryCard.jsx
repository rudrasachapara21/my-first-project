import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background-color: ${props => props.theme.bgSecondary};
  border-radius: 16px;
  padding: 2rem 1.5rem; /* Increased vertical padding */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem; /* Adjusted gap for tighter spacing */
  border: 1px solid ${props => props.theme.borderColor};
  text-align: center;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px); /* Increased lift on hover */
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }

  /* Handles the full-width layout for the last card */
  ${props => props.$isFullWidth && `
    grid-column: 1 / -1;
  `}
`;

const IconWrapper = styled.div`
  font-size: 2rem; /* Slightly larger icon */
  color: ${props => props.theme.accentPrimary};
  margin-bottom: 0.75rem;
`;

const Value = styled.div`
  font-family: 'Clash Display', sans-serif;
  font-size: 3rem; /* Larger font size for impact */
  font-weight: 700; /* Bolder */
  color: ${props => props.theme.textPrimary};
  line-height: 1;
`;

const Label = styled.div`
  font-size: 0.9rem; /* Slightly smaller for better hierarchy */
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
  line-height: 1.3; /* Tighter line height for two-line labels */
`;

function DashboardSummaryCard({ icon, value, label, isLoading, isFullWidth }) {
  if (isLoading) {
    // A simple loading state
    return <Card $isFullWidth={isFullWidth}>...</Card>;
  }

  return (
    <Card $isFullWidth={isFullWidth}>
      <IconWrapper>{icon}</IconWrapper>
      <Value>{value ?? '0'}</Value>
      <Label>{label}</Label>
    </Card>
  );
}

export default DashboardSummaryCard;