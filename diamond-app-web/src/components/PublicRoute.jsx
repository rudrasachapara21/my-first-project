import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PublicRoute = () => {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;

      if (userRole === 'broker') {
        return <Navigate to="/broker-home" replace />;
      } else if (userRole === 'trader') {
        return <Navigate to="/trader-home" replace />;
      }
    } catch (error) {
      console.error("Invalid token, clearing storage:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Outlet />;
    }
  }

  return <Outlet />;
};

export default PublicRoute;