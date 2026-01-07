import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
// ✅ ADDED: Professional toast system
import toast, { Toaster } from 'react-hot-toast'; 

import { 
    PiCertificate, PiChatCircleDots, PiMapPinLine, PiPhone, 
    PiTag, PiTrash, PiEnvelope, PiCheckCircle, PiWarningCircle, PiX,
    PiMagnifyingGlassPlusBold, PiCaretLeftBold, PiCaretRightBold, PiWarningBold
} from "react-icons/pi";

// --- Animations ---
const slideDown = keyframes`
  from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- Layout Strategy ---
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: ${props => props.theme.bgPrimary};
  overflow: hidden; 
  position: relative;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 5rem; 
`;

// ✅ NEW: Professional Gallery Section (Replaces BigImage)
const GallerySection = styled.div`
  position: relative;
  width: 100%;
  height: 350px;
  min-height: 350px;
  border-radius: 20px;
  overflow: hidden;
    background: ${props => props.theme.bgPrimary};
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  flex-shrink: 0;
`;

const MainImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: zoom-in;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  ${props => props.$left ? 'left: 10px;' : 'right: 10px;'}
  &:disabled { opacity: 0; cursor: default; }
`;

const ImageCounter = styled.div`
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
`;

// ✅ NEW: Inspection Lightbox for Pinch-to-Zoom
const InspectionLightbox = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
    background: ${props => props.theme.bgPrimary};
  z-index: 5000;
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.3s ease;
`;

const LightboxHeader = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
    color: ${props => props.theme.textMain};
  z-index: 5010;
`;

const ZoomArea = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pinch-zoom;
`;

const ZoomableImg = styled.img`
  max-width: ${props => props.$zoom}% ;
  transition: max-width 0.3s ease;
  transform-origin: center;
`;

const ZoomControls = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  background: rgba(255,255,255,0.2);
  padding: 10px 20px;
  border-radius: 30px;
  backdrop-filter: blur(10px);
`;

// --- Original Content Styles (PRESERVED) ---
const ActionBar = styled.div`
  flex-shrink: 0;
  padding: 1rem 1.5rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  background-color: ${props => props.theme.bgSecondary};
  border-top: 1px solid ${props => props.theme.borderColor};
  display: flex;
  gap: 1rem;
  align-items: center;
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
`;

const Section = styled.div` background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); `;
const SectionTitle = styled.h2` font-family: 'Clash Display', sans-serif; font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; color: ${props => props.theme.textPrimary}; border-bottom: 1px solid ${props => props.theme.borderColor}; padding-bottom: 0.75rem; `;
const SellerOverview = styled.div` display: flex; align-items: center; gap: 1rem; `;
const Avatar = styled.img` width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background-color: #A5B4FC; flex-shrink: 0; `;
const SellerName = styled.h3` margin: 0; font-size: 1.2rem; font-weight: 600; color: ${props => props.theme.textPrimary}; `;
const SellerOffice = styled.p` margin: 0.25rem 0 0 0; color: ${props => props.theme.textSecondary}; font-size: 0.95rem; `;
const DetailsGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; `;
const DetailItem = styled.div` strong { color: ${props => props.theme.textSecondary}; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 0.25rem; font-weight: 500; } span { color: ${props => props.theme.textPrimary}; display: block; margin-top: 0.2rem; font-size: 1rem; } `;

const CtaButton = styled.a` 
  box-sizing: border-box; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 0.75rem; 
  width: 100%; 
  padding: 0.8rem; 
  margin-top: 1.5rem; 
  border: 1px solid ${props => props.theme.accentPrimary}; 
  border-radius: 12px; 
  background: transparent; 
  color: ${props => props.theme.accentPrimary}; 
  font-family: 'Clash Display', sans-serif; 
  font-size: 1rem; 
  font-weight: 600; 
  cursor: pointer; 
  text-decoration: none; 
  transition: all 0.2s; 

  &:hover { 
    background-color: ${props => props.theme.accentPrimary}; 
    color: white; 
  } 
`;

const ActionButton = styled.button` 
  flex: 1; padding: 1rem; border: none; border-radius: 12px; 
  font-family: 'Clash Display', sans-serif; font-size: 1rem; font-weight: 600; cursor: pointer; 
  display: flex; align-items: center; justify-content: center; gap: 0.5rem; 
  transition: transform 0.1s; 
  &:active { transform: scale(0.98); }
