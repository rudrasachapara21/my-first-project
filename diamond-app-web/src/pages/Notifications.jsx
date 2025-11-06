import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import apiClient from '../api/axiosConfig';

const Container = styled.div``;
const SettingsList = styled.div`
  padding: 0 1.5rem;
`;
const SettingsItemToggle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 0;
  border-bottom: 1px solid ${props => props.theme.borderColor};
`;
const TextContent = styled.div`
  display: flex;
  flex-direction: column;
`;
const ItemText = styled.span`
  font-size: 1.1rem;
  color: ${props => props.theme.textPrimary};
`;
const ItemSubtext = styled.small`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
`;
const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  & input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;
const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.borderColor};
  transition: .4s;
  border-radius: 28px;
  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;
const CheckboxInput = styled.input`
  &:checked + ${Slider} {
    background-color: ${props => props.theme.accentPrimary};
  }
  &:checked + ${Slider}:before {
    transform: translateX(22px);
  }
`;

function Notifications() {
  const [toggles, setToggles] = useState({
    newDemands: true,
    handRaises: true,
    newsUpdates: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        // ## CHANGE: Using apiClient and added /api prefix ##
        const { data } = await apiClient.get('/api/users/me/preferences');
        setToggles(data);
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, []);
  
  const handleToggle = async (key) => {
    // Optimistically update UI
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles); 

    try {
      // ## CHANGE: Using apiClient and added /api prefix ##
      await apiClient.put('/api/users/me/preferences', newToggles);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      // Revert UI on error
      setToggles(toggles); 
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Container>
      <PageHeader title="Notifications" />
      <SettingsList>
        <SettingsItemToggle>
          <TextContent>
            <ItemText>New Demands</ItemText>
            <ItemSubtext>Get notified when a new demand is posted.</ItemSubtext>
          </TextContent>
          <ToggleSwitch>
            <CheckboxInput type="checkbox" checked={toggles.newDemands} onChange={() => handleToggle('newDemands')} />
            <Slider />
          </ToggleSwitch>
        </SettingsItemToggle>
        <SettingsItemToggle>
          <TextContent>
            <ItemText>Hand Raises</ItemText>
            <ItemSubtext>Notify me when a broker raises a hand.</ItemSubtext>
          </TextContent>
          <ToggleSwitch>
            <CheckboxInput type="checkbox" checked={toggles.handRaises} onChange={() => handleToggle('handRaises')} />
            <Slider />
          </ToggleSwitch>
        </SettingsItemToggle>
        <SettingsItemToggle>
          <TextContent>
            <ItemText>News Updates</ItemText>
            <ItemSubtext>Receive updates from the news feed.</ItemSubtext>
          </TextContent>
          <ToggleSwitch>
            <CheckboxInput type="checkbox" checked={toggles.newsUpdates} onChange={() => handleToggle('newsUpdates')} />
            <Slider />
          </ToggleSwitch>
        </SettingsItemToggle>
      </SettingsList>
    </Container>
  );
}

export default Notifications;