import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => p.theme.bgPrimary || '#0D1117'};
  padding: 1rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${p => p.theme.cardBg || '#0F172A'};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  color: ${p => p.theme.textPrimary || '#E2E8F0'};
  text-align: center;
`;

const Subtitle = styled.p`
  margin: 0 0 16px 0;
  color: ${p => p.theme.textSecondary || '#94A3B8'};
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid ${p => p.theme.borderColor || '#334155'};
  background: ${p => p.theme.inputBg || '#0B1220'};
  color: ${p => p.theme.textPrimary || '#E2E8F0'};
  margin-bottom: 12px;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: none;
  background: ${p => p.theme.accentPrimary || '#6366F1'};
  color: white;
  font-weight: 600;
  cursor: pointer;
`;

const Error = styled.div`
  color: #ef4444;
  margin-top: 10px;
  text-align: center;
`;

const Success = styled.div`
  color: #10b981;
  margin-top: 10px;
  text-align: center;
`;

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !otp) {
      setError('Email and OTP are required');
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      setMessage('Email verified! You can now log in after admin approval.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>Verify Email</Title>
        <Subtitle>Enter the OTP sent to your email address</Subtitle>
        <form onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input type="text" inputMode="numeric" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify'}</Button>
        </form>
        {error && <Error>{error}</Error>}
        {message && <Success>{message}</Success>}
      </Card>
    </Container>
  );
}
