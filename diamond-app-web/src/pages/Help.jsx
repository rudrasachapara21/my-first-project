import React, { useState } from 'react';
import styled from 'styled-components';
import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import { PiCaretDown } from "react-icons/pi";

const sampleFaqs = [
    {
        q: "How do I post a new demand?",
        a: "Navigate to the Home screen and tap on the 'Post a Demand' card. Fill in the required details for the diamond you are looking for and submit the form."
    },
    {
        q: "What happens when a broker 'raises a hand'?",
        a: "When a broker raises their hand on one of your demands, their profile and contact information are shared with you. You can see this list in the 'My Demands' tab."
    },
    {
        q: "Can I contact another trader directly?",
        a: "To protect the role of brokers, traders cannot contact each other directly through the 'View Demands' feed. Connections are facilitated through the 'Raise Hand' feature on the Buy Feed or via a broker."
    }
];
const Container = styled.div``;
const Content = styled.div` padding: 1.5rem; `;
const SectionTitle = styled.h2`
    font-family: 'Clash Display', sans-serif; font-size: 1.5rem; margin-top: 0;
    margin-bottom: 1.5rem; color: ${props => props.theme.textPrimary};
`;
const FaqContainer = styled.div` margin-bottom: 2.5rem; `;
const FaqItem = styled.div`
    background-color: ${props => props.theme.bgSecondary}; border: 1px solid ${props => props.theme.borderColor};
    border-radius: 12px; margin-bottom: 1rem; overflow: hidden;
`;
const FaqQuestion = styled.div`
    padding: 1.25rem; font-weight: 600; cursor: pointer; display: flex;
    justify-content: space-between; align-items: center; color: ${props => props.theme.textPrimary};
    svg {
        transition: transform 0.3s ease;
        transform: ${props => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
    }
`;
const FaqAnswer = styled.div`
    padding: 0 1.25rem 1.25rem 1.25rem; color: ${props => props.theme.textSecondary}; line-height: 1.6;
`;
const ContactForm = styled.form` display: flex; flex-direction: column; gap: 1rem; `;
const TextArea = styled.textarea`
    min-height: 120px; padding: 1rem; background-color: ${props => props.theme.bgSecondary};
    border: 2px solid ${props => props.theme.borderColor}; border-radius: 12px;
    color: ${props => props.theme.textPrimary}; font-size: 1rem; font-family: 'Inter', sans-serif;
    resize: vertical;
    &:focus { outline: none; border-color: ${props => props.theme.accentPrimary}; }
`;
const SubmitButton = styled.button`
    padding: 1rem; border: none; border-radius: 12px; background: ${props => props.theme.accentPrimary};
    color: #FFFFFF; font-family: 'Clash Display', sans-serif;
    font-size: 1.2rem; font-weight: 600; cursor: pointer; &:disabled { background: #ccc; }
`;
const ResponseMessage = styled.p`
    text-align: center; font-weight: 500;
    color: ${props => props.type === 'success' ? '#22c55e' : '#ef4444'};
`;


function Help() {
    const [openFaq, setOpenFaq] = useState(null);
    const [queryText, setQueryText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState({ text: '', type: '' });

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };
    
    const handleSubmitQuery = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setResponseMsg({ text: '', type: '' });

        try {
            // --- THE FIX: Changed the endpoint from '/api/support/query' to '/api/support' ---
            const response = await apiClient.post('/api/support', { query_text: queryText });
            setResponseMsg({ text: response.data.message, type: 'success' });
            setQueryText('');
        } catch (error) {
            // Use a more specific error message for "Not Found" errors
            const message = error.response?.status === 404
                ? "Could not find the support endpoint. Please contact the administrator."
                : error.response?.data?.message || 'An error occurred.';
            setResponseMsg({ text: message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <PageHeader title="Help & Support" />
            <Content>
                <FaqContainer>
                    <SectionTitle>Frequently Asked Questions</SectionTitle>
                    {sampleFaqs.map((faq, index) => (
                        <FaqItem key={index}>
                            <FaqQuestion isOpen={openFaq === index} onClick={() => toggleFaq(index)}>
                                {faq.q} <PiCaretDown />
                            </FaqQuestion>
                            {openFaq === index && <FaqAnswer>{faq.a}</FaqAnswer>}
                        </FaqItem>
                    ))}
                </FaqContainer>

                <div>
                    <SectionTitle>Submit a Query</SectionTitle>
                    <ContactForm onSubmit={handleSubmitQuery}>
                        <TextArea 
                            placeholder="Please describe your issue..." 
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            required 
                        />
                        <SubmitButton type="submit" disabled={isLoading || !queryText}>
                            {isLoading ? 'Sending...' : 'Send to Admin'}
                        </SubmitButton>
                        {responseMsg.text && (
                            <ResponseMessage type={responseMsg.type}>
                                {responseMsg.text}
                            </ResponseMessage>
                        )}
                    </ContactForm>
                </div>
            </Content>
        </Container>
    );
}

export default Help;