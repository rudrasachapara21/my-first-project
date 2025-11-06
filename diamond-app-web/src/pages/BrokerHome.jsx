import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { PiHandWaving, PiDiamond } from "react-icons/pi";
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import AppHeader from '../components/AppHeader';
import DashboardSummary from '../components/DashboardSummary';
import { SkeletonDemandCard } from '../components/SkeletonCard';

// ... (All your styled-components are the same, no changes needed) ...
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
  background: ${props => (props.disabled ? props.theme.borderColor : props.theme.accentPrimary)};
  color: ${props => (props.disabled ? props.theme.textSecondary : 'white')};
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

    // --- CACHING FIX: STEP 1 ---
    // Try to load cached data immediately to make the app feel fast
    try {
      const cachedDemands = localStorage.getItem('cachedDemands');
      const cachedInterests = localStorage.getItem('cachedInterests');
      const cachedStats = localStorage.getItem('cachedStats');

      if (cachedDemands && cachedInterests && cachedStats) {
        setDemands(JSON.parse(cachedDemands));
        setRaisedHands(new Set(JSON.parse(cachedInterests)));
        setSummaryStats(JSON.parse(cachedStats));
        setIsLoading(false); // We have data, so we're not "loading"
      } else {
        setIsLoading(true); // No cache, so we ARE loading
      }
    } catch (e) {
      console.error("Failed to load from cache", e);
      setIsLoading(true); // Fail safe, just load normally
    }

    // --- CACHING FIX: STEP 2 ---
    // Always fetch fresh data from the network in the background
    const fetchData = async () => {
      try {
        const [demandsRes, interestsRes, statsRes] = await Promise.all([
            apiClient.get('/api/demands'),
            apiClient.get('/api/demands/my-interests'),
            apiClient.get('/api/stats/summary')
        ]);
        
        // Prepare data for state and cache
        const demandsData = demandsRes.data;
        const interestsData = Array.from(interestsRes.data); // Convert Set to Array for storage
        const statsData = statsRes.data;

        // Update state with fresh data
        setDemands(demandsData);
        setRaisedHands(new Set(interestsData));
        setSummaryStats(statsData);

        // --- CACHING FIX: STEP 3 ---
        // Save the fresh data to the cache for the next visit
        localStorage.setItem('cachedDemands', JSON.stringify(demandsData));
        localStorage.setItem('cachedInterests', JSON.stringify(interestsData));
        localStorage.setItem('cachedStats', JSON.stringify(statsData));

      } catch (error) {
        console.error("Failed to fetch broker data:", error);
      } finally {
        // Only set loading to false if we didn't have cache to begin with
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
          // Also update cache when websocket gets data
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

  const handleRaiseHand = async (e, demandId) => {
    e.stopPropagation();
    if (raisedHands.has(demandId)) return;
    try {
        await apiClient.post(`/api/demands/${demandId}/interest`);
        setRaisedHands(prev => {
          const newRaisedHands = new Set(prev).add(demandId);
          // Also update cache
          localStorage.setItem('cachedInterests', JSON.stringify(Array.from(newRaisedHands)));
          return newRaisedHands;
        });
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
                      <DetailValue>${d.price_per_caret || '-'}</DetailValue>
                    </DetailItem>
                  </DemandDetailGrid>
                  <CardFooter>
                    <InterestCount><strong>{demand.interest_count || 0}</strong> Brokers Interested</InterestCount>
                    <RaiseHandButton onClick={(e) => handleRaiseHand(e, demand.demand_id)} disabled={hasRaisedHand} >
                      <PiHandWaving size={16} />
                      {hasRaisedHand ? 'Interest Shown' : 'Show Interest'}
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