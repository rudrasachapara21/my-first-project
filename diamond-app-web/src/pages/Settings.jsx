import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
// ## CHANGE: Imported the PiQuestion icon ##
import { PiUserCircle, PiPalette, PiBell, PiShieldCheck, PiQuestion } from "react-icons/pi";

const Container = styled.div``;
const SettingsList = styled.div`
  padding: 1.5rem;
`;
const SettingsItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1.2rem;
  background-color: ${props => props.theme.bgSecondary};
  color: ${props => props.theme.textPrimary};
  cursor: pointer;
  border: 1px solid ${props => props.theme.borderColor};

  &:first-child { 
    border-radius: 16px 16px 0 0; 
  }
  &:not(:first-child) {
      margin-top: -1px; /* Collapse borders */
  }
  &:last-child { 
    border-radius: 0 0 16px 16px;
  }
`;
const SettingsText = styled.span`
  font-size: 1.1rem;
  margin-left: 1.5rem;
`;

function Settings() {
  const navigate = useNavigate();
  return (
    <Container>
      <PageHeader title="Settings" />
      <SettingsList>
        <SettingsItem onClick={() => navigate('/edit-profile')}>
          <PiUserCircle size={28} color="#64748B" />
          <SettingsText>Edit Profile</SettingsText>
        </SettingsItem>
        <SettingsItem onClick={() => navigate('/app-theme')}>
          <PiPalette size={28} color="#64748B" />
          <SettingsText>App Theme</SettingsText>
        </SettingsItem>
        <SettingsItem onClick={() => navigate('/notifications')}>
          <PiBell size={28} color="#64748B" />
          <SettingsText>Notifications</SettingsText>
        </SettingsItem>
        <SettingsItem onClick={() => navigate('/security')}>
          <PiShieldCheck size={28} color="#64748B" />
          <SettingsText>Security</SettingsText>
        </SettingsItem>
        {/* ## NEW ITEM: Link to the Help page ## */}
        <SettingsItem onClick={() => navigate('/help')}>
          <PiQuestion size={28} color="#64748B" />
          <SettingsText>Help & Support</SettingsText>
        </SettingsItem>
      </SettingsList>
    </Container>
  );
}

export default Settings;