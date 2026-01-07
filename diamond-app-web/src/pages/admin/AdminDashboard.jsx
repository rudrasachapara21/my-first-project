import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../../api/axiosConfig';
import { useOutletContext } from 'react-router-dom';
import { PiUsersThree, PiDiamondsFour, PiPaperPlaneTilt, PiNewspaper, PiCheckCircle, PiHourglass } from "react-icons/pi";
import GlassCard from '../../components/GlassCard';
import UserGrowthChart from './UserGrowthChart';
import MarketActivityChart from './MarketActivityChart';

const Title = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2.5rem;
  color: ${props => props.theme.textPrimary};
  margin-bottom: 2rem;
`;
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;
const StatCard = styled(GlassCard)`
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
`;

// --- FIX 1: Updated props to use $ prefix (Transient Props) ---
const StatIcon = styled.div`
  font-size: 2.5rem;
  color: ${props => props.$color || props.theme.accentPrimary};
  margin-right: 1.5rem;
  padding: 0.8rem;
  background-color: ${props => props.$bgColor || props.theme.bgSecondary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatInfo = styled.div``;
const StatValue = styled.p`
  font-size: 2.2rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
  line-height: 1;
`;
const StatLabel = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
`;

const MainChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 3rem;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr; 
  }
`;

const StatusCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
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
const ActivityCard = styled(GlassCard)`
  border-radius: 12px;
  overflow: hidden;
`;
const ActivityHeader = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  color: ${props => props.theme.textPrimary};
  padding: 1rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid ${props => props.theme.borderColor};
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
  color: ${props => props.theme.textPrimary};
  font-weight: 500;
`;
const ItemMeta = styled.span`
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
`;


function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [userStatus, setUserStatus] = useState({ verified: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { users = [], news = [] } = useOutletContext() || {};

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const summaryPromise = apiClient.get('/api/stats/admin-summary');
        const verificationPromise = apiClient.get('/api/stats/user-verification');
        
        const [summaryResponse, verificationResponse] = await Promise.all([
          summaryPromise,
          verificationPromise
        ]);

        setStats(summaryResponse.data);
        setUserStatus(verificationResponse.data);

      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllStats();
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
      
      <MainChartGrid>
        <UserGrowthChart />
        
        <StatusCardContainer>
          <StatCard>
            <StatIcon>
              <PiHourglass />
            </StatIcon>
            <StatInfo>
              <StatValue>{userStatus.pending}</StatValue>
              <StatLabel>Pending Approval</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard>
            <StatIcon>
              <PiCheckCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{userStatus.verified}</StatValue>
              <StatLabel>Verified Users</StatLabel>
            </StatInfo>
          </StatCard>
        </StatusCardContainer>

      </MainChartGrid>

      <div style={{ marginTop: '1.5rem' }}>
        <MarketActivityChart />
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