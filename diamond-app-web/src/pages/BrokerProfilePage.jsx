import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { 
    PiChatCircleDots, PiUserPlus, PiXCircle, PiUserMinus, PiCheckCircle, PiCertificate,
    PiMedal, PiStar, PiStarFill, PiStarHalfFill, PiUsers, PiChatText
} from 'react-icons/pi';

// --- (Container, Wrapper, Card, Avatar, Name... all same) ---
const Container = styled.div``;
const ProfileWrapper = styled.div`
  padding: 1.5rem;
`;
const ProfileCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #4f46e5;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
`;
const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 0.5rem 0 0.25rem 0;
`;
const Name = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
  text-align: center;
`;
const VerifiedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #166534;
  color: #dcfce7;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #22c55e;
`;
const Office = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.textSecondary};
  margin: 0 0 1.5rem 0;
  text-align: center;
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 450px;
  margin-bottom: 2rem;
`;
const StatCard = styled.div`
  background: ${props => props.theme.background};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  border: 1px solid ${props => props.theme.borderColor};
`;
const StatIcon = styled.div`
  font-size: 2rem;
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
const StarRatingDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 1.25rem;
  color: #f59e0b;
`;
const Section = styled.div`
  width: 100%;
  max-width: 400px;
  border-top: 1px solid ${props => props.theme.borderColor};
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;
const DetailItem = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0.25rem 0;
  font-size: 1rem;
  line-height: 1.5;
  strong {
    color: ${props => props.theme.textPrimary};
  }
`;
const ActionTitle = styled.h3`
  text-align: center;
  margin: 0;
  color: ${props => props.theme.textSecondary};
  font-weight: 500;
