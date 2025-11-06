import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig'; // Using our central client
import PageHeader from '../components/PageHeader';

const Container = styled.div` font-family: 'Inter', sans-serif; `;
const FormContainer = styled.div` padding: 1.5rem; `;
const InputGroup = styled.div` margin-bottom: 1.5rem; `;
const InputLabel = styled.label` display: block; margin-bottom: 0.5rem; color: ${props => props.theme.textSecondary}; font-size: 0.9rem; font-weight: 700; `;
const InputField = styled.input` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;

// ## CHANGE: Added a SelectField for our dropdowns ##
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

const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.accentPrimary}; color: #FFFFFF; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; &:disabled { background-color: #ccc; } `;
const AiResult = styled.div` margin-top: 2rem; padding: 1.5rem; background-color: ${props => props.theme.bgSecondary}; border-radius: 16px; text-align: center; border: 1px dashed ${props => props.theme.accentSecondary}; `;
const AiPrice = styled.p` font-family: 'Clash Display', sans-serif; font-size: 2.5rem; font-weight: 700; color: ${props => props.theme.accentPrimary}; margin: 0.5rem 0; `;
const ErrorMessage = styled.p` color: #ef4444; text-align: center; font-weight: 500; `;

// --- Data from the Kaggle dataset ---
const cutOptions = ['Ideal', 'Premium', 'Very Good', 'Good', 'Fair'];
const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
const clarityOptions = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];


function AIPricing() {
  const navigate = useNavigate();
  const [price, setPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ## CHANGE: Updated form state to match the dataset ##
  const [formState, setFormState] = useState({
    carat: '',
    color: colorOptions[0], // Default to 'D'
    clarity: clarityOptions[0], // Default to 'IF'
    cut: cutOptions[0], // Default to 'Ideal'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleAiPricing = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPrice(null);
    setError('');

    try {
      // This API call doesn't need to change. The backend
      // will now handle the new, "smarter" logic.
      const response = await apiClient.post('/api/pricing/estimate', formState);
      
      // ## CHANGE: Updated response key to 'estimated_price' ##
      setPrice(response.data.estimated_price); 
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
            <InputField name="carat" type="number" step="0.01" placeholder="e.g., 1.02" value={formState.carat} onChange={handleInputChange} required />
          </InputGroup>
          
          {/* ## CHANGE: Converted 'Color' to a dropdown ## */}
          <InputGroup>
            <InputLabel>Color Grade</InputLabel>
            <SelectField name="color" value={formState.color} onChange={handleInputChange} required>
              {colorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </SelectField>
          </InputGroup>
          
          {/* ## CHANGE: Converted 'Clarity' to a dropdown ## */}
          <InputGroup>
            <InputLabel>Clarity Grade</InputLabel>
            <SelectField name="clarity" value={formState.clarity} onChange={handleInputChange} required>
              {clarityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </SelectField>
          </InputGroup>
          
          {/* ## CHANGE: Converted 'Cut' to a dropdown for "Cut Quality" ## */}
          <InputGroup>
            <InputLabel>Cut Quality</InputLabel>
            <SelectField name="cut" value={formState.cut} onChange={handleInputChange} required>
              {cutOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </SelectField>
          </InputGroup>
          
          {/* ## CHANGE: Removed the "Shape" field ## */}

          <CtaButton type="submit" disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Calculate Estimate'}
          </CtaButton>
        </form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {price !== null && (
          <AiResult>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Estimated Value</h3>
            {/* ## CHANGE: Updated price formatting to match 'estimated_price' ## */}
            <AiPrice>₹{price.toLocaleString('en-IN')}</AiPrice>
            <small>This is an AI-powered estimate based on market data.</small>
          </AiResult>
        )}
      </FormContainer>
    </Container>
  );
}

export default AIPricing;