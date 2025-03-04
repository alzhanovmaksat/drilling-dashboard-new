import React, { useState, useEffect } from 'react';

function Header({ wellId, currentStand, totalDepth, totalStands }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [drillingStatus, setDrillingStatus] = useState('DRILLING');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format date in a user-friendly way
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Format time in a user-friendly way
  const formatTime = (date) => {
    return date.toTimeString().slice(0, 8);
  };
  
  // Format the well ID for display (shortened if too long)
  const displayWellId = wellId ? 
    (wellId.length > 20 ? wellId.substring(0, 17) + '...' : wellId) : 
    'Not Available';
  
  return (
    <header className="dashboard-header">
      <div className="header-main">
        <h1>Drilling Operations Dashboard</h1>
        {wellId && <h2 className="well-id">Well ID: {displayWellId}</h2>}
      </div>
      
      <div className="header-info">
        <div className="header-stats">
          {currentStand > 0 && (
            <div className="header-stat">
              <span className="stat-label">Current Stand</span>
              <span className="stat-value">{currentStand}</span>
            </div>
          )}
          
          {totalStands > 0 && (
            <div className="header-stat">
              <span className="stat-label">Total Stands</span>
              <span className="stat-value">{totalStands}</span>
            </div>
          )}
          
          {totalDepth > 0 && (
            <div className="header-stat">
              <span className="stat-label">Total Depth</span>
              <span className="stat-value">{totalDepth.toFixed(2)} ft</span>
            </div>
          )}
        </div>
        
        <div className="time-panel">
          <div className="current-time">
            <span id="current-date">{formatDate(currentTime)}</span>
            <span id="current-time">{formatTime(currentTime)}</span>
          </div>
          <div className="operation-status">
            <span className="status-indicator status-active"></span>
            <span>{drillingStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;