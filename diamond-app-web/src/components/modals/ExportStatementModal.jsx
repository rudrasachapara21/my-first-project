import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../api/axiosConfig';
import { PiFilePdf, PiMicrosoftExcelLogo, PiX, PiDownloadSimple, PiCalendarBlank } from "react-icons/pi";

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// --- STYLED COMPONENTS ---
const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(15, 23, 42, 0.6); // Dark navy tint
  backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.bgSecondary};
  width: 100%; max-width: 420px;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  animation: ${slideUp} 0.3s ease-out;
`;

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.5rem;
  color: ${props => props.theme.textPrimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent; border: none; cursor: pointer;
  color: ${p => p.theme.textSecondary}; transition: color 0.2s;
  display: flex; align-items: center; justify-content: center;
  padding: 4px; border-radius: 50%;
  &:hover { background: ${p => p.theme.bgSecondary}; color: ${p => p.theme.error}; }
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${p => p.theme.textSecondary};
  margin-bottom: 0.5rem;
`;

const DateGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex; align-items: center;
`;

const DateIcon = styled(PiCalendarBlank)`
  position: absolute; right: 12px; pointer-events: none; color: ${p => p.theme.textSecondary};
`;

const DateInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  font-size: 0.95rem;
  color: ${props => props.theme.textPrimary};
  background: ${props => props.theme.bgSecondary};
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  
  &::-webkit-calendar-picker-indicator {
    opacity: 0; cursor: pointer; position: absolute; right: 0; top: 0; width: 100%; height: 100%;
  }

  &:focus {
    outline: none; border-color: ${props => props.theme.info}; background: ${props => props.theme.textMain};
    box-shadow: 0 0 0 3px ${props => props.theme.info}22;
  }
`;

const FormatGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
  margin-bottom: 2rem;
`;

const FormatCard = styled.div`
  border: 2px solid ${props => props.$active ? props.theme.info : props.theme.border};
  background: ${props => props.$active ? props.theme.info + '15' : props.theme.bgSecondary};
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;

  &:hover {
    border-color: ${props => props.$active ? props.theme.info : props.theme.border};
    transform: translateY(-2px);
  }
`;

const FormatName = styled.span`
  font-weight: 600; font-size: 0.9rem;
  color: ${props => props.$active ? props.theme.info : props.theme.textSecondary};
`;

const ButtonGroup = styled.div`
  display: flex; gap: 1rem; margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1; padding: 0.9rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  
  ${props => props.$primary ? `
    background: ${props => props.theme.accentPrimary}; color: ${props => props.theme.textMain}; border: none;
    &:hover { filter: brightness(1.05); transform: translateY(-1px); }
    &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  ` : `
    background: transparent; color: ${props => props.theme.textSecondary}; border: 1px solid ${props => props.theme.border};
    &:hover { background: ${props => props.theme.bgSecondary}; color: ${props => props.theme.textPrimary}; }
  `}
`;

const ErrorMsg = styled.div`
  background: ${p => p.theme.accentDangerLight || p.theme.error + '15'}; color: ${p => p.theme.error}; padding: 0.75rem; border-radius: 8px;
  font-size: 0.9rem; margin-bottom: 1rem; text-align: center; border: 1px solid ${p => p.theme.error};
`;

// --- MAIN COMPONENT ---
const ExportStatementModal = ({ isOpen, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [format, setFormat] = useState('pdf');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
  const { currentTheme } = useTheme();

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!startDate || !endDate) {
            setError('Please select a valid date range.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await apiClient.get('/api/reports/statement', {
                params: { startDate, endDate, format },
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = format === 'excel' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `Statement_${startDate}_to_${endDate}.${extension}`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            onClose(); 
        } catch (err) {
            console.error("Download failed", err);
            setError('Server connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={e => e.stopPropagation()}>
                <Header>
                    <Title>Export Statement</Title>
                    <CloseButton onClick={onClose}><PiX size={20} /></CloseButton>
                </Header>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                {/* DATE INPUTS */}
                <Label>Select Period</Label>
                <DateGrid>
                    <InputWrapper>
                        <DateInput 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                        <DateIcon size={18} />
                    </InputWrapper>
                    <InputWrapper>
                        <DateInput 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                        <DateIcon size={18} />
                    </InputWrapper>
                </DateGrid>

                {/* FORMAT SELECTION CARDS */}
                <Label>Choose Format</Label>
                <FormatGrid>
          <FormatCard 
            $active={format === 'pdf'} 
            onClick={() => setFormat('pdf')}
          >
            <PiFilePdf size={32} color={format === 'pdf' ? currentTheme?.error : currentTheme?.textSecondary} />
            <FormatName $active={format === 'pdf'}>PDF Document</FormatName>
          </FormatCard>

          <FormatCard 
            $active={format === 'excel'} 
            onClick={() => setFormat('excel')}
          >
            <PiMicrosoftExcelLogo size={32} color={format === 'excel' ? currentTheme?.success : currentTheme?.textSecondary} />
            <FormatName $active={format === 'excel'}>Excel Spreadsheet</FormatName>
          </FormatCard>
                </FormatGrid>

                {/* ACTION BUTTONS */}
                <ButtonGroup>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button $primary onClick={handleDownload} disabled={loading}>
                        {loading ? 'Generating...' : <><PiDownloadSimple size={18} /> Download Now</>}
                    </Button>
                </ButtonGroup>
            </ModalContainer>
        </Overlay>
    );
};

export default ExportStatementModal;