import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { PiHandWaving, PiDiamond, PiCheckCircle } from "react-icons/pi";
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import AppHeader from '../components/AppHeader';
import DashboardSummary from '../components/DashboardSummary';
import { SkeletonDemandCard } from '../components/SkeletonCard';

// ... (Styles) ...
const Container = styled.div` font-family: 'Inter', sans-serif; `;
const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  padding: 0 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.textPrimary};
`;
const DemandsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
`;
const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  }
`;
const DemandDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
`;
const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
`;
const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary};
`;
const DetailValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;
const CardFooter = styled.div`
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid ${props => props.theme.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
`;
const InterestCount = styled.div`
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
`;
const RaiseHandButton = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: ${props => (props.disabled ? props.theme.bgPrimary : props.theme.accentPrimary)};
  color: ${props => (props.disabled ? props.theme.textSecondary : 'white')};
  border: 1px solid ${props => (props.disabled ? props.theme.borderColor : 'transparent')};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  
  &:active {
    transform: ${props => (props.disabled ? 'none' : 'scale(0.97)')};
  }
`;

function BrokerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [demands, setDemands] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [raisedHands, setRaisedHands] = useState(new Set());
  
  useEffect(() => {
    if (!user) return;

    try {
      const cachedDemands = localStorage.getItem('cachedDemands');
      const cachedInterests = localStorage.getItem('cachedInterests');
      const cachedStats = localStorage.getItem('cachedStats');

      if (cachedDemands && cachedInterests && cachedStats) {
        setDemands(JSON.parse(cachedDemands));
        setRaisedHands(new Set(JSON.parse(cachedInterests)));
        setSummaryStats(JSON.parse(cachedStats));
        setIsLoading(false); 
      } else {
        setIsLoading(true); 
      }
    } catch (e) {
      console.error("Failed to load from cache", e);
      setIsLoading(true); 
    }

    const fetchData = async () => {
      try {
        const [demandsRes, interestsRes, statsRes] = await Promise.all([
            apiClient.get('/api/demands'),
            apiClient.get('/api/demands/my-interests'),
            apiClient.get('/api/stats/summary')
        ]);
        
        const demandsData = demandsRes.data;
        const interestsData = Array.from(interestsRes.data); 
        const statsData = statsRes.data;

        setDemands(demandsData);
        setRaisedHands(new Set(interestsData));
        setSummaryStats(statsData);

        localStorage.setItem('cachedDemands', JSON.stringify(demandsData));
        localStorage.setItem('cachedInterests', JSON.stringify(interestsData));
        localStorage.setItem('cachedStats', JSON.stringify(statsData));

      } catch (error) {
        console.error("Failed to fetch broker data:", error);
      } finally {
        if (!localStorage.getItem('cachedDemands')) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user]);
  
  useEffect(() => {
    if (socket) {
      const handleNewDemand = (newDemand) => {
        if (newDemand.diamond_details) {
            delete newDemand.diamond_details.private_name;
        }
        setDemands(prevDemands => {
          const newDemands = [newDemand, ...prevDemands];
          localStorage.setItem('cachedDemands', JSON.stringify(newDemands));
          return newDemands;
        });
      };
      socket.on('new-demand', handleNewDemand);
      return () => {
        socket.off('new-demand', handleNewDemand);
      };
    }
  }, [socket]);

  // --- FIXED HANDLER ---
  const handleRaiseHand = async (e, demandId) => {
    e.stopPropagation();
    if (raisedHands.has(demandId)) return;
    
    try {
        // Updated to use the new 'raise-hand' endpoint
        await apiClient.post(`/api/demands/${demandId}/raise-hand`);
        
        setRaisedHands(prev => {
          const newRaisedHands = new Set(prev);
          newRaisedHands.add(demandId);
          localStorage.setItem('cachedInterests', JSON.stringify(Array.from(newRaisedHands)));
          return newRaisedHands;
        });
        
        // Optional: Update interest count locally for immediate feedback
        setDemands(prev => prev.map(d => 
            d.demand_id === demandId 
            ? { ...d, interest_count: (parseInt(d.interest_count) || 0) + 1 } 
            : d
        ));

    } catch (error) {
        alert(error.response?.data?.message || "An error occurred.");
    }
  };
  
  return (
    <Container>
      <AppHeader title="Home" />
      <DashboardSummary stats={summaryStats} />
      <main>
        <SectionTitle>Live Market Demands</SectionTitle>
        <DemandsList>
          {isLoading ? (
            <><SkeletonDemandCard /><SkeletonDemandCard /><SkeletonDemandCard /></>
          ) : (
            demands.map(demand => {
              const hasRaisedHand = raisedHands.has(demand.demand_id);
              const d = demand.diamond_details || {};

              return (
                <DemandCard key={demand.demand_id} onClick={() => navigate(`/broker/demand/${demand.demand_id}`)}>
                  <DemandDetailGrid>
                    <DetailItem>
                      <DetailLabel>Size (ct)</DetailLabel>
                      <DetailValue><PiDiamond /> {d.size || '-'}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Clarity</DetailLabel>
                      <DetailValue>{d.clarity || '-'}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Price/ct</DetailLabel>
                      <DetailValue>₹{d.price_per_caret || '-'}</DetailValue>
                    </DetailItem>
                  </DemandDetailGrid>
                  <CardFooter>
                    <InterestCount><strong>{demand.interest_count || 0}</strong> Brokers Interested</InterestCount>
                    <RaiseHandButton 
                      onClick={(e) => handleRaiseHand(e, demand.demand_id)} 
                      disabled={hasRaisedHand} 
                    >
                      {hasRaisedHand ? <PiCheckCircle size={16} /> : <PiHandWaving size={16} />}
                      {hasRaisedHand ? 'Hand Raised' : 'Raise Hand'}
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