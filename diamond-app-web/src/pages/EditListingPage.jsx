import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';

const Container = styled.div``;
const FormContainer = styled.form` padding: 1.5rem; `;
const InputGroup = styled.div` margin-bottom: 1.5rem; `;
const InputLabel = styled.label` display: block; margin-bottom: 0.5rem; color: ${props => props.theme.textSecondary}; font-size: 0.9rem; font-weight: 700; `;
const InputField = styled.input` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary}; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; &:disabled { background-color: #ccc; } `;
const SuccessMessage = styled.p` color: #22c55e; text-align: center; font-weight: 500; `;
const ErrorMessage = styled.p` color: #ef4444; text-align: center; font-weight: 500; `;

function EditListingPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState({ price: '', diamond_details: { carat: '', clarity: '' } });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiClient.get(`/api/listings/${listingId}`);
        setListing(response.data);
      } catch (err) {
        console.error("Failed to fetch listing for editing:", err);
        alert("Could not load listing data.");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListing();
  }, [listingId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'carat' || name === 'clarity') {
      setListing(prev => ({
        ...prev,
        diamond_details: { ...prev.diamond_details, [name]: value }
      }));
    } else {
      setListing(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const updateData = {
      price: listing.price,
      diamond_details: listing.diamond_details,
    };

    try {
      await apiClient.put(`/api/listings/${listingId}`, updateData);
      setSuccess('Listing updated successfully!');
      setTimeout(() => navigate(`/listing/${listingId}`), 1500);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update listing.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageHeader title="Loading Listing..." />;
  }

  return (
    <Container>
      <PageHeader title="Edit Listing" backTo={`/listing/${listingId}`} />
      <FormContainer onSubmit={handleSubmit}>
        <InputGroup>
            <InputLabel>Size (Carat)</InputLabel>
            <InputField 
                type="number" step="0.01" name="carat"
                value={listing.diamond_details.carat || ''} onChange={handleChange} required 
            />
        </InputGroup>
        <InputGroup>
            <InputLabel>Clarity</InputLabel>
            <InputField 
                type="text" name="clarity"
                value={listing.diamond_details.clarity || ''} onChange={handleChange} required 
            />
        </InputGroup>
        <InputGroup>
            <InputLabel>Asking Price (INR)</InputLabel>
            <InputField 
                type="number" name="price"
                value={listing.price || ''} onChange={handleChange} required 
            />
        </InputGroup>
        <CtaButton type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
        </CtaButton>
        {success && <SuccessMessage>{success}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </FormContainer>
    </Container>
  );
}

export default EditListingPage;