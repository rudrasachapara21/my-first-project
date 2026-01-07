import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader'; // ✅ IMPORT LOADER
import { useAuth } from '../context/AuthContext';
import { PiCheckCircle, PiChatCircleDots, PiSealCheckFill } from "react-icons/pi";

// --- Styles ---
const Container = styled.div``;

const TabNav = styled.div`
  display: flex;
  background-color: ${props => props.theme.bgSecondary};
  border-radius: 12px;
  padding: 5px;
  margin: 1.5rem;
  border: 1px solid ${props => props.theme.borderColor};
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
  color: ${props => props.$active ? props.theme.bgSecondary : props.theme.textSecondary};
  background-color: ${props => props.$active ? props.theme.textPrimary : 'transparent'};
`;

const OfferList = styled.div`
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OfferCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
  opacity: ${props => props.$faded ? 0.7 : 1};
  
  &:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
`;

const OfferTitle = styled.h3` margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 600; `;
const OfferInfo = styled.p` margin: 0.25rem 0; color: ${props => props.theme.textSecondary}; font-size: 0.9rem; `;
const OfferPrice = styled.span` font-weight: bold; color: ${props => props.theme.textPrimary}; `;
const OfferStatus = styled.span` font-weight: bold; text-transform: capitalize; color: ${props => props.color}; `;
const OfferActions = styled.div` display: flex; gap: 1rem; margin-top: 1rem; `;

const ActionButton = styled.button`
  flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid transparent; font-weight: 600; cursor: pointer;
  background-color: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; border-color: ${props => props.theme.borderColor};
  &:hover { background-color: ${props => props.theme.borderColor}; }

  ${props => props.$accept && `background-color: #22c55e; border-color: #22c55e; color: white; &:hover { background-color: #16a34a; }`}
  ${props => props.$reject && `background-color: #ef4444; border-color: #ef4444; color: white; &:hover { background-color: #dc2626; }`}
  &:disabled { background-color: ${props => props.theme.borderColor}; color: ${props => props.theme.textSecondary}; cursor: not-allowed; }
`;

// --- New Success Banner (Green for Money/Sold) ---
const SuccessBanner = styled.div`
  background: #DCFCE7; 
  color: #166534; 
  border: 1px solid #22c55e;
  padding: 0.75rem; 
  border-radius: 8px; 
  margin-top: 1rem; 
  font-weight: bold;
  display: flex; 
  align-items: center; 
  gap: 0.5rem;
`;

// Modal Styles
const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background: ${props => props.theme.bgSecondary}; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; border: 1px solid ${props => props.theme.borderColor};`;
const ModalTitle = styled.h2` margin-top: 0; font-family: 'Clash Display', sans-serif; `;
const ModalInput = styled.input` width: 100%; padding: 0.8rem; margin: 1rem 0; border: 1px solid ${props => props.theme.borderColor}; border-radius: 6px; font-size: 1rem; background: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; `;
const ModalActions = styled.div` display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; `;
const ModalButton = styled.button` padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid ${props => props.$primary ? 'transparent' : props.theme.borderColor}; font-weight: 600; cursor: pointer; background: ${props => props.$primary ? props.theme.accentPrimary : 'transparent'}; color: ${props => props.$primary ? 'white' : props.theme.textPrimary}; `;

