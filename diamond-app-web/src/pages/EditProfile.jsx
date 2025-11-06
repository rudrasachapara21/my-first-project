import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { PiSealCheckFill } from 'react-icons/pi';

const Container = styled.div``;
const ProfilePhotoSection = styled.div` display: flex; flex-direction: column; align-items: center; padding: 2rem 1.5rem; `;
const Avatar = styled.img` width: 100px; height: 100px; border-radius: 50%; background-color: #A5B4FC; border: 3px solid ${props => props.theme.accentPrimary}; margin-bottom: 1rem; object-fit: cover;`;
const ChangePhotoButton = styled.label` background: transparent; border: 2px solid ${props => props.theme.accentPrimary}; color: ${props => props.theme.accentPrimary}; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; `;
const HiddenFileInput = styled.input` display: none; `;
const FormContainer = styled.form` padding: 0 1.5rem 2rem; `;
const InputGroup = styled.div` margin-bottom: 1.5rem; `;
const InputLabel = styled.label` display: block; margin-bottom: 0.5rem; color: ${props => props.theme.textSecondary}; font-size: 0.9rem; font-weight: 700; `;
const InputField = styled.input` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const TextAreaField = styled.textarea` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; font-family: 'Inter', sans-serif; min-height: 80px; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.accentPrimary}; color: #FFFFFF; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; margin-top: 1rem; &:disabled { background-color: #ccc; } `;
const SuccessMessage = styled.p` color: #22c55e; text-align: center; font-weight: 500; `;
const ReadOnlyField = styled.div` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgPrimary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textSecondary}; font-size: 1rem; box-sizing: border-box; display: flex; align-items: center; gap: 0.5rem; `;

function EditProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  
  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/profile');
        setProfile(response.data);
      } catch (error) { console.error("Failed to fetch profile", error); }
      finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPhotoPreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');
    const formData = new FormData();
    
    // This generic loop will automatically include the new 'office_hours' field
    Object.keys(profile).forEach(key => {
        if (key !== 'user_id' && key !== 'email' && key !== 'role' && key !== 'profile_photo_url' && key !== 'reputation_points') {
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
      // Optionally, refetch user data to update context if needed
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || !profile) return <p>Loading...</p>;

  const displayImage = photoPreview || (profile.profile_photo_url ? `${API_ROOT_URL}${profile.profile_photo_url}` : `https://ui-avatars.com/api/?name=${profile.full_name.replace(' ', '+')}`);

  return (
    <Container>
      <PageHeader title="Edit Profile" />
      <ProfilePhotoSection>
        <Avatar src={displayImage} alt="Profile" />
        <ChangePhotoButton htmlFor="photo-upload">Change Photo</ChangePhotoButton>
        <HiddenFileInput id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} />
      </ProfilePhotoSection>
      <FormContainer onSubmit={handleSubmit}>
        {user.role === 'broker' && (
          <InputGroup>
            <InputLabel>Reputation Points</InputLabel>
            <ReadOnlyField><PiSealCheckFill color="#22c55e" /> {profile.reputation_points}</ReadOnlyField>
          </InputGroup>
        )}
        <InputGroup><InputLabel>Full Name</InputLabel><InputField name="full_name" value={profile.full_name || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>Office Name</InputLabel><InputField name="office_name" value={profile.office_name || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>Phone Number</InputLabel><InputField type="tel" name="phone_number" value={profile.phone_number || ''} onChange={handleChange} /></InputGroup>
        
        {/* --- THE FIX: Added the new "Office Hours" input field --- */}
        <InputGroup>
          <InputLabel>Office Hours</InputLabel>
          <InputField 
            name="office_hours" 
            placeholder="e.g., 10:00 AM - 6:00 PM"
            value={profile.office_hours || ''} 
            onChange={handleChange} 
          />
        </InputGroup>
        
        <InputGroup><InputLabel>Office Address</InputLabel><TextAreaField name="office_address" value={profile.office_address || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>GST Number</InputLabel><InputField name="gst_number" value={profile.gst_number || ''} onChange={handleChange} /></InputGroup>
        
        <CtaButton type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</CtaButton>
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </FormContainer>
    </Container>
  );
}

export default EditProfile;