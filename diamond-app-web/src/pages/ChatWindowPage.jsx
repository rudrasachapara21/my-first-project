import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { 
  PiPaperPlaneRight, PiPaperclip, PiFilePdf, PiX, PiDownloadSimple, PiFile, PiWarningCircleBold 
} from "react-icons/pi";
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const zoomIn = keyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

// --- STYLED COMPONENTS ---
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh; 
  background-color: ${props => props.theme.bgPrimary};
  overflow: hidden; 
  position: relative;
`;

const HeaderContainer = styled.div`
  flex-shrink: 0;
  padding-top: env(safe-area-inset-top); 
  background-color: ${props => props.theme.bgPrimary};
  z-index: 20; 
  border-bottom: 1px solid ${props => props.theme.borderColor};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// ✅ FIX: Added a clickable wrapper for the header title area
const ClickableHeaderTitle = styled.div`
  flex: 1;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.7;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 1rem;
`;

const ReportButton = styled.button`
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
  &:hover { background: rgba(239, 68, 68, 0.1); }
`;

const MessageArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  overscroll-behavior-y: contain;
  padding-bottom: 2rem; 
  background-color: ${props => props.theme.bgPrimary};
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-self: ${props => (props.$sent ? 'flex-end' : 'flex-start')};
  max-width: 75%;
  margin-bottom: 0.75rem;
`;

const MessageBubble = styled.div`
  padding: ${props => props.$isMedia ? '4px' : '0.75rem 1rem'};
  border-radius: 18px;
  border-top-right-radius: ${props => (props.$sent ? '4px' : '18px')};
  border-top-left-radius: ${props => (!props.$sent ? '4px' : '18px')};
  background-color: ${props => (props.$sent ? props.theme.accentPrimary : props.theme.bgSecondary)};
  color: ${props => (props.$sent ? 'white' : props.theme.textPrimary)};
  border: ${props => (props.$sent ? 'none' : `1px solid ${props.theme.borderColor}`)};
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: relative;
  word-wrap: break-word;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const FileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  min-width: 200px;
  transition: opacity 0.2s;
  background-color: ${props => props.$sent ? 'rgba(255, 255, 255, 0.2)' : props.theme.bgPrimary};
  border: ${props => props.$sent ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${props.theme.borderColor}`};
  &:hover { opacity: 0.9; }
`;

const FileIconBox = styled.div`
  width: 40px;
  height: 40px;
  background-color: ${props => props.$sent ? 'rgba(255,255,255,0.9)' : '#F3F4F6'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
`;

const FileName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${props => props.$sent ? 'white' : props.theme.textPrimary};
`;

const FileType = styled.span`
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 2px;
  text-transform: uppercase;
  color: ${props => props.$sent ? 'rgba(255,255,255,0.9)' : props.theme.textSecondary};
`;

const ChatImage = styled.img` 
  width: 100%; 
  max-width: 300px;
  border-radius: 14px; 
  display: block;
  cursor: pointer; 
`;

const Timestamp = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
  text-align: right;
  margin-top: 4px;
  margin-right: 4px;
  color: inherit;
`;

const InputForm = styled.form`
  display: flex;
  align-items: center;
  padding: 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom)); 
  background-color: ${props => props.theme.bgSecondary};
  border-top: 1px solid ${props => props.theme.borderColor};
  flex-shrink: 0;
  z-index: 30; 
`;

const MessageInput = styled.input`
  flex-grow: 1;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 24px;
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  font-size: 1rem;
  transition: border-color 0.2s;
  &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; }
  &:disabled { opacity: 0.7; }
`;

const SendButton = styled.button`
  background: none; border: none; font-size: 1.5rem;
  color: ${props => props.theme.accentPrimary};
  cursor: pointer; margin-left: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  &:disabled { color: ${props => props.theme.borderColor}; cursor: default; }
`;

const AttachButton = styled.label`
  background: none; border: none; font-size: 1.5rem;
  color: ${props => props.theme.textSecondary}; 
  cursor: pointer; margin-right: 0.75rem;
  display: flex; align-items: center;
  &:hover { color: ${props => props.theme.accentPrimary}; }
`;

const HiddenFileInput = styled.input` display: none; `;

const LightboxOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  animation: ${fadeIn} 0.2s ease-out;
  backdrop-filter: blur(5px);
`;

const LightboxHeader = styled.div`
  position: absolute; top: 0; left: 0; right: 0; height: 60px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 1.5rem; z-index: 2010;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
`;

const LightboxActionBtn = styled.button`
  background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  color: white; transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.3); }
