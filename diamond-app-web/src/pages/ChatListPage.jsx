// src/pages/ChatListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../components/PageHeader';

// ... (Styled components are unchanged)
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
const StartChatButton = styled.button` background-color: ${props => props.theme.accentPrimary}; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 500; `;

function ChatListPage() {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const fetchConversations = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:5001/api/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(response.data);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        const token = localStorage.getItem('token');
        const search = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/search/users?query=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error("Search failed:", error);
            }
        };
        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleStartConversation = async (recipient) => {
        const message_content = "Hello!";
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post('http://localhost:5001/api/conversations', {
                recipientId: recipient.user_id,
                message_content
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            navigate(`/chat/${response.data.conversationId}`, { state: { partnerName: recipient.full_name } });
        } catch (error) {
             alert(error.response?.data?.message || "Could not start conversation.");
        }
    };
    
    const handleChatClick = (chat) => {
        navigate(`/chat/${chat.conversation_id}`, { state: { partnerName: chat.partner_name } });
    };

    return (
        <Container>
            <PageHeader title="Messages" />
            <SearchSection>
                <SearchInput
                    type="text"
                    placeholder="Search users or offices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </SearchSection>
            {searchQuery.length > 1 ? (
                <ResultsContainer>
                    {searchResults.map(user => (
                        <ChatItem key={user.user_id}>
                             <Avatar />
                             <ChatContent>
                                <ChatName>{user.full_name}</ChatName>
                                <LastMessage>{user.office_name || user.role}</LastMessage>
                             </ChatContent>
                             <StartChatButton onClick={() => handleStartConversation(user)}>Chat</StartChatButton>
                        </ChatItem>
                    ))}
                </ResultsContainer>
            ) : (
                <ChatList>
                    {isLoading ? <p>Loading...</p> : conversations.map(chat => (
                        <ChatItem key={chat.conversation_id} onClick={() => handleChatClick(chat)}>
                            <Avatar />
                            <ChatContent>
                                <ChatName>{chat.partner_name}</ChatName>
                                <LastMessage>{chat.last_message}</LastMessage>
                            </ChatContent>
                        </ChatItem>
                    ))}
                </ChatList>
            )}
        </Container>
    );
}
export default ChatListPage;