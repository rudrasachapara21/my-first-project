import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import styled from 'styled-components'; // Import styled-components

import { ThemeProvider, useTheme } from './context/ThemeContext'; // Import useTheme
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth
import { WebSocketProvider } from './context/WebSocketContext';
import { NotificationProvider } from './context/NotificationContext';

import App from './App.jsx';
import Login from './pages/Login.jsx';
// ## CHANGE: Import the new RegisterPage ##
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

// --- THIS IS THE FIX ---

// 1. Create a simple loading screen that uses your theme
const GlobalLoadingScreen = styled.div`
  height: 100vh;
  width: 100%;
  /* This will use your theme's primary background color */
  background-color: ${props => props.theme.bgPrimary || '#0D1117'}; 
`;

// 2. Create a new component that holds all your routes
const AppRoutes = () => {
  // Now we can safely use the hooks because this component is
  // *inside* the providers
  const { isLoading } = useAuth();
  const { theme } = useTheme();

  // If the AuthContext is still loading, show a blank screen
  if (isLoading) {
    return <GlobalLoadingScreen theme={theme} />;
  }

  // Once loading is false, render the correct routes
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      {/* ## CHANGE: Add the new /register route ## */}
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />

      <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>}>
        {/* All your app routes from your original file */}
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
        <Route path="profile/:userId" element={<BrokerProfilePage />} />
        <Route path="ai-pricing" element={<AIPricing />} />
        <Route path="help" element={<Help />} />
        <Route path="news" element={<News />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="chats" element={<ChatListPage />} />
        <Route path="chat/:conversationId" element={<ChatWindowPage />} />
        <Route path="security" element={<Security />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="workspace" element={<Workspace />} />
        <Route path="broker/demand/:demandId" element={<BrokerDemandView />} />
      </Route>
      
      <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
        {/* All your admin routes from your original file */}
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="news" element={<ManageNews />} />
      </Route>
    </Routes>
  );
};

// 3. Update your main render function to use the providers
//    and then render the new <AppRoutes /> component
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <NotificationProvider>
              {/* This one component now handles the loading logic */}
              <AppRoutes />
            </NotificationProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);