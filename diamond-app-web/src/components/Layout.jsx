import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';

const Layout = () => {
  // --- THIS IS THE FIX ---
  // We need to receive the context from the parent route (App.jsx)
  // and pass it down to the child routes (BrokerHome.jsx, etc.)
  const context = useOutletContext();

  return (
    // Pass the received context to the child pages
    <Outlet context={context} />
  );
};

export default Layout;