import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { PiPackage, PiUsers } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';

// --- Styled Component Definitions (Previously Missing) ---
const Container = styled.div``;
const TabNav = styled.div`
  display: flex; background-color: ${props => props.theme.borderColor};
  border-radius: 12px; padding: 5px; margin: 0 1.5rem 2rem 1.5rem;
`;
const TabButton = styled.button`
  flex: 1; padding: 0.75rem; border: none; font-size: 1rem; font-weight: 500;
  border-radius: 8px; cursor: pointer; transition: all 0.3s ease;
  font-family: 'Clash Display', sans-serif;
  color: ${props => props.$active ? '#FFFFFF' : props.theme.textSecondary};
  background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
`;
const TabContent = styled.div`padding: 0 1.5rem;`;
const InputField = styled.input`
  width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary};
  border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px;
  color: ${props => props.theme.textPrimary}; font-size: 1rem;
  box-sizing: border-box; margin-bottom: 1.5rem;
  &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; }
`;
const CtaButton = styled.button`
  width: 100%; padding: 1rem; border: none; border-radius: 12px;
  background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary};
  font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer;
  &:disabled { background-color: #ccc; cursor: not-allowed; }
`;
const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
  &:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
`;
const DemandTitle = styled.div`font-size: 1.2rem; font-weight: 500; margin-bottom: 0.5rem;`;
const DemandFooter = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.9rem; color: ${props => props.theme.textSecondary};
`;
const InterestIndicator = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  color: ${props => props.theme.accentPrimary}; font-weight: 600;
`;
const SuccessMessage = styled.p`
  color: #22c55e; text-align: center; font-weight: 500; margin-top: 1rem;
`;
const ErrorMessage = styled.p`
  color: #ef4444; text-align: center; font-weight: 500; margin-top: 1rem;
`;

// --- React Component Logic (Now Correct) ---
function PostDemand() {
  const [activeTab, setActiveTab] = useState('create');
  const navigate = useNavigate();
  const [isTrader, setIsTrader] = useState(false);
  const [myDemands, setMyDemands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMyDemands = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { setIsLoading(false); return; }
    try {
      const response = await axios.get('http://localhost:5001/api/demands/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyDemands(response.data);
    } catch (err) {
      console.error("Failed to fetch my demands", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let user = null;
    try {
      const userString = localStorage.getItem('user');
      if (userString) { user = JSON.parse(userString); }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      navigate('/'); 
      return;
    }
    
    const token = localStorage.getItem('token');

    if (!token || !user) { navigate('/'); return; }
    if (user.role !== 'trader') { navigate('/broker-home'); return; }
    
    setIsTrader(true);

    if (activeTab === 'myDemands') {
      fetchMyDemands();
    }
  }, [activeTab, navigate, fetchMyDemands]);

  const handlePostDemand = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    
    const detailsParts = details.split(',').map(part => part.trim());
    const demandObject = {
        carat: detailsParts[0] || '',
        clarity: detailsParts[1] || '',
        shape: detailsParts[2] || '',
        full_details: details,
    };

    try {
      await axios.post('http://localhost:5001/api/demands', 
        { details: demandObject },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Demand posted successfully!');
      setDetails('');
    } catch (err) {
      const message = err.response?.data?.message || "Failed to post demand.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTrader) {
    return null;
  }
  
  return (
    <Container>
      <PageHeader title="Post a Demand" />
      <TabNav>
        <TabButton $active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
          Create Demand
        </TabButton>
        <TabButton $active={activeTab === 'myDemands'} onClick={() => setActiveTab('myDemands')}>
          My Demands
        </TabButton>
      </TabNav>
      <TabContent>
        {activeTab === 'create' && (
          <form onSubmit={handlePostDemand}>
            <InputField 
                placeholder="Details (e.g., 1.5, VVS1, Round)" 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
            />
            <CtaButton type="submit" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post to Market'}
            </CtaButton>
            {success && <SuccessMessage>{success}</SuccessMessage>}
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </form>
        )}
        {activeTab === 'myDemands' && (
          isLoading ? (
            <><SkeletonDemandCard /><SkeletonDemandCard /></>
          ) : myDemands.length > 0 ? (
            myDemands.map(demand => {
              const demandTitle = typeof demand.diamond_details === 'object' && demand.diamond_details !== null
                ? `${demand.diamond_details.carat || ''}ct, ${demand.diamond_details.clarity || ''}, ${demand.diamond_details.shape || ''}`
                : demand.diamond_details;
              return (
                <DemandCard 
                    key={demand.demand_id} 
                    onClick={() => navigate(`/demands/${demand.demand_id}`)}
                >
                  <DemandTitle>{demandTitle}</DemandTitle>
                  <DemandFooter>
                    <span>Status: {demand.status}</span>
                    <InterestIndicator>
                        <PiUsers />
                        <span>{demand.interest_count || 0} Interested</span>
                    </InterestIndicator>
                  </DemandFooter>
                </DemandCard>
              );
            })
          ) : (
            <EmptyState 
              icon={PiPackage}
              title="You Have No Demands"
              message="Use the 'Create Demand' tab to post a new requirement to the market."
            />
          )
        )}
      </TabContent>
    </Container>
  );
}

export default PostDemand;