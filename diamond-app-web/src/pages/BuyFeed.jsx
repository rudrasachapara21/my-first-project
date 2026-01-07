import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { 
  PiStar, PiStarFill, PiMagnifyingGlass, PiFunnelSimple, 
  PiChatCircleDots, PiStorefront, PiTag, PiTrash, PiXBold
} from "react-icons/pi";
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import { SkeletonListingCard } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

// --- STYLED COMPONENTS ---
const Container = styled.div`
  background-color: ${props => props.theme.bgPrimary};
  min-height: 100vh;
`;

const TabNav = styled.div` display: flex; background-color: ${props => props.theme.borderColor}; border-radius: 12px; padding: 5px; margin: 1.5rem; `;
const TabButton = styled.button` flex: 1; padding: 0.75rem; border: none; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; font-family: 'Inter', sans-serif; color: ${props => props.$active ? props.theme.textPrimary : props.theme.textSecondary}; background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'}; `;

// ✅ FIXED: Unified flex container for perfect horizontal alignment
const ControlsContainer = styled.div` 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  padding: 0 1.5rem; 
  margin-bottom: 2rem; 
  width: 100%;
  box-sizing: border-box;
`;

const SearchInputContainer = styled.div` 
  position: relative; 
  flex: 1; 
  display: flex;
  align-items: center;
`;

// ✅ FIXED: Height and border consistency
const SearchInput = styled.input` 
  width: 100%; 
  height: 48px; /* Fixed height for alignment */
  padding: 0 1rem 0 3.2rem; 
  border-radius: 14px; 
  border: 1px solid ${props => props.theme.borderColor}; 
  background: ${props => props.theme.bgSecondary}; 
  color: ${props => props.theme.textPrimary}; 
  font-size: 1rem; 
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentPrimary};
  }
`;

const SearchIcon = styled(PiMagnifyingGlass)` 
  position: absolute; 
  top: 50%; 
  left: 1.2rem; 
  transform: translateY(-50%); 
  color: ${props => props.theme.textSecondary}; 
  font-size: 1.2rem;
  z-index: 2;
`;

// ✅ FIXED: Button UI hierarchy and alignment
const FilterTrigger = styled.button` 
  height: 48px; /* Matches SearchInput height exactly */
  background: ${props => props.$active ? props.theme.accentPrimary : props.theme.bgSecondary}; 
  border: 1px solid ${props => props.$active ? props.theme.accentPrimary : props.theme.borderColor}; 
  color: ${props => props.$active ? 'white' : props.theme.textPrimary}; 
  border-radius: 14px; 
  padding: 0 1.5rem; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  gap: 0.5rem; 
  font-weight: 600;
  flex-shrink: 0; /* Prevents button from squishing */
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? props.theme.accentPrimary : props.theme.borderColor};
  }
`;

// ✅ FEATURE: Professional Filter Drawer
const FilterDrawer = styled.div`
  position: fixed; top: 0; right: 0; width: 85%; max-width: 400px; height: 100%;
  background: ${props => props.theme.bgSecondary}; z-index: 5000;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
  padding: 2rem; display: flex; flex-direction: column;
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const DrawerOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); z-index: 4999;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const FilterSection = styled.div` margin-bottom: 2rem; `;
const FilterLabel = styled.h4` color: ${props => props.theme.textPrimary}; margin-bottom: 1rem; font-size: 1.1rem; display: flex; justify-content: space-between; `;
const RangeInput = styled.input` width: 100%; margin: 10px 0; accent-color: ${props => props.theme.accentPrimary}; `;

const ShapeGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; `;
const ShapeChip = styled.button` 
  padding: 8px; border-radius: 8px; border: 1px solid ${props => props.$selected ? props.theme.accentPrimary : props.theme.borderColor};
  background: ${props => props.$selected ? props.theme.accentPrimary + '15' : 'transparent'};
  color: ${props => props.$selected ? props.theme.accentPrimary : props.theme.textSecondary};
  cursor: pointer; font-size: 0.85rem; font-weight: 500;
`;

// --- Feed Components ---
const FeedContainer = styled(GlassCard)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border-radius: 28px;
`;
const ListingCardWrapper = styled(Link)` text-decoration: none; color: inherit; display: block; `;
const ListingCard = styled.div` background: ${props => props.theme.bgSecondary}; border-radius: 20px; border: 1px solid ${props => props.theme.borderColor}; overflow: hidden; box-shadow: ${props => props.theme.cardShadow || '0 4px 15px rgba(0,0,0,0.05)'}; `;
const ListingImageWrapper = styled.div` position: relative; `;
const ListingImage = styled.img` width: 100%; height: 260px; object-fit: cover; background-color: ${props => props.theme.bgPrimary}; `;
const ListingContent = styled.div` padding: 1.5rem; `;
const ListingTitle = styled.h3` font-family: 'Clash Display', sans-serif; font-size: 1.3rem; font-weight: 600; color: ${props => props.theme.textPrimary}; margin: 0; `;
const ListingPrice = styled.p` font-size: 1.4rem; color: ${props => props.theme.accentPrimary}; font-weight: 800; margin: 0.5rem 0; `;
const StatusBadge = styled.div`
  position: absolute; top: 1rem; left: 1rem; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: white;
  background: ${props => props.$status === 'sold' ? props.theme.error : props.$status === 'pending' ? props.theme.info : props.theme.success};
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
`;

const WatchlistButton = styled.button` 
  position: absolute; top: 1rem; right: 1rem; width: 40px; height: 40px; border-radius: 50%; border: none;
  background: ${props => props.theme.surfaceGlass}; backdrop-filter: blur(6px); color: ${props => props.theme.textPrimary}; display: flex; align-items: center; justify-content: center; cursor: pointer;
