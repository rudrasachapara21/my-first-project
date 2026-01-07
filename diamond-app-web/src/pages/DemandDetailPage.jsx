import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { 
  PiCrownSimple, PiUserPlus, PiXCircle,
  PiStar, PiStarFill, PiCheckCircle, PiArrowUUpLeft 
} from 'react-icons/pi';

// --- (Helpers) ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

const getAvatarUrl = (photoUrl, name) => {
  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  if (!photoUrl) return `https://ui-avatars.com/api/?name=${name ? name.replace(' ', '+') : 'User'}&background=random`;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_ROOT_URL}${photoUrl}`;
};

// --- (Styles) ---
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
const Actions = styled.div` display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;`;

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;
const DestructiveButton = styled(ActionButton)`
  background-color: transparent;
  color: ${props => props.theme.accentDanger || '#ef4444'};
  border: 1px solid ${props => props.theme.accentDanger || '#ef4444'};
`;
const CompleteButton = styled(ActionButton)`
  background-color: #D1FAE5;
  color: #065F46;
  border-color: #6EE7B7;
`;
const ReturnButton = styled(ActionButton)`
  background-color: #FEF3C7;
  color: #92400E;
  border-color: #F59E0B;
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
const BrokerInfo = styled.div` flex-grow: 1; `;
const BrokerName = styled.h3` margin: 0 0 0.25rem 0; font-size: 1.1rem; color: ${props => props.theme.textPrimary}; `;
const BrokerMeta = styled.p` margin: 0; font-size: 0.9rem; color: ${props => props.theme.textSecondary}; `;
const BrokerActions = styled.div` display: flex; gap: 1rem; width: 100%; `;
const BrokerStatus = styled.p` margin: 0; font-size: 0.9rem; color: ${props => props.theme.textSecondary}; `;
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
const DismissButton = styled(BrokerButton)`
  background-color: ${props => props.theme.bgPrimary};
  color: #ef4444;
  border-color: #fca5a5;
`;

// --- Modal Styles ---
const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;
`;
const ModalContent = styled.div`
  background: ${props => props.theme.bgSecondary};
  padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px;
`;
const ModalTitle = styled.h2` margin-top: 0; font-family: 'Clash Display', sans-serif; text-align: center;`;
const ModalInput = styled.input`
  width: 100%; padding: 0.8rem; margin: 0.5rem 0;
  border: 1px solid ${props => props.theme.borderColor}; border-radius: 8px;
  background: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary};
`;
const ModalTextArea = styled.textarea`
  width: 100%; min-height: 80px; padding: 0.8rem; margin: 0.5rem 0;
  border: 1px solid ${props => props.theme.borderColor}; border-radius: 8px;
  background: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; resize: vertical;
`;
const ModalActions = styled.div` display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; `;
const ModalButton = styled.button`
  padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;
  border: 1px solid ${props => props.$primary ? 'transparent' : props.theme.borderColor};
  background: ${props => props.$primary ? props.theme.accentPrimary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.textPrimary};
