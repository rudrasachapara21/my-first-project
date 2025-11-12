import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { PiChatCircleDots, PiHand, PiCheckCircle, PiXCircle } from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';

// --- Styles ---
const Container = styled.div`
  padding-bottom: 2rem;
`;
const Content = styled.div`
  padding: 0 1.5rem;
`;
const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  margin-top: 1.5rem;
`;
const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.borderColor};
`;
const Title = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
`;
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  padding: 1.5rem;
`;
const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
const DetailLabel = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const DetailValue = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;

// ## --- THIS IS THE FIX (Part 1) --- ##
// Added cursor: pointer and a hover effect
const TraderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.borderColor};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.bgPrimary};
  }
`;
// ## --- END OF FIX --- ##

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
`;
const TraderDetails = styled.div`
  flex-grow: 1;
`;
const TraderName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;
const TraderOffice = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
`;
const ActionButton = styled.button`
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 12px;
  font-family: 'Clash Display', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  
  background-color: ${props => props.$primary ? props.theme.accentPrimary : props.theme.bgPrimary};
  color: ${props => props.$primary ? 'white' : props.theme.textPrimary};
  border: 1px solid ${props => props.$primary ? props.theme.accentPrimary : props.theme.borderColor};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.borderColor};
`;
const InterestButton = styled(ActionButton)`
  background-color: ${props => props.$active ? props.theme.accentDangerLight : props.theme.accentPrimary};
  color: ${props => props.$active ? props.theme.accentDanger : 'white'};
  border-color: ${props => props.$active ? props.theme.accentDanger : props.theme.accentPrimary};
`;
// --- (End of Styles) ---


// ## --- AVATAR HELPER FUNCTION --- ##
const getAvatarUrl = (photoUrl, name) => {
  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  if (!photoUrl) {
    return `https://ui-avatars.com/api/?name=${name ? name.replace(' ', '+') : 'User'}&background=random`;
  }
  if (photoUrl.startsWith('http')) {
    // It's a Cloudinary URL, use it directly
    return photoUrl;
  }
  // It's an old /uploads/ file, add the API root
  return `${API_ROOT_URL}${photoUrl}`;
};


function BrokerDemandView() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [demand, setDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInterested, setIsInterested] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDemand = async () => {
      if (!demandId) return;
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/api/demands/${demandId}`);
        setDemand(response.data);
        setIsInterested(response.data.isInterested);
      } catch (err) {
        console.error("Failed to fetch demand details", err);
        setError("Failed to load demand.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDemand();
  }, [demandId]);

  const handleToggleInterest = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/api/demands/${demandId}/interest`);
      setIsInterested(!isInterested);
    } catch (err) {
      alert("Failed to update interest. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRequestDetails = async () => {
    setIsProcessing(true);
    try {
      const response = await apiClient.post(`/api/demands/${demandId}/request-details`);
      alert(response.data.message || "Details have been sent to your chat.");
      navigate('/chats');
    } catch (err) {
      alert(error.response?.data?.message || "Failed to request details.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleStartChat = async (traderId, traderName) => {
    try {
      const response = await apiClient.post(`/api/conversations`, { recipientId: traderId });
      navigate(`/chat/${response.data.conversation_id}`, { state: { partnerName: traderName } });
    } catch (error) {
      alert(error.response?.data?.message || "Could not start conversation.");
    }
  };

  if (isLoading) return <p>Loading demand...</p>;
  if (error) return <p>{error}</p>;
  if (!demand) return <p>Demand not found.</p>;

  const d = demand.diamond_details;
  const t = demand.traderProfile;
  const isHired = demand.hired_broker_id === user.id;

  const avatarUrl = getAvatarUrl(t.profile_photo_url, t.full_name);
  
  return (
    <Container>
      <PageHeader title="Demand Details" backTo="/broker-home" />
      <Content>
        <DemandCard>
          <CardHeader>
            <Title>Demand for {d.size}ct {d.clarity} Diamond</Title>
          </CardHeader>
          <DetailGrid>
            <DetailItem>
              <DetailLabel>Carat:</DetailLabel>
              <DetailValue>{d.size}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Clarity:</DetailLabel>
              <DetailValue>{d.clarity}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Price/ct:</DetailLabel>
              <DetailValue>${d.price_per_caret}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Quantity:</DetailLabel>
              <DetailValue>{d.quantity}</DetailValue>
            </DetailItem>
          </DetailGrid>
          
          {/* ## --- THIS IS THE FIX (Part 2) --- ## */}
          {/* Added the onClick handler to navigate to the trader's profile */}
          <TraderInfo onClick={() => navigate(`/profile/${t.user_id}`)}>
            <Avatar src={avatarUrl} alt={t.full_name} />
            <TraderDetails>
              <TraderName>{t.full_name}</TraderName>
              <TraderOffice>{t.office_name}</TraderOffice>
            </TraderDetails>
          </TraderInfo>
          {/* ## --- END OF FIX --- ## */}

          <ButtonGroup>
            {isHired ? (
              <>
                <ActionButton $primary disabled>
                  <PiCheckCircle /> You are Hired
                </ActionButton>
                <ActionButton onClick={() => handleStartChat(t.user_id, t.full_name)}>
                  <PiChatCircleDots /> Message Trader
                </ActionButton>
              </>
            ) : demand.hired_broker_id ? (
              <ActionButton disabled>
                <PiXCircle /> Deal in Progress
              </ActionButton>
            ) : (
              <>
                <InterestButton 
                  $active={isInterested} 
                  onClick={handleToggleInterest} 
                  disabled={isProcessing}
                >
                  <PiHand /> {isInterested ? 'Withdraw Interest' : 'Show Interest'}
                </InterestButton>
                <ActionButton 
                  onClick={handleRequestDetails} 
                  disabled={isProcessing}
                >
                  Request More Details
                </ActionButton>
              </>
            )}
          </ButtonGroup>
        </DemandCard>
      </Content>
    </Container>
  );
}

export default BrokerDemandView;