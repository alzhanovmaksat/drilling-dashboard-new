import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const OpsLimitsChart = ({ stands }) => {
  const [viewMode, setViewMode] = useState('all'); // 'all', 'recent10', 'recent20'
  
  const getFilteredStands = () => {
    if (!stands || stands.length === 0) return [];
    
    if (viewMode === 'recent10') {
      return stands.slice(-10);
    } else if (viewMode === 'recent20') {
      return stands.slice(-20);
    }
    
    return stands;
  };
  
  const getChartData = () => {
    const filteredStands = getFilteredStands();
    
    return filteredStands.map(stand => ({
      name: `Stand ${stand.id}`,
      rop: stand.opsLimitRopMaxCount || 0,
      wob: stand.opsLimitWobMaxCount || 0,
      torque: stand.opsLimitTorqueMaxCount || 0,
      rpm: stand.opsLimitRpmMaxCount || 0,
      diffP: stand.opsLimitDiffPMaxCount || 0
    }));
  };
  
  // Calculate total ops limits for the KPI panel
  const calculateTotalLimits = () => {
    const allStands = stands || [];
    
    return {
      rop: allStands.reduce((sum, stand) => sum + (stand.opsLimitRopMaxCount || 0), 0),
      wob: allStands.reduce((sum, stand) => sum + (stand.opsLimitWobMaxCount || 0), 0),
      torque: allStands.reduce((sum, stand) => sum + (stand.opsLimitTorqueMaxCount || 0), 0),
      rpm: allStands.reduce((sum, stand) => sum + (stand.opsLimitRpmMaxCount || 0), 0),
      diffP: allStands.reduce((sum, stand) => sum + (stand.opsLimitDiffPMaxCount || 0), 0)
    };
  };
  
  const totals = calculateTotalLimits();
  
  return (
    <div className="ops-limits-chart">
      <div className="panel-header">
        <h3>Operational Limits Analysis</h3>
        
        <div className="view-controls">
          <button 
            className={`view-button ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All Stands
          </button>
          <button 
            className={`view-button ${viewMode === 'recent10' ? 'active' : ''}`}
            onClick={() => setViewMode('recent10')}
          >
            Recent 10
          </button>
          <button 
            className={`view-button ${viewMode === 'recent20' ? 'active' : ''}`}
            onClick={() => setViewMode('recent20')}
          >
            Recent 20
          </button>
        </div>
      </div>
      
      <div className="limits-summary">
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">ROP Limits</div>
            <div className="summary-value">{totals.rop}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">WOB Limits</div>
            <div className="summary-value">{totals.wob}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Torque Limits</div>
            <div className="summary-value">{totals.torque}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">RPM Limits</div>
            <div className="summary-value">{totals.rpm}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">DiffP Limits</div>
            <div className="summary-value">{totals.diffP}</div>
          </div>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={getChartData()}
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
            <Bar dataKey="rop" name="ROP Max Limits" fill="#1a73e8" />
            <Bar dataKey="wob" name="WOB Max Limits" fill="#34a853" />
            <Bar dataKey="torque" name="Torque Max Limits" fill="#fbbc04" />
            <Bar dataKey="rpm" name="RPM Max Limits" fill="#ea4335" />
            <Bar dataKey="diffP" name="DiffP Max Limits" fill="#9334e8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <style jsx>{`
        .ops-limits-chart {
          background-color: #000;
          color: #fff;
          padding: 15px;
          border: 1px solid #333;
          border-radius: 4px;
          margin-top: 15px;
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
        
        .view-controls {
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
          border-radius: 3px;
        }
        
        .view-button.active {
          background-color: #1a73e8;
          border-color: #1a73e8;
        }
        
        .limits-summary {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
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
        
        .chart-wrapper {
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 10px;
        }
        
        @media (max-width: 992px) {
          .summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .panel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 576px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default OpsLimitsChart;