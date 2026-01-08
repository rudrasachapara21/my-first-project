import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PiSealCheckFill, PiFileText, PiCameraBold } from 'react-icons/pi'; 
import ExportStatementModal from '../components/modals/ExportStatementModal';

// --- STYLES ---
const Container = styled.div`
  background-color: ${props => props.theme.bgPrimary};
  min-height: 100vh;
  /* Extra padding at bottom to ensure last field can scroll above keyboard */
  padding-bottom: 250px;
  /* Prevent layout shift during image load */
  contain: layout style;
`;

const SavingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${props => props.theme.bgPrimary}dd;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  z-index: 99999;
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SavingSpinner = styled.div`
  width: 80px;
  height: 80px;
  border: 5px solid ${props => props.theme.borderColor};
  border-top-color: ${props => props.theme.accentPrimary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const SavingText = styled.div`
  color: ${props => props.theme.textPrimary};
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
`;

const SavingSubtext = styled.div`
  color: ${props => props.theme.textSecondary};
  font-size: 1rem;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
`;

const ProfilePhotoSection = styled.div` 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  padding: 2.5rem 1.5rem; 
`;

const AvatarWrapper = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const PhotoLoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: ${props => props.theme.accentPrimary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
`;

const Avatar = styled.img` 
  width: 110px; 
  height: 110px; 
  border-radius: 50%; 
  background: linear-gradient(135deg, ${props => props.theme.bgSecondary}, ${props => props.theme.bgPrimary}); 
  border: 4px solid ${props => props.theme.bgSecondary}; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  object-fit: cover;
  display: block;
  opacity: ${props => props.$loading ? 0.5 : 1};
  transition: opacity 0.2s ease;
  /* Optimize rendering performance */
  will-change: opacity;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
`;

// ✅ FIX: Custom styled photo trigger to match professional theme
const ChangePhotoTrigger = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  background: ${props => props.theme.accentPrimary};
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px solid ${props => props.theme.bgSecondary};
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: transform 0.2s;
  &:active { transform: scale(0.9); }
`;

const HiddenFileInput = styled.input` 
  display: none; 
`;

const FormContainer = styled.form` 
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  border-radius: 28px;
  background: ${props => props.theme.surfaceGlass || props.theme.bgSecondary};
  border: ${props => props.theme.glassBorder || `1px solid ${props.theme.borderColor}`};
  backdrop-filter: blur(12px);
  box-shadow: ${props => props.theme.cardShadow || '0 8px 32px rgba(0,0,0,0.3)'};
  padding-bottom: 2rem;
`;

const InputGroup = styled.div` 
  margin-bottom: 1.5rem; 
`;

const InputLabel = styled.label` 
  display: block; 
  margin-bottom: 0.6rem; 
  color: ${props => props.theme.textSecondary}; 
  font-size: 0.9rem; 
  font-weight: 700; 
`;

const InputField = styled.input` 
  width: 100%; 
  padding: 1.1rem; 
  background-color: ${props => props.theme.bgSecondary}; 
  border: 2px solid ${props => props.theme.borderColor}; 
  border-radius: 14px; 
  color: ${props => props.theme.textPrimary}; 
  font-size: 1rem; 
  box-sizing: border-box; 
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  &:focus { 
    outline: none; 
    border-color: ${props => props.theme.accentPrimary}; 
    background-color: ${props => props.theme.bgPrimary};
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
  } 
`;

const TextAreaField = styled.textarea` 
  width: 100%; 
  padding: 1.1rem; 
  background-color: ${props => props.theme.bgSecondary}; 
  border: 2px solid ${props => props.theme.borderColor}; 
  border-radius: 14px; 
  color: ${props => props.theme.textPrimary}; 
  font-size: 1rem; 
  box-sizing: border-box; 
  font-family: 'Inter', sans-serif; 
  min-height: 100px; 
  resize: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  &:focus { 
    outline: none; 
    border-color: ${props => props.theme.accentPrimary}; 
    background-color: ${props => props.theme.bgPrimary};
  } 
