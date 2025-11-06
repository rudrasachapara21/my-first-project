import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// --- STYLED COMPONENTS (No changes needed) ---
const Container = styled.div` display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f1f5f9; font-family: 'Inter', sans-serif; `;
const LoginCard = styled.div` background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; `;
const Title = styled.h1` font-family: 'Clash Display', sans-serif; font-size: 2rem; color: #1e2b3b; margin-bottom: 2rem; `;
const Input = styled.input` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; `;
const Button = styled.button` width: 100%; background-color: #4f46e5; color: white; font-size: 1rem; font-weight: 500; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; &:disabled { background-color: #ccc; } `;
const ErrorMessage = styled.p` color: #ef4444; `;

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // FIX: We now pass 'admin' as the third argument to the login function.
    // The login function itself will now handle the role check.
    const result = await login(email, password, 'admin');

    if (result.success) {
      // If login is successful, we know the user is an admin, so we can redirect.
      navigate('/admin');
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <Container>
      <LoginCard>
        <Title>Admin Login</Title>
        <form onSubmit={handleLogin}>
          <Input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
      </LoginCard>
    </Container>
  );
}

export default AdminLogin;