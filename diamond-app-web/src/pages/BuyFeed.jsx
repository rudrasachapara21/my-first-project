// src/pages/BuyFeed.jsx

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PiStar, PiStarFill, PiMagnifyingGlass, PiFunnelSimple, PiChatCircleDots } from "react-icons/pi";
import PageHeader from '../components/PageHeader';
import { SkeletonListingCard } from '../components/SkeletonCard';

// ... All styled components are the same ...
const ControlsContainer = styled.div` display: flex; gap: 1rem; padding: 0 1.5rem; margin-bottom: 2rem; `;
const SearchInputContainer = styled.div` position: relative; flex-grow: 1; `;
const SearchInput = styled.input` width: 100%; padding: 0.8rem 1rem 0.8rem 3rem; border-radius: 12px; border: 1px solid ${props => props.theme.borderColor}; background: ${props => props.theme.bgSecondary}; color: ${props => props.theme.textPrimary}; font-size: 1rem; &::placeholder { color: ${props => props.theme.textSecondary}; } `;
const SearchIcon = styled(PiMagnifyingGlass)` position: absolute; top: 50%; left: 1rem; transform: translateY(-50%); color: ${props => props.theme.textSecondary}; `;
const FilterButton = styled.button` background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; color: ${props => props.theme.textPrimary}; border-radius: 12px; padding: 0 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; `;
const FilterDropdown = styled.div` position: absolute; top: calc(100% + 0.5rem); right: 1.5rem; background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 10; min-width: 150px; padding: 0.5rem 0; `;
const DropdownItem = styled.div` padding: 0.75rem 1rem; cursor: pointer; &:hover { background: ${props => props.theme.bgPrimary}; } color: ${props => props.selected ? props.theme.accentPrimary : props.theme.textPrimary}; font-weight: ${props => props.selected ? '600' : '400'}; `;
const Container = styled.div` position: relative; `;
const FeedContainer = styled.div` padding: 0 1.5rem 2rem 1.5rem; display: flex; flex-direction: column; gap: 2rem; `;
const ListingCard = styled.div` background: ${props => props.theme.bgSecondary}; border-radius: 16px; border: 1px solid ${props => props.theme.borderColor}; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); `;
const ListingImageWrapper = styled.div` position: relative; `;
const ListingImage = styled.img` width: 100%; height: 250px; object-fit: cover; background-color: ${props => props.theme.bgPrimary}; `;
const ListingContent = styled.div` padding: 1.5rem; `;
const ListingTitle = styled.h3` font-size: 1.2rem; font-weight: 600; margin: 0; `;
const ListingPrice = styled.p` font-size: 1.1rem; color: ${props => props.theme.accentPrimary}; font-weight: bold; margin: 0.5rem 0; `;
const ListingSpecs = styled.p` font-size: 0.9rem; color: ${props => props.theme.textSecondary}; margin: 0; `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary}; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; `;
const WatchlistButton = styled.button` background: none; border: none; cursor: pointer; color: ${props => props.theme.accentSecondary}; font-size: 1.5rem; padding: 0; position: absolute; top: 1rem; right: 1rem; background-color: rgba(0,0,0,0.3); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; `;


function BuyFeed() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [watchlist, setWatchlist] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('price-desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchListings = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5001/api/listings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(response.data);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [isLoggedIn, navigate]);

  const handleStartConversation = async (seller) => {
    const message_content = "Hello, I'm interested in one of your listings.";
    const token = localStorage.getItem('token');
    try {
        const response = await axios.post('http://localhost:5001/api/conversations', {
            recipientId: seller.trader_id,
            message_content
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        navigate(`/chat/${response.data.conversationId}`, { state: { partnerName: seller.user_name } });
    } catch (error) {
        alert(error.response?.data?.message || "Could not start conversation. You may already have a chat with this user.");
        // Optional: find existing conversation and navigate to it
    }
  };

  // ... (toggleWatchlist and filteredAndSortedListings are the same)
  const toggleWatchlist = (listingId) => {
    setWatchlist(prev => {
      const newWatchlist = new Set(prev);
      if (newWatchlist.has(listingId)) newWatchlist.delete(listingId);
      else newWatchlist.add(listingId);
      return newWatchlist;
    });
  };
  const filteredAndSortedListings = useMemo(() => {
    return listings
      .filter(item =>
        (item.diamond_details?.shape.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.diamond_details?.clarity.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [listings, searchQuery, sortBy]);


  if (!isLoggedIn) return null;

  return (
    <Container>
      <PageHeader title="Buy Feed" />
      <ControlsContainer>
        {/* ... (Search and filter controls are the same) ... */}
      </ControlsContainer>
      {/* ... (Filter dropdown is the same) ... */}
      <FeedContainer>
        {isLoading ? (
          <><SkeletonListingCard /><SkeletonListingCard /></>
        ) : (
          filteredAndSortedListings.map(item => {
            const isSaved = watchlist.has(item.listing_id);
            const title = `${item.diamond_details.carat}ct, ${item.diamond_details.clarity}, ${item.diamond_details.shape}`;
            const isOwnListing = currentUser?.user_id === item.trader_id;
            
            return (
              <ListingCard key={item.listing_id}>
                <ListingImageWrapper>
                  <ListingImage src={item.image_url ? `http://localhost:5001/${item.image_url}` : 'https://placehold.co/600x400'} alt={title} />
                  <WatchlistButton onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(item.listing_id); }}>
                    {isSaved ? <PiStarFill color="#FBBF24" /> : <PiStar color="#FFFFFF" />}
                  </WatchlistButton>
                </ListingImageWrapper>
                <ListingContent>
                  <ListingTitle>{title}</ListingTitle>
                  <ListingPrice>₹{parseInt(item.price, 10).toLocaleString('en-IN')}</ListingPrice>
                  <ListingSpecs>Seller: {item.user_name}</ListingSpecs>
                  
                  {/* MODIFIED: Button is now "Message Seller" */}
                  {!isOwnListing && (
                     <CtaButton onClick={() => handleStartConversation(item)}>
                        <PiChatCircleDots /> Message Seller
                    </CtaButton>
                  )}
                </ListingContent>
              </ListingCard>
            );
          })
        )}
      </FeedContainer>
    </Container>
  );
}

export default BuyFeed;