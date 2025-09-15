// src/pages/News.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const Container = styled.div``;
const NewsFeed = styled.div`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;
const ArticleCard = styled.div`
    background: ${props => props.theme.bgSecondary};
    border: 1px solid ${props => props.theme.borderColor};
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s ease-in-out;
    &:hover {
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
`;
const ArticleImage = styled.img`
    width: 100%;
    height: 200px;
    object-fit: cover;
    background-color: ${props => props.theme.bgPrimary};
`;
const ArticleContent = styled.div`
    padding: 1.5rem;
`;
const ArticleTitle = styled.h2`
    font-family: 'Clash Display', sans-serif;
    font-size: 1.4rem;
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: ${props => props.theme.textPrimary};
`;
const ArticleMeta = styled.p`
    font-size: 0.8rem;
    font-weight: 500;
    color: ${props => props.theme.textSecondary};
    margin-top: 0;
    margin-bottom: 1rem;
`;
const ArticleBody = styled.p`
    font-size: 1rem;
    line-height: 1.6;
    color: ${props => props.theme.textPrimary};
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
`;

function News() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchNews = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/news', {
            headers: { Authorization: `Bearer ${token}` }
            });
            setNews(response.data);
        } catch (error) {
            console.error("Failed to fetch news:", error);
            if (error.response?.status === 401) navigate('/');
        } finally {
            setIsLoading(false);
        }
    };
    fetchNews();
  }, [navigate]);

  return (
    <Container>
        <PageHeader title="News Feed" />
        <NewsFeed>
            {isLoading ? (
                <p>Loading news...</p>
            ) : (
                news.map(article => (
                    <Link to={`/news/${article.news_id}`} key={article.news_id} style={{ textDecoration: 'none' }}>
                        <ArticleCard>
                            {article.image_url && <ArticleImage src={article.image_url} alt={article.title} />}
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
                    </Link>
                ))
            )}
        </NewsFeed>
    </Container>
  );
}

export default News;