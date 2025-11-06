import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageLoader from './FullPageLoader';

/**
 * A component that protects public-only routes (like the login page).
 * If a user is already logged in, it redirects them to their specific dashboard.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The public component to render (e.g., Login page).
 */
const PublicRoute = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  // 1. Wait for the AuthContext to finish its initial loading.
  if (isLoading) {
    return <FullPageLoader />;
  }

  // 2. If the user is logged in, redirect them away from the public route.
  if (token && user) {
    // --- LOGIC FIX ---
    // This now checks the user's role and redirects to the correct dashboard.
    let targetPath = '/'; // Default fallback
    if (user.role === 'admin') {
      targetPath = '/admin';
    } else if (user.role === 'trader') {
      targetPath = '/trader-home';
    } else if (user.role === 'broker') {
      targetPath = '/broker-home';
    }
    return <Navigate to={targetPath} replace />;
  }

  // 3. If not loading and not logged in, render the public page (e.g., Login).
  return children;
};

export default PublicRoute;