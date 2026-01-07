import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PiTrendUp, PiTrendDown, PiWallet, PiDownloadSimple, PiEmpty } from "react-icons/pi";

import apiClient from '../api/axiosConfig';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader'; // The premium loader we just made
import { useAuth } from '../context/AuthContext';
import ExportStatementModal from '../components/ExportStatementModal'; // Ensure you have this component

// --- STYLES ---
const Container = styled.div``;
const Content = styled.div` padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; `;

// 1. SUMMARY CARDS
const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; `;
const StatCard = styled.div`
  background: ${props => props.theme.bgSecondary}; padding: 1.5rem; border-radius: 16px;
  border: 1px solid ${props => props.theme.borderColor}; box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; gap: 0.5rem; transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
`;
const StatLabel = styled.span` color: ${props => props.theme.textSecondary}; font-size: 0.9rem; font-weight: 500; `;
const StatValue = styled.span` font-family: 'Clash Display', sans-serif; font-size: 1.8rem; font-weight: 600; color: ${props => props.color || props.theme.textPrimary}; `;
const StatIcon = styled.div` width: 40px; height: 40px; border-radius: 50%; background: ${props => props.bg}; color: ${props => props.color}; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; `;

// 2. CHART SECTION
const ChartSection = styled.div` background: ${props => props.theme.bgSecondary}; padding: 1.5rem; border-radius: 16px; border: 1px solid ${props => props.theme.borderColor}; height: 400px; `;
const SectionHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; `;
const Title = styled.h3` margin: 0; font-family: 'Clash Display', sans-serif; `;

const ExportButton = styled.button`
  display: flex; align-items: center; gap: 8px; padding: 10px 16px;
  background: ${props => props.theme.bgPrimary}; border: 1px solid ${props => props.theme.borderColor};
  border-radius: 8px; cursor: pointer; font-weight: 600; color: ${props => props.theme.textPrimary};
  transition: all 0.2s;
  &:hover { background: ${props => props.theme.borderColor}; }
`;

// 3. TABLE
const TableWrapper = styled.div` overflow-x: auto; background: ${props => props.theme.bgSecondary}; border-radius: 16px; border: 1px solid ${props => props.theme.borderColor}; `;
const Table = styled.table` width: 100%; border-collapse: collapse; min-width: 600px; `;
const Th = styled.th` text-align: left; padding: 1rem; border-bottom: 1px solid ${props => props.theme.borderColor}; color: ${props => props.theme.textSecondary}; font-size: 0.85rem; text-transform: uppercase; `;
const Td = styled.td` padding: 1rem; border-bottom: 1px solid ${props => props.theme.borderColor}; font-size: 0.95rem; `;
const TypeBadge = styled.span` padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; background: ${props => props.type === 'CREDIT' ? '#DCFCE7' : '#FEE2E2'}; color: ${props => props.type === 'CREDIT' ? '#166534' : '#991B1B'}; `;

function FinancialPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExportModalOpen, setExportModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Fetch the Table Data
                const stmtRes = await apiClient.get('/api/transactions/statement');
                setTransactions(stmtRes.data);
                
                // 2. Fetch the Graph Data
                const chartRes = await apiClient.get('/api/transactions/analytics');
                setChartData(chartRes.data);
            } catch (error) {
                console.error("Failed to load financials", error);
            } finally {
                // Short delay to show off the fancy loader
                setTimeout(() => setIsLoading(false), 800);
            }
        };
        fetchData();
    }, [user]);

    // Calculate Totals
    const totalIncome = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + parseFloat(t.final_amount), 0);
    const totalSpent = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + parseFloat(t.final_amount), 0);

    // --- RENDER ---
    if (isLoading) return <Loader fullScreen={true} text="Analyzing Market Data..." />;

    return (
        <Container>
            <PageHeader title="Financial Statements" />
            <Content>
                {/* 1. KEY METRICS */}
                <StatsGrid>
                    <StatCard>
                        <StatIcon bg="#DCFCE7" color="#166534"><PiTrendUp size={22} /></StatIcon>
                        <StatLabel>Total Income (Sales)</StatLabel>
                        <StatValue color="#166534">₹{totalIncome.toLocaleString('en-IN')}</StatValue>
                    </StatCard>
                    <StatCard>
                        <StatIcon bg="#FEE2E2" color="#991B1B"><PiTrendDown size={22} /></StatIcon>
                        <StatLabel>Total Expenses (Buys)</StatLabel>
                        <StatValue color="#991B1B">₹{totalSpent.toLocaleString('en-IN')}</StatValue>
                    </StatCard>
                    <StatCard>
                        <StatIcon bg="#E0E7FF" color="#3730A3"><PiWallet size={22} /></StatIcon>
                        <StatLabel>Net Profit / Loss</StatLabel>
                        <StatValue>₹{(totalIncome - totalSpent).toLocaleString('en-IN')}</StatValue>
                    </StatCard>
                </StatsGrid>

                {/* 2. CHART AREA */}
                <ChartSection>
                    <SectionHeader>
                        <Title>Monthly Sales Volume</Title>
                    </SectionHeader>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                                />
                                <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF'}}>
                            <PiEmpty size={48} />
                            <p>No sales data to graph yet.</p>
                        </div>
                    )}
                </ChartSection>

                {/* 3. TRANSACTIONS TABLE */}
                <div>
                    <SectionHeader>
                        <Title>Recent Activity</Title>
                        <ExportButton onClick={() => setExportModalOpen(true)}>
                            <PiDownloadSimple size={18} /> Export Statement
                        </ExportButton>
                    </SectionHeader>
                    
                    <TableWrapper>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Date</Th>
                                    <Th>Type</Th>
                                    <Th>Item Details</Th>
                                    <Th>Counterparty</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr><Td colSpan="6" style={{textAlign: 'center', padding: '3rem', color: '#6B7280'}}>No transactions found.</Td></tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.transaction_id}>
                                            <Td>{new Date(t.transaction_date).toLocaleDateString()}</Td>
                                            <Td><TypeBadge type={t.type}>{t.type}</TypeBadge></Td>
                                            <Td>
                                                <strong>{t.carat}ct {t.shape}</strong> <span style={{color:'#6B7280'}}>({t.color}/{t.clarity})</span>
                                            </Td>
                                            <Td>{t.party_name || 'System'}</Td>
                                            <Td style={{fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem'}}>
                                                ₹{parseFloat(t.final_amount).toLocaleString('en-IN')}
                                            </Td>
                                            <Td style={{textTransform: 'capitalize', color: '#059669', fontWeight: '500'}}>
                                                {t.payment_status}
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </TableWrapper>
                </div>
            </Content>

            {/* EXPORT MODAL */}
            <ExportStatementModal 
                isOpen={isExportModalOpen} 
                onClose={() => setExportModalOpen(false)} 
            />
        </Container>
    );
}

export default FinancialPage;