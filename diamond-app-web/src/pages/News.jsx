import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

// --- STYLES (No changes) ---
const Container = styled.div``;
const NewsFeed = styled.div` padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; `;
const ArticleCard = styled.div` background: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: box-shadow 0.2s ease-in-out; &:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.1); } `;
const ArticleImage = styled.img` width: 100%; height: 200px; object-fit: cover; background-color: ${props => props.theme.bgPrimary}; `;
const ArticleContent = styled.div` padding: 1.5rem; `;
const ArticleTitle = styled.h2` font-family: 'Clash Display', sans-serif; font-size: 1.4rem; margin-top: 0; margin-bottom: 0.5rem; color: ${props => props.theme.textPrimary}; `;
const ArticleMeta = styled.p` font-size: 0.8rem; font-weight: 500; color: ${props => props.theme.textSecondary}; margin-top: 0; margin-bottom: 1rem; `;
const ArticleBody = styled.p` font-size: 1rem; line-height: 1.6; color: ${props => props.theme.textPrimary}; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; `;

// ## CHANGE: Moved constant outside the component for consistency ##
const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

function News() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchNews = async () => {
        setIsLoading(true);
        try {
            // ## CHANGE: Using apiClient and added /api prefix ##
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

  return (
    <Container>
        <PageHeader title="News Feed" />
        <NewsFeed>
            {isLoading ? (
                <p style={{ textAlign: 'center' }}>Loading news...</p>
            ) : (
                news.map(article => {
                    // ## CHANGE: Improved image URL handling ##
                    const imageUrl = article.image_url && !article.image_url.startsWith('http')
                        ? `${API_ROOT_URL}${article.image_url}`
                        : article.image_url;

                    return (
                        <ArticleCard key={article.news_id}>
                            {imageUrl && <ArticleImage src={imageUrl} alt={article.title} />}
                            <ArticleContent>
                                <ArticleTitle>{article.title}</ArticleTitle>
                                <ArticleMeta>
                                    {new Date(article.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </ArticleMeta>
                                <ArticleBody>{article.content}</ArticleBody>
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