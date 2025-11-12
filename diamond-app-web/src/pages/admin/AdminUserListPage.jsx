import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosConfig';
import PageHeader from '../../components/PageHeader';
import { PiMagnifyingGlass } from 'react-icons/pi';

// --- Styles ---
const Container = styled.div``;

const SearchContainer = styled.div`
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  position: sticky;
  top: 0;
  background: ${props => props.theme.background};
  z-index: 10;
`;

const SearchInputWrapper = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.9rem;
  padding-left: 3rem; // Space for the icon
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
`;

const SearchIcon = styled(PiMagnifyingGlass)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.4rem;
  color: ${props => props.theme.textSecondary};
`;

const UserList = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.accentPrimary};
    transform: translateY(-2px);
  }
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  overflow: hidden;
`;

const UserName = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserOffice = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${props => props.theme.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RoleBadge = styled.span`
  margin-left: auto;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  background-color: ${props => props.role === 'trader' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
  color: ${props => props.role === 'trader' ? '#0284c7' : '#16a34a'};
  border: 1px solid ${props => props.role === 'trader' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
`;
// --- (End of Styles) ---


// ## --- NEW HELPER FUNCTION --- ##
const getAvatarUrl = (photoUrl, name) => {
  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');
  if (!photoUrl) {
    return `https://ui-avatars.com/api/?name=${name ? name.replace(' ', '+') : 'User'}&background=random`;
  }
  if (photoUrl.startsWith('http')) {
    // It's a Cloudinary URL, use it directly
    return photoUrl;
  }
  // It's an old /uploads/ file, add the API root
  return `${API_ROOT_URL}${photoUrl}`;
};


function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // (Removed API_ROOT_URL from here)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/api/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        alert(error.response?.data?.message || "Could not load users.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return users;
    return users.filter(user =>
      user.full_name.toLowerCase().includes(term) ||
      (user.office_name && user.office_name.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  // (Removed old getAvatarUrl function from here)

  return (
    <Container>
      <PageHeader title="User Monitoring" />
      <SearchContainer>
        <SearchInputWrapper>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search by name or office..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputWrapper>
      </SearchContainer>
      
      <UserList>
        {isLoading && <p>Loading users...</p>}

        {!isLoading && filteredUsers.length === 0 && (
          <p>No users found.</p>
        )}

        {filteredUsers.map(user => (
          <UserCard 
            key={user.user_id} 
            onClick={() => navigate(`/admin/user-monitoring/${user.user_id}`)}
          >
            {/* ## --- THIS IS THE FIX --- ## */}
            <Avatar src={getAvatarUrl(user.profile_photo_url, user.full_name)} alt={user.full_name} />
            
            <UserInfo>
              <UserName>{user.full_name}</UserName>
              <UserOffice>{user.office_name || 'No office name'}</UserOffice>
            </UserInfo>
            <RoleBadge role={user.role}>{user.role}</RoleBadge>
          </UserCard>
        ))}
      </UserList>
    </Container>
  );
}

export default AdminUserListPage;