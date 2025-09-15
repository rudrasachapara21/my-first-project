import React from 'react';
import styled from 'styled-components';
import { PiBinoculars, PiHandWaving, PiStorefront } from "react-icons/pi";

const SummaryContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0 1.5rem 2rem 1.5rem;
`;
const StatCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid ${props => props.theme.borderColor};
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const StatIcon = styled.div`
  font-size: 1.8rem;
  color: ${props => props.theme.accentPrimary};
  margin-bottom: 0.5rem;
`;
const StatValue = styled.p`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
  line-height: 1;
`;
const StatLabel = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  font-weight: 500;
`;

function DashboardSummary({ userType }) {
  const traderStats = [
    { value: 5, label: 'Active Demands', icon: <PiBinoculars /> },
    { value: 3, label: 'New Interests', icon: <PiHandWaving /> }
  ];
  const brokerStats = [
    { value: 8, label: 'New Demands Today', icon: <PiStorefront /> },
    { value: 12, label: 'Hands Raised', icon: <PiHandWaving /> }
  ];
  const stats = userType === 'trader' ? traderStats : brokerStats;

  return (
    <SummaryContainer>
      {stats.map((stat, index) => (
        <StatCard key={index}>
          <StatIcon>{stat.icon}</StatIcon>
          <StatValue>{stat.value}</StatValue>
          <StatLabel>{stat.label}</StatLabel>
        </StatCard>
      ))}
    </SummaryContainer>
  );
}
export default DashboardSummary;