`;

const ApplyButton = styled.button`
  width: 100%; padding: 1.2rem; background: ${props => props.theme.accentPrimary}; color: white; border: none; border-radius: 14px; font-weight: 700; font-size: 1.1rem; cursor: pointer; margin-top: auto;
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
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(1000000); 
  const [caratRange, setCaratRange] = useState(5.0); 
  const [selectedShape, setSelectedShape] = useState('All');

  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  const shapes = ['All', 'Round', 'Princess', 'Pear', 'Oval', 'Emerald', 'Heart', 'Marquise'];

  useEffect(() => {
    if (!user) return;
    const fetchFeedData = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'buyFeed' ? '/api/listings' : '/api/listings/my-listings';
        const [listingsRes, watchlistRes] = await Promise.all([
          apiClient.get(endpoint),
          activeTab === 'buyFeed' ? apiClient.get('/api/watchlist').catch(() => ({data: []})) : {data: []}
        ]);
        
        if (activeTab === 'buyFeed') setListings(listingsRes.data);
        else setMyListings(listingsRes.data);
        
        setWatchlist(new Set(watchlistRes.data.map(item => item.listing_id)));
      } catch (error) { console.error("Fetch error:", error); } 
      finally { setIsLoading(false); }
    };
    fetchFeedData();
  }, [user, activeTab]);

  const filteredListings = useMemo(() => {
    const list = activeTab === 'buyFeed' ? listings : myListings;
    return list.filter(item => {
      const matchesSearch = searchQuery === '' || 
        (item.shape || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.clarity || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const price = parseFloat(item.price || 0);
      const carat = parseFloat(item.carat || 0);
      
      const matchesPrice = price <= priceRange;
      const matchesCarat = carat <= caratRange;
      const matchesShape = selectedShape === 'All' || item.shape === selectedShape;

      return matchesSearch && matchesPrice && matchesCarat && matchesShape;
    });
  }, [listings, myListings, activeTab, searchQuery, priceRange, caratRange, selectedShape]);

  return (
    <Container>
      <PageHeader title={activeTab === 'buyFeed' ? "Marketplace" : "My Inventory"} />
      
      <TabNav>
        <TabButton $active={activeTab === 'buyFeed'} onClick={() => setActiveTab('buyFeed')}>Buy Feed</TabButton>
        <TabButton $active={activeTab === 'myFeed'} onClick={() => setActiveTab('myFeed')}>My Feed</TabButton>
      </TabNav>

      {/* ✅ UI FIX: Perfectly aligned search and filter */}
      <ControlsContainer>
        <SearchInputContainer>
          <SearchIcon size={20} />
          <SearchInput placeholder="Search shape or clarity..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </SearchInputContainer>
        <FilterTrigger 
           $active={priceRange < 1000000 || caratRange < 5 || selectedShape !== 'All'} 
           onClick={() => setIsFilterOpen(true)}
        >
          <PiFunnelSimple size={20} /> Filter
        </FilterTrigger>
      </ControlsContainer>

      {/* ✅ DRAWER UI FOR FILTERS */}
      <DrawerOverlay $isOpen={isFilterOpen} onClick={() => setIsFilterOpen(false)} />
      <FilterDrawer $isOpen={isFilterOpen}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem'}}>
          <h2 style={{margin:0, fontFamily:'Clash Display'}}>Filters</h2>
          <PiXBold size={24} onClick={() => setIsFilterOpen(false)} style={{cursor:'pointer'}} />
        </div>

        <FilterSection>
          <FilterLabel>Max Price: <span>₹{(priceRange/100000).toFixed(1)}L</span></FilterLabel>
          <RangeInput type="range" min="10000" max="1000000" step="10000" value={priceRange} onChange={e => setPriceRange(e.target.value)} />
        </FilterSection>

        <FilterSection>
          <FilterLabel>Max Carat: <span>{caratRange}ct</span></FilterLabel>
          <RangeInput type="range" min="0.1" max="5.0" step="0.1" value={caratRange} onChange={e => setCaratRange(e.target.value)} />
        </FilterSection>

        <FilterSection>
          <FilterLabel>Diamond Shape</FilterLabel>
          <ShapeGrid>
            {shapes.map(s => (
              <ShapeChip key={s} $selected={selectedShape === s} onClick={() => setSelectedShape(s)}>{s}</ShapeChip>
            ))}
          </ShapeGrid>
        </FilterSection>

        <ApplyButton onClick={() => setIsFilterOpen(false)}>Apply Filters</ApplyButton>
      </FilterDrawer>

      <FeedContainer>
        {isLoading ? <SkeletonListingCard /> : filteredListings.map(item => (
          <ListingCardWrapper to={`/listing/${item.listing_id}`} key={item.listing_id}>
            <ListingCard>
              <ListingImageWrapper>
                <ListingImage src={item.image_urls?.[0]?.startsWith('http') ? item.image_urls[0] : `${API_ROOT_URL}${item.image_urls?.[0] || '/placeholder.png'}`} />
                {item.status !== 'available' && <StatusBadge $status={item.status}>{item.status}</StatusBadge>}
              </ListingImageWrapper>
              <ListingContent>
                <ListingTitle>{item.carat}ct {item.shape} ({item.clarity})</ListingTitle>
                <ListingPrice>₹{parseInt(item.price).toLocaleString('en-IN')}</ListingPrice>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1rem'}}>
                  <span style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>Seller: {item.full_name}</span>
                  <PiChatCircleDots size={24} color={'var(--accent-primary)'} />
                </div>
              </ListingContent>
            </ListingCard>
          </ListingCardWrapper>
        ))}
      </FeedContainer>
    </Container>
  );
}

export default BuyFeed;