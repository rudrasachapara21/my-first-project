import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
// ## CHANGE: Added PiCheckCircle icon ##
import { PiToolbox, PiTimer, PiCheckCircle } from "react-icons/pi";

const Container = styled.div``;

const TabNav = styled.div`
  display: flex;
  background-color: ${props => props.theme.borderColor};
  border-radius: 12px;
  padding: 5px;
  margin: 1.5rem 1.5rem 2rem 1.5rem;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Clash Display', sans-serif;
  color: ${props => props.$active ? '#FFFFFF' : props.theme.textSecondary};
  background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
`;

const TabContent = styled.div`
  padding: 0 1.5rem;
`;

const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
`;

// ## CHANGE: Added CompletedDemandCard, same as in PostDemand.jsx ##
const CompletedDemandCard = styled(DemandCard)`
  opacity: 0.7;
  background-color: ${props => props.theme.bgPrimary};
  cursor: default;
`;

const DemandTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;

const DemandFooter = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  border-top: 1px solid ${props => props.theme.borderColor};
  padding-top: 0.75rem;
  margin-top: 0.75rem;
`;

const FooterText = styled.p`
  margin: 0 0 0.25rem 0;
`;

function Workspace() {
  const [activeTab, setActiveTab] = useState('hired');
  const navigate = useNavigate();
  const [hiredDemands, setHiredDemands] = useState([]);
  const [pendingDemands, setPendingDemands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      setIsLoading(true);
      try {
        const hiredPromise = apiClient.get('/api/demands/workspace/hired');
        const pendingPromise = apiClient.get('/api/demands/workspace/pending');
        
        const [hiredResponse, pendingResponse] = await Promise.all([hiredPromise, pendingPromise]);

        setHiredDemands(hiredResponse.data);
        setPendingDemands(pendingResponse.data);

      } catch (err) {
        console.error("Failed to fetch workspace data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceData();
  }, []);

  // ## CHANGE: Split 'hiredDemands' into active and completed lists ##
  const { activeHired, completedHired } = useMemo(() => {
    const active = [];
    const completed = [];
    for (const demand of hiredDemands) {
      if (demand.status === 'completed') {
        completed.push(demand);
      } else {
        active.push(demand);
      }
    }
    return { activeHired: active, completedHired: completed };
  }, [hiredDemands]);

  // ## CHANGE: This list now renders *active* hired demands ##
  const renderDemandList = (demands, emptyIcon, emptyTitle, emptyMessage) => {
    if (isLoading) {
      return <><SkeletonDemandCard /><SkeletonDemandCard /></>;
    }
    if (demands.length === 0) {
      return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
    }
    return demands.map(demand => {
      const d = demand.diamond_details || {};
      const demandTitle = `Demand for ${d.size || '?'}ct ${d.clarity || ''}`;
      return (
        <DemandCard key={demand.demand_id} onClick={() => navigate(`/broker/demand/${demand.demand_id}`)}>
          <DemandTitle>{demandTitle}</DemandTitle>
          <DemandFooter>
            <FooterText>Trader: {demand.trader_name}</FooterText>
            <FooterText>Status: {demand.status}</FooterText>
          </DemandFooter>
        </DemandCard>
      );
    });
  };

  // ## CHANGE: Added a new render function for *completed* demands ##
  const renderCompletedList = (demands, emptyIcon, emptyTitle, emptyMessage) => {
    if (isLoading) {
      return <><SkeletonDemandCard /><SkeletonDemandCard /></>;
    }
    if (demands.length === 0) {
      return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
    }
    return demands.map(demand => {
      const d = demand.diamond_details || {};
      const demandTitle = `Demand for ${d.size || '?'}ct ${d.clarity || ''}`;
      return (
        <CompletedDemandCard key={demand.demand_id}>
          <DemandTitle>{demandTitle}</DemandTitle>
          <DemandFooter>
            <FooterText>Trader: {demand.trader_name}</FooterText>
            <FooterText>Status: {demand.status}</FooterText>
          </DemandFooter>
        </CompletedDemandCard>
      );
    });
  };

  return (
    <Container>
      <PageHeader title="Broker Workspace" />
      <TabNav>
        {/* ## CHANGE: Updated tabs to include counts ## */}
        <TabButton $active={activeTab === 'hired'} onClick={() => setActiveTab('hired')}>
          Hired ({activeHired.length})
        </TabButton>
        <TabButton $active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
          Pending ({pendingDemands.length})
        </TabButton>
        {/* ## CHANGE: Added 'Completed' tab ## */}
        <TabButton $active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>
          Completed ({completedHired.length})
        </TabButton>
      </TabNav>
      <TabContent>
        {/* ## CHANGE: Updated to show the new lists ## */}
        {activeTab === 'hired' && renderDemandList(
          activeHired,
          PiToolbox,
          "No Hired Demands",
          "When a trader hires you for a demand, it will appear here."
        )}
        {activeTab === 'pending' && renderDemandList(
          pendingDemands,
          PiTimer,
          "No Pending Interests",
          "Demands you've shown interest in will appear here."
        )}
        {/* ## CHANGE: Added new tab content ## */}
        {activeTab === 'completed' && renderCompletedList(
          completedHired,
          PiCheckCircle,
          "No Completed Deals",
          "Deals that you were hired for and have been completed will appear here."
        )}
      </TabContent>
    </Container>
  );
}

export default Workspace;