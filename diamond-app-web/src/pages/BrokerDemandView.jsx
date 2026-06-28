import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import { 
    PiChatCircleDots, PiHand, PiCheckCircle, PiXCircle, 
    PiClock, PiSealCheckFill, PiMapPin, PiCube, PiLineSegments, PiPaperPlaneRight
} from 'react-icons/pi';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

// --- Flexbox Layout ---
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: ${props => props.theme.bgPrimary};
  overflow: hidden;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ActionBar = styled.div`
  flex-shrink: 0;
  padding: 1rem 1.5rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  background-color: ${props => props.theme.bgSecondary};
  border-top: 1px solid ${props => props.theme.borderColor};
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
`;

// --- Components ---
const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 24px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 2rem 1.5rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
  border-bottom: 1px solid ${props => props.theme.borderColor};
  text-align: center;
`;

const Title = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: ${props => props.theme.textPrimary};
  margin: 0;
  span { color: ${props => props.theme.accentPrimary}; }
`;

const SpecGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
`;

const SpecItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.8rem;
  background: ${props => props.theme.bgPrimary};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.borderColor};
`;

const SpecLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  color: ${props => props.theme.textSecondary};
  font-weight: 700;
  display: flex; align-items: center; gap: 5px;
`;

const SpecValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;

const TraderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 0 1rem 1rem 1rem;
  background: ${props => props.theme.bgPrimary};
  border-radius: 16px;
  border: 1px solid ${props => props.theme.borderColor};
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: ${props => props.theme.borderColor}; }
`;

const Avatar = styled.img`
  width: 48px; height: 48px; border-radius: 12px; object-fit: cover;
`;

const TraderMeta = styled.div`
  flex: 1;
  h3 { margin: 0; font-size: 1rem; color: ${props => props.theme.textPrimary}; display: flex; align-items: center; gap: 4px; }
  p { margin: 2px 0 0; font-size: 0.8rem; color: ${props => props.theme.textSecondary}; }
`;

// --- Buttons ---
const ActionButton = styled.button`
  width: 100%;
  height: 54px;
  border-radius: 14px;
  border: none;
  font-family: 'Clash Display', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: transform 0.1s;
  &:active { transform: scale(0.98); }
`;

const PrimaryButton = styled(ActionButton)`
  background: ${props => props.theme.accentPrimary};
  color: #fff;
`;

const SecondaryButton = styled(ActionButton)`
  background: transparent;
  border: 1px solid ${props => props.theme.borderColor};
  color: ${props => props.theme.textPrimary};
  &:hover { background: rgba(255,255,255,0.05); }
`;

const SuccessButton = styled(ActionButton)`
  background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; cursor: default;
`;

const DisabledButton = styled(ActionButton)`
  background: ${props => props.theme.borderColor}; color: ${props => props.theme.textSecondary}; cursor: not-allowed;
`;

function BrokerDemandView() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [demand, setDemand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const response = await apiClient.get(`/api/demands/${demandId}`);
        setDemand(response.data);
      } catch (err) {
        toast.error("Failed to load demand.");
      } finally { setIsLoading(false); }
    };
    fetchDemand();
  }, [demandId]);

  const handleRaiseHand = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/api/demands/${demandId}/raise-hand`);
      setDemand(prev => ({ ...prev, isInterested: true }));
      toast.success("Hand raised successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error processing.");
    } finally { setIsProcessing(false); }
  };

  const handleRequestDetails = async () => {
    setIsProcessing(true);
    try {
      const response = await apiClient.post(`/api/demands/${demandId}/request-details`);
      toast.success("Details requested! Check your chats.");
      navigate(`/chat/${response.data.conversation_id}`);
    } catch (err) { 
        console.error(err);
        toast.error("Failed to send request."); 
    } 
    finally { setIsProcessing(false); }
  };

  if (isLoading) return <Loader fullScreen />;
  if (!demand) return <PageContainer><PageHeader title="Not Found" backTo="/buy-feed" /></PageContainer>;

  const details = demand.diamond_details || {};
  const trader = demand.traderProfile || {};
  const isHired = demand.hired_broker_id === user?.user_id;
  const isTaken = demand.hired_broker_id && !isHired;

  // Profile Image Fallback
  const profileImg = trader.profile_photo_url 
    ? `${import.meta.env.VITE_API_URL.replace('/api','')}${trader.profile_photo_url}`
    : `https://ui-avatars.com/api/?name=${trader.full_name}&background=0ea5e9&color=fff`;

  return (
    <PageContainer>
      <Toaster position="bottom-center" />
      <div style={{ flexShrink: 0 }}>
        <PageHeader title="Demand Details" backTo="/buy-feed" />
      </div>
      
      <ScrollableContent>
        <DemandCard>
          <CardHeader>
            <Title><span>{details.size}ct</span> {details.shape}</Title>
            <div style={{marginTop: '8px', opacity: 0.6, fontSize: '0.85rem'}}>ID: #{demand.demand_id}</div>
          </CardHeader>
          
          <SpecGrid>
            <SpecItem>
              <SpecLabel><PiLineSegments /> Color</SpecLabel>
              <SpecValue>{details.color}</SpecValue>
            </SpecItem>
            <SpecItem>
              <SpecLabel><PiCube /> Clarity</SpecLabel>
              <SpecValue>{details.clarity}</SpecValue>
            </SpecItem>
            <SpecItem>
              <SpecLabel>₹ Target/ct</SpecLabel>
              <SpecValue>₹{details.price_per_caret?.toLocaleString()}</SpecValue>
            </SpecItem>
            <SpecItem>
              <SpecLabel>📦 Qty</SpecLabel>
              <SpecValue>{details.quantity} Pcs</SpecValue>
            </SpecItem>
          </SpecGrid>

          <TraderSection onClick={() => navigate(`/profile/${trader.user_id}`)}>
            <Avatar src={profileImg} alt="Trader" />
            <TraderMeta>
              <h3>{trader.full_name} <PiSealCheckFill color="#0ea5e9" size={14} /></h3>
              <p><PiMapPin size={12}/> {trader.office_name}</p>
            </TraderMeta>
            <PiChatCircleDots size={24} color="#0ea5e9" />
          </TraderSection>

          <div style={{padding: '0 1.5rem 1.5rem 1.5rem'}}>
            <div style={{background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', color: '#666', lineHeight: 1.5}}>
              <strong>Note:</strong> {details.note || "No notes provided."}
            </div>
          </div>
        </DemandCard>
      </ScrollableContent>

      <ActionBar>
        {isHired ? (
          <SuccessButton><PiCheckCircle size={22} /> You are Hired</SuccessButton>
        ) : isTaken ? (
          <DisabledButton><PiXCircle size={22} /> Deal Closed (Taken)</DisabledButton>
        ) : demand.isInterested ? (
          <>
            <DisabledButton><PiClock size={22} /> Hand Raised (Waiting)</DisabledButton>
            {/* 🛑 RENAMED BUTTON */}
            <SecondaryButton onClick={handleRequestDetails} disabled={isProcessing}>
               <PiPaperPlaneRight size={20} /> Request More Details
            </SecondaryButton>
          </>
        ) : (
          <PrimaryButton onClick={handleRaiseHand} disabled={isProcessing}>
            <PiHand size={22} /> Raise Hand
          </PrimaryButton>
        )}
      </ActionBar>
    </PageContainer>
  );
}

export default BrokerDemandView;