`;

const CtaButton = styled.button` 
  width: 100%; 
  padding: 1.1rem; 
  border: none; 
  border-radius: 14px; 
  background: ${props => props.theme.textPrimary}; 
  color: ${props => props.theme.bgSecondary}; 
  font-family: 'Clash Display', sans-serif; 
  font-size: 1.2rem; 
  font-weight: 600; 
  cursor: pointer; 
  margin-top: 1rem; 
  transition: transform 0.1s;
  &:active { transform: scale(0.98); }
  &:disabled { 
    background-color: ${props => props.theme.textSecondary}; 
    cursor: not-allowed; 
  } 
`;

const Spinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: rgba(255,255,255,1);
  border-radius: 50%;
  margin-right: 8px;
  animation: spin 0.8s linear infinite;
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const SuccessMessage = styled.p` 
  color: ${p => p.theme.success}; 
  text-align: center; 
  font-weight: 600; 
  margin-top: 1rem;
`;

const ReadOnlyField = styled.div` 
  width: 100%; 
  padding: 1.1rem; 
  background-color: ${props => props.theme.bgPrimary}; 
  border: 2px solid ${props => props.theme.borderColor}; 
  border-radius: 14px; 
  color: ${props => props.theme.textSecondary}; 
  font-size: 1rem; 
  box-sizing: border-box; 
  display: flex; 
  align-items: center; 
  gap: 0.6rem; 
  font-weight: 500;
`;

const ExportButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 14px;
  background: transparent;
  color: ${props => props.theme.textPrimary};
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  transition: all 0.2s;
  &:hover { background-color: ${props => props.theme.bgSecondary}; }
`;

