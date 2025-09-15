import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { PiList, PiUserCircle, PiHandWaving, PiBell } from "react-icons/pi";

import DashboardSummary from '../components/DashboardSummary';
import NotificationCenter from '../components/NotificationCenter';
import { SkeletonDemandCard } from '../components/SkeletonCard';

// --- Styled Components (from your UI file) ---
const Container = styled.div` font-family: 'Inter', sans-serif; `;
const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center; padding: 1.5rem;
`;
const HeaderTitle = styled.h1`
  font-family: 'Clash Display', sans-serif; font-size: 2rem; font-weight: 600;
  color: ${props => props.theme.textPrimary}; margin: 0;
`;
const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif; font-size: 1.8rem;
  padding: 0 1.5rem; margin-bottom: 1.5rem; color: ${props => props.theme.textPrimary};
`;
const DemandsList = styled.div`
  display: flex; flex-direction: column; gap: 1rem; padding: 0 1.5rem 1.5rem;
`;
const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
`;
const CardHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;
`;
const DemandTitle = styled.div` font-size: 1.4rem; font-weight: 500; `;
const DemandPrice = styled.div`
  font-size: 1.1rem; font-weight: 700; color: ${props => props.theme.accentPrimary};
`;
const DemandDetails = styled.p`
  font-size: 0.9rem; color: ${props => props.theme.textSecondary};
  line-height: 1.5; margin: 0 0 1.5rem 0;
`;
const CardFooter = styled.div`
  display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;
`;
const RaiseHandButton = styled.button`
  padding: 0.6rem 1.2rem; border-radius: 8px; border: none;
  background: ${props => (props.disabled ? props.theme.borderColor : props.theme.accentPrimary)};
  color: ${props => (props.disabled ? props.theme.textSecondary : 'white')};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  font-weight: 700; display: flex; align-items: center; gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  &:active { transform: ${props => (props.disabled ? 'none' : 'scale(0.97)')}; }
`;
const HeaderActions = styled.div` display: flex; align-items: center; gap: 1rem; `;
const BellWrapper = styled.div` position: relative; cursor: pointer; `;
const NotificationBadge = styled.div`
  position: absolute; top: -4px; right: -4px; background-color: #EF4444; color: white;
  width: 18px; height: 18px; border-radius: 50%; font-size: 0.7rem; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
`;

function BrokerHome() {
  const navigate = useNavigate();
  const { toggleSidebar, notifications = [], isNotificationsOpen, toggleNotifications } = useOutletContext() || {};

  // --- State Management from our new functional component ---
  const [demands, setDemands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [raisedHands, setRaisedHands] = useState(new Set());

  // --- Data Fetching Logic ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const fetchDemands = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/demands', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDemands(response.data);

        const interestedIds = new Set();
        response.data.forEach(demand => {
          if (demand.currentUserInterested) {
            interestedIds.add(demand.demand_id);
          }
        });
        setRaisedHands(interestedIds);
        
      } catch (error) {
        console.error("Failed to fetch demands:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDemands();
  }, [navigate]);

  // --- "Raise Hand" Button Logic ---
  const handleRaiseHand = async (demandId) => {
    if (raisedHands.has(demandId)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5001/api/demands/${demandId}/raise-hand`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRaisedHands(prev => new Set(prev).add(demandId));
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setRaisedHands(prev => new Set(prev).add(demandId));
      } else {
        alert(error.response?.data?.message || "An error occurred.");
      }
    }
  };

  return (
    <Container>
      <Header>
        <PiList size={32} color="#64748B" onClick={toggleSidebar} style={{ cursor: 'pointer' }} />
        <HeaderTitle>Broker Home</HeaderTitle>
        <HeaderActions>
            <BellWrapper onClick={toggleNotifications}>
                <PiBell size={32} color="#64748B" />
                {notifications.length > 0 && <NotificationBadge>{notifications.length}</NotificationBadge>}
                {isNotificationsOpen && <NotificationCenter notifications={notifications} />}
            </BellWrapper>
            <PiUserCircle size={36} color="#A5B4FC" onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }} />
        </HeaderActions>
      </Header>

      <DashboardSummary userType="broker" />

      <main>
        <SectionTitle>Live Market Demands</SectionTitle>
        <DemandsList>
          {isLoading ? (
            <><SkeletonDemandCard /><SkeletonDemandCard /><SkeletonDemandCard /></>
          ) : (
            demands.map(demand => {
              const hasRaisedHand = raisedHands.has(demand.demand_id);
              const demandTitle = `${demand.diamond_details.carat}ct, ${demand.diamond_details.clarity}, ${demand.diamond_details.shape}`;
              // Note: Assuming price comes from a property like demand.price. Adjust if needed.
              const demandPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(demand.price || 0);

              return (
                <DemandCard key={demand.demand_id}>
                  <CardHeader>
                    <DemandTitle>{demandTitle}</DemandTitle>
                    <DemandPrice>{demandPrice}</DemandPrice>
                  </CardHeader>
                  <DemandDetails>Posted by: {demand.user_name}</DemandDetails>
                  <CardFooter>
                    <div><strong>{demand.interest_count || 0}</strong> Brokers Interested</div>
                    <RaiseHandButton 
                      onClick={() => handleRaiseHand(demand.demand_id)}
                      disabled={hasRaisedHand}
                    >
                      <PiHandWaving size={16} />
                      {hasRaisedHand ? 'Interest Shown' : 'Raise Hand'}
                    </RaiseHandButton>
                  </CardFooter>
                </DemandCard>
              );
            })
          )}
        </DemandsList>
      </main>
    </Container>
  );
}

export default BrokerHome;