`;
const PrimaryButton = styled(ActionButton)` background: ${props => props.theme.accentPrimary}; color: white; `;
const SecondaryButton = styled(ActionButton)` background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary}; `;
const DeleteButton = styled(ActionButton)` flex: 0.4; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; `;
const ReactivateButton = styled(ActionButton)` background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; `;

const StatusBadge = styled.div`
    padding: 0.75rem; border-radius: 12px; font-weight: bold; text-align: center; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    
    ${props => props.$status === 'sold' && css`
        background: #F3F4F6;
        color: #4B5563;
        border: 1px solid #D1D5DB;
    `}

    ${props => props.$status === 'pending' && css`
        background: #FFF7ED;
        color: #C2410C;
        border: 1px solid #FED7AA;
    `}

    ${props => !['sold', 'pending'].includes(props.$status) && css`
        background: #ECFDF5;
        color: #047857;
        border: 1px solid #6EE7B7;
    `}
`;

// --- Modals ---
const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 6000; animation: ${fadeIn} 0.2s ease-out; `;
const ModalContent = styled.div` background: ${props => props.theme.bgSecondary}; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; border: 1px solid ${props => props.theme.borderColor}; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);`;
const ModalTitle = styled.h2` margin-top: 0; font-family: 'Clash Display', sans-serif; `;
const ModalText = styled.p` color: ${props => props.theme.textSecondary}; line-height: 1.5; margin-bottom: 1.5rem; `;
const ModalInput = styled.input` width: 100%; padding: 0.8rem; margin: 1rem 0 0.5rem 0; border: 1px solid ${props => props.theme.borderColor}; border-radius: 6px; font-size: 1.1rem; box-sizing: border-box; background: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; `;
const ModalActions = styled.div` display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; `;
const ModalButton = styled.button` padding: 0.8rem 1.5rem; border-radius: 8px; border: 1px solid ${props => props.$primary ? 'transparent' : props.theme.borderColor}; font-weight: 600; cursor: pointer; background: ${props => props.$primary ? props.theme.accentPrimary : 'transparent'}; color: ${props => props.$primary ? 'white' : props.theme.textPrimary}; transition: opacity 0.2s; &:disabled { opacity: 0.5; cursor: not-allowed; } `;
const PriceDiff = styled.p` font-size: 0.85rem; margin: 0; color: ${props => props.$good ? '#22c55e' : '#ef4444'}; font-weight: 500; `;

