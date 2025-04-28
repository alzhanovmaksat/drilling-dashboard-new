import React, { useState, useEffect } from 'react';

const OpsLimitsTracker = ({ stands, timeRange }) => {
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
  
  // Process stands data to extract summary data
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
        <h3>Time Period Summary</h3>
        
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


