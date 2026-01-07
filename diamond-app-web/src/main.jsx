import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import styled from 'styled-components'; 

import { ThemeProvider, useTheme } from './context/ThemeContext'; 
import { AuthProvider, useAuth } from './context/AuthContext'; 
import { WebSocketProvider } from './context/WebSocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoadingProvider } from './context/LoadingContext';

import NotificationManager from './components/NotificationManager.jsx';

import App from './App.jsx';
import Login from './pages/Login.jsx';
import RegisterPage from './pages/RegisterPage.jsx'; 
import TraderHome from './pages/TraderHome.jsx';
import BrokerHome from './pages/BrokerHome.jsx';
import PostDemand from './pages/PostDemand.jsx';
import DemandDetailPage from './pages/DemandDetailPage.jsx';
import BrokerProfilePage from './pages/BrokerProfilePage.jsx';
import ViewDemands from './pages/ViewDemands.jsx';
import BuyFeed from './pages/BuyFeed.jsx';
import ListingDetailsPage from './pages/ListingDetailsPage.jsx';
import SellDiamonds from './pages/SellDiamonds.jsx';
import Settings from './pages/Settings.jsx';
import Notifications from './pages/Notifications.jsx';
import AppTheme from './pages/AppTheme.jsx';
import EditProfile from './pages/EditProfile.jsx';
import AIPricing from './pages/AIPricing.jsx';
import Help from './pages/Help.jsx';
import News from './pages/News.jsx';
import NewsDetailPage from './pages/NewsDetailPage.jsx'; 
import Watchlist from './pages/Watchlist.jsx';
import ChatListPage from './pages/ChatListPage.jsx';
import ChatWindowPage from './pages/ChatWindowPage.jsx';
import Security from './pages/Security.jsx';
import OffersPage from './pages/OffersPage.jsx';
import Workspace from './pages/Workspace.jsx';
import BrokerDemandView from './pages/BrokerDemandView.jsx';
import ListingOffersPage from './pages/ListingOffersPage.jsx';
import EditListingPage from './pages/EditListingPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManageNews from './pages/admin/ManageNews.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminUserListPage from './pages/admin/AdminUserListPage.jsx';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';

const GlobalLoadingScreen = styled.div`
  height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.bgPrimary || '#0D1117'}; 
`;

const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

        {/* --- PROTECTED USER ROUTES --- */}
        <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>}>
          <Route index element={<BrokerHome />} />
          <Route path="trader-home" element={<TraderHome />} />
          <Route path="broker-home" element={<BrokerHome />} />
          <Route path="my-demands" element={<PostDemand />} />
          <Route path="demand/:demandId" element={<DemandDetailPage />} />
          <Route path="view-demands" element={<ViewDemands />} />
          <Route path="buy-feed" element={<BuyFeed />} />
          <Route path="listing/:listingId" element={<ListingDetailsPage />} />
          <Route path="listing/:listingId/offers" element={<ListingOffersPage />} />
          <Route path="listing/edit/:listingId" element={<EditListingPage />} />
          <Route path="sell-diamonds" element={<SellDiamonds />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="app-theme" element={<AppTheme />} />
          <Route path="edit-profile" element={<EditProfile />} />
          
          {/* ✅ FIXED: Added both profile route aliases to prevent 404s */}
          <Route path="profile/:userId" element={<BrokerProfilePage />} />
          <Route path="broker-profile/:userId" element={<BrokerProfilePage />} />

          <Route path="ai-pricing" element={<AIPricing />} />
          <Route path="help" element={<Help />} />
          <Route path="news" element={<News />} />
          <Route path="news/:id" element={<NewsDetailPage />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="chats" element={<ChatListPage />} />
          <Route path="chat/:conversationId" element={<ChatWindowPage />} />
          <Route path="security" element={<Security />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="broker/demand/:demandId" element={<BrokerDemandView />} />
        </Route>
        
        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="news" element={<ManageNews />} />
          <Route path="user-monitoring" element={<AdminUserListPage />} />
          <Route path="user-monitoring/:userId" element={<AdminUserDetailPage />} />
        </Route>
      </Routes>
    </>
  );
};

// AppContent lives inside ThemeProvider so it can safely consume the theme hook
const AppContent = () => {
  const { isLoading } = useAuth();
  const { currentTheme } = useTheme();

  if (isLoading) {
    return <GlobalLoadingScreen theme={currentTheme} />;
  }

  return (
    <>
      <NotificationManager />
      <AppRoutes />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>      
        <ThemeProvider>    
          <WebSocketProvider>
            <NotificationProvider>
              <LoadingProvider>
                <AppContent />
              </LoadingProvider>
            </NotificationProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);