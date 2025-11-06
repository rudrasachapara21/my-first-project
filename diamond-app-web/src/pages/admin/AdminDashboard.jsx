import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// ## CHANGE: Corrected the import path ##
import apiClient from '../../api/axiosConfig';
import { useOutletContext } from 'react-router-dom';
import { PiUsersThree, PiDiamondsFour, PiPaperPlaneTilt, PiNewspaper } from "react-icons/pi";
import UserGrowthChart from './UserGrowthChart';

const Title = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 2rem;
`;
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;
const StatCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
`;
const StatIcon = styled.div`
  font-size: 2.5rem;
  color: #4f46e5;
  margin-right: 1.5rem;
  padding: 0.8rem;
  background-color: #eef2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StatInfo = styled.div``;
const StatValue = styled.p`
  font-size: 2.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1;
`;
const StatLabel = styled.p`
  color: #64748b;
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
`;
const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 3rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
const ActivityCard = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow: hidden;
`;
const ActivityHeader = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  color: #1e293b;
  padding: 1rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
`;
const ActivityList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const ActivityItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;
const ItemText = styled.span`
  color: #334155;
  font-weight: 500;
`;
const ItemMeta = styled.span`
  color: #94a3b8;
  font-size: 0.9rem;
`;


function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { users = [], news = [] } = useOutletContext() || {};

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ## CHANGE: Using apiClient and added /api prefix ##
        const response = await apiClient.get('/api/stats/admin-summary');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <Title>Dashboard</Title>
      <StatGrid>
        <StatCard>
          <StatIcon><PiUsersThree /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.totalUsers ?? '-'}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon><PiDiamondsFour /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.activeListings ?? '-'}</StatValue>
            <StatLabel>Active Listings</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon><PiPaperPlaneTilt /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.activeDemands ?? '-'}</StatValue>
            <StatLabel>Active Demands</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon><PiNewspaper /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.newsArticles ?? '-'}</StatValue>
            <StatLabel>News Articles</StatLabel>
          </StatInfo>
        </StatCard>
      </StatGrid>

      <div style={{ marginTop: '3rem' }}>
        <UserGrowthChart />
      </div>

      <ActivityGrid>
        <ActivityCard>
          <ActivityHeader>Recent Users</ActivityHeader>
          <ActivityList>
            {users.slice(0, 5).map(user => (
              <ActivityItem key={user.user_id}>
                <ItemText>{user.full_name}</ItemText>
                <ItemMeta>{user.role}</ItemMeta>
              </ActivityItem>
            ))}
          </ActivityList>
        </ActivityCard>
        <ActivityCard>
          <ActivityHeader>Recent News</ActivityHeader>
          <ActivityList>
            {news.slice(0, 5).map(article => (
              <ActivityItem key={article.news_id}>
                <ItemText>{article.title}</ItemText>
                <ItemMeta>{new Date(article.created_at).toLocaleDateString()}</ItemMeta>
              </ActivityItem>
            ))}
          </ActivityList>
        </ActivityCard>
      </ActivityGrid>
    </div>
  );
}

export default AdminDashboard;