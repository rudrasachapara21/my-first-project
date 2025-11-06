import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import apiClient from '../../api/axiosConfig';
import { useOutletContext } from 'react-router-dom';

const Container = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2.5rem;
  color: #1e293b;
`;

// ## NEW: Added a sub-title for the new sections ##
const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.8rem;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
`;

const AddButton = styled.button`
  background-color: #4f46e5;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #4338ca;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
`;

const Thead = styled.thead`
  @media (max-width: 768px) {
    display: none;
  }
`;

const Tr = styled.tr`
  @media (max-width: 768px) {
    display: block;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 1rem;
  }
`;

const Th = styled.th`
  background-color: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-size: 0.9rem;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  @media (max-width: 768px) {
    display: block;
    text-align: right;
    border-bottom: 1px dotted #ccc;
    position: relative;
    padding-left: 50%;
    &:before {
      content: attr(data-label);
      position: absolute;
      left: 1rem;
      width: 45%;
      padding-right: 10px;
      white-space: nowrap;
      text-align: left;
      font-weight: bold;
      color: #334155;
    }
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button`
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
`;

// ## RENAMED: 'DeleteButton' is now 'RejectButton' for clarity ##
const RejectButton = styled(ActionButton)`
  background-color: #ef4444;
  color: white;
  &:hover {
    background-color: #dc2626;
  }
`;

// ## RENAMED: 'VerifyButton' is now 'ApproveButton' ##
const ApproveButton = styled(ActionButton)`
  background-color: #22c55e;
  color: white;
  &:hover {
    background-color: #16a34a;
  }
`;

const UnverifyButton = styled(ActionButton)`
  background-color: #f1f5f9;
  color: #475569;
  &:hover {
    background-color: #e2e8f0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
`;

// (Modal styles are unchanged)
const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; `;
const Input = styled.input` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; `;
const Select = styled.select` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 1rem; `;


function ManageUsers() {
  const { users, setUsers } = useOutletContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'trader' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ## CHANGE: Split the users list into two separate computed lists ##
  // This will automatically update when 'users' changes.
  const pendingUsers = useMemo(() => 
    users.filter(u => u.is_verified === false) || []
  , [users]);
  
  const verifiedUsers = useMemo(() => 
    users.filter(u => u.is_verified === true) || []
  , [users]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
        alert("Please fill all required fields.");
        return;
    }
    setIsSubmitting(true);
    try {
        // This endpoint now creates a VERIFIED user by default
        const response = await apiClient.post('/api/users', newUser);
        setUsers(prevUsers => [response.data.user, ...prevUsers]);
        setModalOpen(false);
        setNewUser({ fullName: '', email: '', password: '', role: 'trader' });
    } catch (error) {
        alert(error.response?.data?.message || 'Failed to create user.');
    } finally {
        setIsSubmitting(false);
    }
  };

  // ## RENAMED: 'handleDeleteUser' is now 'handleRejectUser' ##
  // This function is used to reject pending users OR delete verified users.
  const handleRejectUser = async (userId) => {
    const action = 'reject or delete';
    if (window.confirm(`Are you sure you want to ${action} this user? This is permanent.`)) {
        try {
            await apiClient.delete(`/api/users/${userId}`);
            // This will remove them from either list
            setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId));
        } catch (error) {
            alert(error.response?.data?.message || `Failed to ${action} user.`);
        }
    }
  };
  
  // ## RENAMED: 'handleToggleVerify' is now 'handleApproveUser' ##
  const handleApproveUser = async (userId) => {
    if (window.confirm(`Are you sure you want to approve this user?`)) {
      try {
        // We send 'is_verified: true' to approve them
        await apiClient.post(`/api/users/${userId}/verify`, { is_verified: true });
        
        // Update the local state to move them from pending to verified
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.user_id === userId ? { ...u, is_verified: true } : u
          )
        );
      } catch (error) {
        alert(error.response?.data?.message || `Failed to approve user.`);
      }
    }
  };

  // ## NEW: Function to Un-verify a user ##
  const handleUnverifyUser = async (userId) => {
     if (window.confirm(`Are you sure you want to un-verify this user? They will be locked out.`)) {
      try {
        // We send 'is_verified: false' to un-verify them
        await apiClient.post(`/api/users/${userId}/verify`, { is_verified: false });
        
        // Update the local state to move them from verified to pending
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.user_id === userId ? { ...u, is_verified: false } : u
          )
        );
      } catch (error) {
        alert(error.response?.data?.message || `Failed to un-verify user.`);
      }
    }
  };


  return (
    <Container>
      <Header>
        <Title>Manage Users</Title>
        <AddButton onClick={() => setModalOpen(true)}>Add New User</AddButton>
      </Header>
      
      {/* --- NEW: Pending Users Section --- */}
      <SectionTitle>Pending Users ({pendingUsers.length})</SectionTitle>
      {pendingUsers.length > 0 ? (
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Actions</Th></Tr></Thead>
          <tbody>
            {pendingUsers.map(user => (
              <Tr key={user.user_id}>
                <Td data-label="Name">{user.full_name}</Td>
                <Td data-label="Email">{user.email}</Td>
                <Td data-label="Role">{user.role}</Td>
                <Td data-label="Actions">
                  <ActionsContainer>
                    <ApproveButton onClick={() => handleApproveUser(user.user_id)}>Approve</ApproveButton>
                    <RejectButton onClick={() => handleRejectUser(user.user_id)}>Reject</RejectButton>
                  </ActionsContainer>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState><p>There are no users awaiting approval.</p></EmptyState>
      )}

      {/* --- NEW: Verified Users Section --- */}
      <SectionTitle>Verified Users ({verifiedUsers.length})</SectionTitle>
      {verifiedUsers.length > 0 ? (
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Actions</Th></Tr></Thead>
          <tbody>
            {verifiedUsers.map(user => (
              <Tr key={user.user_id}>
                <Td data-label="Name">{user.full_name}</Td>
                <Td data-label="Email">{user.email}</Td>
                <Td data-label="Role">{user.role}</Td>
                <Td data-label="Actions">
                  <ActionsContainer>
                    <UnverifyButton onClick={() => handleUnverifyUser(user.user_id)}>Un-verify</UnverifyButton>
                    <RejectButton onClick={() => handleRejectUser(user.user_id)}>Delete</RejectButton>
                  </ActionsContainer>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState><p>There are no verified users.</p></EmptyState>
      )}


      {/* --- (Modal markup is unchanged) --- */}
      {isModalOpen && (
        <ModalBackdrop>
          <ModalContent>
            <h2 style={{marginTop: 0}}>Add New User</h2>
            <Input name="fullName" value={newUser.fullName} onChange={handleInputChange} placeholder="Full Name" />
            <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="Email Address" />
            <Input name="password" type="password" value={newUser.password} onChange={handleInputChange} placeholder="Temporary Password" />
            <Select name="role" value={newUser.role} onChange={handleInputChange}>
              <option value="trader">Trader</option>
              <option value="broker">Broker</option>
            </Select>
            <ModalActions>
              <button onClick={() => setModalOpen(false)} disabled={isSubmitting}>Cancel</button>
              <AddButton onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save User'}
              </AddButton>
            </ModalActions>
          </ModalContent>
        </ModalBackdrop>
      )}
    </Container>
  );
}
export default ManageUsers;