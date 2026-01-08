import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const FullScreenLoader = styled.div`
  height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.bgPrimary || '#0D1117'}; 
`;

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Wait until AuthContext finished checking localStorage
  if (isLoading) {
    return <FullScreenLoader />; 
  }

  // 2. Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. Logic for ADMIN routes
  if (adminOnly) {
    if (user.role === 'admin') {
      return children;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  // 4. Logic for USER routes (Trader/Broker)
  if (!adminOnly) {
    if (user.role === 'trader' || user.role === 'broker') {
      return children;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
  }

  // ✅ 5. CRITICAL SAFETY FALLBACK: Always return a redirection if logic above misses
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;