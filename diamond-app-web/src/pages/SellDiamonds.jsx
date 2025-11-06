import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

// --- Data for dropdowns (matches our AI Pricing data) ---
const cutOptions = ['Ideal', 'Premium', 'Very Good', 'Good', 'Fair'];
const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
const clarityOptions = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];

// --- Styled Components ---
const Container = styled.div``;
const FormContainer = styled.form` padding: 1.5rem; `;

// ## NEW: FormGrid for better layout ##
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  // ## NEW: Allow spanning full width ##
  ${props => props.$fullWidth && `grid-column: 1 / -1;`}
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
  font-weight: 700;
  // ## NEW: Added required asterisk ##
  ${props => props.$required && `
    &::after {
      content: ' *';
      color: #ef4444;
    }
  `}
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
  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentPrimary};
  }
  // File input has special padding
  &[type="file"] {
    padding: 0.8rem;
  }
`;

// ## NEW: SelectField component ##
const SelectField = styled.select`
  width: 100%;
  padding: 1rem;
  background-color: ${props => props.theme.bgSecondary};
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  color: ${props => props.theme.textPrimary};
  font-size: 1rem;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 0.65em auto;
  &:focus {
    outline: none;
    border-color: ${props => props.theme.accentPrimary};
  }
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
  margin-top: 1rem;
  &:disabled {
    background-color: #ccc;
  }
`;

const SuccessMessage = styled.p` color: #22c55e; text-align: center; font-weight: 500; `;
const ErrorMessage = styled.p` color: #ef4444; text-align: center; font-weight: 500; `;

function SellDiamonds() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // ## NEW: Expanded form state ##
  const [formState, setFormState] = useState({
    carat: '',
    cut: cutOptions[0],
    color: colorOptions[0],
    clarity: clarityOptions[0],
    gia_report_number: '',
    price: ''
  });
  
  const [files, setFiles] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    // ## NEW: Grouping details for the JSONB field ##
    const diamondDetails = {
      carat: formState.carat,
      cut: formState.cut,
      color: formState.color,
      clarity: formState.clarity,
      gia_report_number: formState.gia_report_number
    };

    const formData = new FormData();
    // The backend expects 'diamond_details' (JSON) and 'price' (Number)
    formData.append('diamond_details', JSON.stringify(diamondDetails));
    formData.append('price', formState.price);
    
    // The backend expects 'listingImages' for the file array
    for (let i = 0; i < files.length; i++) {
      formData.append('listingImages', files[i]);
    }

    try {
      await apiClient.post('/api/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Diamond listed successfully!');
      setTimeout(() => navigate('/buy-feed', { state: { defaultTab: 'myFeed' } }), 1500);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to list diamond.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Only Traders can see this page
  if (user?.role !== 'trader') {
    // You could redirect or show an unauthorized message
    // For now, returning null keeps it simple.
    return null;
  }

  return (
    <Container>
      <PageHeader title="Sell a Diamond" />
      <FormContainer onSubmit={handleSubmit}>
        <FormGrid>
          {/* --- NEW/UPDATED FIELDS --- */}
          <InputGroup>
            <InputLabel htmlFor="carat" $required>Size (Carat)</InputLabel>
            <InputField
              id="carat" name="carat" type="number" step="0.01"
              placeholder="e.g., 1.5" value={formState.carat}
              onChange={handleInputChange} required
            />
          </InputGroup>
          
          <InputGroup>
            <InputLabel htmlFor="price" $required>Asking Price (INR)</InputLabel>
            <InputField
              id="price" name="price" type="number"
              placeholder="e.g., 800000" value={formState.price}
              onChange={handleInputChange} required
            />
          </InputGroup>
          
          <InputGroup>
            <InputLabel htmlFor="cut" $required>Cut</InputLabel>
            <SelectField id="cut" name="cut" value={formState.cut} onChange={handleInputChange}>
              {cutOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </SelectField>
          </InputGroup>
          
          <InputGroup>
            <InputLabel htmlFor="color" $required>Color</InputLabel>
            <SelectField id="color" name="color" value={formState.color} onChange={handleInputChange}>
              {colorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </SelectField>
          </InputGroup>
          
          <InputGroup>
            <InputLabel htmlFor="clarity" $required>Clarity</InputLabel>
            <SelectField id="clarity" name="clarity" value={formState.clarity} onChange={handleInputChange}>
              {clarityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </SelectField>
          </InputGroup>

          <InputGroup>
            <InputLabel htmlFor="gia_report_number">GIA Report Number</InputLabel>
            <InputField
              id="gia_report_number" name="gia_report_number" type="text"
              placeholder="e.g., 22018876" value={formState.gia_report_number}
              onChange={handleInputChange}
            />
          </InputGroup>
          
          <InputGroup $fullWidth>
            <InputLabel htmlFor="listingImages" $required>Upload Photos (Up to 5)</InputLabel>
            <InputField
              id="listingImages" name="listingImages" type="file"
              multiple accept="image/*"
              onChange={(e) => setFiles(e.target.files)} required
            />
          </InputGroup>
        </FormGrid>
        
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