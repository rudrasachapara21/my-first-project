import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

// A simple loading screen that matches your app's background
const FullScreenLoader = styled.div`
  height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.bgPrimary || '#0D1117'}; 
`;

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Wait until we're done loading
  if (isLoading) {
    // You can return a proper spinner here if you want
    return <FullScreenLoader />; 
  }

  // 2. After loading, check if user is logged in
  if (!user) {
    // If not logged in, redirect to login page
    // state: { from: location } helps redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. (For Admin routes) Check if adminOnly is true and user is not an admin
  if (adminOnly && user.role !== 'admin') {
    // Redirect non-admins away from admin pages
    return <Navigate to="/" replace />;
  }

  // 4. If logged in and has correct role, show the page
  return children;
};

export default ProtectedRoute;