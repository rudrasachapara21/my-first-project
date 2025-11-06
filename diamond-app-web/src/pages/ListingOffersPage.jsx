import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

// --- (Styled-components, no changes) ---
const Container = styled.div``;
const OfferList = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const OfferCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
`;
const OfferInfo = styled.p`
  margin: 0.25rem 0;
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
`;
const OfferPrice = styled.span`
  font-weight: bold;
  font-size: 1.2rem;
  color: ${props => props.theme.textPrimary};
`;
const OfferStatus = styled.span`
  font-weight: bold;
  text-transform: capitalize;
  color: ${props => props.color};
`;
const OfferActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;
// ## CHANGE: Updated button styling ##
const ActionButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border-color: ${props => props.theme.borderColor};

  &:hover {
    background-color: ${props => props.theme.borderColor};
  }

  ${props => props.$accept && `
    background-color: #22c55e;
    border-color: #22c55e;
    color: white;
    &:hover { background-color: #16a34a; }
  `}
  
  ${props => props.$reject && `
    background-color: #ef4444;
    border-color: #ef4444;
    color: white;
    &:hover { background-color: #dc2626; }
  `}

  &:disabled {
    background-color: ${props => props.theme.borderColor};
    color: ${props => props.theme.textSecondary};
    cursor: not-allowed;
  }
`;

// ## NEW: Modal styles (copied from ListingDetailPage.jsx) ##
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


function ListingOffersPage() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ## NEW: State for counter-offer modal ##
    const [isCounterModalOpen, setCounterModalOpen] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [newCounterPrice, setNewCounterPrice] = useState('');

    const fetchOffers = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // This endpoint is correct, it gets all offers for the listing
            const response = await apiClient.get(`/api/listings/${listingId}/offers`);
            setOffers(response.data);
        } catch (error) {
            console.error("Failed to fetch offers for listing:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, [listingId, user]);

    // ## NEW: Central function to handle ALL responses ##
    const handleResponse = async (offerId, responseType, price = null) => {
        setIsSubmitting(true);
        try {
            // We send all responses to the new single endpoint
            await apiClient.put(`/api/offers/${offerId}/respond`, {
                responseType: responseType,
                newPrice: price
            });
            
            // Close modal if it was open
            if (isCounterModalOpen) {
                setCounterModalOpen(false);
                setNewCounterPrice('');
            }
            
            fetchOffers(); // Refresh the list
        } catch (error) { 
            alert(error.response?.data?.message || `Failed to ${responseType} offer.`); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // ## NEW: Helper functions to open/close the modal ##
    const openCounterModal = (offer) => {
        setCurrentOffer(offer);
        // Pre-fill the input with a price slightly higher than the offer
        setNewCounterPrice(Math.round(offer.offer_price * 1.05)); 
        setCounterModalOpen(true);
    };
    
    const onCounterModalSubmit = () => {
        if (!newCounterPrice || isNaN(newCounterPrice) || newCounterPrice <= 0) {
            alert('Please enter a valid counter-offer price.');
            return;
        }
        handleResponse(currentOffer.offer_id, 'counter', newCounterPrice);
    };

    // ## NEW: Improved status text and colors ##
    const getStatusColor = (status) => {
        if (status === 'accepted') return '#22c55e';
        if (status === 'rejected') return '#ef4444';
        if (status === 'pending_buyer') return '#f59e0b';
        return '#64748b'; // pending_seller
    };

    const getStatusText = (status) => {
        if (status === 'pending_seller') return 'Pending Your Response';
        if (status === 'pending_buyer') return 'Waiting for Buyer Response';
        return status; // 'accepted', 'rejected'
    };

    return (
        <Container>
            <PageHeader title={`Offers for Listing #${listingId}`} backTo={`/listing/${listingId}`} />
            <OfferList>
                {isLoading ? (
                    <p style={{textAlign: 'center'}}>Loading offers...</p>
                ) : offers.length === 0 ? (
                    <p style={{textAlign: 'center'}}>No offers have been received for this listing yet.</p>
                ) : (
                    offers.map(offer => (
                        <OfferCard key={offer.offer_id}>
                            <OfferInfo>
                                Offer from: <strong>{offer.buyer_name}</strong>
                            </OfferInfo>
                            <OfferInfo>
                                Price: <OfferPrice>₹{parseInt(offer.offer_price, 10).toLocaleString('en-IN')}</OfferPrice>
                            </OfferInfo>
                             <OfferInfo>
                                Status: <OfferStatus color={getStatusColor(offer.status)}>{getStatusText(offer.status)}</OfferStatus>
                            </OfferInfo>
                            
                            {/* ## NEW: Show buttons only if it's the seller's turn ## */}
                            {offer.status === 'pending_seller' && (
                                <OfferActions>
                                    <ActionButton $accept onClick={() => handleResponse(offer.offer_id, 'accept')} disabled={isSubmitting}>
                                        Accept
                                    </ActionButton>
                                    <ActionButton $reject onClick={() => handleResponse(offer.offer_id, 'reject')} disabled={isSubmitting}>
                                        Reject
                                    </ActionButton>
                                    <ActionButton onClick={() => openCounterModal(offer)} disabled={isSubmitting}>
                                        Counter
                                    </ActionButton>
                                </OfferActions>
                            )}
                        </OfferCard>
                    ))
                )}
            </OfferList>

            {/* ## NEW: Counter-offer Modal ## */}
            {isCounterModalOpen && (
                <ModalBackdrop>
                    <ModalContent>
                        <ModalTitle>Make a Counter-Offer</ModalTitle>
                        <p>Buyer's Offer: ₹{parseInt(currentOffer?.offer_price, 10).toLocaleString('en-IN')}</p>
                        <ModalInput 
                            type="number" 
                            placeholder="Your counter-offer price (INR)" 
                            value={newCounterPrice} 
                            onChange={e => setNewCounterPrice(e.target.value)} 
                        />
                        <ModalActions>
                            <ModalButton onClick={() => setCounterModalOpen(false)}>Cancel</ModalButton>
                            <ModalButton primary onClick={onCounterModalSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Counter'}
                            </ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </Container>
    );
}

export default ListingOffersPage;