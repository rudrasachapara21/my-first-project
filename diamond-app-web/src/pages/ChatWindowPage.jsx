import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
// --- CHANGE 1: Imported new icons for attachments ---
import { PiPaperPlaneRight, PiPaperclip, PiFile } from "react-icons/pi";
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

const Container = styled.div` display: flex; flex-direction: column; height: 100vh; `;
const PageWrapper = styled.div` display: flex; flex-direction: column; height: 100%; `;
const MessageArea = styled.div` flex-grow: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; `;
const MessageWrapper = styled.div` display: flex; flex-direction: column; align-self: ${props => (props.$sent ? 'flex-end' : 'flex-start')}; max-width: 70%; margin-bottom: 0.75rem; `;
const MessageBubble = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 18px;
  background-color: ${props => (props.$sent ? props.theme.accentPrimary : props.theme.bgSecondary)};
  color: ${props => (props.$sent ? 'white' : props.theme.textPrimary)};
  border: ${props => (props.$sent ? 'none' : `1px solid ${props.theme.borderColor}`)};
  white-space: pre-wrap;
  word-wrap: break-word;
`;
const Timestamp = styled.div` font-size: 0.75rem; color: ${props => props.theme.textSecondary}; margin-top: 0.25rem; padding: 0 0.5rem; align-self: ${props => (props.$sent ? 'flex-end' : 'flex-start')}; `;
const InputForm = styled.form` display: flex; align-items: center; padding: 1rem; background-color: ${props => props.theme.bgSecondary}; border-top: 1px solid ${props => props.theme.borderColor}; flex-shrink: 0; `;
const MessageInput = styled.input` flex-grow: 1; padding: 0.75rem 1rem; border: 2px solid ${props => props.theme.borderColor}; border-radius: 20px; background-color: ${props => props.theme.bgPrimary}; color: ${props => props.theme.textPrimary}; font-size: 1rem; &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; } &:disabled { background-color: ${props => props.theme.bgSecondary}; } `;
const SendButton = styled.button` background: none; border: none; font-size: 1.8rem; color: ${props => props.theme.accentPrimary}; cursor: pointer; margin-left: 1rem; display: flex; align-items: center; &:disabled { color: ${props => props.theme.borderColor}; cursor: not-allowed; } `;
const AttachButton = styled.label`
  background: none;
  border: none;
  font-size: 1.8rem;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  &:hover {
    color: ${props => props.theme.accentPrimary};
  }
`;
const HiddenFileInput = styled.input`
  display: none;
`;

// --- CHANGE 2: Created a new styled component for the clickable link ---
const AttachmentLink = styled.a`
  color: inherit; /* Inherits the white or black text color from the bubble */
  text-decoration: underline;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

function ChatWindowPage() {
  const { conversationId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, sendMessage } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const partnerName = location.state?.partnerName || 'Chat';
  const messageAreaRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false); // To disable input during upload

  const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (user && conversationId) {
      const fetchMessages = async () => {
        try {
          const response = await apiClient.get(`/api/conversations/${conversationId}/messages`);
          setMessages(response.data);
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      };
      fetchMessages();
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (data) => {
        if (data.conversation_id === parseInt(conversationId, 10)) {
            setMessages(prevMessages => [...prevMessages, data]);
        }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      conversationId: parseInt(conversationId, 10),
      content: newMessage,
    };
    
    sendMessage('send_message', messageData);

    const sentMessage = {
      conversation_id: parseInt(conversationId, 10),
      sender_id: user.id,
      content: newMessage,
      sent_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, sentMessage]);
    
    setNewMessage('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      await apiClient.post(`/api/conversations/${conversationId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // The websocket will now handle showing the new message, so no alert is needed.
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload file.');
    } finally {
        e.target.value = null;
        setIsUploading(false);
    }
  };

  if (!user) {
    return <p>Loading user...</p>;
  }

  return (
    <PageWrapper>
      <PageHeader title={partnerName} backTo="/chats" />
      <Container>
        <MessageArea ref={messageAreaRef}>
          {messages.map((msg, index) => {
            const sent = String(msg.sender_id) === String(user.id);
            return (
              <MessageWrapper key={msg.message_id || `msg-${index}`} $sent={sent}>
                <MessageBubble $sent={sent}>
                  {/* --- CHANGE 3: Conditionally render a link or plain text --- */}
                  {msg.attachment_url ? (
                    <AttachmentLink href={`${API_ROOT_URL}${msg.attachment_url}`} target="_blank" rel="noopener noreferrer">
                      <PiFile /> {msg.content.replace('📎 Document:', '').trim()}
                    </AttachmentLink>
                  ) : (
                    msg.content
                  )}
                </MessageBubble>
                <Timestamp $sent={sent}>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Timestamp>
              </MessageWrapper>
            );
          })}
        </MessageArea>
        <InputForm onSubmit={handleSend}>
          <AttachButton htmlFor="file-upload">
            <PiPaperclip />
          </AttachButton>
          <HiddenFileInput id="file-upload" type="file" onChange={handleFileChange} disabled={isUploading} />

          <MessageInput
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder={isUploading ? "Uploading file..." : "Type a message..."}
            disabled={!socket || !socket.connected || isUploading}
          />
          <SendButton disabled={!newMessage.trim() || !socket || !socket.connected || isUploading} type="submit">
            <PiPaperPlaneRight />
          </SendButton>
        </InputForm>
      </Container>
    </PageWrapper>
  );
}
export default ChatWindowPage;