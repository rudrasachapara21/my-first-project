import React, { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import apiClient from '../../api/axiosConfig';
import styled from 'styled-components';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChartContainer = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
`;

function MarketActivityChart() {
    const [rawData, setRawData] = useState(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await apiClient.get('/api/stats/market-activity');
                setRawData(response.data); // Store the raw array
            } catch (error) {
                console.error("Failed to fetch market activity data:", error);
            }
        };
        fetchChartData();
    }, []);

    // Memoize the chartData object
    const chartData = useMemo(() => {
        if (!rawData) return null;

        const labels = rawData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        const demands = rawData.map(d => d.demands_count);
        const listings = rawData.map(d => d.listings_count);

        return {
            labels,
            datasets: [
                {
                    label: 'New Demands',
                    data: demands,
                    backgroundColor: '#3b82f6', // Blue
                    borderRadius: 4,
                },
                {
                    label: 'New Listings',
                    data: listings,
                    backgroundColor: '#22c55e', // Green
                    borderRadius: 4,
                }
            ]
        };
    }, [rawData]);

    // Memoize the options object
    const options = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Marketplace Activity (Last 12 Months)',
                font: { size: 18, family: "'Clash Display', sans-serif" }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            },
            x: {
                grid: { display: false }
            }
        }
    }), []);

    if (!chartData) {
        return <ChartContainer>Loading Chart...</ChartContainer>;
    }

    return (
        <ChartContainer>
            <Bar options={options} data={chartData} />
        </ChartContainer>
    );
}

export default MarketActivityChart;