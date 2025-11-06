import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// --- CHANGE 1: Imported the new icon for AI Pricing ---
import { PiHouse, PiPaperPlaneTilt, PiStorefront, PiTag, PiEnvelope, PiGear, PiStar, PiNewspaper, PiSignOut, PiChatCircleDots, PiBriefcase, PiMagicWand } from 'react-icons/pi';

const SidebarContainer = styled.aside`
    width: 280px;
    background-color: ${props => props.theme.bgSecondary};
    border-right: 1px solid ${props => props.theme.borderColor};
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    box-sizing: border-box;

    @media (max-width: 768px) {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        z-index: 1000;
        transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
        transition: transform 0.3s ease-in-out;
    }
`;

const Logo = styled.h1`
    font-family: 'Clash Display', sans-serif;
    font-size: 1.8rem;
    font-weight: 600;
    color: ${props => props.theme.textPrimary};
    margin: 0 0 2rem 0;
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
    overflow-y: auto;
`;

const StyledNavLink = styled(NavLink)`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 1rem;
    color: ${props => props.theme.textSecondary};
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: ${props => props.theme.bgPrimary};
        color: ${props => props.theme.textPrimary};
    }

    &.active {
        background-color: ${props => props.theme.accentPrimary};
        color: white;
    }
`;

const NavSectionDivider = styled.hr`
    border: none;
    border-top: 1px solid ${props => props.theme.borderColor};
    margin: 1rem 0;
`;

const LogoutButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 1rem;
    color: ${props => props.theme.textSecondary};
    width: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    margin-top: auto;
    padding-top: 1rem;
    flex-shrink: 0;
    text-align: left;

    &:hover {
        background-color: ${props => props.theme.bgPrimary};
        color: ${props => props.theme.textPrimary};
    }
`;

function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();

    const traderLinks = [
        { to: "/trader-home", icon: <PiHouse />, label: "Home" },
        { to: "/my-demands", icon: <PiPaperPlaneTilt />, label: "My Demands" },
        { to: "/buy-feed", icon: <PiStorefront />, label: "Buy Feed" },
        { to: "/sell-diamonds", icon: <PiTag />, label: "My Listings" },
        { to: "/offers", icon: <PiEnvelope />, label: "My Offers" },
    ];
    
    const brokerLinks = [
        { to: "/broker-home", icon: <PiHouse />, label: "Home" },
        { to: "/workspace", icon: <PiBriefcase />, label: "Workspace" },
    ];
    
    // --- CHANGE 2: Added the "AI Pricing" link to the shared links array ---
    const sharedLinks = [
        { to: "/watchlist", icon: <PiStar />, label: "Watchlist" },
        { to: "/chats", icon: <PiChatCircleDots />, label: "Messages" },
        { to: "/news", icon: <PiNewspaper />, label: "News" },
        { to: "/ai-pricing", icon: <PiMagicWand />, label: "AI Pricing" },
        { to: "/settings", icon: <PiGear />, label: "Settings" },
    ];

    const primaryLinks = user?.role === 'trader' ? traderLinks : brokerLinks;

    return (
        <SidebarContainer $isOpen={isOpen}>
            <Logo>Diamond Connect</Logo>
            <Nav>
                {primaryLinks.map(link => (
                    <StyledNavLink to={link.to} key={link.to} onClick={onClose} end>
                        {link.icon} {link.label}
                    </StyledNavLink>
                ))}
                
                <NavSectionDivider />
                
                {sharedLinks.map(link => (
                    <StyledNavLink to={link.to} key={link.to} onClick={onClose}>
                        {link.icon} {link.label}
                    </StyledNavLink>
                ))}
            </Nav>
            <LogoutButton onClick={logout}>
                <PiSignOut /> Logout
            </LogoutButton>
        </SidebarContainer>
    );
}

export default Sidebar;