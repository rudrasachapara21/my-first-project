import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig'; // 1. Import our new central API client
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';

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
    const fetchInterests = async () => {
      try {
        // 2. Use apiClient and a relative path. No manual headers needed!
        const response = await apiClient.get(`/api/demands/${demandId}/interests`);
        setBrokers(response.data);
      } catch (error) {
        console.error("Failed to fetch interests:", error);
        // A 401 error from the backend will be caught here, we can handle it
        if (error.response?.status === 401) {
            navigate('/'); // e.g., redirect to login if not authorized
        } else {
            alert(error.response?.data?.message || "Could not load interests.");
        }
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