function OffersPage() {
    const [activeTab, setActiveTab] = useState('received');
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Counter Modal State
    const [isCounterModalOpen, setCounterModalOpen] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [newCounterPrice, setNewCounterPrice] = useState('');

    const fetchOffers = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/api/offers/${activeTab}`);
            setOffers(response.data);
        } catch (error) {
            console.error(`Failed to fetch ${activeTab} offers`, error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, user]);

    useEffect(() => { fetchOffers(); }, [fetchOffers]);
    
    const handleResponse = async (e, offer, responseType, price = null) => {
        e.stopPropagation(); 
        
        if (responseType === 'accept') {
            const confirm = window.confirm("Accepting this offer will immediately MARK AS SOLD and create a Transaction record. Continue?");
            if (!confirm) return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.put(`/api/offers/${offer.offer_id}/respond`, {
                responseType: responseType,
                newPrice: price
            });
            if (isCounterModalOpen) {
                setCounterModalOpen(false);
                setNewCounterPrice('');
            }
            fetchOffers();
        } catch (error) { 
            alert(error.response?.data?.message || `Failed to ${responseType} offer.`); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCounterModal = (e, offer) => {
        e.stopPropagation();
        setCurrentOffer(offer);
        const suggestedPrice = activeTab === 'received' 
            ? Math.round(offer.offer_price * 1.05)
            : Math.round(offer.offer_price * 0.95);
        setNewCounterPrice(suggestedPrice); 
        setCounterModalOpen(true);
    };
    
    const onCounterModalSubmit = (e) => {
        e.stopPropagation();
        if (!newCounterPrice || isNaN(newCounterPrice) || newCounterPrice <= 0) {
            alert('Please enter a valid price.');
            return;
        }
        handleResponse(e, currentOffer, 'counter', newCounterPrice);
    };

    const getStatusColor = (status) => {
        if (status === 'accepted') return '#22c55e'; // Green
        if (status === 'rejected') return '#ef4444';
        if (status === 'pending_buyer') return '#f59e0b';
        return '#64748b';
    };

    const getStatusText = (status) => {
        if (status === 'accepted') return 'Sold / Completed';
        if (status === 'pending_seller') return 'Action Required';
        if (status === 'pending_buyer') return 'Pending Counter-Offer';
        return status;
    };

    const formatDiamondDetails = (details) => {
        if (!details) return 'Diamond Listing';
        let d = details;
        try { d = typeof details === 'string' ? JSON.parse(details) : details; } catch (e) {}
        
        const carat = d?.carat || d?.size;
        const parts = [carat ? `${carat}ct` : '', d?.shape, d?.color, d?.clarity].filter(Boolean);
        return parts.join(', ') || 'Diamond Listing';
    }

    const startChat = async (e, partnerId) => {
        e.stopPropagation();
        try {
            const response = await apiClient.post(`/api/conversations`, { recipientId: partnerId });
            navigate(`/chat/${response.data.conversation_id}`);
        } catch (error) {
            alert("Could not start chat.");
        }
    };

    return (
        <Container>
            <PageHeader title="My Offers" />
            <TabNav>
                <TabButton $active={activeTab === 'received'} onClick={() => setActiveTab('received')}>Received (Selling)</TabButton>
                <TabButton $active={activeTab === 'made'} onClick={() => setActiveTab('made')}>Made (Buying)</TabButton>
            </TabNav>
            <OfferList>
                {/* ✅ ADDED LOADER HERE */}
                {isLoading ? (
                    <Loader text="Loading Offers..." />
                ) : offers.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '2rem', border: '1px dashed #ccc', borderRadius: '12px'}}>
                        <p>No offers found.</p>
                    </div>
                ) : (
                    offers.map(offer => {
                        const isSellersTurn = activeTab === 'received' && offer.status === 'pending_seller';
                        const isBuyersTurn = activeTab === 'made' && offer.status === 'pending_buyer';
                        const isAccepted = offer.status === 'accepted';
                        
                        const details = offer.diamond_details || { carat: offer.carat, shape: offer.shape, color: offer.color, clarity: offer.clarity };

                        return (
                        <OfferCard key={offer.offer_id} $faded={offer.status === 'rejected'} onClick={() => navigate(`/listing/${offer.listing_id}`)}>
                            <OfferTitle>{formatDiamondDetails(details)}</OfferTitle>
                            <OfferInfo>Price: <OfferPrice>₹{parseInt(offer.offer_price, 10).toLocaleString('en-IN')}</OfferPrice></OfferInfo>
                            
                            <OfferInfo>
                                Status: <OfferStatus color={getStatusColor(offer.status)}>
                                    {getStatusText(offer.status)}
                                </OfferStatus>
                            </OfferInfo>
                            
                            <OfferInfo>{activeTab === 'received' ? `From: ${offer.buyer_name}` : `To: ${offer.seller_name}`}</OfferInfo>
                            
                            {isAccepted && (
                                <SuccessBanner>
                                    <PiSealCheckFill size={24} />
                                    <div>
                                        <strong>Sold!</strong> Transaction recorded.
                                    </div>
                                </SuccessBanner>
                            )}

                            {(isSellersTurn || isBuyersTurn) && !isAccepted && (
                                <OfferActions>
                                    <ActionButton $accept onClick={(e) => handleResponse(e, offer, 'accept')} disabled={isSubmitting}>Accept</ActionButton>
                                    <ActionButton $reject onClick={(e) => handleResponse(e, offer, 'reject')} disabled={isSubmitting}>Reject</ActionButton>
                                    <ActionButton onClick={(e) => openCounterModal(e, offer)} disabled={isSubmitting}>Counter</ActionButton>
                                </OfferActions>
                            )}
                            
                            {isAccepted && (
                                <OfferActions>
                                    <ActionButton onClick={(e) => startChat(e, activeTab === 'received' ? offer.buyer_id : offer.seller_id)}>
                                        <PiChatCircleDots /> Chat with {activeTab === 'received' ? 'Buyer' : 'Seller'}
                                    </ActionButton>
                                </OfferActions>
                            )}
                        </OfferCard>
                    )
                }))}
            </OfferList>

            {isCounterModalOpen && (
                <ModalBackdrop onClick={() => setCounterModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle>Counter Offer</ModalTitle>
                        <p>Current: ₹{parseInt(currentOffer?.offer_price, 10).toLocaleString('en-IN')}</p>
                        <ModalInput 
                            type="number" placeholder="Enter New Price" 
                            autoFocus
                            value={newCounterPrice} onChange={e => setNewCounterPrice(e.target.value)}
                        />
                        <ModalActions>
                            <ModalButton onClick={() => setCounterModalOpen(false)}>Cancel</ModalButton>
                            <ModalButton $primary onClick={onCounterModalSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Counter'}
                            </ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </Container>
    );
}
export default OffersPage;