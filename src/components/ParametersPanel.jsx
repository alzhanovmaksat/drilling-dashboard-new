import React from 'react';

function ParametersPanel({ parameters }) {
  // First row of parameter cards - main drilling parameters
  const mainParameterCards = [
    { 
      label: "Weight on Bit", 
      value: parameters.wob, 
      unit: "klbs",
      formatFn: (val) => val.toFixed(2)
    },
    { 
      label: "Rate of Penetration", 
      value: parameters.rop, 
      unit: "ft/hr",
      formatFn: (val) => val.toFixed(1)
    },
    { 
      label: "Rotary Speed", 
      value: parameters.rpm, 
      unit: "RPM",
      formatFn: (val) => val.toFixed(1)
    }
  ];
  
  // Second row of parameter cards - additional parameters
  const secondaryParameterCards = [
    { 
      label: "Torque", 
      value: parameters.torque, 
      unit: "klbf-ft",
      formatFn: (val) => val.toFixed(3)
    },
    { 
      label: "Pump Pressure", 
      value: parameters.pumpPressure, 
      unit: "PSI",
      formatFn: (val) => val.toFixed(0)
    },
    { 
      label: "Flow Rate", 
      value: parameters.flowRate, 
      unit: "bbl/d",
      formatFn: (val) => val.toFixed(0)
    }
  ];
  
  // Third row of parameter cards - depth and time-based metrics
  const timeMetricCards = [
    { 
      label: "Current Depth", 
      value: parameters.depth, 
      unit: "ft",
      formatFn: (val) => val.toFixed(2)
    },
    { 
      label: "Rotary Drilling", 
      value: parameters.rotaryDuration, 
      unit: "hrs",
      formatFn: (val) => val.toFixed(1)
    },
    { 
      label: "Slide Drilling", 
      value: parameters.slideDuration, 
      unit: "hrs",
      formatFn: (val) => val.toFixed(1)
    }
  ];
  
  // Calculate efficiency percentage based on ROP
  const calculateEfficiency = () => {
    const maxExpectedRop = 150; // Set benchmark for 100% efficiency
    const efficiency = Math.min(100, Math.max(0, Math.round((parameters.rop / maxExpectedRop) * 100)));
    return efficiency;
  };
  
  // Get class for progress bar based on value
  const getProgressClass = (value, metric) => {
    if (metric === 'efficiency') {
      if (value > 80) return 'progress-fill high';
      if (value > 50) return 'progress-fill medium';
      return 'progress-fill low';
    } else if (metric === 'stickSlip') {
      if (value < 3) return 'progress-fill low-risk';
      if (value < 7) return 'progress-fill medium-risk';
      return 'progress-fill high-risk';
    } else if (metric === 'control') {
      if (value >= 80) return 'progress-fill high-control';
      if (value >= 50) return 'progress-fill medium-control';
      return 'progress-fill low-control';
    }
    return 'progress-fill';
  };
  
  // Get text description for stick-slip level
  const getStickSlipDescription = (level) => {
    if (level < 3) return 'Low';
    if (level < 7) return 'Moderate';
    return 'High';
  };
  
  // Get description for control drilling percentage
  const getControlDescription = (percent) => {
    if (percent >= 80) return 'Excellent';
    if (percent >= 60) return 'Good';
    if (percent >= 40) return 'Fair';
    return 'Poor';
  };
  
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
  
  return (
    <div className="parameters-panel">
      <div className="panel-header">
        <h3>Current Drilling Parameters</h3>
      </div>
      
      {/* Main drilling parameters */}
      <div className="parameter-cards">
        {mainParameterCards.map((card, index) => (
          <div key={`main-${index}`} className="parameter-card">
            <div className="parameter-label">{card.label}</div>
            <div className="parameter-value">
              {typeof card.value === 'number' && !isNaN(card.value) 
                ? (card.formatFn ? card.formatFn(card.value) : card.value) 
                : '0'}
            </div>
            <div className="parameter-unit">{card.unit}</div>
          </div>
        ))}
      </div>
      
      {/* Secondary parameters */}
      <div className="parameter-cards">
        {secondaryParameterCards.map((card, index) => (
          <div key={`secondary-${index}`} className="parameter-card">
            <div className="parameter-label">{card.label}</div>
            <div className="parameter-value">
              {typeof card.value === 'number' && !isNaN(card.value) 
                ? (card.formatFn ? card.formatFn(card.value) : card.value) 
                : '0'}
            </div>
            <div className="parameter-unit">{card.unit}</div>
          </div>
        ))}
      </div>
      
      {/* Depth and time metrics */}
      <div className="parameter-cards">
        {timeMetricCards.map((card, index) => (
          <div key={`time-${index}`} className="parameter-card">
            <div className="parameter-label">{card.label}</div>
            <div className="parameter-value">
              {typeof card.value === 'number' && !isNaN(card.value) 
                ? (card.formatFn ? card.formatFn(card.value) : card.value) 
                : '0'}
            </div>
            <div className="parameter-unit">{card.unit}</div>
          </div>
        ))}
      </div>
      
      {/* Connection time metrics */}
      <div className="panel-header" style={{ marginTop: '10px' }}>
        <h3>Connection Time Metrics</h3>
      </div>
      
      <div className="connection-metrics">
        {/* Connection Time */}
        <div className="connection-metric">
          <div className="metric-label">Connection Time</div>
          <div className="connection-value">
            {formatTime(parameters.connectionTime || 0)}
          </div>
          <div className="progress-text">
            Total time for connection operations
          </div>
        </div>
        
        {/* Pre-Connection Time */}
        <div className="connection-metric">
          <div className="metric-label">Pre-Connection</div>
          <div className="connection-value">
            {formatTime(parameters.preConnectionTime || 0)}
          </div>
          
          {/* Progress bars for control vs manual */}
          <div className="connection-progress">
            <div 
              className="connection-progress-control" 
              style={{ 
                width: `${calculateControlPercent(
                  parameters.preConnectionInControl || 0, 
                  parameters.preConnectionOutControl || 0
                )}%` 
              }}
            ></div>
            <div 
              className="connection-progress-manual" 
              style={{ 
                width: `${100 - calculateControlPercent(
                  parameters.preConnectionInControl || 0, 
                  parameters.preConnectionOutControl || 0
                )}%` 
              }}
            ></div>
          </div>
          
          <div className="connection-breakdown">
            <span className="control-value">
              Control: {formatTime(parameters.preConnectionInControl || 0)}
            </span>
            <span className="manual-value">
              Manual: {formatTime(parameters.preConnectionOutControl || 0)}
            </span>
          </div>
        </div>
        
        {/* Post-Connection Time */}
        <div className="connection-metric">
          <div className="metric-label">Post-Connection</div>
          <div className="connection-value">
            {formatTime(parameters.postConnectionTime || 0)}
          </div>
          
          {/* Progress bars for control vs manual */}
          <div className="connection-progress">
            <div 
              className="connection-progress-control" 
              style={{ 
                width: `${calculateControlPercent(
                  parameters.postConnectionInControl || 0, 
                  parameters.postConnectionOutControl || 0
                )}%` 
              }}
            ></div>
            <div 
              className="connection-progress-manual" 
              style={{ 
                width: `${100 - calculateControlPercent(
                  parameters.postConnectionInControl || 0, 
                  parameters.postConnectionOutControl || 0
                )}%` 
              }}
            ></div>
          </div>
          
          <div className="connection-breakdown">
            <span className="control-value">
              Control: {formatTime(parameters.postConnectionInControl || 0)}
            </span>
            <span className="manual-value">
              Manual: {formatTime(parameters.postConnectionOutControl || 0)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Efficiency metrics */}
      <div className="panel-header" style={{ marginTop: '10px' }}>
        <h3>Efficiency Metrics</h3>
      </div>
      
      <div className="efficiency-metrics">
        <div className="efficiency-metric">
          <div className="metric-label">Drilling Efficiency</div>
          <div className="metric-value">
            <div className="progress-bar">
              <div 
                className={getProgressClass(calculateEfficiency(), 'efficiency')}
                style={{ width: `${calculateEfficiency()}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {calculateEfficiency()}% of Target ROP
            </div>
          </div>
        </div>
        
        <div className="efficiency-metric">
          <div className="metric-label">Stick-Slip Level</div>
          <div className="metric-value">
            <div className="progress-bar">
              <div 
                className={getProgressClass(parameters.stickSlipLevel, 'stickSlip')}
                style={{ width: `${parameters.stickSlipLevel * 10}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {getStickSlipDescription(parameters.stickSlipLevel)}
            </div>
          </div>
        </div>
        
        {/* Control Drilling Percentage metric */}
        <div className="efficiency-metric">
          <div className="metric-label">Control Drilling</div>
          <div className="metric-value">
            <div className="progress-bar">
              <div 
                className={getProgressClass(parameters.controlDrillingPercent, 'control')}
                style={{ width: `${parameters.controlDrillingPercent}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {parameters.controlDrillingPercent}% - {getControlDescription(parameters.controlDrillingPercent)}
            </div>
          </div>
        </div>
        
        {/* Drilling Rate Stability */}
        <div className="efficiency-metric">
          <div className="metric-label">Rate Stability</div>
          <div className="metric-value">
            <div className="progress-bar">
              <div 
                className={getProgressClass(parameters.rateStability || 70, 'control')}
                style={{ width: `${parameters.rateStability || 70}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {parameters.rateStability || 70}% Stability
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParametersPanel;