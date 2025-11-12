import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import styled, { keyframes } from 'styled-components';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { 
  PiCrownSimple, PiUserPlus, PiXCircle,
  PiStar, PiStarFill 
} from 'react-icons/pi';

// A small utility function to format dates clearly
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

// --- (All Styles) ---
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

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: ${props => props.theme.bgSecondary};
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
`;
const ModalTitle = styled.h2`
  margin-top: 0;
  font-family: 'Clash Display', sans-serif;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;
const ModalButton = styled.button`
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${props => props.$primary ? 'transparent' : props.theme.borderColor};
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.$primary ? props.theme.accentPrimary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.textPrimary};
`;
const StarRatingContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
`;
const popIn = keyframes`
  0% { transform: scale(0.8); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;
const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: ${props => (props.$filled ? '#f59e0b' : props.theme.borderColor)};
  font-size: 2.5rem;
  transition: all 0.2s;
  animation: ${props => (props.$animated ? popIn : 'none')} 0.3s ease-out;

  &:hover {
    transform: scale(1.1);
    color: #f59e0b;
  }
`;
const ReviewTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  background: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  resize: vertical;
`;
// --- (End of Styles) ---


// ## --- NEW HELPER FUNCTION --- ##
const getAvatarUrl = (photoUrl, name) => {
  // Get the base API URL from Vite's environment variables
  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  
  if (!photoUrl) {
    // No photo? Use ui-avatars
    return `https://ui-avatars.com/api/?name=${name ? name.replace(' ', '+') : 'User'}&background=random`;
  }
  if (photoUrl.startsWith('http')) {
    // It's a Cloudinary URL, use it directly
    return photoUrl;
  }
  // It's an old /uploads/ file, add the API root
  return `${API_ROOT_URL}${photoUrl}`;
};


function DemandDetailsPage() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // (Removed API_ROOT_URL from here)

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hiredBrokerInfo, setHiredBrokerInfo] = useState(null);

  const fetchDemandDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/demands/${demandId}`);
      setDemand(response.data);

      if (response.data.hired_broker_id && response.data.interested_brokers) {
        const broker = response.data.interested_brokers.find(
          b => b.user_id === response.data.hired_broker_id
        );
        if (broker) {
          setHiredBrokerInfo(broker);
        }
      }

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

  const handleCompleteDemand = async () => {
    if (!hiredBrokerInfo) {
      alert("Error: Hired broker information not found.");
      return;
    }
    
    const brokerName = hiredBrokerInfo.full_name || 'the broker';
    const brokerId = hiredBrokerInfo.user_id;

    const confirmMsg = `Are you sure you want to mark this deal with ${brokerName} as complete? This will award 1 reputation point.`;
    
    if (window.confirm(confirmMsg)) {
        try {
            const response = await apiClient.post(
              `/api/demands/${demandId}/complete/${brokerId}`
            );
            alert(response.data.message || 'Deal marked as complete!');
            setReviewModalOpen(true);
            fetchDemandDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to complete the deal.');
        }
    }
  };
  
  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      alert("Please select a star rating.");
      return;
    }
    setReviewSubmitting(true);
    try {
        await apiClient.post('/api/reviews', {
            demand_id: demand.demand_id,
            reviewee_id: hiredBrokerInfo.user_id,
            rating: reviewRating,
            review_text: reviewText
        });
        alert("Review submitted successfully!");
        closeReviewModal(true); // Pass true to navigate
    } catch (error) {
        alert(error.response?.data?.message || "Failed to submit review.");
        setReviewSubmitting(false);
    }
  };

  const closeReviewModal = (didSubmit = false) => {
      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewHoverRating(0);
      setReviewText('');
      
      if (didSubmit) {
        navigate('/my-demands'); 
      }
  };

  if (isLoading || !demand || !user) {
    return (
      <Container>
        <PageHeader title="Loading Demand..." backTo="/my-demands" />
        <Content><SkeletonDemandCard /></Content>
      </Container>
    );
  }
  
  if (user.role !== 'trader' || String(demand.trader_id) !== String(user.id)) {
    return (
      <Container>
        <PageHeader title="Unauthorized" backTo="/my-demands" />
        <Content><p>You do not have permission to view this demand's details.</p></Content>
      </Container>
    );
  }

  const d = demand.diamond_details || {};
  const primaryTitle = `${d.size || 'N/A'}ct, ${d.clarity || 'N/A'} Diamond`;
  const privateName = d.private_name;
  
  const canBeCompleted = demand.hired_broker_id && demand.status !== 'completed';

  return (
    <>
      <Container>
        <PageHeader title="Demand Details" backTo="/my-demands" />
        <Content>
          <DemandDetailCard>
            <DemandTitle>{primaryTitle}</DemandTitle>
            {privateName && <DemandInfo>Private Name: {privateName}</DemandInfo>}
            <DemandInfo>Status: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{demand.status}</span></DemandInfo>
            <DemandInfo>Posted: {formatDate(demand.created_at)}</DemandInfo>
            <Actions>
              {demand.status === 'active' && !demand.hired_broker_id && ( 
                <DestructiveButton onClick={handleDelete}>Delete Demand</DestructiveButton> 
              )}
              {canBeCompleted && ( 
                <CompleteButton onClick={handleCompleteDemand}> 
                  <PiCrownSimple /> Mark as Complete 
                </CompleteButton> 
              )}
            </Actions>
          </DemandDetailCard>

          <SectionTitle>Interested Brokers</SectionTitle>

          <BrokerList>
            {demand.interested_brokers?.length > 0 ? demand.interested_brokers.map(broker => {
              const isHired = demand.hired_broker_id === broker.user_id;
              
              // ## --- THIS IS THE FIX --- ##
              // Use the new helper function to build the avatar URL
              const avatarUrl = getAvatarUrl(broker.profile_photo_url, broker.full_name);
              // ## --- END OF FIX --- ##
              
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
                    {isHired && demand.status === 'completed' && (<BrokerStatus>✅ Deal Completed</BrokerStatus>)}
                    {isHired && demand.status !== 'completed' && (<BrokerStatus>✅ Hired</BrokerStatus>)}
                    
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

      {isReviewModalOpen && (
          <ModalBackdrop>
              <ModalContent>
                  <ModalTitle>Deal Complete!</ModalTitle>
                  <p>Please rate your experience with <strong>{hiredBrokerInfo?.full_name}</strong>.</p>
                  
                  <StarRatingContainer>
                      {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (reviewHoverRating || reviewRating);
                          return (
                              <StarButton
                                  key={star}
                                  $filled={isFilled}
                                  $animated={isFilled && star > reviewRating}
                                  onClick={() => setReviewRating(star)}
                                  onMouseEnter={() => setReviewHoverRating(star)}
                                  onMouseLeave={() => setReviewHoverRating(0)}
                              >
                                  {isFilled ? <PiStarFill /> : <PiStar />}
                              </StarButton>
                          );
                      })}
                  </StarRatingContainer>

                  <ReviewTextArea
                      placeholder="Add an optional review..."
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                  />
                  
                  <ModalActions>
                      <ModalButton onClick={() => closeReviewModal(false)}>Skip for Now</ModalButton>
                      <ModalButton $primary onClick={handleReviewSubmit} disabled={reviewSubmitting || reviewRating === 0}>
                          {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </ModalButton>
                  </ModalActions>
              </ModalContent>
          </ModalBackdrop>
      )}
    </>
  );
}
export default DemandDetailsPage;