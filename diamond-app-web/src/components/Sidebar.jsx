import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    PiHouse, PiPaperPlaneTilt, PiStorefront, PiTag, PiGear, 
    PiSignOut, PiChatCircleDots, PiBriefcase, PiMagicWand, 
    PiDiamond, PiHandshake, PiNewspaper 
} from 'react-icons/pi';

// ✨ ANIMATION: Breathing diamond logo
const diamondPulse = keyframes`
  0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 5px var(--glow)); }
  50% { transform: scale(1.1) rotate(8deg); filter: drop-shadow(0 0 20px var(--glow)); }
  100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 5px var(--glow)); }
`;

const SidebarContainer = styled.aside`
    width: 280px;
    height: 100dvh; 
    padding: 2rem 1.25rem 1.5rem; 
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    z-index: 1000;
    background: ${props => props.theme.bgSecondary};
    border-right: 1px solid ${props => props.theme.borderColor};
    backdrop-filter: blur(20px) saturate(160%);
    box-sizing: border-box;
    
    @media (max-width: 1024px) {
        position: fixed;
        left: 0;
        transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
        transition: transform 0.4s ease;
    }
`;

const LogoSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2.5rem;
    --glow: ${props => props.theme.accentPrimary};

    .diamond-logo {
        font-size: 2.5rem;
        color: ${props => props.theme.accentPrimary};
        animation: ${css`${diamondPulse} 5s infinite ease-in-out`};
        margin-bottom: 0.5rem;
    }
`;

const BrandName = styled.h1`
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${props => props.theme.textPrimary};
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1; 
    overflow-y: auto;
    padding-right: 5px;

    &::-webkit-scrollbar { width: 0; }
`;

const StyledNavLink = styled(NavLink)`
    display: flex;
    align-items: center;
    gap: 1.1rem;
    padding: 0.85rem 1.25rem;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    color: ${props => props.theme.textSecondary};
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Smooth pop effect */
    border: 1px solid transparent;

    svg { 
        font-size: 1.3rem; 
        transition: all 0.3s ease; /* Allows the icon to rotate smoothly */
    }

    /* 🚀 3D HOVER EFFECT RESTORED */
    &:hover {
        color: ${props => props.theme.textPrimary};
        background: ${props => props.theme.textPrimary}0D; /* small translucent highlight */
        transform: translateX(10px) scale(1.02); /* Slides right and grows slightly */
        border-color: ${props => props.theme.textPrimary}1A; /* subtle border */
        
        svg { 
            transform: rotate(-12deg) scale(1.25); /* Icon rotates and pops out */
            color: ${props => props.theme.accentPrimary};
        }
    }

    &.active {
        color: ${props => props.theme.textPrimary};
        background: ${props => props.theme.accentPrimary}20;
        border: 1px solid ${props => props.theme.accentPrimary}30;
        svg { 
            color: ${props => props.theme.accentPrimary};
            transform: scale(1.1);
        }
    }
`;

const SectionLabel = styled.span`
    font-size: 0.6rem;
    font-weight: 800;
    color: ${props => props.theme.textSecondary};
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin: 1.2rem 0 0.4rem 1.25rem;
    opacity: 0.4;
`;

const SidebarFooter = styled.div`
    margin-top: auto; 
    padding-top: 1.5rem;
    border-top: 1px solid ${props => props.theme.borderColor};
`;

const LogoutButton = styled.button`
    display: flex;
    align-items: center;
    gap: 1.1rem;
    padding: 0.85rem 1.25rem;
    border-radius: 12px;
    width: 100%;
    background: ${props => props.theme.error}14;
    color: ${props => props.theme.error};
    border: 1px solid transparent;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    svg { transition: all 0.3s ease; }

    &:hover {
        background: ${props => props.theme.error};
        color: ${props => props.theme.textPrimary};
        transform: translateX(10px) scale(1.02);
        
        svg { transform: rotate(-15deg) scale(1.2); }
    }
`;

function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();

    const traderLinks = [
        { to: "/trader-home", icon: <PiHouse />, label: "Terminal" },
        { to: "/buy-feed", icon: <PiStorefront />, label: "Market" },
        { to: "/my-demands", icon: <PiPaperPlaneTilt />, label: "Requests" },
        { to: "/sell-diamonds", icon: <PiTag />, label: "Inventory" },
        { to: "/offers", icon: <PiHandshake />, label: "Offers" },
    ];

    const brokerLinks = [
        { to: "/broker-home", icon: <PiHouse />, label: "Hub" },
        { to: "/workspace", icon: <PiBriefcase />, label: "Workspace" },
    ];

    return (
        <SidebarContainer $isOpen={isOpen}>
            <LogoSection>
                <div className="diamond-logo"><PiDiamond weight="duotone" /></div>
                <BrandName>Connect</BrandName>
            </LogoSection>

            <Nav>
                <SectionLabel>Marketplace</SectionLabel>
                {(user?.role === 'trader' ? traderLinks : brokerLinks).map(link => (
                    <StyledNavLink to={link.to} key={link.to} onClick={onClose} end>
                        {link.icon} {link.label}
                    </StyledNavLink>
                ))}
                
                <SectionLabel>Utilities</SectionLabel>
                <StyledNavLink to="/chats" onClick={onClose}><PiChatCircleDots /> Messages</StyledNavLink>
                <StyledNavLink to="/ai-pricing" onClick={onClose}><PiMagicWand /> AI Engine</StyledNavLink>
                <StyledNavLink to="/news" onClick={onClose}><PiNewspaper /> Market News</StyledNavLink>
                <StyledNavLink to="/settings" onClick={onClose}><PiGear /> Settings</StyledNavLink>
            </Nav>

            <SidebarFooter>
                <LogoutButton onClick={logout}>
                    <PiSignOut weight="bold" /> Sign Out
                </LogoutButton>
            </SidebarFooter>
        </SidebarContainer>
    );
}

export default Sidebar;