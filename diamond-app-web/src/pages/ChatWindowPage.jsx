import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
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

const AttachmentLink = styled.a`
  color: inherit;
  text-decoration: underline;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// --- NEW: Styled component for displaying images in chat ---
const ChatImage = styled.img`
  max-width: 100%;
  border-radius: 10px;
  margin-top: 5px;
  cursor: pointer;
`;

// --- NEW: Helper function to check if a URL is an image ---
const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

function ChatWindowPage() {
  const { conversationId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, sendMessage } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const partnerName = location.state?.partnerName || 'Chat';
  const messageAreaRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

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
    
    const handleNewTextMessage = (data) => {
        if (data.conversationId === parseInt(conversationId, 10)) {
            setMessages(prevMessages => [...prevMessages, data.message]);
        }
    };

    const handleNewFileMessage = (data) => {
        if (data.conversation_id === parseInt(conversationId, 10)) {
            setMessages(prevMessages => [...prevMessages, data]);
        }
    };

    socket.on('NEW_MESSAGE', handleNewTextMessage);
    socket.on('new_message', handleNewFileMessage);
    
    return () => {
      socket.off('NEW_MESSAGE', handleNewTextMessage);
      socket.off('new_message', handleNewFileMessage);
    };
  }, [socket, conversationId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      conversationId: parseInt(conversationId, 10),
      content: newMessage,
    };
    
    sendMessage('SEND_MESSAGE', messageData);
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
            
            // --- NEW: Check if the attachment is an image ---
            const isImage = isImageUrl(msg.attachment_url);

            return (
              <MessageWrapper key={msg.message_id || `msg-${index}`} $sent={sent}>
                <MessageBubble $sent={sent}>
                  
                  {/* --- THIS IS THE FIX --- */}
                  {msg.attachment_url ? (
                    isImage ? (
                      // If it's an image, render an <img> tag
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                        <ChatImage src={msg.attachment_url} alt="Shared image" />
                      </a>
                    ) : (
                      // If it's not an image, render the file link
                      <AttachmentLink href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                        <PiFile /> {msg.content.replace('📎 Document:', '').trim()}
                      </AttachmentLink>
                    )
                  ) : (
                    // If no attachment, just show the text content
                    msg.content
                  )}
                  {/* --- END OF FIX --- */}

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
            onChange={e => setNewMessage(e.g.target.value)}
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