import React from 'react';
import styled from 'styled-components';
import { PiBinoculars, PiHandWaving, PiStorefront, PiSealCheckFill } from "react-icons/pi";
import DashboardSummaryCard from './DashboardSummaryCard';

const SummaryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
`;

function DashboardSummary({ stats }) {
  const getIcon = (label) => {
    if (label.includes('Demand')) return <PiStorefront />;
    if (label.includes('Raised')) return <PiHandWaving />;
    if (label.includes('Interests')) return <PiHandWaving />;
    if (label.includes('Active')) return <PiBinoculars />;
    if (label.includes('Reputation')) return <PiSealCheckFill />;
    return null;
  };

  if (!stats) {
    const statsArray = [1, 2, 3]; // Mock array for loading state
    const totalStats = statsArray.length;
    return (
      <SummaryContainer>
        {statsArray.map((item, index) => {
          const isLastItem = index === totalStats - 1;
          const isOddTotal = totalStats % 2 !== 0;
          return <DashboardSummaryCard key={index} isLoading={true} isFullWidth={isLastItem && isOddTotal} />
        })}
      </SummaryContainer>
    );
  }

  const statsArray = Object.values(stats);
  const totalStats = statsArray.length;

  return (
    <SummaryContainer>
      {statsArray.map((stat, index) => {
        // --- UI FIX: Logic to determine if the card should be full-width ---
        const isLastItem = index === totalStats - 1;
        const isOddTotal = totalStats % 2 !== 0;

        return (
          <DashboardSummaryCard 
            key={index}
            icon={getIcon(stat.label)}
            value={stat.value}
            label={stat.label}
            isFullWidth={isLastItem && isOddTotal} // Pass the prop
          />
        );
      })}
    </SummaryContainer>
  );
}

export default DashboardSummary;