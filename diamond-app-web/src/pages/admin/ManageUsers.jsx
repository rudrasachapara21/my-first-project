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
  color: #1e293b;
`;

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
  &:hover { background-color: #4338ca; }
  &:disabled { background-color: #94a3b8; cursor: not-allowed; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden; 
`;

const Thead = styled.thead`
  @media (max-width: 768px) { display: none; }
`;

const Tr = styled.tr`
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #e2e8f0;
    margin-bottom: 1rem;
    border-radius: 12px;
    padding: 1rem;
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
  vertical-align: middle;

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    &:before { content: attr(data-label); font-weight: 600; color: #64748b; }
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 0.1s;
  &:active { transform: scale(0.98); }
`;

const RejectButton = styled(ActionButton)`
  background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;
  &:hover { background-color: #fecaca; }
`;

const ApproveButton = styled(ActionButton)`
  background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;
  &:hover { background-color: #bbf7d0; }
`;

const UnverifyButton = styled(ActionButton)`
  background-color: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db;
  &:hover { background-color: #e5e7eb; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background-color: #fff;
  border-radius: 8px;
  color: #64748b;
`;

const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); `;
const Input = styled.input` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; box-sizing: border-box; `;
const Select = styled.select` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; box-sizing: border-box; `;

// ✅ NEW: Inline form status indicator
const FormStatus = styled.p`
  font-size: 0.85rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: ${props => props.$error ? '#ef4444' : '#10b981'};
  text-align: center;
`;

function ManageUsers() {
  const { users, setUsers } = useOutletContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'trader' });
  
  // Status tracking (replaces toasts)
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingUsers = useMemo(() => users.filter(u => u.is_verified === false) || [], [users]);
  const verifiedUsers = useMemo(() => users.filter(u => u.is_verified === true) || [], [users]);

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
        setUsers(prevUsers => [response.data.user, ...prevUsers]);
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
            setUsers(prevUsers => prevUsers.filter(u => u.user_id !== userId));
        } catch (error) { console.error(error); }
        finally { setLoadingUserId(null); }
    }
  };
  
  const handleApproveUser = async (userId) => {
      setLoadingUserId(userId);
      try {
        await apiClient.post(`/api/admin/approve-user`, { userId });
        setUsers(prevUsers => 
          prevUsers.map(u => u.user_id === userId ? { ...u, is_verified: true } : u)
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
          prevUsers.map(u => u.user_id === userId ? { ...u, is_verified: false } : u)
        );
      } catch (error) { console.error(error); }
      finally { setLoadingUserId(null); }
    }
  };

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
            <h2 style={{marginTop: 0, fontFamily: 'Clash Display'}}>Add New User</h2>
            
            {/* ✅ INLINE STATUS MSG */}
            {statusMsg.text && <FormStatus $error={statusMsg.isError}>{statusMsg.text}</FormStatus>}

            <Input name="fullName" value={newUser.fullName} onChange={handleInputChange} placeholder="Full Name" />
            <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="Email Address" />
            <Input name="password" type="password" value={newUser.password} onChange={handleInputChange} placeholder="Temporary Password" />
            <Select name="role" value={newUser.role} onChange={handleInputChange}>
              <option value="trader">Trader</option>
              <option value="broker">Broker</option>
            </Select>
            <div style={{display:'flex', justifyContent:'flex-end', gap:'1rem'}}>
              <button onClick={() => setModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}>Cancel</button>
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