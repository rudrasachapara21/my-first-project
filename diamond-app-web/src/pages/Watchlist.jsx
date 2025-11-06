import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { PiStar } from "react-icons/pi";

const Container = styled.div``;

// --- THE FIX: Added margin-top to create space below the header ---
const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem;
  margin-top: 1.5rem;
`;

const ItemCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  cursor: pointer;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ItemTitle = styled.div`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.4rem;
  font-weight: 500;
`;

const ItemPrice = styled.p`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.accentPrimary};
  margin: 0;
  padding-left: 1rem;
`;

const ItemDetails = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  line-height: 1.5;
  margin: 0.5rem 0 0 0;
`;


function Watchlist() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchWatchlist = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get('/api/watchlist');
                setWatchlist(response.data);
            } catch (error) { console.error("Failed to fetch watchlist:", error); }
            finally { setIsLoading(false); }
        };
        fetchWatchlist();
    }, [user]);
    
    const formatDiamondDetails = (details) => {
        if (!details) return '';
        let parts = [];
        if (details.carat) parts.push(`${details.carat}ct`);
        if (details.clarity) parts.push(details.clarity);
        if (details.shape) parts.push(details.shape);
        return parts.join(', ');
    }

    if (isLoading) {
        return (
            <Container>
                <PageHeader title="My Watchlist" backTo={-1} />
                <p style={{ textAlign: 'center' }}>Loading watchlist...</p>
            </Container>
        );
    }

    return (
        <Container>
            <PageHeader title="My Watchlist" backTo={-1} />
            {watchlist.length > 0 ? (
                <ItemsList>
                    {watchlist.map(item => (
                        <ItemCard key={item.listing_id} onClick={() => navigate(`/listing/${item.listing_id}`)}>
                            <CardHeader>
                                <ItemTitle>{item.title || formatDiamondDetails(item.diamond_details)}</ItemTitle>
                                <ItemPrice>
                                    {`₹${parseInt(item.price, 10).toLocaleString('en-IN')}`}
                                </ItemPrice>
                            </CardHeader>
                            <ItemDetails>
                                Sold by: {item.trader_name}
                            </ItemDetails>
                        </ItemCard>
                    ))}
                </ItemsList>
            ) : (
                <EmptyState 
                    icon={PiStar}
                    title="Your Watchlist is Empty"
                    message="Click the star icon on a listing in the Buy Feed to add it here."
                />
            )}
        </Container>
    );
}

export default Watchlist;