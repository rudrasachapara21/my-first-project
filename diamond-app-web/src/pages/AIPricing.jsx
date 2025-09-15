// src/pages/AIPricing.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

// ... (Styled components are the same)
const Container = styled.div` font-family: 'Inter', sans-serif; `;
const FormContainer = styled.div` padding: 1.5rem; `;
const InputGroup = styled.div` margin-bottom: 1.5rem; `;
const InputLabel = styled.label` display: block; margin-bottom: 0.5rem; color: ${props => props.theme.textSecondary}; font-size: 0.9rem; font-weight: 700; `;
const InputField = styled.input` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary}; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; &:disabled { background-color: #ccc; } `;
const AiResult = styled.div` margin-top: 2rem; padding: 1.5rem; background-color: ${props => props.theme.bgSecondary}; border-radius: 16px; text-align: center; border: 1px dashed ${props => props.theme.accentSecondary}; `;
const AiPrice = styled.p` font-family: 'Clash Display', sans-serif; font-size: 2.5rem; font-weight: 700; color: ${props => props.theme.accentPrimary}; margin: 0.5rem 0; `;
const ErrorMessage = styled.p` color: #ef4444; text-align: center; font-weight: 500; `;


function AIPricing() {
  const navigate = useNavigate();
  const [price, setPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // MODIFIED: Add cut and shape to the form state
  const [formState, setFormState] = useState({ carat: '', color: '', clarity: '', cut: '', shape: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleAiPricing = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPrice(null);
    setError('');

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:5001/api/pricing/estimate', formState, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrice(response.data.estimatedPrice);
    } catch (err) {
      setError(err.response?.data?.message || "Could not calculate price.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <PageHeader title="AI Pricing" />
      <FormContainer>
        <form onSubmit={handleAiPricing}>
          <InputGroup>
            <InputLabel>Carat Weight</InputLabel>
            <InputField name="carat" type="number" step="0.01" value={formState.carat} onChange={handleInputChange} required />
          </InputGroup>
          <InputGroup>
            <InputLabel>Color Grade</InputLabel>
            <InputField name="color" type="text" placeholder="e.g., D, G, J" value={formState.color} onChange={handleInputChange} required />
          </InputGroup>
          <InputGroup>
            <InputLabel>Clarity Grade</InputLabel>
            <InputField name="clarity" type="text" placeholder="e.g., VVS1, SI2" value={formState.clarity} onChange={handleInputChange} required />
          </InputGroup>
          {/* ADDED: New fields for cut and shape */}
          <InputGroup>
            <InputLabel>Cut</InputLabel>
            <InputField name="cut" type="text" placeholder="e.g., Excellent, Very Good" value={formState.cut} onChange={handleInputChange} required />
          </InputGroup>
          <InputGroup>
            <InputLabel>Shape</InputLabel>
            <InputField name="shape" type="text" placeholder="e.g., Round, Princess" value={formState.shape} onChange={handleInputChange} required />
          </InputGroup>

          <CtaButton type="submit" disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Calculate Estimate'}
          </CtaButton>
        </form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {price !== null && (
          <AiResult>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Estimated Value</h3>
            <AiPrice>₹{price.toLocaleString('en-IN')}</AiPrice>
            <small>This is a consistent estimate based on diamond characteristics.</small>
          </AiResult>
        )}
      </FormContainer>
    </Container>
  );
}

export default AIPricing;