import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler // <--- 1. IMPORT ADDED
} from 'chart.js';
import styled from 'styled-components';

// --- 2. PATH FIXED: Goes up 2 levels to find 'api' folder ---
import apiClient from '../../api/axiosConfig'; 

// --- 3. REGISTER FILLER ---
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
);

const ChartContainer = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  margin-top: 2rem;
`;

const TitleText = styled.h3`
  margin-bottom: 1rem;
  color: #374151;
  font-family: 'Inter', sans-serif;
`;

function UserGrowthChart() {
    const [rawData, setRawData] = useState(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await apiClient.get('/api/stats/user-growth');
                setRawData(response.data); 
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            }
        };
        fetchChartData();
    }, []);

    // Memoize the chartData object to prevent unnecessary re-renders
    const chartData = useMemo(() => {
        if (!rawData) return null;

        const labels = rawData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        const counts = rawData.map(d => d.count);

        return {
            labels,
            datasets: [{
                label: 'New Users',
                data: counts,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.2)', // Light purple fill
                fill: true, // This works now because 'Filler' is registered!
                tension: 0.4,
            }]
        };
    }, [rawData]);

    const options = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    }), []);

    if (!chartData) {
        return <ChartContainer><p style={{padding:'20px', textAlign:'center'}}>Loading Chart...</p></ChartContainer>;
    }

    return (
        <ChartContainer>
            <TitleText>New Users (Last 12 Months)</TitleText>
            <Line options={options} data={chartData} />
        </ChartContainer>
    );
}

export default UserGrowthChart;