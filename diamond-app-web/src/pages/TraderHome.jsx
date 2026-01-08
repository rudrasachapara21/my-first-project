import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PiPlusCircle, PiBinoculars, PiStorefront, PiTag } from "react-icons/pi";
import GlassCard from '../components/GlassCard';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import DashboardSummary from '../components/DashboardSummary';

const Container = styled.div`
  font-family: 'Inter', sans-serif;
  background-color: ${props => props.theme.bgPrimary};
  min-height: 100%;
`;

const NavGrid = styled.main`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

const NavCard = styled(GlassCard)`
  background: ${props => props.$primary ? (props.theme.primaryGradient || props.theme.accentPrimary) : props.theme.surfaceGlass};
  color: ${props => props.$primary ? props.theme.textMain : props.theme.textPrimary};
  border-radius: 16px;
  padding: ${props => props.$primary ? '2rem' : '1.25rem'};
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: transform 0.1s ease-in-out, background-color 0.3s ease;
  border: 1px solid ${props => props.theme.borderColor};
  
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
  display: flex;
  align-items: center;
  justify-content: center;
  
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
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // ✅ SAFETY: Do not attempt fetch if user is not yet defined
    if (!user) return;

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/stats/summary');
            setSummaryStats(response.data);
        } catch (error) {
            console.error("Failed to fetch trader stats:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
  }, [user]);

  // ✅ PREVENT CRASH: If user object is missing, show nothing or a small loader
  // This works with ProtectedRoute to ensure we never see a "broken" UI
  if (!user) return null;

  return (
    <Container>
      <AppHeader title={`Welcome, ${user.firstName || 'Trader'}`} />
      
      {/* DashboardSummary should handle its own loading state based on stats being null */}
      <DashboardSummary stats={summaryStats} isLoading={loading} />
      
      <NavGrid>
        <NavCard $primary onClick={() => navigate('/my-demands')}>
            <IconWrapper><PiPlusCircle /></IconWrapper>
            <NavCardTitle>Post a Demand</NavCardTitle>
        </NavCard>
        
        <NavCard onClick={() => navigate('/view-demands')}>
            <IconWrapper><PiBinoculars /></IconWrapper>
            <NavCardTitle>Browse Demands</NavCardTitle>
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