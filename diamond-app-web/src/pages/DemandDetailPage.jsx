import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { PiCrownSimple, PiUserPlus, PiXCircle } from 'react-icons/pi';

// A small utility function to format dates clearly
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

const Container = styled.div` padding-bottom: 2rem; `;
const Content = styled.div` padding: 0 1.5rem; `;
const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.borderColor};
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.textPrimary};
  margin-top: 2.5rem;
`;
const DemandDetailCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;
const DemandTitle = styled.h3` font-size: 1.4rem; font-weight: 600; margin: 0 0 0.5rem 0; `;
const DemandInfo = styled.p` margin: 0.25rem 0; color: ${props => props.theme.textSecondary}; `;
const Actions = styled.div` display: flex; gap: 1rem; margin-top: 1.5rem; `;
const ActionButton = styled.button`
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 12px;
  font-family: 'Clash Display', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border: 1px solid ${props => props.theme.borderColor};
`;
const DestructiveButton = styled(ActionButton)`
  background-color: transparent;
  color: ${props => props.theme.accentDanger || '#ef4444'};
  border: 1px solid ${props => props.theme.accentDanger || '#ef4444'};
  
  &:hover {
    background-color: ${props => props.theme.accentDangerLight || '#fee2e2'};
  }
`;
const BrokerList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const BrokerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: ${props => props.theme.bgSecondary};
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.borderColor};
`;
const BrokerTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  width: 100%;
`;
const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;
const BrokerInfo = styled.div`
  flex-grow: 1;
`;
const BrokerName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: ${props => props.theme.textPrimary};
`;
const BrokerMeta = styled.p` 
  margin: 0; 
  font-size: 0.9rem; 
  color: ${props => props.theme.textSecondary};
`;
const BrokerActions = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;
const BrokerStatus = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  white-space: normal;
`;
const BrokerButton = styled.button`
  flex: 1;
  background-color: ${props => props.$primary ? '#4f46e5' : props.theme.bgPrimary};
  color: ${props => props.$primary ? 'white' : props.theme.textPrimary};
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid ${props => props.$primary ? '#4f46e5' : props.theme.borderColor};
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;
const CompleteButton = styled(ActionButton)`
  background-color: #D1FAE5;
  color: #065F46;
  border-color: #6EE7B7;
`;
const DismissButton = styled(BrokerButton)`
  background-color: ${props => props.theme.bgPrimary};
  color: #ef4444;
  border-color: #fca5a5;
`;

