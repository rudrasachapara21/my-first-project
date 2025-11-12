import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../../api/axiosConfig';
import { useOutletContext } from 'react-router-dom';
// ## --- UPDATED ICONS --- ##
import { PiUsersThree, PiDiamondsFour, PiPaperPlaneTilt, PiNewspaper, PiCheckCircle, PiHourglass } from "react-icons/pi";
import UserGrowthChart from './UserGrowthChart';
import MarketActivityChart from './MarketActivityChart';
// ## --- REMOVED UserStatusChart --- ##

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
  /* Use the color prop if provided, otherwise default */
  color: ${props => props.color || '#4f46e5'};
  margin-right: 1.5rem;
  padding: 0.8rem;
  /* Use the color prop for background too */
  background-color: ${props => props.bgColor || '#eef2ff'};
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

// This grid holds the Line Chart and the new Stat Cards
const MainChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 3rem;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr; /* Line chart is 2/3, Cards are 1/3 */
  }
`;

// ## --- NEW: A simple container for the two new cards --- ##
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
  // ## --- NEW STATE for verification stats --- ##
  const [userStatus, setUserStatus] = useState({ verified: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { users = [], news = [] } = useOutletContext() || {};

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Fetch all 3 endpoints in parallel
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
      
      {/* Grid 1: User Growth (Line) and NEW User Status (Cards) */}
      <MainChartGrid>
        <UserGrowthChart />
        
        {/* ## --- THIS REPLACES THE DONUT CHART --- ## */}
        <StatusCardContainer>
          <StatCard>
            <StatIcon color="#f59e0b" bgColor="#fffbeb">
              <PiHourglass />
            </StatIcon>
            <StatInfo>
              <StatValue>{userStatus.pending}</StatValue>
              <StatLabel>Pending Approval</StatLabel>
            </StatInfo>
          </StatCard>
          <StatCard>
            <StatIcon color="#16a34a" bgColor="#f0fdf4">
              <PiCheckCircle />
            </StatIcon>
            <StatInfo>
              <StatValue>{userStatus.verified}</StatValue>
              <StatLabel>Verified Users</StatLabel>
            </StatInfo>
          </StatCard>
        </StatusCardContainer>
        {/* ## --- END OF REPLACEMENT --- ## */}

      </MainChartGrid>

      {/* Grid 2: Market Activity (Bar) */}
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