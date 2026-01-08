import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader'; 
import { useAuth } from '../context/AuthContext';

// --- Constants ---
const shapeOptions = ['Round', 'Princess', 'Emerald', 'Asscher', 'Marquise', 'Oval', 'Radiant', 'Pear', 'Heart', 'Cushion'];
const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const clarityOptions = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2'];
const cutOptions = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'];

// --- Animations ---
// Generate a themed glow animation using the provided accent color
const makeGlowPulse = (accent) => keyframes`
  0% { box-shadow: 0 0 0 0 ${accent}66; border-color: ${accent}; }
  70% { box-shadow: 0 0 0 10px ${accent}00; border-color: ${accent}; }
  100% { box-shadow: 0 0 0 0 ${accent}00; }
`;

const slideUp = keyframes`
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- Styled Components ---
const Container = styled.div`
  background-color: transparent;
  padding-bottom: 6rem;

  header {
    @media (max-width: 480px) {
      padding-top: 4.5rem;
      h1 { font-size: 1.6rem; text-align: center; width: 100%; }
    }
  }
`;

const ScanningOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${props => props.theme.bgPrimary}dd;
  backdrop-filter: blur(20px);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ScanningSpinner = styled.div`
  width: 80px;
  height: 80px;
  border: 4px solid ${props => props.theme.borderColor};
  border-top-color: ${props => props.theme.accentPrimary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ScanningText = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.textPrimary};
  text-align: center;
`;

const ScanningSubtext = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  text-align: center;
  max-width: 300px;
`;

const FormContainer = styled.form` 
  padding: 1rem; 
  max-width: 800px;
  margin: 0 auto;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); 
  column-gap: 1.2rem;
  row-gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 28px;
  background: ${props => props.theme.surfaceGlass || props.theme.bgSecondary};
  border: ${props => props.theme.glassBorder || `1px solid ${props.theme.borderColor}`};
  backdrop-filter: blur(12px);
  box-shadow: ${props => props.theme.cardShadow || '0 8px 32px rgba(0,0,0,0.3)'};
  align-items: start;

  @media (max-width: 768px) { 
    grid-template-columns: 1fr; 
    padding: 1.25rem;
  }
`;

const SectionTitle = styled.h3`
  grid-column: 1 / -1;
  font-size: 1.1rem;
  font-family: 'Clash Display', sans-serif;
  color: ${props => props.theme.accentPrimary};
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::after { 
    content: ''; 
    flex: 1; 
    height: 1px; 
    background: ${props => props.theme.borderColor}; 
    opacity: 0.3; 
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  ${props => props.$fullWidth ? css`
    grid-column: 1 / -1;
  ` : css`
    grid-column: span 1;
  `}
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 0.6rem;
  color: ${props => props.theme.textPrimary};
  font-size: 0.85rem;
  font-weight: 600;
  ${props => props.$required && `&::after { content: ' *'; color: ${props.theme.error}; }`}
`;

const InputField = styled.input`
  width: 100%;
  height: 54px;
  padding: 0 1.2rem;
  background-color: ${props => props.theme.bgPrimary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  color: ${props => props.theme.textPrimary};
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus { 
    outline: none; 
    border-color: ${props => props.theme.accentPrimary}; 
    box-shadow: 0 0 0 4px ${props => props.theme.accentPrimary}20; 
  }
`;

const PriceInputField = styled(InputField)`
  ${props => props.$highlighted && css`
    animation: ${makeGlowPulse(props.theme.accentPrimary)} 2.5s ease-out;
    border-color: ${props.theme.accentPrimary};
    background: ${props.theme.accentPrimary}10;
  `}
`;

const CustomFileLabel = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 54px;
  background-color: ${props => props.theme.bgPrimary};
  border: 2px dashed ${props => props.theme.borderColor};
  border-radius: 16px;
  color: ${props => props.theme.textSecondary};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover { border-color: ${props => props.theme.accentPrimary}; background: ${props => props.theme.accentPrimary}05; }
`;

const AutoFillButton = styled.button`
  height: 54px;
  padding: 0 1.5rem;
  border: none;
  border-radius: 16px;
  background: ${props => props.theme.bgSecondary};
  color: ${props => props.theme.textPrimary};
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  &:hover { transform: scale(1.05) translateY(-2px); box-shadow: ${props => props.theme.cardShadow}; }
  &:disabled { opacity: 0.5; transform: none; }
