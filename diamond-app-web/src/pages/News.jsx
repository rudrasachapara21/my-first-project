import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { ExternalLink, ArrowLeft } from 'lucide-react'; // Added ArrowLeft

// --- STYLES ---
const Container = styled.div``;
const NewsFeed = styled.div` 
  padding: 1.5rem; 
  display: flex; 
  flex-direction: column; 
  gap: 2rem; 
  max-width: 800px; 
  margin: 0 auto;
`;

const ArticleCard = styled.div` 
  background: ${props => props.theme.bgSecondary}; 
  border: 1px solid ${props => props.theme.borderColor}; 
  border-radius: 16px; 
  overflow: hidden; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.05); 
  transition: all 0.2s ease-in-out; 
  display: flex;
  flex-direction: column;

  &:hover { 
    box-shadow: 0 12px 30px rgba(0,0,0,0.15); 
    transform: translateY(-2px);
  } 
`;

const ImageWrapper = styled.div`
  display: block;
  width: 100%;
  overflow: hidden;
`;

const ArticleImage = styled.img` 
  width: 100%; 
  height: 240px; 
  object-fit: cover; 
  background-color: ${props => props.theme.bgPrimary}; 
  transition: transform 0.5s ease;

  ${ArticleCard}:hover & {
    transform: scale(1.05);
  }
`;

const ArticleContent = styled.div` 
  padding: 1.5rem; 
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ArticleTitle = styled.h2` 
  font-family: 'Clash Display', sans-serif; 
  font-size: 1.5rem; 
  margin: 0; 
  color: ${props => props.theme.textPrimary}; 
  line-height: 1.3;
  
  a {
    text-decoration: none;
    color: inherit;
    &:hover { color: ${props => props.theme.accent}; }
  }
`;

const ArticleMeta = styled.div` 
  font-size: 0.85rem; 
  font-weight: 500; 
  color: ${props => props.theme.textSecondary}; 
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ArticleBody = styled.div` 
  font-size: 1rem; 
  line-height: 1.6; 
  color: ${props => props.theme.textSecondary}; 
  a { display: none; }
`;

const ReadMoreButton = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  align-self: flex-start;
  padding: 0.75rem 1.25rem;
  background-color: ${props => props.theme.bgPrimary};
  color: ${props => props.theme.textPrimary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.accent};
    color: white;
    border-color: ${props => props.theme.accent};
  }
`;

// New Back Button Style
const BackButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin-bottom: 1rem;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.accent};
  }
`;

const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

function News() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const navigate = useNavigate(); // Hook for navigation

  const cleanContent = (htmlContent) => {
    if (!htmlContent) return "";
    return htmlContent.replace(/<a\b[^>]*>(.*?)<\/a>/i, "").replace(/\n\n/g, "");
  };

  useEffect(() => {
    if (!user) return;
    const fetchNews = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/news');
            setNews(response.data);
        } catch (error) {
            console.error("Failed to fetch news:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchNews();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNewArticle = (newArticle) => {
        setNews(prevNews => [newArticle, ...prevNews]);
    };
    socket.on('new-article', handleNewArticle);
    return () => {
        socket.off('new-article', handleNewArticle);
    };
  }, [socket]);

  return (
    <Container>
        <div style={{ padding: '2rem 1.5rem 0', maxWidth: '800px', margin: '0 auto' }}>
            {/* --- ADDED BACK BUTTON HERE --- */}
            <BackButton onClick={() => navigate(-1)}>
                <ArrowLeft size={20} /> Back
            </BackButton>
            
            <h1 style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '2rem' }}>Market News</h1>
            <p style={{ color: '#888' }}>Live updates from the diamond industry</p>
        </div>

        <NewsFeed>
            {isLoading ? (
                <p style={{ textAlign: 'center' }}>Loading news...</p>
            ) : (
                news.map(article => {
                    const imageUrl = article.image_url && !article.image_url.startsWith('http')
                        ? `${API_ROOT_URL}${article.image_url}`
                        : article.image_url;

                    const summaryText = cleanContent(article.content);

                    return (
                        <ArticleCard key={article.news_id}>
                            {imageUrl && (
                                <Link to={`/news/${article.news_id}`}>
                                    <ImageWrapper>
                                        <ArticleImage src={imageUrl} alt={article.title} />
                                    </ImageWrapper>
                                </Link>
                            )}
                            
                            <ArticleContent>
                                <ArticleTitle>
                                    <Link to={`/news/${article.news_id}`}>
                                        {article.title}
                                    </Link>
                                </ArticleTitle>

                                <ArticleMeta>
                                    {new Date(article.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                    <span>•</span>
                                    <span>NewsBot 🤖</span>
                                </ArticleMeta>
                                
                                <ArticleBody dangerouslySetInnerHTML={{ __html: summaryText }} />

                                <Link to={`/news/${article.news_id}`} style={{ textDecoration: 'none' }}>
                                    <ReadMoreButton>
                                        Read Summary <ExternalLink size={16} />
                                    </ReadMoreButton>
                                </Link>
                            </ArticleContent>
                        </ArticleCard>
                    );
                })
            )}
        </NewsFeed>
    </Container>
  );
}

export default News;