import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const TimeBreakdownAnalysis = ({ stands }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeViewMode, setTimeViewMode] = useState('24h');
  const [dateViewData, setDateViewData] = useState({
    standsCount: 0,
    totalFootage: 0,
    avgControlPercent: 0,
    breakdowns: {
      '6h': [],
      '12h': [],
      '24h': []
    }
  });
  
  // Process stands data based on selected date and time view
  useEffect(() => {
    if (!stands || stands.length === 0) return;
    
    // Get the selected date at beginning of day
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    // Get end of selected date
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Filter stands for the selected date
    const dayStands = stands.filter(stand => {
      if (!stand.startTime) return false;
      const standDate = new Date(stand.startTime);
      return standDate >= selectedDateObj && standDate <= endDate;
    });
    
    // Process the day's data
    const totalDistance = dayStands.reduce((sum, stand) => sum + (stand.distanceDrilled || 0), 0);
    const weightedControlSum = dayStands.reduce((sum, stand) => 
      sum + ((stand.controlDrillingPercent || 0) * (stand.distanceDrilled || 0)), 0);
    const avgControl = totalDistance > 0 ? weightedControlSum / totalDistance : 0;
    
    // Create time breakdowns
    const timeBreakdowns = {
      '6h': createTimeIntervals(selectedDateObj, 6, 4),
      '12h': createTimeIntervals(selectedDateObj, 12, 2),
      '24h': createTimeIntervals(selectedDateObj, 24, 1)
    };
    
    // Analyze each time period
    Object.keys(timeBreakdowns).forEach(period => {
      timeBreakdowns[period] = timeBreakdowns[period].map(interval => {
        const intervalStands = dayStands.filter(stand => {
          if (!stand.startTime) return false;
          const standDate = new Date(stand.startTime);
          return standDate >= interval.start && standDate < interval.end;
        });
        
        return {
          ...interval,
          standsCount: intervalStands.length,
          totalFootage: intervalStands.reduce((sum, stand) => sum + (stand.distanceDrilled || 0), 0),
          avgControlPercent: calculateWeightedAverage(intervalStands, 'controlDrillingPercent', 'distanceDrilled'),
          preConnControlPercent: calculateControlPercent(
            intervalStands.reduce((sum, stand) => sum + (stand.preConnectionInControl || 0), 0),
            intervalStands.reduce((sum, stand) => sum + (stand.preConnectionOutControl || 0), 0)
          ),
          postConnControlPercent: calculateControlPercent(
            intervalStands.reduce((sum, stand) => sum + (stand.postConnectionInControl || 0), 0),
            intervalStands.reduce((sum, stand) => sum + (stand.postConnectionOutControl || 0), 0)
          ),
          totalPreConnControl: intervalStands.reduce((sum, stand) => sum + (stand.preConnectionInControl || 0), 0),
          totalPreConnManual: intervalStands.reduce((sum, stand) => sum + (stand.preConnectionOutControl || 0), 0),
          totalPostConnControl: intervalStands.reduce((sum, stand) => sum + (stand.postConnectionInControl || 0), 0),
          totalPostConnManual: intervalStands.reduce((sum, stand) => sum + (stand.postConnectionOutControl || 0), 0),
          opsLimits: {
            rop: intervalStands.reduce((sum, stand) => sum + (stand.opsLimitRopMaxCount || 0), 0),
            wob: intervalStands.reduce((sum, stand) => sum + (stand.opsLimitWobMaxCount || 0), 0),
            torque: intervalStands.reduce((sum, stand) => sum + (stand.opsLimitTorqueMaxCount || 0), 0),
            rpm: intervalStands.reduce((sum, stand) => sum + (stand.opsLimitRpmMaxCount || 0), 0),
            diffP: intervalStands.reduce((sum, stand) => sum + (stand.opsLimitDiffPMaxCount || 0), 0)
          }
        };
      });
    });
    
    setDateViewData({
      standsCount: dayStands.length,
      totalFootage: totalDistance,
      avgControlPercent: avgControl,
      totalPreConnectionControl: dayStands.reduce((sum, stand) => sum + (stand.preConnectionInControl || 0), 0),
      totalPreConnectionManual: dayStands.reduce((sum, stand) => sum + (stand.preConnectionOutControl || 0), 0),
      totalPostConnectionControl: dayStands.reduce((sum, stand) => sum + (stand.postConnectionInControl || 0), 0),
      totalPostConnectionManual: dayStands.reduce((sum, stand) => sum + (stand.postConnectionOutControl || 0), 0),
      breakdowns: timeBreakdowns
    });
  }, [stands, selectedDate]);
  
  // Helper to create time intervals for a day
  const createTimeIntervals = (baseDate, hourInterval, count) => {
    const intervals = [];
    
    for (let i = 0; i < count; i++) {
      const startTime = new Date(baseDate);
      startTime.setHours(startTime.getHours() + (i * hourInterval));
      
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + hourInterval);
      
      intervals.push({
        start: startTime,
        end: endTime,
        label: `${formatTime(startTime)} - ${formatTime(endTime)}`
      });
    }
    
    return intervals;
  };
  
  // Format time as HH:MM
  const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Format time in minutes and seconds
  const formatTimeMs = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate weighted average for values
  const calculateWeightedAverage = (items, valueKey, weightKey) => {
    const weightedSum = items.reduce((sum, item) => sum + ((item[valueKey] || 0) * (item[weightKey] || 0)), 0);
    const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 0), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };
  
  // Calculate control percentage
  const calculateControlPercent = (inControl, outControl) => {
    const total = inControl + outControl;
    return total > 0 ? (inControl / total) * 100 : 0;
  };
  
  // Get data for stands and footage chart
  const getStandsAndFootageData = () => {
    const data = dateViewData.breakdowns[timeViewMode] || [];
    
    return data.map(interval => ({
      name: interval.label,
      footage: interval.totalFootage,
      stands: interval.standsCount
    }));
  };
  
  // Get data for control pie chart
  const getControlPieData = () => {
    if (!dateViewData.breakdowns[timeViewMode] || dateViewData.breakdowns[timeViewMode].length === 0) {
      return [
        { name: "Control", value: 0 },
        { name: "Manual", value: 100 }
      ];
    }
    
    const selectedPeriod = dateViewData.breakdowns[timeViewMode][0] || { preConnControlPercent: 0 };
    
    return [
      { name: "Control", value: selectedPeriod.preConnControlPercent || 0 },
      { name: "Manual", value: 100 - (selectedPeriod.preConnControlPercent || 0) }
    ];
  };
  
  // Get data for ops limits chart
  const getOpsLimitsData = () => {
    const data = dateViewData.breakdowns[timeViewMode] || [];
    
    return data.map(interval => ({
      name: interval.label,
      rop: interval.opsLimits.rop,
      wob: interval.opsLimits.wob,
      torque: interval.opsLimits.torque,
      rpm: interval.opsLimits.rpm,
      diffP: interval.opsLimits.diffP
    }));
  };
  
  const COLORS = ['#34a853', '#fbbc04']; // Green for control, yellow for manual
  const LIMIT_COLORS = {
    rop: '#1a73e8',    // Blue
    wob: '#34a853',    // Green
    torque: '#fbbc04', // Yellow
    rpm: '#ea4335',    // Red
    diffP: '#9334e8'   // Purple
  };
  
  return (
    <div className="time-breakdown-analysis">
      <div className="panel-header">
        <h3>Time-Based Analysis</h3>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Date:</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-select"
            />
          </div>
          
          <div className="filter-group">
            <label>Time View:</label>
            <div className="button-group">
              <button 
                className={`view-button ${timeViewMode === '6h' ? 'active' : ''}`}
                onClick={() => setTimeViewMode('6h')}
              >
                6 Hour
              </button>
              <button 
                className={`view-button ${timeViewMode === '12h' ? 'active' : ''}`}
                onClick={() => setTimeViewMode('12h')}
              >
                12 Hour
              </button>
              <button 
                className={`view-button ${timeViewMode === '24h' ? 'active' : ''}`}
                onClick={() => setTimeViewMode('24h')}
              >
                24 Hour
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="summary-section">
        <div className="summary-header">
          <h4>Daily Summary - {new Date(selectedDate).toLocaleDateString()}</h4>
        </div>
        
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Total Stands</div>
            <div className="summary-value">{dateViewData.standsCount || 0}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Footage</div>
            <div className="summary-value">{(dateViewData.totalFootage || 0).toFixed(2)} ft</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Avg Control %</div>
            <div className="summary-value">{(dateViewData.avgControlPercent || 0).toFixed(2)}%</div>
          </div>
        </div>
      </div>
      
      <div className="connection-summary-section">
        <div className="summary-header">
          <h4>Connection Time Breakdown</h4>
        </div>
        
        <div className="connection-grid">
          <div className="connection-item">
            <div className="connection-label">Pre-Conn Control</div>
            <div className="connection-value">
              {formatTimeMs(dateViewData.totalPreConnectionControl || 0)}
            </div>
          </div>
          <div className="connection-item">
            <div className="connection-label">Pre-Conn Manual</div>
            <div className="connection-value">
              {formatTimeMs(dateViewData.totalPreConnectionManual || 0)}
            </div>
          </div>
          <div className="connection-item">
            <div className="connection-label">Post-Conn Control</div>
            <div className="connection-value">
              {formatTimeMs(dateViewData.totalPostConnectionControl || 0)}
            </div>
          </div>
          <div className="connection-item">
            <div className="connection-label">Post-Conn Manual</div>
            <div className="connection-value">
              {formatTimeMs(dateViewData.totalPostConnectionManual || 0)}
            </div>
          </div>
          
          <div className="connection-item wide">
            <div className="connection-label">Pre-Connection Control %</div>
            <div className="connection-value">
              {calculateControlPercent(
                dateViewData.totalPreConnectionControl || 0,
                dateViewData.totalPreConnectionManual || 0
              ).toFixed(2)}%
            </div>
          </div>
          <div className="connection-item wide">
            <div className="connection-label">Post-Connection Control %</div>
            <div className="connection-value">
              {calculateControlPercent(
                dateViewData.totalPostConnectionControl || 0,
                dateViewData.totalPostConnectionManual || 0
              ).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
      
      <div className="chart-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h4>Footage & Stands by Time Period</h4>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={getStandsAndFootageData()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#1a73e8" />
                <YAxis yAxisId="right" orientation="right" stroke="#34a853" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="footage" name="Footage (ft)" fill="#1a73e8" />
                <Bar yAxisId="right" dataKey="stands" name="Stands Count" fill="#34a853" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-header">
            <h4>Pre-Connection Control Percentage</h4>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getControlPieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getControlPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="ops-limits-chart">
        <div className="chart-header">
          <h4>Operational Limits by Time Period</h4>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={getOpsLimitsData()}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rop" name="ROP Limits" fill={LIMIT_COLORS.rop} />
              <Bar dataKey="wob" name="WOB Limits" fill={LIMIT_COLORS.wob} />
              <Bar dataKey="torque" name="Torque Limits" fill={LIMIT_COLORS.torque} />
              <Bar dataKey="rpm" name="RPM Limits" fill={LIMIT_COLORS.rpm} />
              <Bar dataKey="diffP" name="DiffP Limits" fill={LIMIT_COLORS.diffP} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="time-periods-table">
        <div className="table-header">
          <h4>Time Periods Breakdown</h4>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Time Period</th>
              <th>Stands</th>
              <th>Footage</th>
              <th>Control %</th>
              <th>Pre-Conn %</th>
              <th>Post-Conn %</th>
              <th>Ops Limits (ROP/WOB/TRQ/RPM/DP)</th>
            </tr>
          </thead>
          <tbody>
            {dateViewData.breakdowns[timeViewMode] && dateViewData.breakdowns[timeViewMode].map((interval, index) => (
              <tr key={index}>
                <td>{interval.label}</td>
                <td>{interval.standsCount}</td>
                <td>{interval.totalFootage.toFixed(2)} ft</td>
                <td>{interval.avgControlPercent.toFixed(2)}%</td>
                <td>{interval.preConnControlPercent.toFixed(2)}%</td>
                <td>{interval.postConnControlPercent.toFixed(2)}%</td>
                <td>
                  {interval.opsLimits.rop}/{interval.opsLimits.wob}/{interval.opsLimits.torque}/
                  {interval.opsLimits.rpm}/{interval.opsLimits.diffP}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <style jsx>{`
        .time-breakdown-analysis {
          background-color: #000;
          color: #fff;
          padding: 15px;
          border: 1px solid #333;
          border-radius: 4px;
          margin-bottom: 20px;
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
        
        .filter-controls {
          display: flex;
          gap: 15px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .date-select {
          background-color: #333;
          color: #fff;
          border: 1px solid #444;
          padding: 5px 8px;
          border-radius: 4px;
        }
        
        .button-group {
          display: flex;
          gap: 5px;
        }
        
        .view-button {
          background-color: #333;
          color: #fff;
          border: 1px solid #444;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .view-button.active {
          background-color: #1a73e8;
          border-color: #1a73e8;
        }
        
        .summary-section {
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
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .summary-item {
          background-color: #222;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }
        
        .summary-label {
          font-size: 0.8rem;
          color: #aaa;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 1.2rem;
          font-weight: 500;
        }
        
        .connection-summary-section {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .connection-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        
        .connection-item {
          background-color: #222;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
        }
        
        .connection-item.wide {
          grid-column: span 2;
        }
        
        .connection-label {
          font-size: 0.8rem;
          color: #aaa;
          margin-bottom: 5px;
        }
        
        .connection-value {
          font-size: 1.2rem;
          font-weight: 500;
        }
        
        .chart-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .chart-container {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
        }
        
        .ops-limits-chart {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .chart-header {
          border-bottom: 1px solid #333;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .chart-header h4 {
          margin: 0;
          font-size: 1rem;
        }
        
        .chart-wrapper {
          height: 300px;
        }
        
        .time-periods-table {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
        }
        
        .table-header {
          border-bottom: 1px solid #333;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        
        .data-table th,
        .data-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #333;
          text-align: left;
        }
        
        .data-table th {
          background-color: #222;
          font-weight: normal;
          color: #ccc;
        }
        
        @media (max-width: 992px) {
          .filter-controls {
            flex-direction: column;
          }
          
          .chart-grid {
            grid-template-columns: 1fr;
          }
          
          .connection-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          
          .connection-grid {
            grid-template-columns: 1fr;
          }
          
          .connection-item.wide {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default TimeBreakdownAnalysis;