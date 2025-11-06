import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
// ## CHANGE: Added PiCheckCircle icon ##
import { PiPackage, PiUsers, PiCheckCircle } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { SkeletonDemandCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  background-color: ${props => props.theme.bgPrimary || '#FFFFFF'};
  min-height: 100%;
`;

const TabNav = styled.div`
  display: flex;
  background-color: ${props => props.theme.borderColor};
  border-radius: 12px;
  padding: 5px;
  margin: 1.5rem 1.5rem 2rem 1.5rem;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Clash Display', sans-serif;
  color: ${props => props.$active ? '#FFFFFF' : props.theme.textSecondary};
  background-color: ${props => props.$active ? props.theme.accentPrimary : 'transparent'};
`;

const TabContent = styled.div`
  padding: 0 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  ${props => props.$fullWidth && `grid-column: 1 / -1;`}
`;

const Label = styled.label`
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
  
  ${props => props.$required && `
    &::after {
      content: ' *';
      color: #ef4444;
    }
  `}
`;

const InputField = styled.input` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const SelectField = styled.select` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.accentPrimary}; color: #FFFFFF; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; &:disabled { background-color: ${props => props.theme.borderColor}; color: ${props => props.theme.textSecondary}; cursor: not-allowed; } `;

const DemandCard = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
  &:hover {
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }
`;

const CompletedDemandCard = styled(DemandCard)`
  opacity: 0.7;
  background-color: ${props => props.theme.bgPrimary};
  cursor: default;
`;

const DemandTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const DemandFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  flex-wrap: nowrap;
  gap: 1rem;
`;

const DemandInfo = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const InterestIndicator = styled.div` 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  color: ${props => props.$hasInterest ? props.theme.accentPrimary : (props.$completed ? '#22c55e' : props.theme.textSecondary)}; 
  font-weight: 600;
  flex-shrink: 0;
  
  svg {
    vertical-align: middle;
  }
`;

const Message = styled.p` text-align: center; font-weight: 500; margin-top: 1rem; color: ${props => props.success ? '#22c55e' : '#ef4444'}; `;
const clarityOptions = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];

