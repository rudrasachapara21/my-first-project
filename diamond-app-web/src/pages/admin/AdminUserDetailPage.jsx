import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import apiClient from '../../api/axiosConfig';
import PageHeader from '../../components/PageHeader';
import InlineLoader from '../../components/InlineLoader';
import { PiMedal, PiStar, PiUsers, PiDiamond, PiWarningCircle, PiShield, PiEnvelope } from 'react-icons/pi';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// --- Styles ---
const Container = styled.div`
  font-family: 'Inter', sans-serif;
`;

const ProfileHeader = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ProfileTop = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap; 
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid ${props => props.theme.accentPrimary};
`;

const ProfileInfo = styled.div`
  flex-grow: 1;
`;

const Name = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: ${props => props.theme.textPrimary};
`;

const Office = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.textSecondary};
  margin: 0;
`;

const RoleBadge = styled.span`
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: capitalize;
  background-color: ${props => props.role === 'trader' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
  color: ${props => props.role === 'trader' ? '#0ea5e9' : '#10b981'};
  border: 1px solid ${props => props.role === 'trader' ? 'rgba(14, 165, 233, 0.4)' : 'rgba(16, 185, 129, 0.4)'};
`;

const AdminActions = styled.div`
  flex-basis: 100%; 
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Clash Display', sans-serif;
  
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border: 2px solid ${props => props.theme.borderColor};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SuspendButton = styled(ActionButton)`
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #991b1b;
  border-color: #ef4444;
  
  &:hover {
    background: linear-gradient(135deg, #fecaca, #fee2e2);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
`;

const UnsuspendButton = styled(ActionButton)`
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
  border-color: #10b981;
  
  &:hover {
    background: linear-gradient(135deg, #a7f3d0, #d1fae5);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const WarningButton = styled(ActionButton)`
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #78350f;
  border-color: #f59e0b;
  
  &:hover {
    background: linear-gradient(135deg, #fde68a, #fef3c7);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const StatIcon = styled.div`
  font-size: 1.8rem;
  color: ${props => props.color || props.theme.accentPrimary};
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
`;

const ProfileDetailsGrid = styled.div`
  border-top: 1px solid ${props => props.theme.borderColor};
  padding-top: 2rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const DetailItem = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.borderColor};
  padding: 0.75rem 1rem;
  border-radius: 8px;
`;

const DetailLabel = styled.span`
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 0.25rem;
  text-transform: uppercase;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  color: ${props => props.theme.textPrimary};
  word-wrap: break-word;
`;

const ActivitySection = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
`;

const TabBar = styled.div`
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid ${props => props.theme.borderColor};
  padding: 0.5rem 1.5rem;
  background: ${props => props.theme.bgAlt};
  border-radius: 16px 16px 0 0;
`;

const TabButton = styled.button`
  padding: 0.8rem 1rem;
  margin: 0.5rem;
  border: none;
  background: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${props => props.$active ? props.theme.accentPrimary : props.theme.textSecondary};
  border-bottom: 3px solid ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: ${props => props.$active ? props.theme.accentPrimary : props.theme.textPrimary};
  }
`;

const TabContent = styled.div`
  padding: 1.5rem;
`;

const EmptyState = styled.p`
  color: ${props => props.theme.textSecondary};
  text-align: center;
  padding: 2rem;
`;

const ItemCard = styled.div`
  border: 1px solid ${props => props.theme.borderColor};
  background: ${props => props.theme.background};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
`;

const CardTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;

const CardDetail = styled.p`
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  
  strong {
    color: ${props => props.theme.textPrimary};
    font-weight: 500;
  }
`;

const DetailsList = styled.ul`
  list-style: none;
  padding: 0.5rem 0 0 0;
  margin: 0.5rem 0 0 0;
  border-top: 1px solid ${props => props.theme.borderColor};
`;

const DetailListItem = styled.li`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  padding: 0.25rem 0;
  text-transform: capitalize;

  strong {
    color: ${props => props.theme.textPrimary};
    font-weight: 500;
    min-width: 120px;
    display: inline-block;
  }
`;

// Warning Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 20px;
  padding: 2.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: ${fadeIn} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const ModalTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  color: ${props => props.theme.textPrimary};
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ModalDescription = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0 0 2rem 0;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background: ${props => props.theme.bgPrimary};
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  color: ${props => props.theme.textPrimary};
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentPrimary};
    box-shadow: 0 0 0 4px ${props => props.theme.accentPrimary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
    opacity: 0.6;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 0.9rem 1.8rem;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Clash Display', sans-serif;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled(ModalButton)`
  background: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border: 2px solid ${props => props.theme.borderColor};
`;

const SendWarningButton = styled(ModalButton)`
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  
  &:hover {
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
  }
`;
// --- (End of Styles) ---


// ## --- NEW HELPER FUNCTION --- ##
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


function AdminUserDetailPage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('liveDemands');
  const [isLoading, setIsLoading] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [isSendingWarning, setIsSendingWarning] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  // (Removed API_ROOT_URL from here)

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const profilePromise = apiClient.get(`/api/admin/users/${userId}/profile`);
      const activityPromise = apiClient.get(`/api/admin/users/${userId}/activity`);
      
      const [profileResponse, activityResponse] = await Promise.all([
        profilePromise,
        activityPromise
      ]);
      
      setProfile(profileResponse.data);
      setActivity(activityResponse.data);
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      alert(error.response?.data?.message || "Could not load user data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleToggleSuspend = async () => {
    const isCurrentlySuspended = profile.is_suspended;
    const action = isCurrentlySuspended ? 'un-suspend' : 'suspend';
    const confirmMsg = `Are you sure you want to ${action} this user?`;

    if (window.confirm(confirmMsg)) {
      setIsSuspending(true);
      try {
        let reason = undefined;
        if (!isCurrentlySuspended) {
          reason = prompt('Enter suspension reason (optional):');
        }
        
        const response = await apiClient.put(`/api/admin/users/${userId}/suspend`, {
          suspend: !isCurrentlySuspended,
          reason: reason || undefined
        });
        
        alert(response.data.message);
        fetchData(); 

      } catch (error) {
        alert(error.response?.data?.message || `Failed to ${action} user.`);
      } finally {
        setIsSuspending(false);
      }
    }
  };
  
  const handleSendWarning = async () => {
    if (!warningText.trim()) {
      alert('Please enter a warning message');
      return;
    }
    
    setIsSendingWarning(true);
    try {
      const response = await apiClient.post(`/api/admin/users/${userId}/warn`, {
        warning: warningText
      });
      
      alert(response.data.message + ' - Email sent successfully!');
      setShowWarningModal(false);
      setWarningText('');
      
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send warning');
    } finally {
      setIsSendingWarning(false);
    }
  };

  // (Removed old getAvatarUrl function from here)

  const renderDiamondDetails = (details) => {
    if (!details) return null;
    
    const fields = [
      { key: 'size', label: 'Size (ct)' },
      { key: 'clarity', label: 'Clarity' },
      { key: 'price_per_caret', label: 'Price/ct' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'private_name', label: 'Private Name' },
      { key: 'require_till', label: 'Required By' },
      { key: 'payment_duration', label: 'Payment' }
    ];

    return (
      <DetailsList>
        {fields.map(field => (
          (details[field.key] || details[field.key] === 0) ? (
            <DetailListItem key={field.key}>
              <strong>{field.label}:</strong> {details[field.key]}
            </DetailListItem>
          ) : null
        ))}
      </DetailsList>
    );
  };

  const renderTabContent = () => {
    if (!activity) return <EmptyState>No activity data found.</EmptyState>;

    const data = activity[activeTab];
    if (!data || data.length === 0) {
      return <EmptyState>No items found for this tab.</EmptyState>;
    }

    return data.map((item, index) => (
      <ItemCard key={item.demand_id || item.listing_id || item.offer_id || item.review_id || index}>
        {activeTab.includes('Demands') && (
          <>
            <CardTitle>Demand #{item.demand_id}</CardTitle>
            <CardDetail><strong>Status:</strong> {item.status}</CardDetail>
            {renderDiamondDetails(item.diamond_details)}
          </>
        )}
        {activeTab.includes('Listings') && (
          <>
            <CardTitle>Listing #{item.listing_id}</CardTitle>
            <CardDetail><strong>Status:</strong> {item.status}</CardDetail>
            <CardDetail><strong>Price:</strong> {item.price}</CardDetail>
            {renderDiamondDetails(item.diamond_details)}
          </>
        )}
        {activeTab.includes('Offers') && (
          <>
            <CardTitle>Offer #{item.offer_id} @ ${item.offer_price}</CardTitle>
            <CardDetail><strong>Status:</strong> {item.status}</CardDetail>
            {item.buyer_name && <CardDetail><strong>Buyer:</strong> {item.buyer_name}</CardDetail>}
            {renderDiamondDetails(item.diamond_details)}
          </>
        )}
        {activeTab.includes('Reviews') && (
          <>
            <CardTitle>{item.rating} Star Review</CardTitle>
            <CardDetail><strong>{activeTab === 'reviewsGiven' ? 'Review for:' : 'Review from:'}</strong> {item.reviewee_name || item.reviewer_name}</CardDetail>
            <CardDetail>"{item.review_text || 'No comment'}"</CardDetail>
          </>
        )}
      </ItemCard>
    ));
  };

  if (isLoading || !profile) {
    return (
      <Container>
        <PageHeader title="Loading User Profile..." />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader title="User Profile & Activity" backTo={-1} />
      
      <ProfileHeader>
        <ProfileTop>
          {/* ## --- THIS IS THE FIX --- ## */}
          <Avatar src={getAvatarUrl(profile.profile_photo_url, profile.full_name)} alt={profile.full_name} />

          <ProfileInfo>
            <Name>{profile.full_name}</Name>
            <Office>{profile.office_name || 'No office name'}</Office>
            <RoleBadge role={profile.role}>{profile.role}</RoleBadge>
          </ProfileInfo>

          <AdminActions>
            {profile.is_suspended ? (
              <UnsuspendButton onClick={handleToggleSuspend} disabled={isSuspending}>
                {isSuspending ? <InlineLoader text="Processing..." size="16px" /> : <><PiShield /> Un-suspend User</>}
              </UnsuspendButton>
            ) : (
              <SuspendButton onClick={handleToggleSuspend} disabled={isSuspending}>
                {isSuspending ? <InlineLoader text="Processing..." size="16px" /> : <><PiWarningCircle /> Suspend User</>}
              </SuspendButton>
            )}
            
            <WarningButton onClick={() => setShowWarningModal(true)}>
              <PiEnvelope /> Send Warning
            </WarningButton>
          </AdminActions>
        </ProfileTop>
        
        <StatsGrid>
          <StatCard>
            <StatIcon color="#10b981"><PiMedal /></StatIcon>
            <StatValue>{profile.reputation_points || 0}</StatValue>
            <StatLabel>Reputation</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#f59e0b"><PiStar /></StatIcon>
            <StatValue>{profile.average_rating}</StatValue>
            <StatLabel>Rating</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#8b5cf6"><PiUsers /></StatIcon>
            <StatValue>{profile.total_reviews}</StatValue>
            <StatLabel>Reviews</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#0ea5e9"><PiDiamond /></StatIcon>
            <StatValue>{profile.total_listings || 0}</StatValue>
            <StatLabel>Listings</StatLabel>
          </StatCard>
        </StatsGrid>

        <ProfileDetailsGrid>
          <DetailItem>
            <DetailLabel>Email</DetailLabel>
            <DetailValue>{profile.email}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Phone</DetailLabel>
            <DetailValue>{profile.phone_number || 'N/A'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>GST Number</DetailLabel>
            <DetailValue>{profile.gst_number || 'N/A'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Office Address</DetailLabel>
            <DetailValue>{profile.office_address || 'N/A'}</DetailValue>
          </DetailItem>
        </ProfileDetailsGrid>
      </ProfileHeader>

      <ActivitySection>
        <TabBar>
          <TabButton $active={activeTab === 'liveDemands'} onClick={() => setActiveTab('liveDemands')}>Live Demands</TabButton>
          <TabButton $active={activeTab === 'currentListings'} onClick={() => setActiveTab('currentListings')}>Current Listings</TabButton>
          <TabButton $active={activeTab === 'offersMade'} onClick={() => setActiveTab('offersMade')}>Offers Made</TabButton>
          <TabButton $active={activeTab === 'offersReceived'} onClick={() => setActiveTab('offersReceived')}>Offers Received</TabButton>
          <TabButton $active={activeTab === 'completedDemands'} onClick={() => setActiveTab('completedDemands')}>Completed Demands</TabButton>
          <TabButton $active={activeTab === 'soldListings'} onClick={() => setActiveTab('soldListings')}>Completed Sales</TabButton>
          <TabButton $active={activeTab === 'reviewsGiven'} onClick={() => setActiveTab('reviewsGiven')}>Reviews Given</TabButton>
          <TabButton $active={activeTab === 'reviewsReceived'} onClick={() => setActiveTab('reviewsReceived')}>Reviews Received</TabButton>
        </TabBar>
        <TabContent>
          {renderTabContent()}
        </TabContent>
      </ActivitySection>
      
      {showWarningModal && (
        <ModalOverlay onClick={() => setShowWarningModal(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <PiWarningCircle style={{ color: '#f59e0b' }} />
              Send Official Warning
            </ModalTitle>
            <ModalDescription>
              Send a formal warning email to {profile?.full_name}. This warning will be recorded and the user will be notified via email.
            </ModalDescription>
            
            <ModalTextarea
              value={warningText}
              onChange={(e) => setWarningText(e.target.value)}
              placeholder="Describe the violation or misconduct..."
              maxLength={500}
            />
            
            <ModalActions>
              <CancelButton onClick={() => {
                setShowWarningModal(false);
                setWarningText('');
              }}>
                Cancel
              </CancelButton>
              <SendWarningButton 
                onClick={handleSendWarning}
                disabled={isSendingWarning || !warningText.trim()}
              >
                {isSendingWarning ? <InlineLoader text="Sending..." size="16px" /> : 'Send Warning'}
              </SendWarningButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default AdminUserDetailPage;