import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { PiStar, PiStarFill, PiMagnifyingGlass, PiFunnelSimple, PiChatCircleDots, PiStorefront, PiTag } from "react-icons/pi";
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { SkeletonListingCard } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

// --- (All styled components remain the same) ---
const Container = styled.div``;
const TabNav = styled.div` display: flex; background-color: ${props => props.theme.borderColor}; border-radius: 12px; padding: 5px; margin: 1.5rem; `;
const TabButton = styled.button` flex: 1; padding: 0.75rem; border: none; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; font-family: 'Inter', sans-serif; color: ${props => props.$active ? '#FFFFFF' : props.theme.textSecondary}; background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'}; `;
const ControlsContainer = styled.div` display: flex; gap: 1rem; align-items: center; padding: 0 1.5rem; margin-bottom: 2rem; `;
const SearchInputContainer = styled.div` position: relative; flex: 1 1 auto; min-width: 0; `;
const SearchInput = styled.input` width: 100%; padding: 0.8rem 1rem 0.8rem 3rem; border-radius: 12px; border: 1px solid ${props => props.theme.borderColor}; background: ${props => props.theme.bgSecondary}; color: ${props => props.theme.textPrimary}; font-size: 1rem; &::placeholder { color: ${props => props.theme.textSecondary}; } `;
const SearchIcon = styled(PiMagnifyingGlass)` position: absolute; top: 50%; left: 1rem; transform: translateY(-50%); color: ${props => props.theme.textSecondary}; `;
const SortWrapper = styled.div` position: relative; flex-shrink: 0; `;
const FilterButton = styled.button` background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; color: ${props => props.theme.textPrimary}; border-radius: 12px; padding: 0.8rem 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1rem; `;
const FilterDropdown = styled.div` position: absolute; top: calc(100% + 5px); right: 0; background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 10; width: 200px; padding: 0.5rem 0; `;
const DropdownItem = styled.div` padding: 0.75rem 1rem; cursor: pointer; &:hover { background: ${props => props.theme.bgPrimary}; } color: ${props => props.selected ? props.theme.accentPrimary : props.theme.textPrimary}; font-weight: ${props => props.selected ? '600' : '400'}; `;
const FeedContainer = styled.div` padding: 0 1.5rem 2rem 1.5rem; display: flex; flex-direction: column; gap: 2rem; `;
const ListingCard = styled.div` background: ${props => props.theme.bgSecondary}; border-radius: 16px; border: 1px solid ${props => props.theme.borderColor}; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); `;
const ListingImageWrapper = styled.div` position: relative; `;
const ListingImage = styled.img` width: 100%; height: 250px; object-fit: cover; background-color: ${props => props.theme.bgPrimary}; `;
const ListingContent = styled.div` padding: 1.5rem; `;
const ListingTitle = styled.h3` font-family: 'Clash Display', sans-serif; font-size: 1.3rem; font-weight: 600; margin: 0; `;
const ListingPrice = styled.p` font-size: 1.2rem; color: ${props => props.theme.accentPrimary}; font-weight: bold; margin: 0.5rem 0; `;
const ListingSpecs = styled.p` font-size: 0.9rem; color: ${props => props.theme.textSecondary}; margin: 0; `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary}; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; margin-top: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s; &:hover { background-color: ${props => props.theme.accentPrimary}; color: white; }`;
const WatchlistButton = styled.button` background: none; border: none; cursor: pointer; color: ${props => props.theme.accentSecondary}; font-size: 1.5rem; padding: 0; position: absolute; top: 1rem; right: 1rem; background-color: rgba(0,0,0,0.3); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; `;
const ListingCardWrapper = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

function BuyFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'buyFeed');
  
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [watchlist, setWatchlist] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('price-desc');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

  useEffect(() => {
    if (!user) return;
    const fetchFeedData = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'buyFeed' ? '/api/listings' : '/api/listings/my-listings';
        // ## FIX: Only fetch watchlist when on the 'buyFeed' tab ##
        const listingsPromise = apiClient.get(endpoint);
        
        let watchlistData = new Set();
        if (activeTab === 'buyFeed') {
          const watchlistRes = await apiClient.get('/api/watchlist');
          watchlistData = new Set(watchlistRes.data.map(item => item.listing_id));
        }

        const listingsRes = await listingsPromise;
        
        if (activeTab === 'buyFeed') { 
          setListings(listingsRes.data); 
        } else { 
          setMyListings(listingsRes.data); 
        }
        setWatchlist(watchlistData);
        
      } catch (error) { console.error("Failed to fetch feed data:", error); } 
      finally { setIsLoading(false); }
    };
    fetchFeedData();
  }, [user, activeTab]);
  
  const handleStartConversation = async (seller) => {
    try {
        const response = await apiClient.post('/api/conversations', { recipientId: seller.trader_id });
        navigate(`/chat/${response.data.conversation_id}`, { state: { partnerName: seller.trader_name } });
    } catch (error) { alert(error.response?.data?.message || "Could not start conversation."); }
  };

  const toggleWatchlist = async (listingId) => {
    const newWatchlist = new Set(watchlist);
    try {
        if (newWatchlist.has(listingId)) {
            newWatchlist.delete(listingId);
            await apiClient.delete(`/api/watchlist/${listingId}`);
        } else {
            newWatchlist.add(listingId);
            await apiClient.post(`/api/watchlist/${listingId}`);
        }
        setWatchlist(newWatchlist);
    } catch (error) { console.error("Failed to update watchlist:", error); }
  };
  
  const listToDisplay = activeTab === 'buyFeed' ? listings : myListings;

  const filteredAndSortedListings = useMemo(() => {
    return listToDisplay
      .map(item => {
        // This parsing logic is correct and robust
        let detailsObject = {};
        try { detailsObject = typeof item.diamond_details === 'string' ? JSON.parse(item.diamond_details) : item.diamond_details; } 
        catch (e) { console.error("Failed to parse details for item:", item.listing_id); }
        return { ...item, diamond_details: detailsObject };
      })
      // ## --- THIS IS THE FIX (Search Logic) --- ##
      // Updated the filter to search on the new, correct fields
      .filter(item => {
        if (activeTab === 'myFeed') return true;
        
        const query = searchQuery.toLowerCase();
        const details = item.diamond_details;
        
        return ( 
          details.carat?.toString().includes(query) ||
          details.clarity?.toLowerCase().includes(query) || 
          details.color?.toLowerCase().includes(query) ||
          details.cut?.toLowerCase().includes(query) ||
          details.gia_report_number?.toLowerCase().includes(query)
        );
      })
      // ## --- END OF FIX --- ##
      .sort((a, b) => {
        if (activeTab === 'myFeed') return 0;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [listToDisplay, searchQuery, sortBy, activeTab]);

  const renderContent = () => {
    if (isLoading) { return <><SkeletonListingCard /><SkeletonListingCard /></>; }
    if (filteredAndSortedListings.length === 0) {
      const emptyStateTitle = activeTab === 'buyFeed' ? "No Listings Found" : "You Have No Listings";
      const emptyStateMessage = activeTab === 'buyFeed' ? "There are currently no items in the feed that match your search." : "Items you post for sale will appear here.";
      const emptyStateIcon = activeTab === 'buyFeed' ? PiStorefront : PiTag;
      return <EmptyState icon={emptyStateIcon} title={emptyStateTitle} message={emptyStateMessage} />
    }
    return filteredAndSortedListings.map(item => {
      const isSaved = watchlist.has(item.listing_id);
      const isOwnListing = user?.id === item.trader_id;
      
      // ## --- THIS IS THE FIX (Display Logic) --- ##
      // Updated the title and specs to show the new data
      const details = item.diamond_details;
      const title = `${details.carat || '?'}ct, ${details.color || ''} ${details.clarity || ''}, ${details.cut || ''} Cut`;
      const giaInfo = details.gia_report_number ? `GIA: ${details.gia_report_number}` : '';
      
      return (
        <ListingCardWrapper to={`/listing/${item.listing_id}`} key={item.listing_id}>
          <ListingCard>
            <ListingImageWrapper>
              <ListingImage src={item.image_urls && item.image_urls[0] ? `${API_ROOT_URL}${item.image_urls[0]}` : 'https://placehold.co/600x400'} alt={title} />
              {/* Only show watchlist button on *other* people's listings */}
              {!isOwnListing && (
                <WatchlistButton onClick={(e) => { e.preventDefault(); toggleWatchlist(item.listing_id); }}>
                  {isSaved ? <PiStarFill color="#FBBF24" /> : <PiStar color="#FFFFFF" />}
                </WatchlistButton>
              )}
            </ListingImageWrapper>
            <ListingContent>
              <ListingTitle>{title}</ListingTitle>
              <ListingPrice>₹{parseInt(item.price, 10).toLocaleString('en-IN')}</ListingPrice>
              <ListingSpecs>{giaInfo}</ListingSpecs>
              <ListingSpecs style={{ marginTop: '4px' }}>Seller: {item.trader_name}</ListingSpecs>
              {/* ## --- END OF FIX --- ## */}

              {!isOwnListing && (
                <CtaButton onClick={(e) => { e.preventDefault(); handleStartConversation(item); }}>
                  <PiChatCircleDots /> Message Seller
                </CtaButton>
              )}
            </ListingContent>
          </ListingCard>
        </ListingCardWrapper>
      );
    })
  };

  return (
    <Container>
      <PageHeader title={activeTab === 'buyFeed' ? "Buy Feed" : "My Feed"} />
      
      <TabNav>
        <TabButton $active={activeTab === 'buyFeed'} onClick={() => setActiveTab('buyFeed')}>Buy Feed</TabButton>
        <TabButton $active={activeTab === 'myFeed'} onClick={() => setActiveTab('myFeed')}>My Feed</TabButton>
      </TabNav>

      {activeTab === 'buyFeed' && (
        <ControlsContainer>
          <SearchInputContainer>
            <SearchIcon size={20} />
            <SearchInput placeholder="Search by Carat, GIA, Cut..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </SearchInputContainer>
          <SortWrapper>
            <FilterButton onClick={() => setShowFilterDropdown(p => !p)}>
              <PiFunnelSimple /> Sort
            </FilterButton>
            {showFilterDropdown && (
              <FilterDropdown onMouseLeave={() => setShowFilterDropdown(false)}>
                <DropdownItem selected={sortBy === 'price-desc'} onClick={() => { setSortBy('price-desc'); setShowFilterDropdown(false); }}>Price: High to Low</DropdownItem>
                <DropdownItem selected={sortBy === 'price-asc'} onClick={() => { setSortBy('price-asc'); setShowFilterDropdown(false); }}>Price: Low to High</DropdownItem>
              </FilterDropdown>
            )}
          </SortWrapper>
        </ControlsContainer>
      )}

      <FeedContainer>
        {renderContent()}
      </FeedContainer>
    </Container>
  );
}

export default BuyFeed;