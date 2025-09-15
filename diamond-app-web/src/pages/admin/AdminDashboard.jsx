import React from 'react';
import styled from 'styled-components';
import { useOutletContext } from 'react-router-dom';

const Title = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 2rem;
`;

const StatGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
`;

const StatCard = styled.div`
    background-color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
`;

const StatValue = styled.div`
    font-size: 2.5rem;
    font-weight: 600;
    color: #4f46e5;
`;

const StatLabel = styled.div`
    font-size: 1rem;
    color: #64748b;
    margin-top: 0.5rem;
`;

function AdminDashboard() {
  const { users, news } = useOutletContext();

  return (
    <div>
      <Title>Admin Dashboard</Title>
      <StatGrid>
        <StatCard>
            <StatValue>{users.length}</StatValue>
            <StatLabel>Total Users</StatLabel>
        </StatCard>
        <StatCard>
            <StatValue>{news.length}</StatValue>
            <StatLabel>News Articles</StatLabel>
        </StatCard>
        <StatCard>
            <StatValue>0</StatValue>
            <StatLabel>Support Queries</StatLabel>
        </StatCard>
      </StatGrid>
    </div>
  );
}

export default AdminDashboard;