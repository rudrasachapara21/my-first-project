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
    return <FullScreenLoader />; 
  }

  // 2. After loading, check if user is logged in
  if (!user) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // ## --- THIS IS THE NEW, CORRECTED LOGIC --- ##

  // 3. Check for ADMIN routes
  if (adminOnly) {
    // If route is adminOnly, user MUST be 'admin'
    if (user.role === 'admin') {
      return children; // Good: Admin on admin route
    } else {
      // Bad: Trader/Broker on admin route. Redirect to their home.
      return <Navigate to="/" replace />;
    }
  }
  
  // 4. Check for USER routes (adminOnly is false)
  if (!adminOnly) {
    // If route is a user route, user MUST be 'trader' or 'broker'
    if (user.role === 'trader' || user.role === 'broker') {
      return children; // Good: User on user route
    } else {
      // Bad: Admin on user route. Redirect to admin home.
      return <Navigate to="/admin" replace />;
    }
  }
  
  // ## --- END OF NEW LOGIC --- ##
};

export default ProtectedRoute;