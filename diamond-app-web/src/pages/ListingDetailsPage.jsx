import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { PiCertificate, PiChatCircleDots, PiMapPinLine, PiPhone, PiBuildingOffice, PiFileText, PiTag, PiPencilSimple, PiTrash, PiEnvelope } from "react-icons/pi";

const Container = styled.div``;
const Content = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
const BigImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 16px;
  background-color: ${props => props.theme.bgSecondary};
  margin-bottom: 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
`;
const Section = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;
const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.textPrimary};
  border-bottom: 1px solid ${props => props.theme.borderColor};
  padding-bottom: 0.75rem;
`;
const SellerOverview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #A5B4FC;
  flex-shrink: 0;
`;
const SellerName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;
const SellerOffice = styled.p`
  margin: 0.25rem 0 0 0;
  color: ${props => props.theme.textSecondary};
  font-size: 0.95rem;
`;
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
`;
const DetailItem = styled.div`
  strong {
    color: ${props => props.theme.textSecondary};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  span {
    color: ${props => props.theme.textPrimary};
    display: block;
    margin-top: 0.2rem;
    font-size: 1rem;
  }
`;
const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
const CtaButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.accentPrimary};
  color: white;
  font-family: 'Clash Display', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.5rem;
  text-decoration: none;
  transition: background-color 0.2s;
  &:hover {
    background-color: #4338ca;
  }
