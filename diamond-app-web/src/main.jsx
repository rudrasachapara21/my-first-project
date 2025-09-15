import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';

import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';

import App from './App.jsx';
import Login from './pages/Login.jsx';
import TraderHome from './pages/TraderHome.jsx';
import BrokerHome from './pages/BrokerHome.jsx';
import PostDemand from './pages/PostDemand.jsx';
import ViewDemands from './pages/ViewDemands.jsx';
import BuyFeed from './pages/BuyFeed.jsx';
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
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import DemandDetailPage from './pages/DemandDetailPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManageNews from './pages/admin/ManageNews.jsx';

import './index.css';

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/", element: <Login /> },
      { path: "/admin/login", element: <AdminLogin /> },
    ]
  },
  {
    element: (
      <ProtectedRoute>
        <WebSocketProvider>
          <App />
        </WebSocketProvider>
      </ProtectedRoute>
    ),
    children: [
      { path: "/trader-home", element: <TraderHome /> },
      { path: "/broker-home", element: <BrokerHome /> },
      { path: "/post-demand", element: <PostDemand /> },
      { path: "/view-demands", element: <ViewDemands /> },
      { path: "/buy-feed", element: <BuyFeed /> },
      { path: "/sell-diamonds", element: <SellDiamonds /> },
      { path: "/feed/buy/:listingId", element: <ListingDetailPage /> },
      { path: "/demands/:demandId", element: <DemandDetailPage /> },
      { path: "/settings", element: <Settings /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/app-theme", element: <AppTheme /> },
      { path: "/edit-profile", element: <EditProfile /> },
      { path: "/ai-pricing", element: <AIPricing /> },
      { path: "/help", element: <Help /> },
      { path: "/news", element: <News /> },
      { path: "/news/:newsId", element: <NewsDetailPage /> },
      { path: "/watchlist", element: <Watchlist /> },
      { path: "/chats", element: <ChatListPage /> },
      { path: "/chat/:chatId", element: <ChatWindowPage /> },
      { path: "/security", element: <Security /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <WebSocketProvider>
          <AdminLayout />
        </WebSocketProvider>
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin/dashboard", element: <AdminDashboard /> },
      { path: "/admin/users", element: <ManageUsers /> },
      { path: "/admin/news", element: <ManageNews /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);