`;

const SelectField = styled.select`
  width: 100%;
  height: 54px;
  padding: 0 1.2rem;
  background-color: ${props => props.theme.bgPrimary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  color: ${props => props.theme.textPrimary};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
`;

const StatusOverlay = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 450px;
  padding: 1.25rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  backdrop-filter: blur(15px);
  animation: ${slideUp} 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);

  ${props => props.$type === 'success' && css` background: ${props.theme.accentPrimary}22; color: ${props.theme.accentPrimary}; border-color: ${props.theme.accentPrimary}33; `}
  ${props => props.$type === 'error' && css` background: ${props.theme.accentSecondary || props.theme.error}22; color: ${props.theme.accentSecondary || props.theme.error}; border-color: ${props.theme.accentSecondary || props.theme.error}33; `}
  ${props => props.$type === 'info' && css` background: ${props.theme.accentPrimary}22; color: ${props.theme.accentPrimary}; border-color: ${props.theme.accentPrimary}33; `}
`;

// ✅ NEW THEME-SYNCED BUTTON
const SubmitButton = styled.button`
  width: 100%;
  height: 60px;
  /* Syncs with the gold/orange accent from your sidebar. Use gradient when available */
  background: ${props => props.theme.primaryGradient || props.theme.accentPrimary};
  color: ${props => props.theme.background};
  border: none;
  border-radius: 20px;
  font-size: 1.2rem;
  font-weight: 800;
  margin-top: 2rem;
  cursor: pointer;
  /* Use central shadow token */
  box-shadow: ${props => `${props.theme.primaryGlow || '0 4px 15px rgba(0,0,0,0.4)'}, ${props.theme.cardShadow || '0 4px 15px rgba(0,0,0,0.4)'}`};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => `${props.theme.primaryGlow || '0 6px 20px rgba(0,0,0,0.45)'}, ${props.theme.cardShadow || '0 6px 20px rgba(0,0,0,0.45)'}`};
  }

  &:active {
    transform: translateY(0);
  }
`;

function SellDiamonds() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState({ show: false, message: '', type: '' });
  const [priceHighlighted, setPriceHighlighted] = useState(false);
  
  const [reportNumber, setReportNumber] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [formState, setFormState] = useState({
    shape: 'Round', carat: '', color: 'D',
    clarity: 'FL', cut: 'Ideal', price: '', description: ''
  });

  const triggerStatus = (msg, type = 'success') => {
    setStatus({ show: true, message: msg, type });
    if (type !== 'info') setTimeout(() => setStatus({ show: false, message: '', type: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleScanPdf = async () => {
    if (!certificateFile) return triggerStatus("Please upload a PDF first.", "error");
    if (certificateFile.type !== "application/pdf") return triggerStatus("Invalid Certificate: Only PDFs are allowed.", "error");

    setIsScanning(true);
    triggerStatus("Reading Certificate & Valuating...", "info");

    // Defer API call to allow loading overlay to render first
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });

    const formData = new FormData();
    formData.append('pdfFile', certificateFile);

    try {
      const response = await apiClient.post('/api/listings/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const result = response.data.data;

      if (result) {
        setReportNumber(result.report_number || reportNumber);
        setFormState(prev => ({ 
            ...prev, 
            ...result,
            price: result.estimated_price || prev.price 
        }));
        setPriceHighlighted(true);
        triggerStatus(`Scan Complete: ₹${result.estimated_price?.toLocaleString()}`, "success");
      } else {
        throw new Error();
      }
    } catch (err) {
      triggerStatus("Unable to scan: Invalid or unsupported PDF.", "error");
    } finally { setIsScanning(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return triggerStatus("Upload at least one image.", "error");
    
    setIsLoading(true);
    triggerStatus("Listing on Exchange...", "info");
    
    const formData = new FormData();
    formData.append('reportNumber', reportNumber);
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    if (certificateFile) formData.append('certificateFile', certificateFile);
    Array.from(files).forEach(f => formData.append('listingImages', f));

    try {
      await apiClient.post('/api/listings', formData);
      triggerStatus("Diamond Listed Successfully!", "success");
      setTimeout(() => navigate('/buy-feed'), 1500);
    } catch (err) {
      triggerStatus(err.response?.data?.message || "Listing failed.", "error");
      setIsLoading(false);
    }
  };

  if (user?.role !== 'trader') return null;

  return (
    <Container>
      {isScanning && (
        <ScanningOverlay>
          <ScanningSpinner />
          <ScanningText>Scanning Certificate...</ScanningText>
          <ScanningSubtext>Reading PDF & Analyzing Diamond Specs</ScanningSubtext>
        </ScanningOverlay>
      )}

      {status.show && (
        <StatusOverlay $type={status.type}>
          <div style={{ fontSize: '1.2rem' }}>{status.type === 'success' ? '✓' : status.type === 'error' ? '✕' : '✨'}</div>
          {status.message}
        </StatusOverlay>
      )}

      {isLoading ? <Loader fullScreen text="Verifying & Publishing..." /> : (
        <>
          <PageHeader title="Sell a Diamond" />
          <FormContainer onSubmit={handleSubmit}>
            <FormGrid>
              <SectionTitle>Certification</SectionTitle>
              <InputGroup $fullWidth>
                <InputLabel>GIA/IGI Certificate PDF</InputLabel>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <CustomFileLabel style={{ flex: 1 }}>
                    <input type="file" hidden accept=".pdf" onChange={(e) => setCertificateFile(e.target.files[0])} />
                    {certificateFile ? '✓ PDF Loaded' : 'Choose File'}
                  </CustomFileLabel>
                  <AutoFillButton type="button" onClick={handleScanPdf} disabled={!certificateFile || isScanning}>
                    {isScanning ? '...' : 'Scan'}
                  </AutoFillButton>
                </div>
                {certificateFile && <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '8px' }}>{certificateFile.name}</div>}
              </InputGroup>

              <InputGroup $fullWidth>
                <InputLabel>Report Number</InputLabel>
                <InputField type="text" value={reportNumber} onChange={(e) => setReportNumber(e.target.value)} placeholder="e.g., 12345678" />
              </InputGroup>

              <SectionTitle>Diamond Specs</SectionTitle>
              <InputGroup>
                <InputLabel $required>Shape</InputLabel>
                <SelectField name="shape" value={formState.shape} onChange={handleInputChange}>
                  {shapeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </SelectField>
              </InputGroup>
              <InputGroup>
                <InputLabel $required>Carat Weight</InputLabel>
                <InputField name="carat" type="number" step="0.01" value={formState.carat} onChange={handleInputChange} required />
              </InputGroup>
              
              <InputGroup>
                <InputLabel $required>Color Grade</InputLabel>
                <SelectField name="color" value={formState.color} onChange={handleInputChange}>
                  {colorOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </SelectField>
              </InputGroup>
              <InputGroup>
                <InputLabel $required>Clarity Grade</InputLabel>
                <SelectField name="clarity" value={formState.clarity} onChange={handleInputChange}>
                  {clarityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </SelectField>
              </InputGroup>

              <InputGroup>
                <InputLabel $required>Total Price (₹)</InputLabel>
                <PriceInputField 
                  name="price" 
                  type="number" 
                  value={formState.price} 
                  onChange={handleInputChange} 
                  $highlighted={priceHighlighted} 
                  required 
                  placeholder="Auto-filled on scan"
                />
              </InputGroup>
              <InputGroup>
                <InputLabel>Cut Grade</InputLabel>
                <SelectField name="cut" value={formState.cut} onChange={handleInputChange}>
                  {cutOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </SelectField>
              </InputGroup>

              <SectionTitle>Gallery</SectionTitle>
              <InputGroup $fullWidth>
                <CustomFileLabel>
                  <input type="file" hidden multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
                  {files.length > 0 ? `✓ ${files.length} Images` : 'Upload Images'}
                </CustomFileLabel>
              </InputGroup>
            </FormGrid>

            {/* ✅ UPDATED BUTTON COMPONENT */}
            <SubmitButton type="submit">
              Post Listing
            </SubmitButton>
          </FormContainer>
        </>
      )}
    </Container>
  );
}

export default SellDiamonds;