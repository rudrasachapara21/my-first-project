import React from 'react';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';
import { PiDeviceMobile, PiDesktop } from "react-icons/pi";

const Container = styled.div``;
const Content = styled.div`
    padding: 1.5rem;
`;
const Section = styled.div`
    margin-bottom: 3rem;
`;
const SectionTitle = styled.h2`
    font-family: 'Clash Display', sans-serif;
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: ${props => props.theme.textPrimary};
`;
const InputGroup = styled.div` margin-bottom: 1.5rem; `;
const InputLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
  font-weight: 700;
`;
const InputField = styled.input`
  width: 100%;
  padding: 1rem;
  background-color: ${props => props.theme.bgSecondary};
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  color: ${props => props.theme.textPrimary};
  font-size: 1rem;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; }
`;
const SubmitButton = styled.button`
    padding: 1rem;
    border: none;
    border-radius: 12px;
    background: ${props => props.theme.textPrimary};
    color: ${props => props.theme.bgSecondary};
    font-family: 'Clash Display', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
`;
const SessionItem = styled.div`
    display: flex;
    align-items: center;
    padding: 1rem;
    background-color: ${props => props.theme.bgSecondary};
    border: 1px solid ${props => props.theme.borderColor};
    border-radius: 12px;
    margin-bottom: 1rem;
`;
const SessionIcon = styled.div`
    font-size: 2rem;
    margin-right: 1.5rem;
    color: ${props => props.theme.textSecondary};
`;
const SessionInfo = styled.div`
    flex-grow: 1;
`;
const SessionDevice = styled.p`
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: ${props => props.theme.textPrimary};
`;
const SessionLocation = styled.p`
    font-size: 0.9rem;
    margin: 0;
    color: ${props => props.theme.textSecondary};
`;
const CurrentTag = styled.span`
    font-size: 0.8rem;
    font-weight: 600;
    color: ${props => props.theme.accentPrimary};
`;

function Security() {
    return (
        <Container>
            <PageHeader title="Security" />
            <Content>
                <Section>
                    <SectionTitle>Change Password</SectionTitle>
                    <form onSubmit={(e) => { e.preventDefault(); alert('Password updated!'); }}>
                        <InputGroup>
                            <InputLabel>Current Password</InputLabel>
                            <InputField type="password" required />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel>New Password</InputLabel>
                            <InputField type="password" required />
                        </InputGroup>
                        <InputGroup>
                            <InputLabel>Confirm New Password</InputLabel>
                            <InputField type="password" required />
                        </InputGroup>
                        <SubmitButton type="submit">Update Password</SubmitButton>
                    </form>
                </Section>
                <Section>
                    <SectionTitle>Active Sessions</SectionTitle>
                    <SessionItem>
                        <SessionIcon><PiDeviceMobile /></SessionIcon>
                        <SessionInfo>
                            <SessionDevice>iPhone 15 Pro</SessionDevice>
                            <SessionLocation>Mumbai, IN</SessionLocation>
                        </SessionInfo>
                        <CurrentTag>Current</CurrentTag>
                    </SessionItem>
                    <SessionItem>
                        <SessionIcon><PiDesktop /></SessionIcon>
                        <SessionInfo>
                            <SessionDevice>Chrome on Mac OS</SessionDevice>
                            <SessionLocation>Mumbai, IN</SessionLocation>
                        </SessionInfo>
                    </SessionItem>
                </Section>
            </Content>
        </Container>
    );
}

export default Security;