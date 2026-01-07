import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { ExternalLink, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Button from '../components/Button'; // Assuming you have a standard Button component

// --- STYLES ---
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.accent};
  }
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-family: 'Clash Display', sans-serif;
  font-size: 2.5rem;
  color: ${props => props.theme.textPrimary};
  margin-bottom: 1rem;
  line-height: 1.2;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: ${props => props.theme.textSecondary};
  font-size: 0.9rem;
`;

const MainImage = styled.img`
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
`;

const Content = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  color: ${props => props.theme.textPrimary};
  margin-bottom: 3rem;

  /* Hide the old raw link if it exists in the text */
  a { display: none; }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme.borderColor};
`;

const SourceButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background-color: ${props => props.theme.accent};
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }
`;

const API_ROOT_URL = import.meta.env.VITE_API_URL.replace('/api', '');

function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await apiClient.get(`/api/news/${id}`);
        setArticle(response.data);
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) return <Container>Loading article...</Container>;
  if (!article) return <Container>Article not found.</Container>;

  // Logic to handle image URL
  const imageUrl = article.image_url && !article.image_url.startsWith('http')
    ? `${API_ROOT_URL}${article.image_url}`
    : article.image_url;

  // Logic to extract the external link
  const extractLink = (htmlContent) => {
    const match = htmlContent.match(/href="([^"]*)"/);
    return match ? match[1] : "#";
  };
  const externalLink = extractLink(article.content);

  // Logic to clean the text (remove the link from the body)
  const cleanContent = article.content
    .replace(/<a\b[^>]*>(.*?)<\/a>/i, "")
    .replace(/\n\n/g, "<br/><br/>");

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back to News
      </BackButton>

      <Header>
        <Title>{article.title}</Title>
        <Meta>
          <span>{new Date(article.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
          <span>•</span>
          <span>Market Intelligence</span>
        </Meta>
      </Header>

      {/* If we have an image, show it. 
          FUTURE: If you add multiple images to DB, we can map through them here. */}
      {imageUrl && <MainImage src={imageUrl} alt={article.title} />}

      <Content dangerouslySetInnerHTML={{ __html: cleanContent }} />

      <ButtonContainer>
        <SourceButton href={externalLink} target="_blank" rel="noopener noreferrer">
          Read Full Story on Source <ExternalLink size={20} />
        </SourceButton>
      </ButtonContainer>
    </Container>
  );
}

export default NewsDetailPage;