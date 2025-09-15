// src/pages/admin/ManageNews.jsx

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Container = styled.div``;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; `;
const Title = styled.h1` font-family: 'Clash Display', sans-serif; font-size: 2.5rem; color: #1e293b; `;
const AddButton = styled.button` background-color: #4f46e5; color: white; font-size: 1rem; font-weight: 500; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; &:hover { background-color: #4338ca; } `;
const Table = styled.table` width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 8px; `;
const Thead = styled.thead` @media (max-width: 768px) { display: none; } `;
const Tr = styled.tr` @media (max-width: 768px) { display: block; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); } `;
const Th = styled.th` background-color: #f8fafc; padding: 1rem; text-align: left; font-size: 0.9rem; color: #64748b; border-bottom: 1px solid #e2e8f0; `;
const Td = styled.td` padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: middle; @media (max-width: 768px) { display: block; text-align: right; border-bottom: 1px dotted #ccc; position: relative; padding-left: 50%; &:before { content: attr(data-label); position: absolute; left: 1rem; width: 45%; padding-right: 10px; white-space: nowrap; text-align: left; font-weight: bold; color: #334155; } &:last-child { border-bottom: none; } } `;
const ImageThumbnail = styled.img` width: 80px; height: 50px; object-fit: cover; border-radius: 4px; `;
const CardImage = styled.img` width: 100%; height: 150px; object-fit: cover; display: none; @media (max-width: 768px) { display: block; } `;
const DeleteButton = styled.button` background-color: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; &:hover { background-color: #dc2626; } `;
const EmptyState = styled.div` text-align: center; padding: 4rem; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); `;
const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; `;
const Input = styled.input` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; box-sizing: border-box; `;
const TextArea = styled.textarea` width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; min-height: 120px; resize: vertical; box-sizing: border-box; `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 1rem; `;

function ManageNews() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', image_url: '' });

  const fetchNews = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/admin/login'); return; }
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5001/api/news', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNews(response.data);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role !== 'admin') {
      alert("Access Denied.");
      navigate('/admin/login');
    } else {
      fetchNews();
    }
  }, [fetchNews, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({ ...prev, [name]: value }));
  };

  const handleAddArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
        alert("Title and content are required.");
        return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5001/api/news', newArticle, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalOpen(false);
      setNewArticle({ title: '', content: '', image_url: '' });
      fetchNews(); // Refresh the list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to post article.');
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`http://localhost:5001/api/news/${articleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchNews(); // Refresh the list
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete article.');
      }
    }
  };

  return (
    <Container>
      <Header>
        <Title>Manage News</Title>
        <AddButton onClick={() => setModalOpen(true)}>Add New Article</AddButton>
      </Header>
      {isLoading ? <p>Loading news...</p> : news.length > 0 ? (
        <Table>
          <Thead><Tr><Th>Image</Th><Th>Title</Th><Th>Date</Th><Th>Actions</Th></Tr></Thead>
          <tbody>
            {news.map(article => (
              <Tr key={article.news_id}>
                <CardImage src={article.image_url} alt={article.title} />
                <Td data-label="Image">
                    {article.image_url ? <ImageThumbnail src={article.image_url} alt={article.title} /> : 'No Image'}
                </Td>
                <Td data-label="Title">{article.title}</Td>
                <Td data-label="Date">{new Date(article.created_at).toLocaleDateString()}</Td>
                <Td data-label="Actions"><DeleteButton onClick={() => handleDeleteArticle(article.news_id)}>Delete</DeleteButton></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState>
          <h3>No News Articles Found</h3>
          <p>Click "Add New Article" to get started.</p>
        </EmptyState>
      )}
      {isModalOpen && (
        <ModalBackdrop>
          <ModalContent>
            <h2 style={{marginTop: 0}}>Add New Article</h2>
            <Input name="title" value={newArticle.title} onChange={handleInputChange} placeholder="Article Title" />
            <Input name="image_url" value={newArticle.image_url} onChange={handleInputChange} placeholder="Image URL (e.g., https://...)" />
            <TextArea name="content" value={newArticle.content} onChange={handleInputChange} placeholder="Article content..."/>
            <ModalActions>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <AddButton onClick={handleAddArticle}>Save Article</AddButton>
            </ModalActions>
          </ModalContent>
        </ModalBackdrop>
      )}
    </Container>
  );
}

export default ManageNews;