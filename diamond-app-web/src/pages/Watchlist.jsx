// src/pages/Watchlist.jsx

import React from 'react';
import styled from 'styled-components';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { PiArrowLeft, PiStar } from "react-icons/pi";
import EmptyState from '../components/EmptyState';

const Container = styled.div``;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
`;

const HeaderTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.5rem;
`;

const ItemCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
    const { watchlist = [] } = useOutletContext() || {};

    return (
        <Container>
            <Header>
                <PiArrowLeft size={32} color="#64748B" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <HeaderTitle>My Watchlist</HeaderTitle>
                <div style={{ width: 32 }}></div>
            </Header>
            
            {watchlist.length > 0 ? (
                <ItemsList>
                    {watchlist.map(item => (
                        <ItemCard key={`${item.type}-${item.id}`}>
                            <CardHeader>
                                <ItemTitle>{item.title}</ItemTitle>
                                <ItemPrice>
                                    {typeof item.price === 'number' ? `₹${item.price.toLocaleString('en-IN')}` : item.price}
                                </ItemPrice>
                            </CardHeader>
                            <ItemDetails>
                                {item.type === 'demand' ? `Posted by: ${item.poster}` : `Specs: ${item.specs}`}
                            </ItemDetails>
                        </ItemCard>
                    ))}
                </ItemsList>
            ) : (
                <EmptyState 
                    icon={PiStar}
                    title="Your Watchlist is Empty"
                    message="Click the star icon on a demand or listing to add it here."
                />
            )}
        </Container>
    );
}

export default Watchlist;