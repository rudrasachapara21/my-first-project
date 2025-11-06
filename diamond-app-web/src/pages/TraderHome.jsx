import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PiPlusCircle, PiBinoculars, PiStorefront, PiTag } from "react-icons/pi";
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import DashboardSummary from '../components/DashboardSummary';

const Container = styled.div`font-family: 'Inter', sans-serif;`;

const NavGrid = styled.main`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

const NavCard = styled.div`
  background: ${props => props.$primary ? props.theme.accentPrimary : props.theme.bgSecondary};
  color: ${props => props.$primary ? '#FFFFFF' : props.theme.textPrimary};
  border-radius: 16px;
  padding: ${props => props.$primary ? '2rem' : '1.25rem'};
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform 0.1s ease-in-out;
  
  &:active { transform: scale(0.97); }

  @media (max-width: 480px) {
    padding: ${props => props.$primary ? '1.5rem' : '1rem'};
  }
`;

const IconWrapper = styled.div`
  font-size: 1.8rem;
  margin-right: 1.25rem;
  width: 30px;
  text-align: center;
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-right: 1rem;
  }
`;

const NavCardTitle = styled.div`
  font-size: 1.3rem;
  font-weight: 500;
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

function TraderHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summaryStats, setSummaryStats] = useState(null);
  
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
        try {
            // ## CHANGE: Using apiClient and added /api prefix ##
            const response = await apiClient.get('/api/stats/summary');
            setSummaryStats(response.data);
        } catch (error) {
            console.error("Failed to fetch trader stats:", error);
        }
    };
    fetchStats();
  }, [user]);

  return (
    <Container>
      <AppHeader title="Home" />
      <DashboardSummary stats={summaryStats} />
      <NavGrid>
        <NavCard $primary onClick={() => navigate('/my-demands')}>
            <IconWrapper><PiPlusCircle /></IconWrapper>
            <NavCardTitle>Post a Demand</NavCardTitle>
        </NavCard>
        <NavCard onClick={() => navigate('/my-demands')}>
            <IconWrapper><PiBinoculars /></IconWrapper>
            <NavCardTitle>My Demands</NavCardTitle>
        </NavCard>
        <NavCard onClick={() => navigate('/buy-feed')}>
            <IconWrapper><PiStorefront /></IconWrapper>
            <NavCardTitle>Buy Feed</NavCardTitle>
        </NavCard>
        <NavCard onClick={() => navigate('/sell-diamonds')}>
            <IconWrapper><PiTag /></IconWrapper>
            <NavCardTitle>My Listings</NavCardTitle>
        </NavCard>
      </NavGrid>
    </Container>
  );
}

export default TraderHome;