`;

const LightboxContent = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  padding: 60px 0 20px 0; box-sizing: border-box;
  animation: ${zoomIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const LightboxImage = styled.img` max-width: 100%; max-height: 85vh; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); `;
const PDFViewerFrame = styled.iframe` width: 95%; height: 85vh; border: none; background: white; border-radius: 8px; `;

const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
const isPdfUrl = (url) => /\.(pdf)$/i.test(url);

function ChatWindowPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, sendMessage } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [partnerId, setPartnerId] = useState(location.state?.partnerId || null);
  const [partnerName, setPartnerName] = useState(location.state?.partnerName || 'Chat');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };
  
  const messageAreaRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ FIX: Fetching conversation metadata if partnerId is missing from state
  useEffect(() => {
    if (user && conversationId) {
      const fetchConversationData = async () => {
        try {
          const [msgRes, convRes] = await Promise.all([
            apiClient.get(`/api/conversations/${conversationId}/messages`),
            apiClient.get(`/api/conversations/${conversationId}`)
          ]);
          
          setMessages(msgRes.data);
          
          // Identify the other participant to get the correct profile ID
          const other = convRes.data.participants?.find(p => String(p.user_id) !== String(user.id));
          if (other) {
            setPartnerId(other.user_id);
            setPartnerName(other.full_name || other.email);
          }
        } catch (error) { 
          console.error("Failed to fetch data:", error); 
        }
      };
      fetchConversationData();
    }
  }, [user, conversationId]);

  useEffect(() => {
    if (!socket) return;
    const handleNewTextMessage = (data) => {
        if (data.conversationId === parseInt(conversationId, 10)) setMessages(prev => [...prev, data.message]);
    };
    const handleNewFileMessage = (data) => {
        if (data.conversation_id === parseInt(conversationId, 10)) setMessages(prev => [...prev, data]);
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
    if (!socket || !socket.connected) { alert("Reconnecting..."); return; }
    sendMessage('SEND_MESSAGE', { conversationId: parseInt(conversationId, 10), content: newMessage });
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) { alert('Failed to upload file.'); } 
    finally { e.target.value = null; setIsUploading(false); }
  };

  const handleMediaClick = (url) => {
      if (isImageUrl(url)) setPreviewMedia({ url, type: 'image' });
      else if (isPdfUrl(url)) setPreviewMedia({ url, type: 'pdf' });
      else window.open(url, '_blank');
  };

  const handleReportUser = async () => {
    if (window.confirm(`Are you sure you want to report ${partnerName}? Administrative team will review this conversation.`)) {
        try {
            await apiClient.post('/api/reports', {
                target_user_id: partnerId,
                conversation_id: conversationId,
                reason: 'Reported from chat window'
            });
            triggerToast('Report submitted successfully.', 'success');
        } catch (error) {
            triggerToast('Failed to submit report.', 'error');
        }
    }
  };

  // ✅ FIX: Navigation logic based on User ID
  const handleViewProfile = () => {
    if (partnerId) {
        navigate(`/broker-profile/${partnerId}`); 
    } else {
        triggerToast("User profile not available.", 'error');
    }
  };

  if (!user) return <p style={{padding:'20px', color: 'var(--text-primary)'}}>Loading...</p>;

  return (
    <PageWrapper>
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      <HeaderContainer>
        {/* ✅ FIX: Title is now wrapped in a Clickable area */}
        <ClickableHeaderTitle onClick={handleViewProfile}>
            <PageHeader 
                title={partnerName} 
                backTo="/chats" 
                onBack={() => navigate(-1)} 
            />
        </ClickableHeaderTitle>
        <HeaderActions>
            <ReportButton onClick={handleReportUser} title="Report User">
                <PiWarningCircleBold size={24} />
            </ReportButton>
        </HeaderActions>
      </HeaderContainer>

      <MessageArea ref={messageAreaRef}>
        {messages.map((msg, index) => {
          const sent = String(msg.sender_id) === String(user.id);
          const isImage = isImageUrl(msg.attachment_url);
          const isPdf = isPdfUrl(msg.attachment_url);

          return (
            <MessageWrapper key={msg.message_id || `msg-${index}`} $sent={sent}>
              <MessageBubble $sent={sent} $isMedia={!!msg.attachment_url}>
                {msg.attachment_url ? (
                  isImage ? (
                    <ChatImage 
                      src={msg.attachment_url} 
                      alt="Image" 
                      onClick={() => handleMediaClick(msg.attachment_url)}
                    />
                  ) : isPdf ? (
                    <FileCard $sent={sent} onClick={() => handleMediaClick(msg.attachment_url)}>
                        <FileIconBox $sent={sent}>
                            <PiFilePdf size={24} color="#ef4444" />
                        </FileIconBox>
                        <FileInfo>
                            <FileName $sent={sent}>{msg.content.replace('📎 Document:', '').trim()}</FileName>
                            <FileType $sent={sent}>PDF Document</FileType>
                        </FileInfo>
                    </FileCard>
                  ) : (
                    <FileCard $sent={sent} onClick={() => window.open(msg.attachment_url, '_blank')}>
                         <FileIconBox $sent={sent}>
                             <PiFile size={24} color="#6B7280" />
                         </FileIconBox>
                         <FileInfo>
                            <FileName $sent={sent}>{msg.content.replace('📎 Document:', '').trim()}</FileName>
                            <FileType $sent={sent}>File</FileType>
                        </FileInfo>
                    </FileCard>
                  )
                ) : (
                  msg.content
                )}
                <Timestamp>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Timestamp>
              </MessageBubble>
            </MessageWrapper>
          );
        })}
      </MessageArea>

      <InputForm onSubmit={handleSend}>
        <AttachButton htmlFor="file-upload"><PiPaperclip /></AttachButton>
        <HiddenFileInput id="file-upload" type="file" onChange={handleFileChange} disabled={isUploading} />
        <MessageInput
          value={newMessage} onChange={e => setNewMessage(e.target.value)}
          placeholder={isUploading ? "Uploading..." : "Message"} disabled={isUploading} 
        />
        <SendButton disabled={!newMessage.trim() || isUploading} type="submit"><PiPaperPlaneRight /></SendButton>
      </InputForm>

      {previewMedia && (
        <LightboxOverlay onClick={() => setPreviewMedia(null)}>
            <LightboxHeader onClick={e => e.stopPropagation()}>
                <LightboxActionBtn onClick={() => setPreviewMedia(null)}><PiX size={20} /></LightboxActionBtn>
                <LightboxActionBtn as="a" href={previewMedia.url} download target="_blank"><PiDownloadSimple size={20} /></LightboxActionBtn>
            </LightboxHeader>
            <LightboxContent onClick={e => e.stopPropagation()}>
                {previewMedia.type === 'image' ? <LightboxImage src={previewMedia.url} /> : 
                <PDFViewerFrame src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(previewMedia.url)}`} />}
            </LightboxContent>
        </LightboxOverlay>
      )}
    </PageWrapper>
  );
}

export default ChatWindowPage;