function DemandDetailsPage() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

  const fetchDemandDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/demands/${demandId}`);
      setDemand(response.data);
    } catch (error) {
      console.error("Failed to fetch demand details:", error);
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  }, [demandId, navigate]);

  useEffect(() => { if (user) { fetchDemandDetails(); } }, [user, fetchDemandDetails]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this demand?')) {
      try {
        await apiClient.delete(`/api/demands/${demandId}`);
        alert('Demand deleted successfully.');
        navigate('/my-demands');
      } catch (error) {
        alert(error.response?.data?.message || "Could not delete demand.");
      }
    }
  };
  
  const handleHireBroker = async (brokerId) => { if (!window.confirm("Are you sure you want to hire this broker for this demand?")) return; try { await apiClient.post(`/api/demands/${demandId}/hire/${brokerId}`); fetchDemandDetails(); } catch (error) { alert(error.response?.data?.message || 'Failed to hire broker.'); } };
  const handleDismissBroker = async (brokerId) => { if (window.confirm("Are you sure you want to dismiss this broker's interest? They will be removed from this list.")) { try { await apiClient.delete(`/api/demands/${demandId}/interest/${brokerId}`); setDemand(prevDemand => ({ ...prevDemand, interested_brokers: prevDemand.interested_brokers.filter(b => b.user_id !== brokerId) })); } catch (error) { console.error("Failed to dismiss broker interest:", error); alert(error.response?.data?.message || 'Failed to dismiss broker interest.'); } } };

  // --- CHANGE 1: Updated the "Complete Demand" logic ---
  const handleCompleteDemand = async () => {
    // New confirmation message reflecting the delete action
    if (window.confirm("Are you sure you want to mark this deal as complete? This will permanently delete the demand.")) {
      try {
        // Changed to call the same delete endpoint as handleDelete
        await apiClient.delete(`/api/demands/${demandId}`);
        alert('Demand completed and removed successfully!');
        // Redirect to the demands list page
        navigate('/my-demands');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to complete and remove the demand.');
      }
    }
  };

  if (isLoading || !demand || !user) { return ( <Container> <PageHeader title="Loading Demand..." backTo="/my-demands" /> <Content><SkeletonDemandCard /></Content> </Container> ); }
  if (user.role !== 'trader' || String(demand.trader_id) !== String(user.id)) { return ( <Container> <PageHeader title="Unauthorized" backTo="/my-demands" /> <Content><p>You do not have permission to view this demand's details.</p></Content> </Container> ); }

  const d = demand.diamond_details || {};
  const primaryTitle = `${d.size || 'N/A'}ct, ${d.clarity || 'N/A'} Diamond`;
  const privateName = d.private_name;
  const canBeCompleted = demand.hired_broker_id && demand.status !== 'completed';

  return (
    <Container>
      <PageHeader title="Demand Details" backTo="/my-demands" />
      <Content>
        <DemandDetailCard>
          <DemandTitle>{primaryTitle}</DemandTitle>
          {privateName && <DemandInfo>Private Name: {privateName}</DemandInfo>}
          <DemandInfo>Status: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{demand.status}</span></DemandInfo>
          <DemandInfo>Posted: {formatDate(demand.created_at)}</DemandInfo>
          <Actions>
            {demand.status === 'active' && !demand.hired_broker_id && ( <DestructiveButton onClick={handleDelete}>Delete Demand</DestructiveButton> )}
            {canBeCompleted && ( <CompleteButton onClick={handleCompleteDemand}> <PiCrownSimple /> Mark as Complete </CompleteButton> )}
          </Actions>
        </DemandDetailCard>

        <SectionTitle>Interested Brokers</SectionTitle>

        <BrokerList>
          {demand.interested_brokers?.length > 0 ? demand.interested_brokers.map(broker => {
            const isHired = demand.hired_broker_id === broker.user_id;
            const avatarUrl = broker.profile_photo_url ? `${API_ROOT_URL}${broker.profile_photo_url}` : `https://ui-avatars.com/api/?name=${broker.full_name.replace(' ', '+')}&background=random`;
            return (
              <BrokerCard key={broker.user_id}>
                <BrokerTopRow onClick={() => navigate(`/profile/${broker.user_id}`, { state: { demand: demand } })}>
                  <Avatar src={avatarUrl} alt={broker.full_name} />
                  <BrokerInfo>
                    <BrokerName>{broker.full_name}</BrokerName>
                    <BrokerMeta>Office: {broker.office_name || 'N/A'}</BrokerMeta>
                  </BrokerInfo>
                </BrokerTopRow>
                <BrokerActions>
                  {isHired && (<BrokerStatus>✅ Hired</BrokerStatus>)}
                  {!demand.hired_broker_id && demand.status === 'active' && (
                    <>
                      <DismissButton onClick={() => handleDismissBroker(broker.user_id)}> <PiXCircle /> Dismiss </DismissButton>
                      <BrokerButton $primary onClick={() => handleHireBroker(broker.user_id)}> <PiUserPlus /> Hire </BrokerButton>
                    </>
                  )}
                  {demand.hired_broker_id && !isHired && (<BrokerStatus>Another broker hired</BrokerStatus>)}
                </BrokerActions>
              </BrokerCard>
            )
          }) : <p>No brokers have shown interest yet.</p>}
        </BrokerList>
      </Content>
    </Container>
  );
}
export default DemandDetailsPage;