`;


function DemandDetailsPage() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [finalWeight, setFinalWeight] = useState('');
  const [brokerReview, setBrokerReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => { if (user) fetchDemandDetails(); }, [user, fetchDemandDetails]);

  // --- Handlers ---

  const handleHireBroker = async (brokerId) => {
    if (!window.confirm("Are you sure you want to hire this broker? The item will be marked 'On Memo'.")) return;
    try {
      // Use new 'hire' endpoint (Memo logic)
      await apiClient.post(`/api/demands/hire`, { demandId, brokerId });
      alert("Broker Hired! Demand is now 'On Memo'.");
      fetchDemandDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to hire broker.');
    }
  };

  const handleReturnItem = async () => {
    if (!window.confirm("Is the item returned? This will un-hire the broker and make the demand active again.")) return;
    try {
      await apiClient.put(`/api/demands/${demandId}/return`);
      alert("Item returned. Demand is active again.");
      fetchDemandDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to return item.');
    }
  };

  const handleCompleteSubmit = async () => {
    if (!finalPrice || !finalWeight) {
      alert("Please enter the Final Price and Weight.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.put(`/api/demands/${demandId}/complete`, {
        final_price: finalPrice,
        final_weight: finalWeight,
        broker_review: brokerReview
      });
      alert("Deal Closed! Details saved to your Statement.");
      setCompleteModalOpen(false);
      fetchDemandDetails();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to complete deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this demand?')) {
      try {
        await apiClient.delete(`/api/demands/${demandId}`);
        navigate('/my-demands');
      } catch (error) {
        alert("Could not delete demand.");
      }
    }
  };

  if (isLoading || !demand || !user) return (
    <Container>
      <PageHeader title="Loading..." backTo={-1} />
      <Content><SkeletonDemandCard /></Content>
    </Container>
  );

  const d = demand.diamond_details || {};
  const isCompleted = demand.status === 'completed';
  const isOnMemo = demand.status === 'on_memo';
  const hiredBrokerId = demand.hired_broker_id;

  return (
    <>
      <Container>
        <PageHeader title="Manage Demand" backTo={-1} />
        <Content>
          <DemandDetailCard>
            <DemandTitle>{d.size || '0'}ct {d.shape} {d.clarity}</DemandTitle>
            <DemandInfo>Status: <b style={{ textTransform: 'uppercase', color: isOnMemo ? '#d97706' : isCompleted ? 'green' : 'inherit' }}>{demand.status.replace('_', ' ')}</b></DemandInfo>
            
            <Actions>
              {!isCompleted && !isOnMemo && (
                <DestructiveButton onClick={handleDelete}>Delete Demand</DestructiveButton>
              )}
              
              {isOnMemo && (
                <>
                  <CompleteButton onClick={() => setCompleteModalOpen(true)}>
                    <PiCrownSimple size={20} /> Mark Deal Complete
                  </CompleteButton>
                  <ReturnButton onClick={handleReturnItem}>
                    <PiArrowUUpLeft size={20} /> Return / Un-Hire
                  </ReturnButton>
                </>
              )}
            </Actions>
          </DemandDetailCard>

          <SectionTitle>Interested Brokers</SectionTitle>

          <BrokerList>
            {demand.interested_brokers?.length > 0 ? demand.interested_brokers.map(broker => {
              const isHired = hiredBrokerId === broker.user_id;
              const avatarUrl = getAvatarUrl(broker.profile_photo_url, broker.full_name);
              
              return (
                <BrokerCard key={broker.user_id}>
                  <BrokerTopRow onClick={() => navigate(`/profile/${broker.user_id}`)}>
                    <Avatar src={avatarUrl} alt={broker.full_name} />
                    <BrokerInfo>
                      <BrokerName>{broker.full_name}</BrokerName>
                      <BrokerMeta>{broker.office_name || 'No Office Info'}</BrokerMeta>
                    </BrokerInfo>
                  </BrokerTopRow>
                  
                  <BrokerActions>
                    {isHired ? (
                      <BrokerStatus style={{ color: isCompleted ? 'green' : '#d97706', fontWeight: 'bold' }}>
                        {isCompleted ? '✅ Deal Closed with this Broker' : '⚠️ Hired (On Memo)'}
                      </BrokerStatus>
                    ) : hiredBrokerId ? (
                      <BrokerStatus>Another broker is currently hired.</BrokerStatus>
                    ) : (
                      <>
                        <DismissButton onClick={() => {/* Add dismiss logic if needed */}}>Dismiss</DismissButton>
                        <BrokerButton $primary onClick={() => handleHireBroker(broker.user_id)}>
                          <PiUserPlus /> Hire (Give on Memo)
                        </BrokerButton>
                      </>
                    )}
                  </BrokerActions>
                </BrokerCard>
              );
            }) : <p style={{ color: '#666' }}>No brokers have raised their hand yet.</p>}
          </BrokerList>
        </Content>
      </Container>

      {/* --- POPUP FORM FOR COMPLETION --- */}
      {isCompleteModalOpen && (
        <ModalBackdrop>
          <ModalContent>
            <ModalTitle>Finalize Deal Details</ModalTitle>
            <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>
              Please enter the final details for your statement.
            </p>
            
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Final Price (Total ₹)</label>
            <ModalInput 
              type="number" 
              placeholder="e.g. 500000" 
              value={finalPrice} 
              onChange={e => setFinalPrice(e.target.value)} 
            />

            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Final Weight (Carat)</label>
            <ModalInput 
              type="number" 
              placeholder="e.g. 1.02" 
              value={finalWeight} 
              onChange={e => setFinalWeight(e.target.value)} 
            />

            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Review for Broker (Optional)</label>
            <ModalTextArea 
              placeholder="How was their service?" 
              value={brokerReview} 
              onChange={e => setBrokerReview(e.target.value)} 
            />

            <ModalActions>
              <ModalButton onClick={() => setCompleteModalOpen(false)}>Cancel</ModalButton>
              <ModalButton $primary onClick={handleCompleteSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Confirm & Close Deal'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalBackdrop>
      )}
    </>
  );
}

export default DemandDetailsPage;