`;
const ActionButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
  width: 100%;
`;
const ActionButton = styled.button`
  background-color: ${props => props.$primary ? '#4f46e5' : (props.$danger ? '#FEE2E2' : props.theme.bgPrimary)};
  color: ${props => props.$primary ? 'white' : (props.$danger ? '#ef4444' : props.theme.textPrimary)};
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid ${props => props.$primary ? '#4f46e5' : (props.$danger ? '#fca5a5' : props.theme.borderColor)};
  padding: 0.8rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  width: 100%;
  &:hover { opacity: 0.9; }
`;
const CompleteButton = styled(ActionButton)`
  background-color: #22c55e;
  border-color: #22c55e;
  color: white;
`;
const ReviewSection = styled(Section)`
  max-width: 100%;
  align-items: flex-start;
`;
const ReviewCard = styled.div`
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  padding: 1.25rem;
  width: 100%;
  box-sizing: border-box;
`;
const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;
const ReviewerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;
const ReviewerName = styled.span`
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;
const ReviewBody = styled.p`
  color: ${props => props.theme.textSecondary};
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
`;
const EmptyState = styled.div`
  width: 100%;
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.textSecondary};
`;

// ## --- ALL NEW MODAL STYLES ADDED --- ##
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
  border: 1px solid ${props => props.primary ? 'transparent' : props.theme.borderColor};
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.primary ? props.theme.accentPrimary : 'transparent'};
  color: ${props => props.primary ? 'white' : props.theme.textPrimary};
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
// ## --- END NEW MODAL STYLES --- ##


// --- Helper Components (AnimatedCounter, StarRating) ---
const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    let start = 0;
    const end = parseInt(value, 10);
    if (start === end) return;
    const duration = 1000;
    const incrementTime = (duration / end);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) { clearInterval(timer); }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
};

const StarRating = ({ rating }) => {
  const stars = [];
  const numRating = parseFloat(rating);
  for (let i = 1; i <= 5; i++) {
    if (i <= numRating) { stars.push(<PiStarFill key={i} />); } 
    else if (i - 0.5 <= numRating) { stars.push(<PiStarHalfFill key={i} />); } 
    else { stars.push(<PiStar key={i} />); }
  }
  return <StarRatingDisplay>{stars}</StarRatingDisplay>;
};


function BrokerProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { user } = useAuth();
    
    const [profile, setProfile] = useState(null);
    const [reviewData, setReviewData] = useState({ 
      stats: { average_rating: 0, total_reviews: 0 }, 
      reviews: [] 
    });
    const [isLoading, setIsLoading] = useState(true);

    // ## NEW: State for Review Modal ##
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHoverRating, setReviewHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const demand = state?.demand;
    const API_URL = import.meta.env.VITE_API_URL.replace('/api', '');

    useEffect(() => {
        if (!user || !userId) return;
        
        const fetchProfileAndReviews = async () => {
            setIsLoading(true);
            try {
                const profilePromise = apiClient.get(`/api/users/${userId}`);
                const reviewsPromise = apiClient.get(`/api/users/${userId}/reviews`);
                const [profileResponse, reviewsResponse] = await Promise.all([profilePromise, reviewsPromise]);
                
                setProfile(profileResponse.data);
                setReviewData(reviewsResponse.data);
            } catch (error) {
                console.error("Failed to fetch profile or reviews:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileAndReviews();
    }, [userId, user]);

    const handleAction = async (action, successMsg, errorMsg, redirectUrl) => { if (!window.confirm("Are you sure?")) return; try { await action(); alert(successMsg); navigate(redirectUrl); } catch (error) { alert(error.response?.data?.message || errorMsg); } };
    const handleHire = () => handleAction( () => apiClient.post(`/api/demands/${demand.demand_id}/hire/${profile.user_id}`), 'Broker hired successfully!', 'Failed to hire broker.', `/demand/${demand.demand_id}` );
    const handleDismiss = () => handleAction( () => apiClient.delete(`/api/demands/${demand.demand_id}/interest/${profile.user_id}`), 'Broker interest dismissed.', 'Failed to dismiss interest.', `/demand/${demand.demand_id}` );
    const handleUnhire = () => handleAction( () => apiClient.post(`/api/demands/${demand.demand_id}/unhire/${profile.user_id}`), 'Broker has been un-hired.', 'Failed to un-hire broker.', `/demand/${demand.demand_id}` );
    const handleMessage = async () => { try { const response = await apiClient.post(`/api/conversations`, { recipientId: profile.user_id }); navigate(`/chat/${response.data.conversation_id}`, { state: { partnerName: profile.full_name } }); } catch (error) { alert(error.response?.data?.message || "Could not start conversation."); } };

    // ## --- UPDATED handleCompleteDeal FUNCTION --- ##
    const handleCompleteDeal = async () => {
        const confirmMsg = "Are you sure you want to mark this deal as complete? This will award 1 reputation point to the broker and mark the demand as 'completed'.";
        if (window.confirm(confirmMsg)) {
            try {
                // 1. Call the backend to complete the deal and award the point
                const response = await apiClient.post(`/api/demands/${demand.demand_id}/complete/${profile.user_id}`);
                alert(response.data.message || 'Deal marked as complete!');
                
                // 2. NOW, open the review modal instead of navigating away
                setReviewModalOpen(true);
                
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to complete the deal.');
            }
        }
    };
    
    // ## --- NEW REVIEW HANDLER FUNCTIONS --- ##
    const handleReviewSubmit = async () => {
        if (reviewRating === 0) {
            alert("Please select a star rating.");
            return;
        }
        setReviewSubmitting(true);
        try {
            await apiClient.post('/api/reviews', {
                demand_id: demand.demand_id, // Link the review to this demand
                reviewee_id: profile.user_id, // The ID of the person being reviewed (the broker)
                rating: reviewRating,
                review_text: reviewText
            });
            alert("Review submitted successfully!");
            closeReviewModal();
            navigate('/my-demands'); // Navigate away *after* review is submitted
        } catch (error) {
            alert(error.response?.data?.message || "Failed to submit review.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setReviewRating(0);
        setReviewHoverRating(0);
        setReviewText('');
        // We navigate away even if they skip, because the deal is complete
        navigate('/my-demands'); 
    };
    // ## --- END NEW REVIEW HANDLER FUNCTIONS --- ##


    if (isLoading || !profile) {
        return <PageHeader title="Loading Profile..." />;
    }

    const isHired = demand && demand.hired_broker_id === profile.user_id;

    return (
        <Container>
            <PageHeader title={`${profile.role === 'broker' ? 'Broker' : 'Trader'} Profile`} backTo={-1} />
            <ProfileWrapper>
                <ProfileCard>
                    <Avatar src={profile.profile_photo_url ? `${API_URL}${profile.profile_photo_url}` : `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}`} />
                    
                    <NameWrapper>
                      <Name>{profile.full_name}</Name>
                      {profile.is_verified && (
                        <VerifiedBadge>
                          <PiCertificate /> Verified
                        </VerifiedBadge>
                      )}
                    </NameWrapper>

                    <Office>{profile.office_name}</Office>
                    
                    <StatsGrid>
                        <StatCard>
                            <StatIcon color="#22c55e"><PiMedal /></StatIcon>
                            <StatValue><AnimatedCounter value={profile.reputation_points || 0} /></StatValue>
                            <StatLabel>Reputation</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatIcon color="#f59e0b"><PiStar /></StatIcon>
                            <StatValue>{reviewData.stats.average_rating}</StatValue>
                            <StatLabel>Rating</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatIcon color="#64748b"><PiUsers /></StatIcon>
                            <StatValue><AnimatedCounter value={reviewData.stats.total_reviews} /></StatValue>
                            <StatLabel>Reviews</StatLabel>
                        </StatCard>
                    </StatsGrid>
                    
                    <StarRating rating={reviewData.stats.average_rating} />

                    {demand && user?.id === demand.trader_id && (
                        <Section>
                            <ActionTitle>Actions for Demand #{demand.demand_id}</ActionTitle>
                            <ActionButtonRow>
                                {isHired ? (
                                    <>
                                        <ActionButton $danger onClick={handleUnhire}><PiUserMinus /> Un-hire</ActionButton>
                                        <ActionButton onClick={handleMessage}><PiChatCircleDots /> Message</ActionButton>
                                        {/* This button now triggers the review modal */}
                                        <CompleteButton onClick={handleCompleteDeal}><PiCheckCircle /> Mark Complete</CompleteButton>
                                    </>
                                ) : (
                                    <>
                                        <ActionButton $danger onClick={handleDismiss}><PiXCircle /> Dismiss</ActionButton>
                                        <ActionButton $primary onClick={handleHire}><PiUserPlus /> Hire</ActionButton>
                                    </>
                                )}
                            </ActionButtonRow>
                        </Section>
                    )}
                    
                    <Section>
                        {profile.office_address && <DetailItem><strong>Office Address:</strong> {profile.office_address}</DetailItem>}
                        {profile.phone_number && <DetailItem><strong>Phone Number:</strong> {profile.phone_number}</DetailItem>}
                        {profile.gst_number && <DetailItem><strong>GST Number:</strong> {profile.gst_number}</DetailItem>}
                    </Section>

                    {user.id !== profile.user_id && !demand && (
                         <Section>
                            <ActionButton $primary onClick={handleMessage}>
                                <PiChatCircleDots /> Message
                            </ActionButton>
                        </Section>
                    )}
                </ProfileCard>
                
                <ReviewSection>
                    <h2>Reviews ({reviewData.reviews.length})</h2>
                    {reviewData.reviews.length > 0 ? (
                        reviewData.reviews.map(review => (
                            <ReviewCard key={review.review_id}>
                                <ReviewHeader>
                                    <ReviewerInfo>
                                        <Avatar 
                                            style={{width: '40px', height: '40px'}}
                                            src={review.reviewer_photo ? `${API_URL}${review.reviewer_photo}` : `https://ui-avatars.com/api/?name=${review.reviewer_name.replace(' ', '+')}`} 
                                        />
                                        <ReviewerName>{review.reviewer_name}</ReviewerName>
                                    </ReviewerInfo>
                                    <StarRating rating={review.rating} />
                                </ReviewHeader>
                                <ReviewBody>
                                    {review.review_text || <em>No review text provided.</em>}
                                </ReviewBody>
                            </ReviewCard>
                        ))
                    ) : (
                        <EmptyState>
                            <PiChatText size={40} />
                            <p>This user has not received any written reviews yet.</p>
                        </EmptyState>
                    )}
                </ReviewSection>
            </ProfileWrapper>
            
            {/* ## --- NEW REVIEW MODAL ADDED --- ## */}
            {isReviewModalOpen && (
                <ModalBackdrop>
                    <ModalContent>
                        <ModalTitle>Deal Complete!</ModalTitle>
                        <p>Please rate your experience with <strong>{profile?.full_name}</strong>.</p>
                        
                        <StarRatingContainer>
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = star <= (reviewHoverRating || reviewRating);
                                return (
                                    <StarButton
                                        key={star}
                                        $filled={isFilled}
                                        $animated={isFilled && star > reviewRating} // Animate new stars
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
                            <ModalButton onClick={closeReviewModal}>Skip for Now</ModalButton>
                            <ModalButton primary onClick={handleReviewSubmit} disabled={reviewSubmitting || reviewRating === 0}>
                                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                            </ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalBackdrop>
            )}
            {/* ## --- END NEW REVIEW MODAL --- ## */}

        </Container>
    );
}
export default BrokerProfilePage;