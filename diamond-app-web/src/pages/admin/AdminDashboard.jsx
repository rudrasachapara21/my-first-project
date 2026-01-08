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
  font-size: 2.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme.accentPrimary}, ${props => props.theme.accentSecondary || props.theme.accentPrimary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.textSecondary};
  font-size: 1rem;
  margin-bottom: 2.5rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
`;
const StatCard = styled(GlassCard)`
  padding: 1.75rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, ${props => props.theme.accentPrimary}15, transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: ${props => props.theme.accentPrimary};
    
    &::before {
      left: 100%;
    }
  }
`;

// --- FIX 1: Updated props to use $ prefix (Transient Props) ---
const StatIcon = styled.div`
  font-size: 2.8rem;
  color: ${props => props.$color || props.theme.textMain};
  padding: 1rem;
  background: ${props => props.$bgColor || `${props.theme.accentPrimary}15`};
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px ${props => props.$bgColor || props.theme.accentPrimary}20;
  flex-shrink: 0;
  transition: all 0.3s ease;
  
  ${props => props.$pulse && `
    animation: pulse 2s ease-in-out infinite;
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `}
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.p`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.textPrimary};
  margin: 0;
  line-height: 1;
  font-family: 'Clash Display', sans-serif;
  letter-spacing: -0.5px;
`;

const StatLabel = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0.5rem 0 0 0;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.3px;
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
  border-bottom: 1px solid ${props => props.theme.borderColor};
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
    return <p style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading dashboard...</p>;
  }

  return (
    <div>
      <Title>Dashboard</Title>
      <Subtitle>Overview of platform activity and user statistics</Subtitle>
      <StatGrid>
        <StatCard>
          <StatIcon $color="#4f46e5" $pulse><PiUsersThree /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.totalUsers ?? '-'}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon $color="#0ea5e9" $bgColor="rgba(14, 165, 233, 0.1)"><PiDiamondsFour /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.activeListings ?? '-'}</StatValue>
            <StatLabel>Active Listings</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon $color="#8b5cf6" $bgColor="rgba(139, 92, 246, 0.1)"><PiPaperPlaneTilt /></StatIcon>
          <StatInfo>
            <StatValue>{stats?.activeDemands ?? '-'}</StatValue>
            <StatLabel>Active Demands</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon $color="#10b981" $bgColor="rgba(16, 185, 129, 0.1)"><PiNewspaper /></StatIcon>
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
            <StatIcon $color="#f59e0b" $bgColor="rgba(245, 158, 11, 0.1)">
              <PiHourglass />
            </StatIcon>
            <StatInfo>
              <StatValue>{userStatus.pending}</StatValue>
              <StatLabel>Pending Approval</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard>
            <StatIcon $color="#22c55e" $bgColor="rgba(34, 197, 94, 0.1)">
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