function PostDemand() {
  const [activeTab, setActiveTab] = useState('create');
  const navigate = useNavigate();
  const [myDemands, setMyDemands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  
  const initialFormState = {
    size: '',
    clarity: clarityOptions[0],
    price_per_caret: '',
    quantity: '',
    private_name: '',
    require_till: '',
    payment_duration: '',
  };
  const [formState, setFormState] = useState(initialFormState);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const fetchMyDemands = useCallback(async () => {
    setIsListLoading(true);
    try {
      const response = await apiClient.get('/api/demands/my-demands');
      setMyDemands(response.data);
    } catch (err) {
      console.error("Failed to fetch my demands", err);
      setError('Could not load your demands.');
    } finally {
      setIsListLoading(false);
    }
  }, []);

  const { activeDemands, completedDemands } = useMemo(() => {
    const active = [];
    const completed = [];
    for (const demand of myDemands) {
      if (demand.status === 'completed') {
        completed.push(demand);
      } else {
        active.push(demand);
      }
    }
    return { activeDemands: active, completedDemands: completed };
  }, [myDemands]);


  useEffect(() => {
    if (user && (activeTab === 'activeDemands' || activeTab === 'completedDemands')) {
      fetchMyDemands();
    }
  }, [user, activeTab, fetchMyDemands]);

  const handlePostDemand = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await apiClient.post('/api/demands', formState);
      setSuccess('Demand posted successfully!');
      setFormState(initialFormState);
      setActiveTab('activeDemands'); 
    } catch (err) {
      const message = err.response?.data?.message || "Failed to post demand.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderActiveDemands = () => {
    if (isListLoading) {
      return <><SkeletonDemandCard /><SkeletonDemandCard /></>;
    }
    if (activeDemands.length === 0) {
      return <EmptyState icon={PiPackage} title="You Have No Active Demands" message="Use the 'Create Demand' tab to post a new requirement." />;
    }
    return activeDemands.map(demand => {
      const d = demand.diamond_details || {};
      const demandTitle = d.private_name || `Demand for ${d.size}ct`;
      const interestCount = demand.interest_count || 0;

      return (
        <DemandCard key={demand.demand_id} onClick={() => navigate(`/demand/${demand.demand_id}`)}>
          <DemandTitle>{demandTitle}</DemandTitle>
          <DemandFooter>
            <DemandInfo>Size: {d.size}ct | Clarity: {d.clarity}</DemandInfo>
            <InterestIndicator $hasInterest={interestCount > 0}>
                <PiUsers />
                <span>{interestCount} Interested</span>
            </InterestIndicator>
          </DemandFooter>
        </DemandCard>
      );
    });
  };

  const renderCompletedDemands = () => {
    if (isListLoading) {
      return <><SkeletonDemandCard /><SkeletonDemandCard /></>;
    }
    if (completedDemands.length === 0) {
      return <EmptyState icon={PiCheckCircle} title="No Completed Demands" message="Active deals you mark as 'complete' will appear here." />;
    }
    return completedDemands.map(demand => {
      const d = demand.diamond_details || {};
      const demandTitle = d.private_name || `Demand for ${d.size}ct`;

      return (
        <CompletedDemandCard key={demand.demand_id}>
          <DemandTitle>{demandTitle}</DemandTitle>
          <DemandFooter>
            <DemandInfo>Size: {d.size}ct | Clarity: {d.clarity}</DemandInfo>
            <InterestIndicator $completed={true}>
                <PiCheckCircle />
                <span>Completed</span>
            </InterestIndicator>
          </DemandFooter>
        </CompletedDemandCard>
      );
    });
  };


  return (
    <Container>
      <PageHeader title="My Demands" />
      <TabNav>
        <TabButton $active={activeTab === 'create'} onClick={() => setActiveTab('create')}>Create Demand</TabButton>
        <TabButton $active={activeTab === 'activeDemands'} onClick={() => setActiveTab('activeDemands')}>
          Active ({activeDemands.length})
        </TabButton>
        
        {/* ## FIX: Corrected the closing tag from </AddingButton> to </TabButton> ## */}
        <TabButton $active={activeTab === 'completedDemands'} onClick={() => setActiveTab('completedDemands')}>
          Completed ({completedDemands.length})
        </TabButton>

      </TabNav>
      <TabContent>
        {activeTab === 'create' && (
          <form onSubmit={handlePostDemand}>
            <FormGrid>
              <FormField>
                <Label htmlFor="size" $required>Size (Carat)</Label>
                <InputField id="size" name="size" type="number" step="0.01" placeholder="e.g., 1.5" value={formState.size} onChange={handleInputChange} required />
              </FormField>
              <FormField>
                <Label htmlFor="clarity" $required>Clarity</Label>
                <SelectField id="clarity" name="clarity" value={formState.clarity} onChange={handleInputChange} required>
                  {clarityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </SelectField>
              </FormField>
              <FormField>
                <Label htmlFor="price_per_caret" $required>Price per Carat (₹)</Label>
                <InputField id="price_per_caret" name="price_per_caret" type="number" step="0.01" placeholder="e.g., 500000" value={formState.price_per_caret} onChange={handleInputChange} required />
              </FormField>
              <FormField>
                <Label htmlFor="quantity" $required>Quantity</Label>
                <InputField id="quantity" name="quantity" type="number" placeholder="e.g., 1" value={formState.quantity} onChange={handleInputChange} required />
              </FormField>
              <FormField>
                <Label htmlFor="require_till">Required By</Label>
                <InputField id="require_till" name="require_till" type="date" value={formState.require_till} onChange={handleInputChange} />
              </FormField>
              <FormField>
                <Label htmlFor="payment_duration">Payment Duration</Label>
                <InputField id="payment_duration" name="payment_duration" type="text" placeholder="e.g., Within 7 days" value={formState.payment_duration} onChange={handleInputChange} />
              </FormField>
              <FormField $fullWidth>
                <Label htmlFor="private_name">Private Name (Only you can see this)</Label>
                <InputField id="private_name" name="private_name" type="text" placeholder="e.g., 'Special request for John Doe'" value={formState.private_name} onChange={handleInputChange} />
              </FormField>
            </FormGrid>

            <CtaButton type="submit" disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post to Market'}
            </CtaButton>
            {success && <Message success>{success}</Message>}
            {error && !success && <Message>{error}</Message>}
          </form>
        )}
        
        {activeTab === 'activeDemands' && renderActiveDemands()}
        {activeTab === 'completedDemands' && renderCompletedDemands()}
        
      </TabContent>
    </Container>
  );
}

export default PostDemand;