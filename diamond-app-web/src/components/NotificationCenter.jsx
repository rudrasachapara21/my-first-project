import React from 'react';
import styled from 'styled-components';
import EmptyState from './EmptyState';
import { PiBell } from 'react-icons/pi';

const PanelContainer = styled.div`
  position: absolute;
  top: 55px;
  /* FIX: Changed from 'right: 0'. 
    A negative value pushes the panel further to the right, clearing the
    user profile icon and aligning it correctly on the screen.
  */
  right: -52px;
  width: 350px;
  max-width: 90vw;
  background: ${props => props.theme.bgSecondary};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.borderColor};
  box-shadow: 0 5px 25px rgba(0,0,0,0.1);
  z-index: 100;
`;
const PanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.borderColor};
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  font-weight: 500;
  color: ${props => props.theme.textPrimary};
`;
const NotificationList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
`;
const NotificationItem = styled.li`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.borderColor};
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
  &:last-child { border-bottom: none; }
`;

function NotificationCenter({ notifications }) {
  return (
    <PanelContainer>
      <PanelHeader>Notifications</PanelHeader>
      <NotificationList>
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <NotificationItem key={notif.id}>{notif.message}</NotificationItem>
          ))
        ) : (
          <div style={{padding: '0.5rem'}}>
            <EmptyState 
                icon={PiBell}
                title="No New Notifications" 
                message="Check back later for new updates." 
            />
          </div>
        )}
      </NotificationList>
    </PanelContainer>
  );
}
export default NotificationCenter;