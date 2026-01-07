import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const CenterWrapper = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0; 
  width: 350px;
  max-width: 90vw;
  max-height: 480px;
  background: ${props => props.theme.bgSecondary}; 
  border-radius: 16px;
  /* ✅ Glass-morphism for premium feel */
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  border: 1px solid ${props => props.theme.textPrimary}1A;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Header = styled.div`
  padding: 1.2rem;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.5px;
  color: ${props => props.theme.textPrimary};
  border-bottom: 1px solid ${props => props.theme.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationList = styled.div`
  overflow-y: auto;
  flex: 1;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${props => props.theme.textPrimary}1A; border-radius: 10px; }
`;

const NotificationItem = styled.div`
  padding: 1.1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid ${props => props.theme.textPrimary}08;

  &:hover {
    background: ${props => props.theme.textPrimary}0D;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MessageText = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.textPrimary};
  line-height: 1.4;
`;

const TimeStamp = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.textSecondary};
  opacity: 0.6;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${props => props.theme.info};
  border-radius: 50%;
  margin-top: 6px;
  box-shadow: 0 0 10px ${props => props.theme.info};
`;

const DismissButton = styled.button`
  background: ${props => props.theme.textPrimary}0D;
  border: none;
  color: ${props => props.theme.textSecondary};
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  
  &:hover {
    background: ${props => props.theme.error};
    color: ${props => props.theme.textPrimary};
  }
`;

const NotificationCenter = ({ onClose }) => {
  const { notifications, isLoading, dismissNotification, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleItemClick = (notification) => {
    markAsRead([notification.id]);
    if (notification.link_url) {
      navigate(notification.link_url);
    }
    onClose(); 
  };

  return (
    <CenterWrapper onClick={(e) => e.stopPropagation()}>
      <Header>
        Notifications
        {notifications.length > 0 && (
           <span style={{fontSize: '0.7rem', opacity: 0.5, fontWeight: 400}}>
             {notifications.length} Total
           </span>
        )}
      </Header>
      <NotificationList>
        {isLoading ? (
          <div style={{padding: '2rem', textAlign: 'center', opacity: 0.5}}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{padding: '3rem', textAlign: 'center', opacity: 0.5}}>No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} onClick={() => handleItemClick(n)}>
              {!n.is_read && <UnreadDot />}
              <NotificationContent>
                <MessageText>{n.message}</MessageText>
                <TimeStamp>{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TimeStamp>
              </NotificationContent>
              <DismissButton onClick={(e) => {
                e.stopPropagation();
                dismissNotification(n.id);
              }}>✕</DismissButton>
            </NotificationItem>
          ))
        )}
      </NotificationList>
    </CenterWrapper>
  );
};

export default NotificationCenter;