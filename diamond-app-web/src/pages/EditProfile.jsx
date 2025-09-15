// src/pages/EditProfile.jsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

// ... All styled components are the same ...
const ProgressWrapper = styled.div` padding: 0 1.5rem 2rem 1.5rem; `;
const ProgressLabel = styled.p` font-size: 0.9rem; color: ${props => props.theme.textSecondary}; margin: 0 0 0.5rem 0; font-weight: 500; `;
const ProgressBarContainer = styled.div` width: 100%; height: 10px; background-color: ${props => props.theme.borderColor}; border-radius: 10px; overflow: hidden; `;
const ProgressBar = styled.div` width: ${props => props.$progress}%; height: 100%; background-color: ${props => props.theme.accentPrimary}; border-radius: 10px; transition: width 0.5s ease-in-out; `;
const Container = styled.div``;
const ProfilePhotoSection = styled.div` display: flex; flex-direction: column; align-items: center; padding: 2rem 1.5rem; `;
const Avatar = styled.img` width: 100px; height: 100px; border-radius: 50%; background-color: #A5B4FC; border: 3px solid ${props => props.theme.accentPrimary}; margin-bottom: 1rem; object-fit: cover;`;
const ChangePhotoButton = styled.label` background: transparent; border: 2px solid ${props => props.theme.accentPrimary}; color: ${props => props.theme.accentPrimary}; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; `;
const HiddenFileInput = styled.input` display: none; `;
const FormContainer = styled.form` padding: 0 1.5rem; `;
const InputGroup = styled.div` margin-bottom: 1.5rem; `;
const InputLabel = styled.label` display: block; margin-bottom: 0.5rem; color: ${props => props.theme.textSecondary}; font-size: 0.9rem; font-weight: 700; `;
const InputField = styled.input` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const TextAreaField = styled.textarea` width: 100%; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; font-family: 'Inter', sans-serif; min-height: 80px; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } `;
const CtaButton = styled.button` width: 100%; padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.textPrimary}; color: ${props => props.theme.bgSecondary}; font-family: 'Clash Display', sans-serif; font-size: 1.2rem; font-weight: 600; cursor: pointer; margin-top: 1rem; &:disabled { background-color: #ccc; } `;
const SuccessMessage = styled.p` color: #22c55e; text-align: center; font-weight: 500; `;


function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(''); // For displaying the new photo
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState('');

  const calculateProgress = useCallback((data) => {
    // ... same as before
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
        calculateProgress(response.data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, calculateProgress]);

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result); // Set the preview URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    
    // THIS IS THE FIX: We create a copy of the profile but remove the photo_url
    // so the long preview string is NOT sent.
    const profileDataToSend = { ...profile };
    delete profileDataToSend.photo_url;

    // Append all text fields
    Object.keys(profileDataToSend).forEach(key => {
        if(profileDataToSend[key] !== null) {
            formData.append(key, profileDataToSend[key]);
        }
    });
    // Append the new photo file ONLY if one was selected
    if (photoFile) {
        formData.append('photo', photoFile);
    }

    try {
      const response = await axios.put('http://localhost:5001/api/profile', formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(response.data.message);
      // Optional: Update profile state with new URL from server if needed
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine which image to show: the new preview or the existing one from the database
  const displayImage = photoPreview || (profile.photo_url ? `http://localhost:5001/${profile.photo_url}` : 'https://placehold.co/100');

  return (
    <Container>
      <PageHeader title="Edit Profile" />
      <ProfilePhotoSection>
        <Avatar src={displayImage} />
        <ChangePhotoButton htmlFor="photo-upload">Change Photo</ChangePhotoButton>
        <HiddenFileInput id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} />
      </ProfilePhotoSection>
      <ProgressWrapper>
        <ProgressLabel>Profile Completion: {Math.round(progress)}%</ProgressLabel>
        <ProgressBarContainer>
            <ProgressBar $progress={progress} />
        </ProgressBarContainer>
      </ProgressWrapper>
      <FormContainer onSubmit={handleSubmit}>
        {/* All your InputGroups are the same as before */}
        <InputGroup><InputLabel>Full Name</InputLabel><InputField name="full_name" value={profile.full_name || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>Office Name</InputLabel><InputField name="office_name" value={profile.office_name || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>Phone Number</InputLabel><InputField name="phone_number" value={profile.phone_number || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>Office Address</InputLabel><TextAreaField name="office_address" value={profile.office_address || ''} onChange={handleChange} /></InputGroup>
        <InputGroup><InputLabel>GST Number</InputLabel><InputField name="gst_number" value={profile.gst_number || ''} onChange={handleChange} placeholder="e.g., 22AAAAA0000A1Z5" /></InputGroup>

        <CtaButton type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
        </CtaButton>
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </FormContainer>
    </Container>
  );
}

export default EditProfile;