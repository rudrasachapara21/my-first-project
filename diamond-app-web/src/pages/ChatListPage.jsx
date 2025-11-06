import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

const Container = styled.div``;
const SearchSection = styled.div` padding: 1rem 1.5rem; border-bottom: 1px solid ${props => props.theme.borderColor}; `;
const SearchInput = styled.input` width: 100%; padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid ${props => props.theme.borderColor}; background: ${props => props.theme.bgSecondary}; color: ${props => props.theme.textPrimary}; font-size: 1rem; box-sizing: border-box; `;
const ResultsContainer = styled.div` max-height: 300px; overflow-y: auto; `;
const ChatList = styled.div` padding: 0; `;
const ChatItem = styled.div` display: flex; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid ${props => props.theme.borderColor}; cursor: pointer; &:hover { background-color: ${props => props.theme.bgSecondary}; } `;
const Avatar = styled.div` width: 50px; height: 50px; border-radius: 50%; background-color: #A5B4FC; margin-right: 1rem; flex-shrink: 0; `;
const ChatContent = styled.div` flex-grow: 1; overflow: hidden; `;
const ChatName = styled.h3` margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600; color: ${props => props.theme.textPrimary}; `;
const LastMessage = styled.p` margin: 0; font-size: 0.9rem; color: ${props => props.theme.textSecondary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;

function ChatListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      // ## CHANGE: Using apiClient and added /api prefix ##
      const response = await apiClient.get('/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const search = async () => {
      try {
        // ## CHANGE: Using apiClient and added /api prefix ##
        const response = await apiClient.get(`/api/search/users?name=${searchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleOpenConversation = (chat) => {
    navigate(`/chat/${chat.conversation_id}`, { state: { partnerName: chat.partner_name } });
  };

  const handleStartNewConversation = async (searchedUser) => {
    try {
      // ## CHANGE: Using apiClient and added /api prefix ##
      const response = await apiClient.post('/api/conversations', {
        recipientId: searchedUser.user_id,
      });
      navigate(`/chat/${response.data.conversation_id}`, { state: { partnerName: searchedUser.full_name } });
    } catch (error) {
      alert(error.response?.data?.message || "Could not start conversation.");
    }
  };

  const uniqueConversations = useMemo(() => {
    const map = new Map();
    conversations.forEach(chat => { map.set(chat.partner_id, chat); });
    const sorted = Array.from(map.values()).sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time) : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time) : 0;
        return timeB - timeA;
    });
    return sorted;
  }, [conversations]);

  return (
    <Container>
      <PageHeader title="Messages" />
      <SearchSection>
        <SearchInput
          type="text"
          placeholder="Search users to start a new chat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchSection>
      {searchQuery.length > 1 ? (
        <ResultsContainer>
          {isSearching ? ( <p style={{ padding: '1.5rem' }}>Searching...</p> ) : (
            searchResults.map(user => (
              <ChatItem key={user.user_id} onClick={() => handleStartNewConversation(user)}>
                <Avatar />
                <ChatContent>
                  <ChatName>{user.full_name}</ChatName>
                  <LastMessage>{user.office_name || user.role}</LastMessage>
                </ChatContent>
              </ChatItem>
            ))
          )}
        </ResultsContainer>
      ) : (
        <ChatList>
          {isLoading ? ( <p style={{ padding: '1.5rem' }}>Loading conversations...</p> ) : (
            uniqueConversations.map(chat => (
              <ChatItem key={chat.conversation_id} onClick={() => handleOpenConversation(chat)} >
                <Avatar />
                <ChatContent>
                  <ChatName>{chat.partner_name}</ChatName>
                  <LastMessage>{chat.last_message || '...'}</LastMessage>
                </ChatContent>
              </ChatItem>
            ))
          )}
        </ChatList>
      )}
    </Container>
  );
}

export default ChatListPage;