import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import apiClient from '../../api/axiosConfig';
import PageHeader from '../../components/PageHeader';
import { PiMedal, PiStar, PiUsers, PiDiamond, PiWarningCircle } from 'react-icons/pi';

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
  background-color: ${props => props.role === 'trader' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
  color: ${props => props.role === 'trader' ? '#0284c7' : '#16a34a'};
  border: 1px solid ${props => props.role === 'trader' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
`;

const AdminActions = styled.div`
  flex-basis: 100%; 
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border: 1px solid ${props => props.theme.borderColor};

  &:hover {
    opacity: 0.8;
  }
`;

const SuspendButton = styled(ActionButton)`
  background-color: ${props => props.theme.accentDangerLight || '#fee2e2'};
  color: ${props => props.theme.accentDanger || '#ef4444'};
  border: 1px solid ${props => props.theme.accentDanger || '#ef4444'};
`;

const UnsuspendButton = styled(ActionButton)`
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.3);
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
      try {
        const response = await apiClient.put(`/api/admin/users/${userId}/suspend`, {
          suspend: !isCurrentlySuspended
        });
        
        alert(response.data.message);
        fetchData(); 

      } catch (error) {
        alert(error.response?.data?.message || `Failed to ${action} user.`);
      }
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
      <PageHeader title="User Profile & Activity" backTo="/admin/user-monitoring" />
      
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
              <UnsuspendButton onClick={handleToggleSuspend}>
                <PiWarningCircle /> Un-suspend User
              </UnsuspendButton>
            ) : (
              <SuspendButton onClick={handleToggleSuspend}>
                <PiWarningCircle /> Suspend User
              </SuspendButton>
            )}
          </AdminActions>
        </ProfileTop>
        
        <StatsGrid>
          <StatCard>
            <StatIcon color="#22c55e"><PiMedal /></StatIcon>
            <StatValue>{profile.reputation_points || 0}</StatValue>
            <StatLabel>Reputation</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#f59e0b"><PiStar /></StatIcon>
            <StatValue>{profile.average_rating}</StatValue>
            <StatLabel>Rating</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon color="#64748b"><PiUsers /></StatIcon>
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
    </Container>
  );
}

export default AdminUserDetailPage;