function ListingDetailsPage() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI Logic States (PRESERVED)
    const [isOfferModalOpen, setOfferModalOpen] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Gallery & Zoom States
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Confirmation Modal State (PRESERVED)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });
    
    const API_ROOT_URL = (import.meta.env.VITE_API_URL || '').replace('/api', '');

    const openConfirm = (title, message, action) => {
        setConfirmModal({ isOpen: true, title, message, action });
    };

    const closeConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleConfirmAction = async () => {
        if (confirmModal.action) {
            await confirmModal.action();
        }
        closeConfirm();
    };

    const fetchListing = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/api/listings/${listingId}`);
            setListing(response.data);
        } catch (error) {
            if (error.response?.status === 404) navigate('/buy-feed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchListing(); }, [user, listingId]);

    const handleStartConversation = async () => {
        try {
            const recipientId = listing.user_id || listing.trader_id;
            const response = await apiClient.post(`/api/conversations`, { recipientId });
            navigate(`/chat/${response.data.conversation_id}`, { state: { partnerName: listing.full_name, partnerId: recipientId } });
        } catch (error) { toast.error("Could not start conversation."); }
    };
    
    const handleMakeOffer = async () => {
        if (!offerPrice || isNaN(offerPrice) || offerPrice <= 0) { toast.error('Please enter a valid price.'); return; }
        setIsSubmitting(true);
        const loadToast = toast.loading('Sending offer...');
        try {
            await apiClient.post(`/api/offers/${listingId}`, { offer_price: offerPrice });
            setOfferModalOpen(false);
            setOfferPrice('');
            toast.success('Offer Sent Successfully!', { id: loadToast });
        } catch (error) { toast.error('Failed to send offer.', { id: loadToast }); } 
        finally { setIsSubmitting(false); }
    };

    const handleDelete = () => {
        openConfirm(
            "Delete Listing?",
            "This action cannot be undone. The listing will be permanently removed.",
            async () => {
                try { await apiClient.delete(`/api/listings/${listingId}`); navigate('/buy-feed'); } 
                catch (error) { toast.error('Failed to delete.'); }
            }
        );
    };

    const handleMarkSold = () => {
        openConfirm(
            "Mark as Sold?",
            "Confirm that the deal is complete and payment has been received.",
            async () => {
                try { await apiClient.put(`/api/listings/${listingId}/sold`); fetchListing(); toast.success('Marked as Sold'); } 
                catch (error) { toast.error("Failed to mark sold."); }
            }
        );
    };

    const handleReactivate = () => {
        openConfirm(
            "Reactivate Listing?",
            "This will cancel the pending status and make the diamond visible to buyers again.",
            async () => {
                try { await apiClient.put(`/api/listings/${listingId}/reactivate`); fetchListing(); toast.success('Listing Reactivated'); } 
                catch (error) { toast.error("Failed to reactivate."); }
            }
        );
    };

    const getPriceDiff = () => {
        if (!listing || !offerPrice) return null;
        const asking = parseFloat(listing.price);
        const offer = parseFloat(offerPrice);
        if (isNaN(offer)) return null;
        const diff = ((asking - offer) / asking) * 100;
        const isGood = diff < 20; 
        if (diff > 0) return { text: `${diff.toFixed(1)}% below asking price`, good: isGood };
        if (diff < 0) return { text: `${Math.abs(diff).toFixed(1)}% above asking price`, good: true };
        return { text: "Matching asking price", good: true };
    };

    if (isLoading || !user) return <Loader fullScreen={true} text="Fetching Diamond Details..." />;
    if (!listing) return <PageContainer><PageHeader title="Not Found" backTo={-1} /></PageContainer>;
    
    const currentUserId = user?.user_id || user?.id;
    const listingOwnerId = listing.user_id || listing.trader_id;
    const isOwner = String(currentUserId) === String(listingOwnerId);
    
    const isPending = listing.status === 'pending';
    const isSold = listing.status === 'sold';

    // ✅ Resolved Multiple Images Path
    const images = (listing.image_urls || []).map(url => {
        if (!url) return 'https://placehold.co/800x600?text=No+Image';
        if (url.startsWith('http')) return url;
        return `${API_ROOT_URL}${url.startsWith('/') ? url : '/' + url}`;
    });
    if (images.length === 0) images.push('https://placehold.co/800x600?text=No+Image');

    const handleNext = (e) => { e.stopPropagation(); setCurrentImgIndex(p => p < images.length - 1 ? p + 1 : p); };
    const handlePrev = (e) => { e.stopPropagation(); setCurrentImgIndex(p => p > 0 ? p - 1 : p); };

    const profileAvatarUrl = listing.profile_photo_url?.startsWith('http')
        ? listing.profile_photo_url
        : (listing.profile_photo_url ? `${API_ROOT_URL}${listing.profile_photo_url}` : `https://ui-avatars.com/api/?name=${listing.full_name}&background=a5b4fc&color=fff`);

    const certificateLink = listing.certificate_url?.startsWith('http')
        ? listing.certificate_url
        : (listing.certificate_url ? `${API_ROOT_URL}${listing.certificate_url}` : null);

    const priceDiff = getPriceDiff();

    return (
        <PageContainer>
            {/* ✅ Professional Toaster */}
            <Toaster position="top-center" reverseOrder={false} />

            <div style={{ flexShrink: 0 }}>
                <PageHeader title={listing.title || `${listing.carat}ct ${listing.shape}`} backTo={-1} />
            </div>

            <ScrollableContent>
                {/* ✅ INTEGRATED GALLERY SECTION (REPLACES STATIC IMAGE) */}
                <GallerySection onClick={() => setIsZoomOpen(true)}>
                    <MainImage src={images[currentImgIndex]} alt="Diamond" />
                    {images.length > 1 && (
                        <>
                            <NavButton $left onClick={handlePrev} disabled={currentImgIndex === 0}><PiCaretLeftBold size={20}/></NavButton>
                            <NavButton onClick={handleNext} disabled={currentImgIndex === images.length - 1}><PiCaretRightBold size={20}/></NavButton>
                            <ImageCounter>{currentImgIndex + 1} / {images.length}</ImageCounter>
                        </>
                    )}
                </GallerySection>
                
                {isPending && <StatusBadge $status="pending"><PiWarningCircle size={20}/> Deal Pending (Booked)</StatusBadge>}
                {isSold && <StatusBadge $status="sold"><PiCheckCircle size={20}/> Sold</StatusBadge>}

                <Section>
                    <SectionTitle>Diamond Details</SectionTitle>
                    <DetailsGrid>
                        <DetailItem><strong>Price:</strong><span>₹{parseInt(listing.price).toLocaleString('en-IN')}</span></DetailItem>
                        <DetailItem><strong>Carat:</strong><span>{listing.carat}</span></DetailItem>
                        <DetailItem><strong>Clarity:</strong><span>{listing.clarity}</span></DetailItem>
                        <DetailItem><strong>Shape:</strong><span>{listing.shape}</span></DetailItem>
                        <DetailItem><strong>Color:</strong><span>{listing.color}</span></DetailItem>
                        <DetailItem><strong>Cut:</strong><span>{listing.cut}</span></DetailItem>
                        {listing.certificate_number && <DetailItem><strong>Report:</strong><span>{listing.certificate_number}</span></DetailItem>}
                    </DetailsGrid>

                    {certificateLink && (
                        <CtaButton href={certificateLink} target="_blank" rel="noopener noreferrer">
                            <PiCertificate /> View Certificate
                        </CtaButton>
                    )}
                </Section>
                
                <Section>
                    <SectionTitle>Seller Information</SectionTitle>
                    <SellerOverview>
                        <Avatar src={profileAvatarUrl} />
                        <div>
                            <SellerName>{listing.full_name}</SellerName>
                            <SellerOffice>{listing.office_name || 'Individual Trader'}</SellerOffice>
                        </div>
                    </SellerOverview>
                    <DetailsGrid>
                        <DetailItem><strong><PiMapPinLine /> Location:</strong><span>{listing.office_address || 'Not Disclosed'}</span></DetailItem>
                        <DetailItem><strong><PiPhone /> Phone:</strong><span>{listing.phone_number || 'Hidden'}</span></DetailItem>
                    </DetailsGrid>
                </Section>
            </ScrollableContent>

            <ActionBar>
                {isOwner ? (
                    <>
                        {isPending && <ActionButton style={{background:'#F3F4F6', color:'#374151'}} onClick={handleMarkSold}>Mark Sold</ActionButton>}
                        {isPending && <ReactivateButton onClick={handleReactivate}>Reactivate</ReactivateButton>}
                        {!isSold && !isPending && (
                            <>
                                <DeleteButton onClick={handleDelete}><PiTrash /></DeleteButton>
                                <PrimaryButton onClick={() => navigate(`/listing/${listingId}/offers`)}>
                                    <PiEnvelope /> View Offers
                                </PrimaryButton>
                            </>
                        )}
                        {isSold && <p style={{width:'100%', textAlign:'center', color:'#6B7280', margin:0, fontWeight:600}}>This listing is archived</p>}
                    </>
                ) : (
                    <>
                        {isPending ? (
                            <p style={{width: '100%', textAlign:'center', color:'#B45309', fontWeight:'bold'}}>Currently Booked</p>
                        ) : isSold ? (
                            <p style={{width: '100%', textAlign:'center', color:'#4B5563', fontWeight:'bold'}}>Sold Out</p>
                        ) : (
                            <>
                                <SecondaryButton onClick={() => setOfferModalOpen(true)}>
                                    <PiTag /> Make Offer
                                </SecondaryButton>
                                <PrimaryButton onClick={handleStartConversation}>
                                    <PiChatCircleDots /> Message
                                </PrimaryButton>
                            </>
                        )}
                    </>
                )}
            </ActionBar>

            {/* ✅ INTEGRATED INSPECTION LIGHTBOX (ZOOM) */}
            {isZoomOpen && (
                <InspectionLightbox>
                    <LightboxHeader>
                        <span>Inspection Mode</span>
                        <PiX size={30} onClick={() => {setIsZoomOpen(false); setZoomLevel(100);}} style={{cursor:'pointer'}}/>
                    </LightboxHeader>
                    <ZoomArea>
                        <ZoomableImg src={images[currentImgIndex]} $zoom={zoomLevel} />
                    </ZoomArea>
                    <ZoomControls>
                        <PiMagnifyingGlassPlusBold size={24} color="white" onClick={() => setZoomLevel(p => Math.min(p + 50, 400))} />
                        <span style={{color:'white', fontWeight:'bold'}}>{zoomLevel}%</span>
                        <PiWarningCircle size={24} color="white" onClick={() => setZoomLevel(100)} />
                    </ZoomControls>
                </InspectionLightbox>
            )}

            {isOfferModalOpen && (
                <ModalBackdrop onClick={() => setOfferModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle>Make an Offer</ModalTitle>
                        <p style={{margin: '0.5rem 0', color: '#666'}}>Asking Price: ₹{parseInt(listing.price).toLocaleString('en-IN')}</p>
                        <ModalInput 
                            type="number" autoFocus placeholder="Enter your price" 
                            value={offerPrice} onChange={e => setOfferPrice(e.target.value)} 
                        />
                        {priceDiff && <PriceDiff $good={priceDiff.good}>{priceDiff.text}</PriceDiff>}
                        <ModalActions>
                            <ModalButton onClick={() => setOfferModalOpen(false)}>Cancel</ModalButton>
                            <ModalButton $primary onClick={handleMakeOffer} disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Submit Offer'}
                            </ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalBackdrop>
            )}

            {confirmModal.isOpen && (
                <ModalBackdrop onClick={closeConfirm}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle>{confirmModal.title}</ModalTitle>
                        <ModalText>{confirmModal.message}</ModalText>
                        <ModalActions>
                            <ModalButton onClick={closeConfirm}>Cancel</ModalButton>
                            <ModalButton $primary onClick={handleConfirmAction}>Confirm</ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </PageContainer>
    );
}

export default ListingDetailsPage;