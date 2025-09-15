// src/pages/admin/ManageUsers.jsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Styled Components (Unchanged) ---
const Container = styled.div``;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; `;
const Title = styled.h1` font-family: 'Clash Display', sans-serif; font-size: 2.5rem; color: #1e293b; `;
const AddButton = styled.button` background-color: #4f46e5; color: white; font-size: 1rem; font-weight: 500; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; &:hover { background-color: #4338ca; } `;
const Table = styled.table` width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 8px; `;
const Thead = styled.thead` @media (max-width: 768px) { display: none; } `;
const Tr = styled.tr` @media (max-width: 768px) { display: block; border-bottom: 2px solid #e2e8f0; margin-bottom: 1rem; } `;
const Th = styled.th` background-color: #f8fafc; padding: 1rem; text-align: left; font-size: 0.9rem; color: #64748b; border-bottom: 1px solid #e2e8f0; `;
const Td = styled.td` padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #334155; @media (max-width: 768px) { display: block; text-align: right; border-bottom: 1px dotted #ccc; position: relative; padding-left: 50%; &:before { content: attr(data-label); position: absolute; left: 1rem; width: 45%; padding-right: 10px; white-space: nowrap; text-align: left; font-weight: bold; color: #334155; } } `;
const DeleteButton = styled.button` background-color: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; &:hover { background-color: #dc2626; } `;
const EmptyState = styled.div` text-align: center; padding: 4rem; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); `;
const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; `;
const Input = styled.input` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; `;
const Select = styled.select` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 1rem; `;

function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  // MODIFIED: Added password to the initial state
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'trader' });

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5001/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      if(error.response?.status === 403) alert("Access Denied: Admins only.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role !== 'admin') {
      alert("Access Denied. Redirecting to login.");
      navigate('/');
    } else {
      fetchUsers();
    }
  }, [fetchUsers, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password) {
        alert("Please fill all fields.");
        return;
    }
    const token = localStorage.getItem('token');
    try {
        await axios.post('http://localhost:5001/api/auth/create-user', newUser, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setModalOpen(false);
        // MODIFIED: Reset the form including the password
        setNewUser({ full_name: '', email: '', password: '', role: 'trader' });
        fetchUsers();
    } catch (error) {
        alert(error.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their demands and listings.')) {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5001/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user.');
        }
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>Manage Users</Title>
        <AddButton onClick={() => setModalOpen(true)}>Add New User</AddButton>
      </Header>
      {isLoading ? <p>Loading users...</p> : users.length > 0 ? (
        <Table>
          <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Role</Th><Th>Actions</Th></Tr></Thead>
          <tbody>
            {users.map(user => (
              <Tr key={user.user_id}>
                <Td data-label="Name">{user.full_name}</Td>
                <Td data-label="Email">{user.email}</Td>
                <Td data-label="Phone">{user.phone_number}</Td>
                <Td data-label="Role">{user.role}</Td>
                <Td data-label="Actions"><DeleteButton onClick={() => handleDeleteUser(user.user_id)}>Delete</DeleteButton></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState><h3>No Users Found</h3><p>Click "Add New User" to get started.</p></EmptyState>
      )}
      {isModalOpen && (
        <ModalBackdrop>
          <ModalContent>
            <h2 style={{marginTop: 0}}>Add New User</h2>
            <Input name="full_name" value={newUser.full_name} onChange={handleInputChange} placeholder="Full Name" />
            <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} placeholder="Email Address" />
            {/* ADDED: The password input field */}
            <Input name="password" type="password" value={newUser.password} onChange={handleInputChange} placeholder="Password" />
            <Select name="role" value={newUser.role} onChange={handleInputChange}>
              <option value="trader">Trader</option><option value="broker">Broker</option>
            </Select>
            <ModalActions>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <AddButton onClick={handleAddUser}>Save User</AddButton>
            </ModalActions>
          </ModalContent>
        </ModalBackdrop>
      )}
    </Container>
  );
}
export default ManageUsers;