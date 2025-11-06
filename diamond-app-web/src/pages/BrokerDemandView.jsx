import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { PiHandsClapping, PiXCircle, PiDiamond, PiQuestion } from 'react-icons/pi';

const Container = styled.div` padding-bottom: 2rem; `;
const Content = styled.div` padding: 0 1.5rem; `;
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
`;
const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
`;
const DemandTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: ${props => props.theme.textPrimary};
`;
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
`;
const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${props => props.theme.background};
  padding: 1rem;
  border-radius: 12px;
`;
const DetailIcon = styled.div`
  font-size: 1.5rem;
  color: ${props => props.theme.accentPrimary};
`;
const DetailText = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: ${props => props.theme.textPrimary};
`;
const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const InterestButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  border: none;
  border-radius: 12px;
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  
  background-color: ${props => props.$interested ? props.theme.bgSecondary : props.theme.accentPrimary};
  color: ${props => props.$interested ? '#ef4444' : 'white'};
  border: ${props => props.$interested ? `1px solid #ef4444` : 'none'};

  &:hover {
    opacity: 0.9;
  }
`;
const SecondaryButton = styled(InterestButton)`
  background-color: transparent;
  color: ${props => props.theme.textSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  font-size: 1.1rem;
  padding: 1rem;

  &:hover {
    background-color: ${props => props.theme.bgSecondary};
    border-color: ${props => props.theme.accentPrimary};
    color: ${props => props.theme.accentPrimary};
  }
`;
const TraderProfileCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
`;
const TraderAvatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
`;
const TraderInfo = styled.div``;
const TraderName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;
const TraderOffice = styled.p`
  margin: 0;
  color: ${props => props.theme.textSecondary};
`;

function BrokerDemandView() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const API_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    apiClient.get(`/api/demands/${demandId}`)
      .then(res => setDemand(res.data))
      .catch(err => {
        console.error("Failed to fetch demand details for broker view:", err);
        navigate('/workspace');
      })
      .finally(() => setIsLoading(false));
  }, [demandId, user, navigate]);

  const handleToggleInterest = async () => {
    try {
      await apiClient.post(`/api/demands/${demandId}/interest`);
      setDemand(prev => ({ ...prev, isInterested: !prev.isInterested }));
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleRequestDetails = async () => {
    if (window.confirm("Are you sure you want to request more details from the trader? They will be notified.")) {
      try {
        await apiClient.post(`/api/demands/${demandId}/request-details`);
        alert("The trader has been notified of your request for more details.");
      } catch (error) {
        alert(error.response?.data?.message || "Could not send the request.");
      }
    }
  };

  if (isLoading || !demand) {
    return (
        <Container>
            <PageHeader title="Loading Demand..." backTo="/workspace" />
        </Container>
    );
  }

  const d = demand.diamond_details || {};
  const demandTitle = `Demand for ${d.size || '?'}ct Diamond`;
  const details = [
    { label: 'Carat', value: d.size },
    { label: 'Clarity', value: d.clarity },
    { label: 'Price/ct', value: d.price_per_caret ? `$${d.price_per_caret}`: null },
    { label: 'Quantity', value: d.quantity },
  ].filter(item => item.value);

  const traderAvatarUrl = demand.traderProfile?.profile_photo_url
    ? `${API_URL}${demand.traderProfile.profile_photo_url}`
    : `https://ui-avatars.com/api/?name=${demand.traderProfile?.full_name.replace(' ', '+') || 'Trader'}&background=random`;

  return (
    <Container>
      <PageHeader title="Demand Details" backTo="/buy-feed" />
      <Content>
        <Wrapper>
          <DemandCard>
            <DemandTitle>{demandTitle}</DemandTitle>
            <DetailGrid>
              {details.map(item => (
                <DetailItem key={item.label}>
                  <DetailIcon><PiDiamond /></DetailIcon>
                  <DetailText>{item.label}: <strong>{item.value}</strong></DetailText>
                </DetailItem>
              ))}
            </DetailGrid>
          </DemandCard>

          {demand.traderProfile && (
            <TraderProfileCard onClick={() => navigate(`/profile/${demand.traderProfile.user_id}`)}>
              <TraderAvatar src={traderAvatarUrl} alt={demand.traderProfile.full_name} />
              <TraderInfo>
                  <TraderName>{demand.traderProfile.full_name}</TraderName>
                  <TraderOffice>{demand.traderProfile.office_name}</TraderOffice>
              </TraderInfo>
            </TraderProfileCard>
          )}

          <ActionButtonsContainer>
            <InterestButton $interested={demand.isInterested} onClick={handleToggleInterest}>
              {demand.isInterested ? <><PiXCircle /> Withdraw Interest</> : <><PiHandsClapping /> Show Interest</>}
            </InterestButton>
            <SecondaryButton onClick={handleRequestDetails}>
              <PiQuestion /> Request More Details
            </SecondaryButton>
          </ActionButtonsContainer>
        </Wrapper>
      </Content>
    </Container>
  );
}

export default BrokerDemandView;