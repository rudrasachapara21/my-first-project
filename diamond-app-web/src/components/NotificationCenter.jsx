import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const CenterWrapper = styled.div`
  position: absolute;
  top: 100%;
  
  /* --- THE FIX: Set 'right' to 0 to align with the new parent anchor --- */
  right: 0; 

  width: 350px;
  max-width: 90vw; /* Still keeps it from being too wide on extra small screens */
  max-height: 400px;
  background-color: ${props => props.theme.bgSecondary}; 
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid ${props => props.theme.borderColor};
  margin-top: 15px; 
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid ${props => props.theme.borderColor};
`;

const NotificationList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
`;

const NotificationItem = styled.li`
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme.borderColor};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${props => props.theme.backgroundHover};
  }
`;

const NotificationMessage = styled.span`
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${props => props.theme.accentPrimary};
  border-radius: 50%;
  flex-shrink: 0;
`;

const DismissButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.textSecondary};
  font-weight: bold;
  cursor: pointer;
  padding: 5px;
  margin-left: auto;
  &:hover {
    color: ${props => props.theme.accentPrimary};
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
`;

const NotificationCenter = ({ onClose }) => {
  const { notifications, isLoading, dismissNotification } = useNotifications();
  const navigate = useNavigate();

  const handleItemClick = (notification) => {
    if (notification.link_url) {
      navigate(notification.link_url);
    }
    onClose(); 
  };
  
  const handleDismiss = (e, notificationId) => {
    e.stopPropagation(); 
    dismissNotification(notificationId); 
  };

  return (
    <CenterWrapper onClick={(e) => e.stopPropagation()}>
      <Header>Notifications</Header>
      <NotificationList>
        {isLoading ? (
          <EmptyState>Loading...</EmptyState>
        ) : notifications.length === 0 ? (
          <EmptyState>You have no notifications.</EmptyState>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} onClick={() => handleItemClick(n)}>
              {!n.is_read && <UnreadDot />}
              <NotificationMessage>{n.message}</NotificationMessage>
              <DismissButton onClick={(e) => handleDismiss(e, n.id)}>X</DismissButton>
            </NotificationItem>
          ))
        )}
      </NotificationList>
    </CenterWrapper>
  );
};

export default NotificationCenter;