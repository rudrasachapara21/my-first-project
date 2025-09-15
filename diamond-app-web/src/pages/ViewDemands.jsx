// src/pages/ViewDemands.jsx

import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { PiFaders, PiHandWaving, PiStar, PiStarFill } from "react-icons/pi";
import FilterPanel from '../components/FilterPanel';
import { SkeletonDemandCard } from '../components/SkeletonCard';
import PageHeader from '../components/PageHeader';

// ... All styled components are the same ...
const Container = styled.div``;
const FilterBarContainer = styled.div` display: flex; gap: 0.75rem; align-items: center; padding: 0 1.5rem 2rem 1.5rem; `;
const SearchInput = styled.input` flex-grow: 1; padding: 0.9rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const FilterButton = styled.button` padding: 0.9rem; border: 2px solid ${props => props.theme.borderColor}; background-color: ${props => props.theme.bgSecondary}; color: ${props => props.theme.textSecondary}; border-radius: 12px; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; `;
const DemandsList = styled.div` display: flex; flex-direction: column; gap: 1rem; padding: 0 1.5rem; `;
const DemandCard = styled.div` background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); `;
const CardHeader = styled.div` display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; `;
const DemandTitle = styled.div`font-size: 1.4rem; font-weight: 500; padding-right: 1rem;`;
const DemandDetails = styled.p` font-size: 0.9rem; color: ${props => props.theme.textSecondary}; line-height: 1.5; margin: 0 0 1.5rem 0; `;
const CardFooter = styled.div` display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; `;
const RaiseHandButton = styled.button` padding: 0.6rem 1.2rem; border-radius: 8px; border: none; background: ${props => props.disabled ? props.theme.borderColor : props.theme.accentPrimary}; color: ${props => props.disabled ? props.theme.textSecondary : 'white'}; cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'}; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.1s ease-in-out; &:active { transform: scale(0.97); } `;
const WatchlistButton = styled.button` background: none; border: none; cursor: pointer; color: ${props => props.theme.accentSecondary}; font-size: 1.5rem; padding: 0; `;


function ViewDemands() {
  const { watchlist = [], toggleWatchlist } = useOutletContext() || {};
  const navigate = useNavigate();
  const [demands, setDemands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({ sortBy: 'newest' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const fetchDemands = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/demands', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDemands(response.data);
      } catch (error) {
        console.error("Failed to fetch demands:", error);
        if (error.response?.status === 401) navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDemands();
  }, [navigate]);

  const processedDemands = useMemo(() => {
    let filtered = [...demands];
    // Filtering and sorting logic...
    return filtered;
  }, [demands, searchTerm, filters]);

  return (
    <Container>
      <PageHeader title="View Demands" />
      <FilterBarContainer>
        <SearchInput placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <FilterButton onClick={() => setIsFilterPanelOpen(true)}><PiFaders /></FilterButton>
      </FilterBarContainer>
      <DemandsList>
        {isLoading ? (
          <><SkeletonDemandCard /><SkeletonDemandCard /><SkeletonDemandCard /></>
        ) : (
          processedDemands.map(demand => {
            const isSaved = watchlist.some(item => item.id === demand.demand_id && item.type === 'demand');
            
            const demandTitle = typeof demand.diamond_details === 'object' && demand.diamond_details !== null
                ? `${demand.diamond_details.carat || ''}ct, ${demand.diamond_details.clarity || ''}, ${demand.diamond_details.shape || ''}`
                : demand.diamond_details;

            return (
              <DemandCard key={demand.demand_id}>
                <CardHeader>
                  <DemandTitle>{demandTitle}</DemandTitle>
                  <WatchlistButton onClick={() => toggleWatchlist(demand, 'demand')}>
                    {isSaved ? <PiStarFill color="#FBBF24" /> : <PiStar />}
                  </WatchlistButton>
                </CardHeader>
                <DemandDetails>Posted by: {demand.user_name}</DemandDetails>
                <CardFooter>
                  <div><strong>{demand.interest_count || 0}</strong> Brokers Interested</div>
                  <RaiseHandButton disabled={false} onClick={() => alert('Interest noted!')}>
                    <PiHandWaving size={16} /> Raise Hand
                  </RaiseHandButton>
                </CardFooter>
              </DemandCard>
            );
          })
        )}
      </DemandsList>
      {/* THIS IS THE FIX */}
      {isFilterPanelOpen && <FilterPanel onClose={() => setIsFilterPanelOpen(false)} filters={filters} setFilters={setFilters} />}
    </Container>
  );
}
export default ViewDemands;