import React from 'react';

function StandHistory({ stands, onStandSelect }) {
  if (!stands || stands.length === 0) {
    return (
      <div className="sidebar">
        <h2>Stand History</h2>
        <p className="no-data">No stand data available</p>
      </div>
    );
  }
  
  // Helper function to determine stand performance indicators
  const getStandIndicators = (stand) => {
    const indicators = [];
    
    // High ROP performance (greater than 100 ft/hr)
    if (stand.rop > 100) {
      indicators.push({
        type: 'high-performance',
        title: 'High ROP',
        icon: 'triangle'
      });
    }
    
    // High WOB (greater than 15 klbs)
    if (stand.wob > 15) {
      indicators.push({
        type: 'high-wob',
        title: 'High WOB',
        icon: 'circle'
      });
    }
    
    // Low ROP (less than 50 ft/hr)
    if (stand.rop < 50 && stand.rop > 0) {
      indicators.push({
        type: 'low-performance',
        title: 'Low ROP',
        icon: 'triangle-down'
      });
    }
    
    // Distance drilled indicator (greater than 90 ft)
    if (stand.distanceDrilled > 90) {
      indicators.push({
        type: 'long-section',
        title: 'Long Section',
        icon: 'square'
      });
    }
    
    // High control drilling percentage (greater than 80%)
    if (stand.controlDrillingPercent >= 80) {
      indicators.push({
        type: 'high-control',
        title: 'High Control %',
        icon: 'check'
      });
    }
    
    // Low control drilling percentage (less than 40%)
    if (stand.controlDrillingPercent < 40 && stand.controlDrillingPercent > 0) {
      indicators.push({
        type: 'low-control',
        title: 'Low Control %',
        icon: 'warning'
      });
    }
    
    return indicators;
  };
  
  // Render appropriate icon for each indicator
  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'triangle':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5L5 19H19L12 5Z" fill="currentColor"/>
          </svg>
        );
      case 'circle':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="7" fill="currentColor"/>
          </svg>
        );
      case 'triangle-down':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19L5 5H19L12 19Z" fill="currentColor"/>
          </svg>
        );
      case 'square':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
          </svg>
        );
      case 'check':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Helper function to get color class based on control percentage
  const getControlPercentClass = (percent) => {
    if (percent >= 80) return "high-control-percent";
    if (percent >= 60) return "medium-control-percent";
    if (percent >= 40) return "low-control-percent";
    return "very-low-control-percent";
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Stand History</h2>
        <p className="total-stands">Total Stands: {stands.length}</p>
      </div>
      
      <ul className="stand-list">
        {stands.map(stand => (
          <li 
            key={stand.id}
            className={`stand-item ${stand.isActive ? 'active' : ''} ${stand.standType === 'Drilling' ? 'drilling' : 'other'}`}
            onClick={() => onStandSelect(stand.id)}
          >
            <div className="stand-header">
              <span className="stand-title">{stand.title}</span>
              <span className="stand-time">{stand.timeRange}</span>
            </div>
            <div className="stand-details">
              <div className="stand-detail">
                <span className="stand-detail-label">Depth:</span>
                <span className="stand-detail-value">
                  {typeof stand.depth === 'number' 
                    ? stand.depth.toFixed(2) + ' ft' 
                    : 'N/A'}
                </span>
              </div>
              <div className="stand-detail">
                <span className="stand-detail-label">ROP:</span>
                <span className="stand-detail-value">
                  {typeof stand.rop === 'number' 
                    ? stand.rop.toFixed(1) + ' ft/hr' 
                    : 'N/A'}
                </span>
              </div>
              <div className="stand-detail">
                <span className="stand-detail-label">WOB:</span>
                <span className="stand-detail-value">
                  {typeof stand.wob === 'number' 
                    ? stand.wob.toFixed(2) + ' klbs' 
                    : 'N/A'}
                </span>
              </div>
              <div className="stand-detail">
                <span className="stand-detail-label">RPM:</span>
                <span className="stand-detail-value">
                  {typeof stand.rpm === 'number' 
                    ? stand.rpm.toFixed(1)
                    : 'N/A'}
                </span>
              </div>
              
              {/* Control Drilling Percentage */}
              <div className="stand-detail">
                <span className="stand-detail-label">Control %:</span>
                <span className={`stand-detail-value ${getControlPercentClass(stand.controlDrillingPercent)}`}>
                  {typeof stand.controlDrillingPercent === 'number'
                    ? stand.controlDrillingPercent + '%'
                    : 'N/A'}
                </span>
              </div>
              
              {stand.distanceDrilled && (
                <div className="stand-detail">
                  <span className="stand-detail-label">Distance:</span>
                  <span className="stand-detail-value">
                    {stand.distanceDrilled} ft
                  </span>
                </div>
              )}
            </div>
            
            <div className="stand-indicators">
              {getStandIndicators(stand).map((indicator, index) => (
                <span 
                  key={index} 
                  className={`indicator ${indicator.type}`} 
                  title={indicator.title}
                >
                  {renderIcon(indicator.icon)}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StandHistory;