function EditProfile() {
  const { user, updateUser } = useAuth();
  const { currentTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // ✅ FIX: Keyboard avoidance helper
  const handleFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/profile');
        setProfile(response.data);
      } catch (error) { 
        console.error("Failed to fetch profile", error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadError('');
      
      // Use requestAnimationFrame to ensure UI updates before FileReader starts
      requestAnimationFrame(() => {
        setIsUploadingPhoto(true);
        
        // Small delay to ensure loading overlay is painted
        setTimeout(() => {
          const reader = new FileReader();
          
          reader.onloadend = () => { 
            // Only update after successful read
            if (reader.result) {
              setPhotoFile(file);
              setPhotoPreview(reader.result);
            }
            setIsUploadingPhoto(false);
          };
          
          reader.onerror = () => {
            setUploadError('Failed to load image');
            setIsUploadingPhoto(false);
          };
          
          reader.readAsDataURL(file);
        }, 50); // 50ms delay ensures overlay is visible
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess('');
    const formData = new FormData();
    
    Object.keys(profile).forEach(key => {
        const excluded = ['user_id', 'email', 'role', 'profile_photo_url', 'reputation_points'];
        if (!excluded.includes(key)) {
            formData.append(key, profile[key] || '');
        }
    });

    if (photoFile) {
        formData.append('profilePhoto', photoFile);
    }

    try {
      const response = await apiClient.put('/api/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(response.data.message);
      updateUser(response.data.user);
      
      if (response.data.user.profile_photo_url) {
        setPhotoPreview(response.data.user.profile_photo_url);
        setPhotoFile(null); 
      }
    } catch (error) {
      const backendError = error.response?.data;
      // Check for face detection error payload
      if (backendError && backendError.error) {
        const msg = `Upload Failed: ${backendError.error}`;
        setUploadError(msg);
        try { toast.error(msg); } catch (e) { /* ignore */ }
      } else {
        alert(backendError?.message || 'Failed to update profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || !profile) return <Loader fullScreen={true} text="Loading Profile..." />;

  const displayImage = photoPreview || 
                       profile.profile_photo_url || 
                       `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}`;

  return (
    <>
      {isSaving && (
        <SavingOverlay>
          <SavingSpinner />
          <SavingText>
            {photoFile ? 'Verifying Face...' : 'Saving Changes...'}
          </SavingText>
          {photoFile && (
            <SavingSubtext>
              This may take a few seconds while we validate your photo
            </SavingSubtext>
          )}
        </SavingOverlay>
      )}

      <Container>
        <PageHeader title="Edit Profile" />
      
      <ProfilePhotoSection>
        <AvatarWrapper>
          <Avatar 
            src={displayImage} 
            alt="Profile" 
            $loading={isUploadingPhoto}
            decoding="async"
            loading="eager"
            onError={(e) => {
              // Fallback to UI Avatars if image fails to load
              if (!e.target.src.includes('ui-avatars.com')) {
                e.target.src = `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}`;
              }
            }}
          />
          {isUploadingPhoto && (
            <PhotoLoadingOverlay>
              <LoadingSpinner />
              <LoadingText>Loading...</LoadingText>
            </PhotoLoadingOverlay>
          )}
          <ChangePhotoTrigger htmlFor="photo-upload">
            <PiCameraBold size={20} />
          </ChangePhotoTrigger>
        </AvatarWrapper>
        <HiddenFileInput id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} />
        {/* Helper note for face upload rules */}
        <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', maxWidth: 420 }}>
          Upload a photo where your face is visible. (Head & Shoulders or Half-Body preferred). If you upload a group photo, or the face is not clearly visible the backend will respond with a rejection reason which will show in a toast: 'Upload Failed: [Reason]'
        </div>
        {/* Inline upload error with suggestion */}
        {uploadError && (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <p style={{ color: 'var(--error)', margin: 0, fontWeight: 700 }}>{uploadError}</p>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>Tip: Try again with a clear headshot (head & shoulders).</p>
          </div>
        )}
      </ProfilePhotoSection>

      <FormContainer onSubmit={handleSubmit}>
        {user.role === 'broker' && (
          <InputGroup>
            <InputLabel>Reputation Points</InputLabel>
            <ReadOnlyField><PiSealCheckFill color={currentTheme?.success} /> {profile.reputation_points}</ReadOnlyField>
          </InputGroup>
        )}

        <InputGroup>
          <InputLabel>Full Name</InputLabel>
          <InputField name="full_name" value={profile.full_name || ''} onChange={handleChange} onFocus={handleFocus} />
        </InputGroup>

        <InputGroup>
          <InputLabel>Office Name</InputLabel>
          <InputField name="office_name" value={profile.office_name || ''} onChange={handleChange} onFocus={handleFocus} />
        </InputGroup>

        <InputGroup>
          <InputLabel>Phone Number</InputLabel>
          <InputField type="tel" name="phone_number" value={profile.phone_number || ''} onChange={handleChange} onFocus={handleFocus} />
        </InputGroup>
        
        <InputGroup>
          <InputLabel>Office Hours</InputLabel>
          <InputField 
            name="office_hours" 
            placeholder="e.g., 10:00 AM - 6:00 PM"
            value={profile.office_hours || ''} 
            onChange={handleChange} 
            onFocus={handleFocus}
          />
        </InputGroup>
        
        <InputGroup>
          <InputLabel>Office Address</InputLabel>
          <TextAreaField name="office_address" value={profile.office_address || ''} onChange={handleChange} onFocus={handleFocus} />
        </InputGroup>

        <InputGroup>
          <InputLabel>GST Number</InputLabel>
          <InputField name="gst_number" value={profile.gst_number || ''} onChange={handleChange} onFocus={handleFocus} />
        </InputGroup>
        
        <CtaButton type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? (
            photoFile ? (
              <>
                <Spinner aria-hidden="true" /> Verifying Face...
              </>
            ) : (
              'Saving Changes...'
            )
          ) : 'Update Profile'}
        </CtaButton>
        
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <ExportButton type="button" onClick={() => setIsExportModalOpen(true)}>
            <PiFileText size={20} />
            Download Activity Statement
        </ExportButton>
      </FormContainer>

      <ExportStatementModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </Container>
    </>
  );
}

export default EditProfile;