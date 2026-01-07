import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { PiCheckCircle, PiCurrencyInr, PiXCircle } from "react-icons/pi";

// --- Styles ---
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
  position: relative;
  transition: all 0.2s;
  
  /* Dim card if another offer won */
  opacity: ${props => props.$dim ? 0.5 : 1};
  filter: ${props => props.$dim ? 'grayscale(100%)' : 'none'};
  pointer-events: ${props => props.$dim ? 'none' : 'auto'};
`;

const OfferHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const BuyerName = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`;

const OfferDate = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme.textSecondary};
`;

const PriceTag = styled.div`
  font-family: 'Clash Display', sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
  color: ${props => props.theme.textPrimary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
    background-color: ${props => props.bg};
    color: ${props => props.color};
  margin-top: 0.5rem;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 1.5rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.1s;

  &:active { transform: scale(0.98); }

  /* Default (Counter) */
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border-color: ${props => props.theme.borderColor};

  /* Accept Green */
    ${props => props.$variant === 'accept' && `
        background-color: ${props.theme.success};
        color: ${props.theme.background || '#fff'};
        &:hover { background-color: ${props.theme.success}; opacity: 0.95; }
    `}
  
  /* Reject Red */
    ${props => props.$variant === 'reject' && `
        background-color: ${props.theme.error};
        color: ${props.theme.background || '#fff'};
        &:hover { background-color: ${props.theme.error}; opacity: 0.95; }
    `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// --- Success Banner ---
const SuccessBanner = styled.div`
    background: ${props => props.theme.success}22; /* translucent success */
    color: ${props => props.theme.success};
    border: 1px solid ${props => props.theme.success}33;
  padding: 1.5rem;
  margin: 1rem 1.5rem 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: fadeIn 0.5s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// --- Modal Styles ---
const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;
`;
const ModalContent = styled.div`
  background: ${props => props.theme.bgSecondary}; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; text-align: center;
  border: 1px solid ${props => props.theme.borderColor};
`;
const ModalInput = styled.input`
  width: 100%; padding: 1rem; margin: 1.5rem 0; 
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 8px; font-size: 1.1rem; 
  background: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary};
`;

function ListingOffersPage() {
    const { listingId } = useParams();
    const { user } = useAuth();
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal State
    const [isCounterModalOpen, setCounterModalOpen] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [newCounterPrice, setNewCounterPrice] = useState('');

    const fetchOffers = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/api/listings/${listingId}/offers`);
            setOffers(response.data);
        } catch (error) {
            console.error("Failed to fetch offers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchOffers(); }, [listingId, user]);

    const handleResponse = async (offerId, responseType, price = null) => {
        if (responseType === 'accept') {
            const confirm = window.confirm("Are you sure? This will SELL the diamond and create a Transaction record.");
            if (!confirm) return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.put(`/api/offers/${offerId}/respond`, {
                responseType: responseType,
                newPrice: price
            });

            if (isCounterModalOpen) {
                setCounterModalOpen(false);
                setNewCounterPrice('');
            }
            
            // Just refresh data, don't use annoying alerts
            fetchOffers(); 
        } catch (error) { 
            alert(error.response?.data?.message || `Failed to ${responseType} offer.`); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCounterModal = (offer) => {
        setCurrentOffer(offer);
        setNewCounterPrice(Math.round(offer.offer_price * 1.05)); 
        setCounterModalOpen(true);
    };
    
    const onCounterModalSubmit = () => {
        if (!newCounterPrice || isNaN(newCounterPrice) || newCounterPrice <= 0) {
            alert('Please enter a valid price.');
            return;
        }
        handleResponse(currentOffer.offer_id, 'counter', newCounterPrice);
    };

    // Helper to check if deal is closed
    const winningOffer = offers.find(o => o.status === 'accepted');

    return (
        <Container>
            <PageHeader title="Manage Offers" backTo={-1} />
            
            {/* --- SUCCESS BANNER (If Sold) --- */}
            {winningOffer && (
                <SuccessBanner>
                    <PiCheckCircle size={32} />
                    <div>
                        <h3 style={{margin: 0}}>Sold to {winningOffer.buyer_name}!</h3>
                        <p style={{margin: '4px 0 0', fontSize: '0.9rem'}}>
                            Transaction Created. Final Price: ₹{parseInt(winningOffer.offer_price).toLocaleString('en-IN')}
                        </p>
                    </div>
                </SuccessBanner>
            )}

            <OfferList>
                {isLoading ? (
                    <p style={{textAlign: 'center', opacity: 0.6}}>Checking for offers...</p>
                ) : offers.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '12px'}}>
                        <h3>No Offers Yet</h3>
                        <p>Wait for traders to bid on your diamond.</p>
                    </div>
                ) : (
                    offers.map(offer => {
                        const isWinner = offer.status === 'accepted';
                        // If there is a winner, dim everyone else
                        const isDimmed = winningOffer && !isWinner;

                        return (
                            <OfferCard key={offer.offer_id} $dim={isDimmed}>
                                <OfferHeader>
                                    <div>
                                        <BuyerName>{offer.buyer_name}</BuyerName>
                                        <OfferDate>{new Date(offer.updated_at).toLocaleDateString()}</OfferDate>
                                    </div>
                                    <PriceTag>
                                        <PiCurrencyInr />
                                        {parseInt(offer.offer_price).toLocaleString('en-IN')}
                                    </PriceTag>
                                </OfferHeader>

                                {/* Status Badge */}
                                {offer.status === 'pending_seller' && <StatusBadge bg={'var(--accent-primary)'} color={'var(--bg-primary)'}>Your Turn</StatusBadge>}
                                {offer.status === 'pending_buyer' && <StatusBadge bg={'var(--info)'} color={'var(--bg-primary)'}>Waiting for Buyer</StatusBadge>}
                                {offer.status === 'rejected' && <StatusBadge bg={'var(--error)'} color={'var(--bg-primary)'}>Rejected</StatusBadge>}
                                {offer.status === 'accepted' && <StatusBadge bg={'var(--success)'} color={'var(--bg-primary)'}>Accepted & Sold</StatusBadge>}

                                {/* Action Buttons (Only show if active and no deal closed yet) */}
                                {offer.status === 'pending_seller' && !winningOffer && (
                                    <ActionGrid>
                                        <ActionButton $variant="accept" onClick={() => handleResponse(offer.offer_id, 'accept')} disabled={isSubmitting}>
                                            Accept
                                        </ActionButton>
                                        <ActionButton $variant="reject" onClick={() => handleResponse(offer.offer_id, 'reject')} disabled={isSubmitting}>
                                            Reject
                                        </ActionButton>
                                        <ActionButton onClick={() => openCounterModal(offer)} disabled={isSubmitting}>
                                            Counter
                                        </ActionButton>
                                    </ActionGrid>
                                )}
                            </OfferCard>
                        );
                    })
                )}
            </OfferList>

            {/* Counter Modal */}
            {isCounterModalOpen && (
                <ModalBackdrop onClick={() => setCounterModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <h2 style={{marginTop: 0}}>Counter Offer</h2>
                        <p>Suggest a new price for <strong>{currentOffer?.buyer_name}</strong></p>
                        
                        <ModalInput 
                            type="number" 
                            autoFocus
                            placeholder="Enter Amount" 
                            value={newCounterPrice} 
                            onChange={e => setNewCounterPrice(e.target.value)} 
                        />
                        
                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                            <ActionButton onClick={() => setCounterModalOpen(false)}>Cancel</ActionButton>
                            <ActionButton $variant="accept" onClick={onCounterModalSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Counter'}
                            </ActionButton>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </Container>
    );
}

export default ListingOffersPage;