import React, { useState, useEffect, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import apiClient from '../../api/axiosConfig';
import styled from 'styled-components';

ChartJS.register(ArcElement, Tooltip, Legend);

const ChartContainer = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  height: 100%;
`;

function UserStatusChart() {
    // ## --- CHANGE 1: Store the raw data from the API --- ##
    const [rawData, setRawData] = useState(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await apiClient.get('/api/stats/user-verification');
                setRawData(response.data); // Store { verified: 50, pending: 5 }
            } catch (error) {
                console.error("Failed to fetch user status data:", error);
            }
        };
        fetchChartData();
    }, []);

    // ## --- CHANGE 2: Memoize the 'chartData' object --- ##
    // This creates the data object only when rawData changes.
    const chartData = useMemo(() => {
        if (!rawData) return null; // Return null if data hasn't loaded

        return {
            labels: ['Verified Users', 'Pending Approval'],
            datasets: [{
                label: 'User Status',
                data: [rawData.verified, rawData.pending],
                backgroundColor: [
                    '#4f46e5', // Primary
                    '#f59e0b', // Amber
                ],
                borderColor: [
                    '#4f46e5',
                    '#f59e0b',
                ],
                borderWidth: 1,
            }]
        };
    }, [rawData]); // Dependency: only re-run when rawData changes

    // This options object is also memoized
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
            title: {
                display: true,
                text: 'User Verification Status',
                font: { size: 18, family: "'Clash Display', sans-serif" }
            },
        },
    }), []);

    // ## --- CHANGE 3: Check for chartData, not rawData --- ##
    if (!chartData) {
        return <ChartContainer>Loading Chart...</ChartContainer>;
    }

    return (
        <ChartContainer>
            <Doughnut options={options} data={chartData} />
        </ChartContainer>
    );
}

export default UserStatusChart;