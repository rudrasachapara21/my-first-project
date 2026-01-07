import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PiList, PiUserCircle, PiBell } from "react-icons/pi";
import NotificationCenter from './NotificationCenter';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext'; 

// ✨ ANIMATION: Soft breathing pulse for the notification badge
const badgePulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  z-index: 1000;
  background: ${props => props.theme.glassEffect ? 'transparent' : props.theme.bgPrimary};
  transition: all 0.4s ease;
`;

const HeaderTitle = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: ${props => props.theme.textPrimary};
  letter-spacing: -0.5px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
`;

const IconButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: ${props => props.theme.textSecondary};
  background: ${props => props.theme.textPrimary}08;
  border: 1px solid ${props => props.theme.textPrimary}0D;
  
  &:hover {
    background: ${props => props.theme.accentPrimary}15;
    color: ${props => props.theme.accentPrimary};
    transform: translateY(-3px) scale(1.05);
    border-color: ${props => props.theme.accentPrimary}40;
  }
`;

const BellWrapper = styled(IconButtonWrapper)`
  position: relative; 
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  /* 🎨 Use theme error color for badge */
  background: linear-gradient(135deg, ${props => props.theme.error} 0%, ${props => props.theme.error}CC 100%);
  color: ${props => props.theme.textPrimary};
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme.bgPrimary};
  box-shadow: 0 0 15px ${props => props.theme.error}44;
  animation: ${css`${badgePulse} 2.5s infinite ease-in-out`};
  pointer-events: none;
`;

const AvatarWrapper = styled.div`
  position: relative;
  padding: 3px;
  border-radius: 50%;
  /* 💎 Glowing 3D Ring */
  background: linear-gradient(45deg, ${props => props.theme.accentPrimary}, ${props => props.theme.textPrimary}33);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &:hover { 
    transform: scale(1.1) rotate(5deg);
  background: linear-gradient(45deg, ${props => props.theme.accentPrimary}, ${props => props.theme.textPrimary});
    box-shadow: 0 0 20px ${props => props.theme.accentPrimary}66;
  }
`;

const Avatar = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${props => props.theme.bgPrimary};
  display: block;
`;

const getAvatarUrl = (photoUrl, name) => {
  if (!photoUrl) {
    // 🎨 Improved fallback with brand-consistent colors
    return `https://ui-avatars.com/api/?name=${name ? name.replace(' ', '+') : 'User'}&background=6366f1&color=fff&bold=true&font-size=0.45`;
  }
  if (photoUrl.startsWith('http')) return photoUrl;
  const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace('/api', '');
  return `${API_ROOT}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

function AppHeader({ title }) {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const { toggleSidebar } = useOutletContext() || {};
    const { user } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const avatarUrl = getAvatarUrl(user?.profile_photo_url, user?.full_name);

    return (
        <Header>
            <IconButtonWrapper onClick={toggleSidebar}>
              <PiList size={26} />
            </IconButtonWrapper>
            
            <HeaderTitle>{title}</HeaderTitle>
            
            <HeaderActions>
                <BellWrapper onClick={(e) => {
                    e.stopPropagation(); 
                    setIsDropdownOpen(!isDropdownOpen);
                }}>
                    <PiBell size={26} />
                    {unreadCount > 0 && (
                      <NotificationBadge>{unreadCount > 99 ? '99+' : unreadCount}</NotificationBadge>
                    )}
                </BellWrapper>
                
                {user ? (
                  <AvatarWrapper onClick={() => navigate('/edit-profile')}>
                    <Avatar 
                        src={avatarUrl} 
                        alt="User" 
                        onError={(e) => { e.target.src = getAvatarUrl(null, user.full_name); }} 
                    />
                  </AvatarWrapper>
                ) : (
                  <IconButtonWrapper onClick={() => navigate('/edit-profile')}>
                    <PiUserCircle size={30} />
                  </IconButtonWrapper>
                )}

                {isDropdownOpen && (
                    <NotificationCenter onClose={() => setIsDropdownOpen(false)} />
                )}
            </HeaderActions>
        </Header>
    );
}

export default AppHeader;