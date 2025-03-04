import React from 'react';

function ConnectionKPI({ connectionData }) {
  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate control percentages
  const calculateControlPercent = (inControl, outControl) => {
    const total = inControl + outControl;
    if (total === 0) return 0;
    return Math.round((inControl / total) * 100);
  };
  
  // Get class for percentage
  const getPercentClass = (percent) => {
    if (percent >= 80) return "high";
    if (percent >= 60) return "medium";
    if (percent >= 40) return "low";
    return "very-low";
  };
  
  // Calculate stats
  const preConnectionTime = connectionData.preConnectionTime || 0;
  const postConnectionTime = connectionData.postConnectionTime || 0;
  const totalConnectionTime = connectionData.connectionTime || 0;
  
  const preControlTime = connectionData.preConnectionInControl || 0;
  const preManualTime = connectionData.preConnectionOutControl || 0;
  const postControlTime = connectionData.postConnectionInControl || 0;
  const postManualTime = connectionData.postConnectionOutControl || 0;
  
  const preControlPercent = calculateControlPercent(preControlTime, preManualTime);
  const postControlPercent = calculateControlPercent(postControlTime, postManualTime);
  const totalControlPercent = calculateControlPercent(
    preControlTime + postControlTime, 
    preManualTime + postManualTime
  );
  
  // Previous stand data for trend indicators (in a real app, this would come from historical data)
  // For demo purposes, we'll just show random trends
  const getTrendIndicator = () => {
    const trends = ['up', 'down', 'neutral'];
    const randomIndex = Math.floor(Math.random() * 3);
    return trends[randomIndex];
  };
  
  const preTrend = getTrendIndicator();
  const postTrend = getTrendIndicator();
  const totalTrend = getTrendIndicator();
  
  // Render trend arrow
  const renderTrendArrow = (trend) => {
    if (trend === 'up') {
      return <span className="trend-arrow">↑</span>;
    } else if (trend === 'down') {
      return <span className="trend-arrow">↓</span>;
    }
    return <span className="trend-arrow">→</span>;
  };
  
  return (
    <div className="control-kpi-container">
      <div className="control-kpi-card">
        <div className="control-kpi-title">Pre-Connection</div>
        <div className="control-kpi-value">{formatTime(preConnectionTime)}</div>
        <div className="control-kpi-percentage">
          <div className={`control-percentage ${getPercentClass(preControlPercent)}`}>
            {preControlPercent}% Control
          </div>
          <div className={`trend-indicator ${preTrend}`}>
            {renderTrendArrow(preTrend)}
            {preTrend === 'up' ? '+5%' : preTrend === 'down' ? '-3%' : '0%'}
          </div>
        </div>
      </div>
      
      <div className="control-kpi-card">
        <div className="control-kpi-title">Post-Connection</div>
        <div className="control-kpi-value">{formatTime(postConnectionTime)}</div>
        <div className="control-kpi-percentage">
          <div className={`control-percentage ${getPercentClass(postControlPercent)}`}>
            {postControlPercent}% Control
          </div>
          <div className={`trend-indicator ${postTrend}`}>
            {renderTrendArrow(postTrend)}
            {postTrend === 'up' ? '+7%' : postTrend === 'down' ? '-4%' : '0%'}
          </div>
        </div>
      </div>
      
      <div className="control-kpi-card">
        <div className="control-kpi-title">Total Connection Time</div>
        <div className="control-kpi-value">{formatTime(totalConnectionTime)}</div>
        <div className="control-kpi-percentage">
          <div className={`control-percentage ${getPercentClass(totalControlPercent)}`}>
            {totalControlPercent}% Control
          </div>
          <div className={`trend-indicator ${totalTrend}`}>
            {renderTrendArrow(totalTrend)}
            {totalTrend === 'up' ? '+4%' : totalTrend === 'down' ? '-2%' : '0%'}
          </div>
        </div>
      </div>
      
      <div className="control-kpi-card">
        <div className="control-kpi-title">Connection Efficiency</div>
        <div className="control-kpi-value">
          {Math.round(100 - (totalConnectionTime / (15 * 60)) * 100)}%
        </div>
        <div className="control-kpi-percentage">
          <div className="control-percentage medium">
            vs. 15:00 Benchmark
          </div>
        </div>
      </div>
      
      <div className="comparison-container" style={{ gridColumn: "1 / span 2" }}>
        <div className="comparison-title">Pre-Connection Breakdown</div>
        <div className="comparison-chart">
          <div className="comparison-label">Control vs Manual:</div>
          <div className="comparison-bar">
            <div 
              className="comparison-control" 
              style={{ width: `${preControlPercent}%` }}
            >
              {formatTime(preControlTime)}
            </div>
            <div 
              className="comparison-manual" 
              style={{ width: `${100 - preControlPercent}%` }}
            >
              {formatTime(preManualTime)}
            </div>
          </div>
        </div>
        
        <div className="comparison-title">Post-Connection Breakdown</div>
        <div className="comparison-chart">
          <div className="comparison-label">Control vs Manual:</div>
          <div className="comparison-bar">
            <div 
              className="comparison-control" 
              style={{ width: `${postControlPercent}%` }}
            >
              {formatTime(postControlTime)}
            </div>
            <div 
              className="comparison-manual" 
              style={{ width: `${100 - postControlPercent}%` }}
            >
              {formatTime(postManualTime)}
            </div>
          </div>
        </div>
        
        <div className="connection-average-line">
          <span className="average-label">Fleet Average: 12:30</span>
        </div>
      </div>
    </div>
  );
}

export default ConnectionKPI;