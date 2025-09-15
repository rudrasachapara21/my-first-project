import React from 'react';
import styled from 'styled-components';
import { PiX } from "react-icons/pi";

const PanelOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const PanelContainer = styled.div`
  background: ${props => props.theme.bgSecondary};
  width: 90%;
  max-width: 500px;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 5px 25px rgba(0,0,0,0.15);
`;
const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;
const PanelTitle = styled.h2`
  font-size: 1.5rem;
  color: ${props => props.theme.textPrimary};
  margin: 0;
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.textSecondary};
`;
const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
  font-weight: 700;
`;
const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => props.theme.bgPrimary};
  border: 2px solid ${props => props.theme.borderColor};
  border-radius: 8px;
  color: ${props => props.theme.textPrimary};
  font-size: 1rem;
`;
const CtaButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: ${props => props.theme.accentPrimary};
  color: white;
  font-family: 'Clash Display', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
`;

function FilterPanel({ onClose, filters, setFilters }) {
  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value }));
  };
  return (
    <PanelOverlay onClick={onClose}>
      <PanelContainer onClick={(e) => e.stopPropagation()}>
        <PanelHeader>
          <PanelTitle>Filter & Sort</PanelTitle>
          <CloseButton onClick={onClose}><PiX /></CloseButton>
        </PanelHeader>
        <FormGroup>
            <Label>Sort By</Label>
            <Select value={filters.sortBy} onChange={handleSortChange}>
                <option value="newest">Date Posted (Newest First)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
            </Select>
        </FormGroup>
        <CtaButton onClick={onClose}>
            Apply Filters
        </CtaButton>
      </PanelContainer>
    </PanelOverlay>
  );
}
export default FilterPanel;