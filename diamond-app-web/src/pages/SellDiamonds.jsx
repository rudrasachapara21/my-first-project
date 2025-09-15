// src/pages/SellDiamonds.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

// --- Styled Components (no changes) ---
const Container = styled.div``;
const FormContainer = styled.form`
  padding: 1.5rem;
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
const CtaButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.textPrimary};
  color: ${props => props.theme.bgSecondary};
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  &:disabled { background-color: #ccc; }
`;
const SuccessMessage = styled.p`
    color: #22c55e; text-align: center; font-weight: 500;
`;
const ErrorMessage = styled.p`
    color: #ef4444; text-align: center; font-weight: 500;
`;


function SellDiamonds() {
  const navigate = useNavigate();
  const [isTrader, setIsTrader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for form fields
  const [file, setFile] = useState(null);
  const [carat, setCarat] = useState('');
  const [clarity, setClarity] = useState('');
  const [price, setPrice] = useState('');
  
  // Protection useEffect
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !user) {
      navigate('/');
      return;
    }
    if (user.role !== 'trader') {
      navigate('/broker-home'); // Redirect non-traders
      return;
    }
    setIsTrader(true);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
        setError('Please upload an image.');
        return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    // FormData is used to send files and text together
    const formData = new FormData();
    formData.append('image', file);
    formData.append('carat', carat);
    formData.append('clarity', clarity);
    formData.append('price', price);
    // You can add more fields here like color, shape, etc.
    // formData.append('color', 'D'); 

    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5001/api/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Diamond listed successfully!');
      // Reset form
      setFile(null);
      setCarat('');
      setClarity('');
      setPrice('');
      e.target.reset(); // Clears the file input
      
      // Redirect to the buy feed after a short delay
      setTimeout(() => navigate('/buy-feed'), 2000);

    } catch (err) {
      const message = err.response?.data?.message || "Failed to list diamond.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTrader) return null; // Render nothing while redirecting

  return (
    <Container>
      <PageHeader title="Sell a Diamond" />
      <FormContainer onSubmit={handleSubmit}>
        <InputGroup>
            <InputLabel>Upload Photo</InputLabel>
            <InputField 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                required 
            />
        </InputGroup>
        <InputGroup>
            <InputLabel>Size (Carat)</InputLabel>
            <InputField 
                type="number" 
                step="0.01"
                value={carat}
                onChange={(e) => setCarat(e.target.value)}
                required 
            />
        </InputGroup>
        <InputGroup>
            <InputLabel>Clarity</InputLabel>
            <InputField 
                type="text" 
                value={clarity}
                onChange={(e) => setClarity(e.target.value)}
                required 
            />
        </InputGroup>
        <InputGroup>
            <InputLabel>Asking Price (INR)</InputLabel>
            <InputField 
                type="number" 
                placeholder="e.g., 800000" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required 
            />
        </InputGroup>
        <CtaButton type="submit" disabled={isLoading}>
            {isLoading ? 'Listing...' : 'List Diamond for Sale'}
        </CtaButton>
        {success && <SuccessMessage>{success}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </FormContainer>
    </Container>
  );
}

export default SellDiamonds;