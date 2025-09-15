// src/pages/ListingDetailPage.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';

const Container = styled.div`
  padding: 1.5rem;
`;

const Title = styled.h2`
  font-family: 'Clash Display', sans-serif;
`;

function ListingDetailPage() {
  // This hook gets the ID from the URL (e.g., the '1' from '/feed/buy/1')
  const { listingId } = useParams();

  return (
    <div>
      <PageHeader title="Diamond Details" />
      <Container>
        <Title>Details for Diamond ID: {listingId}</Title>
        <p>This is where the full details, image gallery, and certificate for the diamond will be displayed.</p>
        <p>(This page is now connected and ready to be built out!)</p>
      </Container>
    </div>
  );
}

export default ListingDetailPage;