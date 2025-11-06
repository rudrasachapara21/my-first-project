import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
// ## CHANGE: Corrected the import path ##
import apiClient from '../../api/axiosConfig';
import styled from 'styled-components';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartContainer = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
`;

function UserGrowthChart() {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                // ## CHANGE: Using apiClient and added /api prefix ##
                const response = await apiClient.get('/api/stats/user-growth');
                const data = response.data;
                
                const labels = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                const counts = data.map(d => d.count);

                setChartData({
                    labels,
                    datasets: [{
                        label: 'New Users',
                        data: counts,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4,
                    }]
                });
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            }
        };
        fetchChartData();
    }, []);

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'New Users (Last 7 Days)',
                font: { size: 18, family: "'Clash Display', sans-serif" }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    if (!chartData) {
        return <ChartContainer>Loading Chart...</ChartContainer>;
    }

    return (
        <ChartContainer>
            <Line options={options} data={chartData} />
        </ChartContainer>
    );
}

export default UserGrowthChart;