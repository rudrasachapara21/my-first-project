// src/pages/DemandDetailPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';

const Container = styled.div` padding-bottom: 2rem; `;
const Section = styled.div` padding: 0 1.5rem; margin-bottom: 2rem; `;
const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif; font-size: 1.5rem;
  margin-top: 0; margin-bottom: 1.5rem; color: ${props => props.theme.textPrimary};
`;
const DemandDetailCard = styled.div`
  background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px; padding: 1.5rem;
`;
const DemandTitle = styled.h3`
  font-size: 1.4rem; font-weight: 600; margin: 0 0 0.5rem 0;
`;
const DemandInfo = styled.p`
  margin: 0.25rem 0; color: ${props => props.theme.textSecondary};
`;
const Actions = styled.div`
  display: flex; gap: 1rem; margin-top: 1.5rem;
`;
const ActionButton = styled.button`
  flex: 1; padding: 0.8rem; border: none; border-radius: 12px;
  font-family: 'Clash Display', sans-serif; font-size: 1.1rem; font-weight: 600;
  cursor: pointer;
  background-color: ${props => props.danger ? '#FEE2E2' : props.theme.bgPrimary};
  color: ${props => props.danger ? '#DC2626' : props.theme.textPrimary};
  border: 1px solid ${props => props.danger ? '#FCA5A5' : props.theme.borderColor};
`;
const BrokerList = styled.div` display: flex; flex-direction: column; gap: 1rem; `;
const BrokerCard = styled.div`
  background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px; padding: 1.5rem;
`;
const BrokerName = styled.h3`
  font-size: 1.2rem; font-weight: 600; margin: 0 0 0.5rem 0;
`;

function DemandDetailPage() {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const [demand, setDemand] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDemandDetails = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      const [demandRes, interestsRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/demands/${demandId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:5001/api/demands/${demandId}/interests`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDemand(demandRes.data);
      setBrokers(interestsRes.data);
    } catch (error) {
      console.error("Failed to fetch details:", error);
      alert(error.response?.data?.message || "Could not load details.");
      navigate(-1); // Go back if there's an error
    } finally {
      setIsLoading(false);
    }
  }, [demandId, navigate]);

  useEffect(() => {
    fetchDemandDetails();
  }, [fetchDemandDetails]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this demand? This cannot be undone.')) {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5001/api/demands/${demandId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Demand deleted successfully.');
            navigate('/post-demand');
        } catch (error) {
            console.error("Failed to delete demand:", error);
            alert(error.response?.data?.message || "Could not delete demand.");
        }
    }
  };

  if (isLoading || !demand) {
    return (
        <Container>
            <PageHeader title="Loading Demand..." />
            <Section><SkeletonDemandCard /></Section>
        </Container>
    );
  }

  const demandTitle = typeof demand.diamond_details === 'object' && demand.diamond_details !== null
    ? `${demand.diamond_details.carat || ''}ct, ${demand.diamond_details.clarity || ''}, ${demand.diamond_details.shape || ''}`
    : demand.diamond_details;

  return (
    <Container>
      <PageHeader title="Demand Details" />
      <Section>
        <DemandDetailCard>
            <DemandTitle>{demandTitle}</DemandTitle>
            <DemandInfo>Status: {demand.status}</DemandInfo>
            <DemandInfo>Posted on: {new Date(demand.created_at).toLocaleDateString()}</DemandInfo>
            <Actions>
                <ActionButton onClick={() => alert('Edit feature coming soon!')}>Edit Demand</ActionButton>
                <ActionButton danger onClick={handleDelete}>Delete Demand</ActionButton>
            </Actions>
        </DemandDetailCard>
      </Section>
      <Section>
        <SectionTitle>Interested Brokers</SectionTitle>
        <BrokerList>
            {brokers.length > 0 ? brokers.map(broker => (
                <BrokerCard key={broker.user_id}>
                    <BrokerName>{broker.full_name}</BrokerName>
                    <p>{broker.office_name}</p>
                    <p>{broker.email} | {broker.phone_number}</p>
                </BrokerCard>
            )) : <p>No brokers have shown interest yet.</p>}
        </BrokerList>
      </Section>
    </Container>
  );
}

export default DemandDetailPage;