`;
const MessageButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.textPrimary};
  color: ${props => props.theme.bgSecondary};
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${props => props.theme.accentPrimary};
    color: white;
  }
`;
const OfferButton = styled(MessageButton)`
  background: ${props => props.theme.accentPrimary};
  color: white;
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
const ModalInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  background: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
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

function ListingDetailsPage() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOfferModalOpen, setOfferModalOpen] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    
    const API_URL = import.meta.env.VITE_API_URL.replace('/api', '');

    useEffect(() => {
        if (!user) return;
        const fetchListing = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get(`/api/listings/${listingId}`);
                setListing(response.data);
            } catch (error) {
                console.error("Failed to fetch listing:", error);
                if (error.response?.status === 404) navigate('/buy-feed');
            } finally {
                setIsLoading(false);
            }
        };
        fetchListing();
    }, [user, listingId, navigate]);

    const handleStartConversation = async () => {
        try {
            const response = await apiClient.post(`/api/conversations`, { recipientId: listing.trader_id });
            navigate(`/chat/${response.data.conversation_id}`, { state: { partnerName: listing.full_name } });
        } catch (error) {
            alert(error.response?.data?.message || "Could not start conversation.");
        }
    };
    
    const handleMakeOffer = async () => {
        if (!offerPrice || isNaN(offerPrice) || offerPrice <= 0) {
            alert('Please enter a valid offer price.');
            return;
        }
        try {
            await apiClient.post(`/api/offers/${listingId}`, { offer_price: offerPrice });
            setOfferModalOpen(false);
            setOfferPrice('');
            alert('Offer submitted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to make offer.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to permanently delete this listing?')) {
            try {
                await apiClient.delete(`/api/listings/${listingId}`);
                alert('Listing deleted successfully.');
                navigate('/buy-feed', { state: { defaultTab: 'myFeed' } });
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete listing.');
            }
        }
    };

    if (isLoading || !user) {
        return <Container><PageHeader title="Loading..." backTo="/buy-feed" /></Container>;
    }
    if (!listing) {
        return <Container><PageHeader title="Listing Not Found" backTo="/buy-feed" /></Container>;
    }
    
    const details = typeof listing.diamond_details === 'string' ? JSON.parse(listing.diamond_details) : listing.diamond_details;
    const primaryImageUrl = listing.image_urls && listing.image_urls[0] ? `${API_URL}${listing.image_urls[0]}` : 'https://placehold.co/800x600';
    const profileAvatarUrl = listing.profile_photo_url ? `${API_URL}${listing.profile_photo_url}` : `https://ui-avatars.com/api/?name=${(listing.full_name || 'User').replace(' ', '+')}&background=a5b4fc&color=fff`;

    const isOwner = user.id === listing.trader_id;

    return (
        <Container>
            <PageHeader title={listing.title || 'Diamond Listing'} backTo="/buy-feed" />
            <Content>
                <BigImage src={primaryImageUrl} alt={listing.title || "Diamond Image"} />
                <Section>
                    <SectionTitle>Diamond Details</SectionTitle>
                    <DetailsGrid>
                        <DetailItem><strong>Price:</strong><span>₹{parseInt(listing.price, 10).toLocaleString('en-IN')}</span></DetailItem>
                        <DetailItem><strong>Carat:</strong><span>{details.carat || 'N/A'}</span></DetailItem>
                        <DetailItem><strong>Clarity:</strong><span>{details.clarity || 'N/A'}</span></DetailItem>
                        <DetailItem><strong>Shape:</strong><span>{details.shape || 'N/A'}</span></DetailItem>
                    </DetailsGrid>
                    {listing.certificate_url && (
                        <CtaButton href={`${API_URL}${listing.certificate_url}`} target="_blank" rel="noopener noreferrer">
                            <PiCertificate /> View Certificate
                        </CtaButton>
                    )}
                </Section>
                <Section>
                    <SectionTitle>Seller Information</SectionTitle>
                    <SellerOverview>
                        <Avatar src={profileAvatarUrl} alt={listing.full_name} />
                        <div>
                            <SellerName>{listing.full_name}</SellerName>
                            <SellerOffice>{listing.office_name || 'N/A'}</SellerOffice>
                        </div>
                    </SellerOverview>
                    <DetailsGrid>
                        <DetailItem><strong><PiMapPinLine /> Address:</strong><span>{listing.office_address || 'N/A'}</span></DetailItem>
                        <DetailItem><strong><PiPhone /> Phone:</strong><span>{listing.phone_number || 'N/A'}</span></DetailItem>
                        <DetailItem><strong><PiFileText /> GST Number:</strong><span>{listing.gst_number || 'N/A'}</span></DetailItem>
                    </DetailsGrid>
                </Section>
                {isOwner ? (
                    <ActionsContainer>
                        <MessageButton onClick={handleDelete} style={{background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5'}}>
                            <PiTrash /> Delete Listing
                        </MessageButton>
                        <MessageButton onClick={() => navigate(`/listing/edit/${listingId}`)}>
                            <PiPencilSimple /> Edit Listing
                        </MessageButton>
                        <OfferButton onClick={() => navigate(`/listing/${listingId}/offers`)}>
                            <PiEnvelope /> View Offers Received
                        </OfferButton>
                    </ActionsContainer>
                ) : (
                    <ActionsContainer>
                        <OfferButton onClick={() => setOfferModalOpen(true)}>
                            <PiTag /> Make an Offer
                        </OfferButton>
                        <MessageButton onClick={handleStartConversation}>
                            <PiChatCircleDots /> Message Seller
                        </MessageButton>
                    </ActionsContainer>
                )}
            </Content>
            {isOfferModalOpen && (
                <ModalBackdrop>
                    <ModalContent>
                        <ModalTitle>Make an Offer</ModalTitle>
                        <p>Listing Price: ₹{parseInt(listing.price, 10).toLocaleString('en-IN')}</p>
                        <ModalInput 
                            type="number" 
                            placeholder="Your offer price (INR)" 
                            value={offerPrice} 
                            onChange={e => setOfferPrice(e.target.value)} 
                        />
                        <ModalActions>
                            <ModalButton onClick={() => setOfferModalOpen(false)}>Cancel</ModalButton>
                            <ModalButton primary onClick={handleMakeOffer}>Submit Offer</ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </Container>
    );
}

export default ListingDetailsPage;