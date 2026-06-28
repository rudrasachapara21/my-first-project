import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import apiClient from '../../api/axiosConfig';
import { useOutletContext } from 'react-router-dom';
import InlineLoader from '../../components/InlineLoader';

// --- STYLED COMPONENTS ---
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
  color: #22d3ee;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
`;

const SectionTitle = styled.h2`
  font-family: 'Clash Display', sans-serif;
  font-size: 1.25rem;
  color: #22d3ee;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 2px solid rgba(34, 211, 238, 0.2);
  padding-bottom: 0.75rem;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
  
  &:hover {
    background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
  }
  
  &:disabled {
    background: #334155;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #1e293b;
  border: 1px solid #334155;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  overflow: hidden;
`;

const Thead = styled.thead`
  @media (max-width: 768px) { display: none; }
`;

const Tr = styled.tr`
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    background: #1e293b;
    border: 1px solid #334155;
    margin-bottom: 1rem;
    border-radius: 12px;
    padding: 1rem;
  }
`;

const Th = styled.th`
  background-color: rgba(15, 23, 42, 0.6);
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px solid #334155;
`;

const Td = styled.td`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #334155;
  color: #e2e8f0;
  font-size: 0.95rem;
  vertical-align: middle;

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: none;
    &:before {
      content: attr(data-label);
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
    }
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.2);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled(ActionButton)`
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  
  &:hover {
    background-color: rgba(239, 68, 68, 0.25);
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
  }
`;

const ApproveButton = styled(ActionButton)`
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  
  &:hover {
    background-color: rgba(16, 185, 129, 0.25);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }
`;

const UnverifyButton = styled(ActionButton)`
  background-color: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.3);
  
  &:hover {
    background-color: rgba(148, 163, 184, 0.25);
    box-shadow: 0 4px 15px rgba(148, 163, 184, 0.2);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  color: #94a3b8;
  font-size: 1.1rem;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #1e293b;
  border: 1px solid #334155;
  padding: 2.5rem;
  border-radius: 20px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
  
  h2 {
    color: #22d3ee;
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-family: 'Clash Display';
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 0.9rem;
  margin-bottom: 1rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #e2e8f0;
  box-sizing: border-box;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #22d3ee;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;
const Select = styled.select`
  width: 100%;
  padding: 0.9rem;
  margin-bottom: 1rem;
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #e2e8f0;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #22d3ee;
    box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
  }
  
  option {
    background-color: #0f172a;
    color: #e2e8f0;
  }
`;

// ✅ NEW: Inline form status indicator
const FormStatus = styled.p`
  font-size: 0.85rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: ${props => props.$error ? '#ef4444' : '#10b981'};
  text-align: center;
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(148, 163, 184, 0.1);
    border-color: #64748b;
    color: #e2e8f0;
  }
