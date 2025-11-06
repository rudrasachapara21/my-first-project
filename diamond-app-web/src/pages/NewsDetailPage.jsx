import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import styled from 'styled-components';
import PageHeader from '../components/PageHeader';

const Container = styled.div``;
const ArticleWrapper = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
`;
const ArticleImage = styled.img`
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: cover;
    border-radius: 16px;
    margin-bottom: 2rem;
`;
const ArticleTitle = styled.h1`
    font-family: 'Clash Display', sans-serif;
    font-size: 2.5rem;
    color: ${props => props.theme.textPrimary};
    margin-bottom: 0.5rem;
`;
const ArticleMeta = styled.p`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 2rem;
`;
const ArticleBody = styled.div`
    font-size: 1.1rem;
    line-height: 1.8;
    color: ${props => props.theme.textPrimary};
`;

function NewsDetailPage() {
    const { newsId } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ## CHANGE: Added for constructing image URLs ##
    const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                // ## CHANGE: Using apiClient and a relative path ##
                const response = await apiClient.get(`/api/news/${newsId}`);
                setArticle(response.data);
            } catch (error) {
                console.error("Failed to fetch article", error);
                navigate('/news');
            } finally {
                setIsLoading(false);
            }
        };

        fetchArticle();
    }, [newsId, navigate]);

    if (isLoading) {
        return <p>Loading article...</p>;
    }

    if (!article) {
        return <p>Article not found.</p>;
    }

    // ## CHANGE: Correctly build image URL ##
    const imageUrl = article.image_url && !article.image_url.startsWith('http') 
        ? `${API_ROOT_URL}${article.image_url}` 
        : article.image_url;

    return (
        <Container>
            <PageHeader title="News" />
            <ArticleWrapper>
                {imageUrl && <ArticleImage src={imageUrl} alt={article.title} />}
                <ArticleTitle>{article.title}</ArticleTitle>
                <ArticleMeta>
                    Posted on {new Date(article.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </ArticleMeta>
                <ArticleBody>
                    {article.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </ArticleBody>
            </ArticleWrapper>
        </Container>
    );
}

export default NewsDetailPage;