import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend
);

// Set chart theme for dark mode
ChartJS.defaults.color = '#e0e0e0';
ChartJS.defaults.borderColor = '#444';
ChartJS.defaults.scale.grid.color = '#333';

const OpsLimitsTracker = ({ stands, timeRange }) => {
  const [opsLimitData, setOpsLimitData] = useState({
    labels: [],
    ropMaxCounts: [],
    wobMaxCounts: [],
    torqueMaxCounts: [],
    rpmMaxCounts: [],
    diffPMaxCounts: []
  });
  
  const [timePeriod, setTimePeriod] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState({
    standsCount: 0,
    totalFootage: 0,
    avgControlPercent: 0,
    preConnectionControl: 0,
    preConnectionManual: 0,
    postConnectionControl: 0,
    postConnectionManual: 0
  });
  
  // Process stands data to extract ops limits counts
  useEffect(() => {
    if (!stands || stands.length === 0) return;
    
    // Filter stands by date if a specific date is selected
    let filteredStands = [...stands];
    
    if (timePeriod !== 'all') {
      const selectedDateTime = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      let startDate;
      if (timePeriod === '24h') {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
      } else if (timePeriod === '12h') {
        startDate = new Date(selectedDateTime);
        startDate.setHours(selectedDateTime.getHours() - 12);
      } else if (timePeriod === '6h') {
        startDate = new Date(selectedDateTime);
        startDate.setHours(selectedDateTime.getHours() - 6);
      }
      
      filteredStands = stands.filter(stand => {
        if (!stand.startTime) return false;
        const standDate = new Date(stand.startTime);
        return standDate >= startDate && standDate <= endDate;
      });
    }
    
    // Map stand data to ops limits counts
    const labels = filteredStands.map(stand => `Stand ${stand.id}`);
    const ropMaxCounts = filteredStands.map(stand => stand.opsLimitRopMaxCount || 0);
    const wobMaxCounts = filteredStands.map(stand => stand.opsLimitWobMaxCount || 0);
    const torqueMaxCounts = filteredStands.map(stand => stand.opsLimitTorqueMaxCount || 0);
    const rpmMaxCounts = filteredStands.map(stand => stand.opsLimitRpmMaxCount || 0);
    const diffPMaxCounts = filteredStands.map(stand => stand.opsLimitDiffPMaxCount || 0);
    
    setOpsLimitData({
      labels,
      ropMaxCounts,
      wobMaxCounts,
      torqueMaxCounts,
      rpmMaxCounts,
      diffPMaxCounts
    });
    
    // Calculate summary data
    const totalDistance = filteredStands.reduce((sum, stand) => 
      sum + (stand.distanceDrilled || 0), 0);
    
    const weightedControlSum = filteredStands.reduce((sum, stand) => 
      sum + ((stand.controlDrillingPercent || 0) * (stand.distanceDrilled || 0)), 0);
    
    const avgControl = totalDistance > 0 ? weightedControlSum / totalDistance : 0;
    
    const preConnControl = filteredStands.reduce((sum, stand) => 
      sum + (stand.preConnectionInControl || 0), 0);
    
    const preConnManual = filteredStands.reduce((sum, stand) => 
      sum + (stand.preConnectionOutControl || 0), 0);
    
    const postConnControl = filteredStands.reduce((sum, stand) => 
      sum + (stand.postConnectionInControl || 0), 0);
    
    const postConnManual = filteredStands.reduce((sum, stand) => 
      sum + (stand.postConnectionOutControl || 0), 0);
    
    setSummaryData({
      standsCount: filteredStands.length,
      totalFootage: totalDistance.toFixed(2),
      avgControlPercent: avgControl.toFixed(2),
      preConnectionControl: (preConnControl / 60).toFixed(2), // Convert to minutes
      preConnectionManual: (preConnManual / 60).toFixed(2),
      postConnectionControl: (postConnControl / 60).toFixed(2),
      postConnectionManual: (postConnManual / 60).toFixed(2)
    });
    
  }, [stands, timePeriod, selectedDate]);
  
  // Chart configuration for ops limits
  const getOpsLimitsChartConfig = () => {
    return {
      labels: opsLimitData.labels,
      datasets: [
        {
          label: 'ROP Max',
          data: opsLimitData.ropMaxCounts,
          backgroundColor: 'rgba(26, 115, 232, 0.7)',
          borderColor: 'rgba(26, 115, 232, 1)',
          borderWidth: 1
        },
        {
          label: 'WOB Max',
          data: opsLimitData.wobMaxCounts,
          backgroundColor: 'rgba(52, 168, 83, 0.7)',
          borderColor: 'rgba(52, 168, 83, 1)',
          borderWidth: 1
        },
        {
          label: 'Torque Max',
          data: opsLimitData.torqueMaxCounts,
          backgroundColor: 'rgba(251, 188, 4, 0.7)',
          borderColor: 'rgba(251, 188, 4, 1)',
          borderWidth: 1
        },
        {
          label: 'RPM Max',
          data: opsLimitData.rpmMaxCounts,
          backgroundColor: 'rgba(234, 67, 53, 0.7)',
          borderColor: 'rgba(234, 67, 53, 1)',
          borderWidth: 1
        },
        {
          label: 'Diff P Max',
          data: opsLimitData.diffPMaxCounts,
          backgroundColor: 'rgba(153, 52, 232, 0.7)',
          borderColor: 'rgba(153, 52, 232, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Chart options for ops limits
  const opsLimitsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Stand Number'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Operational Limits Count by Stand'
      },
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    }
  };
  
  // Get time breakdown options for dropdown
  const getTimeOptions = () => {
    return [
      { value: 'all', label: 'All Data' },
      { value: '24h', label: '24 Hours' },
      { value: '12h', label: '12 Hours' },
      { value: '6h', label: '6 Hours' }
    ];
  };
  
  return (
    <div className="ops-limits-tracker">
      <div className="panel-header">
        <h3>Operational Limits Analysis</h3>
        
        <div className="time-filter-controls">
          <div className="filter-row">
            <div className="filter-group">
              <label>Time Period:</label>
              <select 
                value={timePeriod} 
                onChange={(e) => setTimePeriod(e.target.value)}
                className="time-period-select"
              >
                {getTimeOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {timePeriod !== 'all' && (
              <div className="filter-group">
                <label>Select Date:</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="date-select"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="time-period-summary">
        <div className="summary-header">
          <h4>Time Period Summary</h4>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Stands Drilled</div>
            <div className="summary-value">{summaryData.standsCount}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Footage</div>
            <div className="summary-value">{summaryData.totalFootage} ft</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Avg Control %</div>
            <div className="summary-value">{summaryData.avgControlPercent}%</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Pre-Conn Control</div>
            <div className="summary-value">{summaryData.preConnectionControl} min</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Pre-Conn Manual</div>
            <div className="summary-value">{summaryData.preConnectionManual} min</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Post-Conn Control</div>
            <div className="summary-value">{summaryData.postConnectionControl} min</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Post-Conn Manual</div>
            <div className="summary-value">{summaryData.postConnectionManual} min</div>
          </div>
        </div>
      </div>
      
      <div className="ops-limits-chart-container">
        <div className="chart-wrapper" style={{ height: '300px' }}>
          <Bar 
            data={getOpsLimitsChartConfig()} 
            options={opsLimitsChartOptions}
          />
        </div>
      </div>
      
      <style jsx>{`
        .ops-limits-tracker {
          background-color: #000;
          color: #fff;
          padding: 15px;
          border: 1px solid #333;
          border-radius: 4px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
        }
        
        .panel-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        
        .time-filter-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .filter-row {
          display: flex;
          gap: 15px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .time-period-select, .date-select {
          background-color: #333;
          color: #fff;
          border: 1px solid #444;
          padding: 5px 8px;
          border-radius: 4px;
        }
        
        .time-period-summary {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .summary-header {
          border-bottom: 1px solid #333;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .summary-header h4 {
          margin: 0;
          font-size: 1rem;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        
        .summary-item {
          background-color: #222;
          padding: 8px;
          border-radius: 4px;
        }
        
        .summary-label {
          font-size: 0.8rem;
          color: #aaa;
          margin-bottom: 4px;
        }
        
        .summary-value {
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .ops-limits-chart-container {
          margin-top: 15px;
        }
        
        .chart-wrapper {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
        }
        
        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .filter-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default OpsLimitsTracker;