`;

function ManageUsers() {
  const context = useOutletContext() || {};
  const { users = [], setUsers = () => {}, isLoading = false, error = null } = context;
  const [isModalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'trader' });
  
  // Status tracking (replaces toasts)
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState(null);

  // Only show users who have verified their email AND are not yet admin-approved
  const pendingUsers = useMemo(() => 
    (users || []).filter(u => u?.email_verified === true && u?.is_verified === false), 
    [users]
  );
  
  // Only show users who are admin-approved
  const verifiedUsers = useMemo(() => 
    (users || []).filter(u => u?.email_verified === true && u?.is_verified === true), 
    [users]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const clearStatus = () => setTimeout(() => setStatusMsg({ text: '', isError: false }), 3000);

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
        setStatusMsg({ text: "Please fill all fields.", isError: true });
        return;
    }
    setIsSubmitting(true);
    setStatusMsg({ text: "Saving...", isError: false });
    try {
        const response = await apiClient.post('/api/users', newUser);
        setUsers(prevUsers => [response.data.user, ...(prevUsers || [])]);
        setNewUser({ fullName: '', email: '', password: '', role: 'trader' });
        setStatusMsg({ text: "User created successfully!", isError: false });
        setTimeout(() => setModalOpen(false), 1500);
    } catch (error) {
        setStatusMsg({ text: error.response?.data?.message || 'Failed to create.', isError: true });
    } finally {
        setIsSubmitting(false);
        clearStatus();
    }
  };

  const handleRejectUser = async (userId) => {
    if (window.confirm(`Delete this user?`)) {
        setLoadingUserId(userId);
        try {
            await apiClient.post(`/api/admin/reject-user`, { userId });
            setUsers(prevUsers => (prevUsers || []).filter(u => u?.user_id !== userId));
        } catch (error) { console.error(error); }
        finally { setLoadingUserId(null); }
    }
  };
  
  const handleApproveUser = async (userId) => {
      setLoadingUserId(userId);
      try {
        await apiClient.post(`/api/admin/approve-user`, { userId });
        setUsers(prevUsers => 
          (prevUsers || []).map(u => u?.user_id === userId ? { ...u, is_verified: true } : u)
        );
      } catch (error) { console.error(error); }
      finally { setLoadingUserId(null); }
  };

  const handleUnverifyUser = async (userId) => {
     if (window.confirm(`Un-verify this user?`)) {
      setLoadingUserId(userId);
      try {
        await apiClient.post(`/api/admin/unverify-user`, { userId });
        setUsers(prevUsers => 
          (prevUsers || []).map(u => u?.user_id === userId ? { ...u, is_verified: false } : u)
        );
      } catch (error) { console.error(error); }
      finally { setLoadingUserId(null); }
    }
  };

  // Loading state check
  if (isLoading) {
    return (
      <Container>
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <p>Loading users...</p>
        </div>
      </Container>
    );
  }

  // Error state check
  if (error) {
    return (
      <Container>
        <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>
          <p>Error: {error}</p>
          <p style={{ color: '#64748b', marginTop: '1rem' }}>Please try refreshing the page.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Manage Users</Title>
        <AddButton onClick={() => setModalOpen(true)}>Add New User</AddButton>
      </Header>
      
      <SectionTitle>Pending Users ({pendingUsers.length})</SectionTitle>
      {pendingUsers.length > 0 ? (
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Actions</Th></Tr></Thead>
          <tbody>
            {pendingUsers.map(user => (
              <Tr key={user.user_id}>
                <Td data-label="Name">{user.full_name}</Td>
                <Td data-label="Email">{user.email}</Td>
                <Td data-label="Role" style={{textTransform:'capitalize'}}>{user.role}</Td>
                <Td data-label="Actions">
                  <ActionsContainer>
                    <ApproveButton 
                      onClick={() => handleApproveUser(user.user_id)}
                      disabled={loadingUserId === user.user_id}
                    >
                      {loadingUserId === user.user_id ? <InlineLoader size="16px" /> : 'Approve'}
                    </ApproveButton>
                    <RejectButton 
                      onClick={() => handleRejectUser(user.user_id)}
                      disabled={loadingUserId === user.user_id}
                    >
                      {loadingUserId === user.user_id ? <InlineLoader size="16px" /> : 'Reject'}
                    </RejectButton>
                  </ActionsContainer>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState><p>No users awaiting approval.</p></EmptyState>
      )}

      <SectionTitle>Verified Users ({verifiedUsers.length})</SectionTitle>
      {verifiedUsers.length > 0 ? (
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Actions</Th></Tr></Thead>
          <tbody>
            {verifiedUsers.map(user => (
              <Tr key={user.user_id}>
                <Td data-label="Name">{user.full_name}</Td>
                <Td data-label="Email">{user.email}</Td>
                <Td data-label="Role" style={{textTransform:'capitalize'}}>{user.role}</Td>
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
        <EmptyState><p>No verified users.</p></EmptyState>
      )}

      {isModalOpen && (
        <ModalBackdrop onClick={() => setModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>Add New User</h2>
            
            {/* ✅ INLINE STATUS MSG */}
            {statusMsg.text && <FormStatus $error={statusMsg.isError}>{statusMsg.text}</FormStatus>}

            <Input name="fullName" value={newUser.fullName} onChange={handleInputChange} placeholder="Full Name" />
            <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="Email Address" />
            <Input name="password" type="password" value={newUser.password} onChange={handleInputChange} placeholder="Temporary Password" />
            <Select name="role" value={newUser.role} onChange={handleInputChange}>
              <option value="trader">Trader</option>
              <option value="broker">Broker</option>
            </Select>
            <div style={{display:'flex', justifyContent:'flex-end', gap:'1rem', marginTop: '1rem'}}>
              <CancelButton onClick={() => setModalOpen(false)}>Cancel</CancelButton>
              <AddButton onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save User'}
              </AddButton>
            </div>
          </ModalContent>
        </ModalBackdrop>
      )}
    </Container>
  );
}

export default ManageUsers;