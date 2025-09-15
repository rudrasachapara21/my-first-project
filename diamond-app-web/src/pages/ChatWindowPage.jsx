import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import { PiPaperPlaneRight } from "react-icons/pi";
import { useWebSocket } from '../context/WebSocketContext';

// --- Styled Components ---
const Container = styled.div` display: flex; flex-direction: column; height: calc(100vh - 74px); `;
const MessageArea = styled.div` flex-grow: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; `;
const MessageWrapper = styled.div` display: flex; flex-direction: column; align-self: ${props => (props.$sent ? 'flex-end' : 'flex-start')}; max-width: 70%; margin-bottom: 0.75rem; `;
const MessageBubble = styled.div` padding: 0.75rem 1rem; border-radius: 18px; background-color: ${props => (props.$sent ? props.theme.accentPrimary : props.theme.bgSecondary)}; color: ${props => (props.$sent ? 'white' : props.theme.textPrimary)}; border: ${props => (props.$sent ? 'none' : `1px solid ${props.theme.borderColor}`)}; `;
const Timestamp = styled.div` font-size: 0.75rem; color: ${props => props.theme.textSecondary}; margin-top: 0.25rem; padding: 0 0.5rem; align-self: ${props => (props.$sent ? 'flex-end' : 'flex-start')}; `;
const InputForm = styled.form` display: flex; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border-top: 1px solid ${props => props.theme.borderColor}; flex-shrink: 0; `;
const MessageInput = styled.input` flex-grow: 1; padding: 0.75rem 1rem; border: 2px solid ${props => props.theme.borderColor}; border-radius: 20px; background-color: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; font-size: 1rem; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } &:disabled { background-color: ${props => props.theme.bgSecondary}; } `;
const SendButton = styled.button` background: none; border: none; font-size: 1.8rem; color: ${props => props.theme.accentPrimary}; cursor: pointer; margin-left: 1rem; display: flex; align-items: center; &:disabled { color: ${props => props.theme.borderColor}; cursor: not-allowed; } `;
const StatusIndicator = styled.div` text-align: center; padding: 0.5rem; font-size: 0.8rem; color: ${props => props.theme.textSecondary}; background-color: ${props => props.theme.bgSecondary}; `;

function ChatWindowPage() {
    const navigate = useNavigate();
    const { chatId } = useParams();
    const location = useLocation();
    const { ws, isConnected } = useWebSocket();
    const partnerName = location.state?.partnerName || 'Chat';
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const messageAreaRef = useRef(null);

    useEffect(() => { if (messageAreaRef.current) { messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight; } }, [messages]);
    
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (!token || !user) { navigate('/'); return; }
        setCurrentUser(user);

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://localhost:5001/api/conversations/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
                setMessages(response.data);
            } catch (error) {
                console.error("Failed to fetch messages", error);
                navigate('/chats');
            }
        };
        fetchMessages();
    }, [chatId, navigate]);

    useEffect(() => {
        if (!ws) return;

        const handleMessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            if (receivedMessage.conversation_id === parseInt(chatId, 10)) {
                setMessages(prev => [...prev, receivedMessage]);
            }
        };
        
        ws.addEventListener('message', handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
        };
    }, [ws, chatId]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !isConnected) return;
        const messagePayload = { conversationId: parseInt(chatId, 10), message_content: newMessage };
        ws.send(JSON.stringify(messagePayload));
        const optimisticMessage = { message_id: Date.now(), conversation_id: parseInt(chatId, 10), sender_id: currentUser.user_id, message_content: newMessage, sent_at: new Date().toISOString() };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
    };
    
    const formatTime = (timestamp) => { return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); };

    return (
        <>
            <PageHeader title={partnerName} />
            <Container>
                {!isConnected && <StatusIndicator>Connecting to chat...</StatusIndicator>}
                <MessageArea ref={messageAreaRef}>
                    {messages.map(msg => {
                        const isSent = msg.sender_id === currentUser?.user_id;
                        return (
                            <MessageWrapper key={msg.message_id} $sent={isSent}>
                                <MessageBubble $sent={isSent}>{msg.message_content}</MessageBubble>
                                <Timestamp $sent={isSent}>{formatTime(msg.sent_at)}</Timestamp>
                            </MessageWrapper>
                        );
                    })}
                </MessageArea>
                <InputForm onSubmit={handleSend}>
                    <MessageInput 
                        type="text" 
                        placeholder={isConnected ? "Type a message..." : "Waiting for connection..."} 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!isConnected}
                    />
                    <SendButton type="submit" disabled={!isConnected}><PiPaperPlaneRight /></SendButton>
                </InputForm>
            </Container>
        </>
    );
}
export default ChatWindowPage;