// src/pages/DemandInterestsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard'; // Re-using skeleton for loading

const Container = styled.div``;
const BrokerList = styled.div`
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
`;
const BrokerCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px; padding: 1.5rem;
`;
const BrokerName = styled.h3`
  font-size: 1.2rem; font-weight: 600; margin: 0 0 0.5rem 0;
`;
const BrokerInfo = styled.p`
  margin: 0.25rem 0; color: ${props => props.theme.textSecondary};
`;

function DemandInterestsPage() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchInterests = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/demands/${demandId}/interests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBrokers(response.data);
      } catch (error) {
        console.error("Failed to fetch interests:", error);
        alert(error.response?.data?.message || "Could not load interests.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterests();
  }, [demandId, navigate]);

  return (
    <Container>
      <PageHeader title="Interested Brokers" />
      <BrokerList>
        {isLoading ? (
          <><SkeletonDemandCard /><SkeletonDemandCard /></>
        ) : brokers.length > 0 ? (
          brokers.map(broker => (
            <BrokerCard key={broker.user_id}>
              <BrokerName>{broker.full_name}</BrokerName>
              <BrokerInfo><strong>Office:</strong> {broker.office_name}</BrokerInfo>
              <BrokerInfo><strong>Email:</strong> {broker.email}</BrokerInfo>
              <BrokerInfo><strong>Phone:</strong> {broker.phone_number}</BrokerInfo>
            </BrokerCard>
          ))
        ) : (
          <p>No brokers have shown interest in this demand yet.</p>
        )}
      </BrokerList>
    </Container>
  );
}

export default DemandInterestsPage;