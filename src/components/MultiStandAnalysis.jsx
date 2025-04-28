import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './MultiStandAnalysis.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function MultiStandAnalysis({ stands, onClose }) {
  const [selectedStands, setSelectedStands] = useState([]);
  const [quickSelectOption, setQuickSelectOption] = useState('custom');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [sortOption, setSortOption] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // Sorted stands for display
  const sortedStands = [...stands].sort((a, b) => {
    const aValue = a[sortOption];
    const bValue = b[sortOption];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    }
  });

  // Handle quick selection options
  useEffect(() => {
    if (quickSelectOption === 'custom') {
      // Keep current selection for custom option
      return;
    }
    
    let newSelection = [];
    
    if (quickSelectOption === 'latest5') {
      // Get the 5 most recent stands
      newSelection = [...stands]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5)
        .map(stand => stand.id);
    } else if (quickSelectOption === 'latest10') {
      // Get the 10 most recent stands
      newSelection = [...stands]
        .sort((a, b) => b.id - a.id)
        .slice(0, 10)
        .map(stand => stand.id);
    } else if (quickSelectOption === 'best5ROP') {
      // Get the 5 stands with highest ROP
      newSelection = [...stands]
        .sort((a, b) => b.rop - a.rop)
        .slice(0, 5)
        .map(stand => stand.id);
    } else if (quickSelectOption === 'best5Control') {
      // Get the 5 stands with highest control percentage
      newSelection = [...stands]
        .sort((a, b) => b.controlDrillingPercent - a.controlDrillingPercent)
        .slice(0, 5)
        .map(stand => stand.id);
    }
    
    setSelectedStands(newSelection);
  }, [quickSelectOption, stands]);

  // Calculate metrics for selected stands
  useEffect(() => {
    if (selectedStands.length === 0) {
      setAnalysisResults(null);
      return;
    }

    // Get the stand objects for selected IDs
    const selectedStandObjects = stands.filter(stand => 
      selectedStands.includes(stand.id)
    );

    // Calculate average metrics
    const avgRop = calculateAverage(selectedStandObjects, 'rop');
    const avgWob = calculateAverage(selectedStandObjects, 'wob');
    const avgRpm = calculateAverage(selectedStandObjects, 'rpm');
    const avgTorque = calculateAverage(selectedStandObjects, 'torque');
    const avgControlPercent = calculateAverage(selectedStandObjects, 'controlDrillingPercent');
    
    // Calculate average connection metrics
    const avgPreConnectionTime = calculateAverage(selectedStandObjects, 'preConnectionTime');
    const avgPostConnectionTime = calculateAverage(selectedStandObjects, 'postConnectionTime');
    const avgTotalConnectionTime = calculateAverage(selectedStandObjects, 'connectionTime');
    
    // Calculate average connection control percentages
    const avgPreConnectionControl = calculateControlPercent(
      selectedStandObjects.map(s => s.preConnectionInControl || 0),
      selectedStandObjects.map(s => s.preConnectionOutControl || 0)
    );
    
    const avgPostConnectionControl = calculateControlPercent(
      selectedStandObjects.map(s => s.postConnectionInControl || 0),
      selectedStandObjects.map(s => s.postConnectionOutControl || 0)
    );
    
    const avgTotalConnectionControl = calculateControlPercent(
      selectedStandObjects.map(s => (s.preConnectionInControl || 0) + (s.postConnectionInControl || 0)),
      selectedStandObjects.map(s => (s.preConnectionOutControl || 0) + (s.postConnectionOutControl || 0))
    );
    
    // Calculate total ops limits counts
    const totalRopLimits = calculateSum(selectedStandObjects, 'opsLimitRopMaxCount');
    const totalWobLimits = calculateSum(selectedStandObjects, 'opsLimitWobMaxCount');
    const totalTorqueLimits = calculateSum(selectedStandObjects, 'opsLimitTorqueMaxCount');
    const totalRpmLimits = calculateSum(selectedStandObjects, 'opsLimitRpmMaxCount');
    const totalDiffPLimits = calculateSum(selectedStandObjects, 'opsLimitDiffPMaxCount');
    
    // Calculate total distance drilled
    const totalDistance = calculateSum(selectedStandObjects, 'distanceDrilled');
    
    // Sort selected stands by ID for charts
    const sortedSelectedStands = [...selectedStandObjects].sort((a, b) => a.id - b.id);
    
    // Create combined chart data for ROP and Control %
    const combinedChartData = {
      labels: sortedSelectedStands.map(stand => `Stand ${stand.id}`),
      datasets: [
        {
          type: 'line',
          label: 'ROP (ft/hr)',
          data: sortedSelectedStands.map(stand => stand.rop || 0),
          borderColor: 'rgba(26, 115, 232, 0.8)',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(26, 115, 232, 0.8)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1',
        },
        {
          type: 'bar',
          label: 'Control %',
          data: sortedSelectedStands.map(stand => stand.controlDrillingPercent || 0),
          backgroundColor: 'rgba(52, 168, 83, 0.7)',
          borderColor: 'rgba(52, 168, 83, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        }
      ]
    };
    
    // Set analysis results
    setAnalysisResults({
      avgRop,
      avgWob,
      avgRpm,
      avgTorque,
      avgControlPercent,
      avgPreConnectionTime,
      avgPostConnectionTime,
      avgTotalConnectionTime,
      avgPreConnectionControl,
      avgPostConnectionControl,
      avgTotalConnectionControl,
      totalRopLimits,
      totalWobLimits,
      totalTorqueLimits,
      totalRpmLimits,
      totalDiffPLimits,
      totalDistance,
      combinedChartData,
      standCount: selectedStandObjects.length
    });
  }, [selectedStands, stands]);

  // Calculate average for a specific property across multiple stands
  const calculateAverage = (items, property) => {
    if (!items || items.length === 0) return 0;
    
    const validItems = items.filter(item => 
      item && item[property] !== undefined && item[property] !== null && !isNaN(item[property])
    );
    
    if (validItems.length === 0) return 0;
    
    const sum = validItems.reduce((total, item) => total + item[property], 0);
    return sum / validItems.length;
  };
  
  // Calculate sum for a specific property across multiple stands
  const calculateSum = (items, property) => {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => 
      total + (item && item[property] ? item[property] : 0), 0
    );
  };
  
  // Calculate control percentage from arrays of in-control and out-of-control times
  const calculateControlPercent = (inControlArray, outControlArray) => {
    if (!inControlArray || !outControlArray || inControlArray.length === 0) return 0;
    
    const totalInControl = inControlArray.reduce((sum, val) => sum + (val || 0), 0);
    const totalOutControl = outControlArray.reduce((sum, val) => sum + (val || 0), 0);
    
    const total = totalInControl + totalOutControl;
    if (total === 0) return 0;
    
    return (totalInControl / total) * 100;
  };

  // Format time value (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle a stand selection
  const toggleStandSelection = (standId) => {
    setSelectedStands(prev => {
      if (prev.includes(standId)) {
        return prev.filter(id => id !== standId);
      } else {
        return [...prev, standId];
      }
    });
    setQuickSelectOption('custom'); // Reset to custom when manually selecting
  };

  // Handle changing sort options
  const handleSortChange = (option) => {
    if (option === sortOption) {
      // Toggle direction if clicking the same option
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New option, reset to ascending
      setSortOption(option);
      setSortDirection('asc');
    }
  };

  // Combined chart options
  const combinedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'ROP and Control % Comparison',
        font: {
          size: 16
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (context.dataset.type === 'line') {
              return `${label}: ${context.raw.toFixed(1)} ft/hr`;
            } else {
              return `${label}: ${context.raw.toFixed(1)}%`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Stand Number',
          padding: {
            top: 10
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Control Drilling %',
          padding: {
            bottom: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        // Dynamically set the max value for ROP with some headroom
        max: function(context) {
          const values = context.chart.data.datasets[0].data;
          return Math.max(...values) * 1.2 || 100;
        },
        title: {
          display: true,
          text: 'ROP (ft/hr)',
          padding: {
            bottom: 10
          }
        },
        grid: {
          display: false // Don't show grid lines for the right axis
        }
      }
    }
  };

  return (
    <div className="multi-stand-analysis">
      <div className="multi-stand-header">
        <h2>Multi-Stand Analysis</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="quick-select-section">
        <label>Quick Select:</label>
        <select 
          value={quickSelectOption} 
          onChange={(e) => setQuickSelectOption(e.target.value)}
          className="quick-select-dropdown"
        >
          <option value="custom">Custom Selection</option>
          <option value="latest5">Latest 5 Stands</option>
          <option value="latest10">Latest 10 Stands</option>
          <option value="best5ROP">Top 5 by ROP</option>
          <option value="best5Control">Top 5 by Control %</option>
        </select>
        
        <div className="selection-count">
          {selectedStands.length} stands selected
        </div>
      </div>
      
      <div className="stand-selection-grid">
        <div className="stand-grid-header">
          <div 
            className={`stand-grid-column ${sortOption === 'id' ? 'sorted' : ''}`} 
            onClick={() => handleSortChange('id')}
          >
            Stand ID {sortOption === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`stand-grid-column ${sortOption === 'rop' ? 'sorted' : ''}`} 
            onClick={() => handleSortChange('rop')}
          >
            ROP (ft/hr) {sortOption === 'rop' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`stand-grid-column ${sortOption === 'controlDrillingPercent' ? 'sorted' : ''}`} 
            onClick={() => handleSortChange('controlDrillingPercent')}
          >
            Control % {sortOption === 'controlDrillingPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            className={`stand-grid-column ${sortOption === 'distanceDrilled' ? 'sorted' : ''}`} 
            onClick={() => handleSortChange('distanceDrilled')}
          >
            Distance (ft) {sortOption === 'distanceDrilled' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="stand-grid-column">Select</div>
        </div>
        
        <div className="stand-grid-rows">
          {sortedStands.map(stand => (
            <div 
              key={stand.id} 
              className={`stand-grid-row ${selectedStands.includes(stand.id) ? 'selected' : ''}`}
            >
              <div className="stand-grid-cell">{stand.id}</div>
              <div className="stand-grid-cell">{(stand.rop || 0).toFixed(2)}</div>
              <div className="stand-grid-cell">{(stand.controlDrillingPercent || 0).toFixed(1)}%</div>
              <div className="stand-grid-cell">{(stand.distanceDrilled || 0).toFixed(1)}</div>
              <div className="stand-grid-cell">
                <input 
                  type="checkbox" 
                  checked={selectedStands.includes(stand.id)} 
                  onChange={() => toggleStandSelection(stand.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {analysisResults && (
        <div className="analysis-results">
          <h3>Analysis Results for {analysisResults.standCount} Stands</h3>
          
          <div className="results-grid">
            <div className="results-section">
              <h4>Drilling Performance</h4>
              <div className="result-item">
                <div className="result-label">Average ROP:</div>
                <div className="result-value">{analysisResults.avgRop.toFixed(2)} ft/hr</div>
              </div>
              <div className="result-item">
                <div className="result-label">Average WOB:</div>
                <div className="result-value">{analysisResults.avgWob.toFixed(2)} klbs</div>
              </div>
              <div className="result-item">
                <div className="result-label">Average RPM:</div>
                <div className="result-value">{analysisResults.avgRpm.toFixed(1)}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Average Torque:</div>
                <div className="result-value">{analysisResults.avgTorque.toFixed(3)} klbf-ft</div>
              </div>
              <div className="result-item">
                <div className="result-label">Average Control %:</div>
                <div className="result-value">{analysisResults.avgControlPercent.toFixed(1)}%</div>
              </div>
              <div className="result-item">
                <div className="result-label">Total Distance:</div>
                <div className="result-value">{analysisResults.totalDistance.toFixed(1)} ft</div>
              </div>
            </div>
            
            <div className="results-section">
              <h4>Connection Performance</h4>
              <div className="result-item">
                <div className="result-label">Avg Pre-Connection:</div>
                <div className="result-value">{formatTime(analysisResults.avgPreConnectionTime)}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Avg Pre-Conn Control:</div>
                <div className="result-value">{analysisResults.avgPreConnectionControl.toFixed(1)}%</div>
              </div>
              <div className="result-item">
                <div className="result-label">Avg Post-Connection:</div>
                <div className="result-value">{formatTime(analysisResults.avgPostConnectionTime)}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Avg Post-Conn Control:</div>
                <div className="result-value">{analysisResults.avgPostConnectionControl.toFixed(1)}%</div>
              </div>
              <div className="result-item">
                <div className="result-label">Avg Total Connection:</div>
                <div className="result-value">{formatTime(analysisResults.avgTotalConnectionTime)}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Avg Total Conn Control:</div>
                <div className="result-value">{analysisResults.avgTotalConnectionControl.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="results-section">
              <h4>Operational Limits</h4>
              <div className="result-item">
                <div className="result-label">ROP Limits:</div>
                <div className="result-value">{analysisResults.totalRopLimits}</div>
              </div>
              <div className="result-item">
                <div className="result-label">WOB Limits:</div>
                <div className="result-value">{analysisResults.totalWobLimits}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Torque Limits:</div>
                <div className="result-value">{analysisResults.totalTorqueLimits}</div>
              </div>
              <div className="result-item">
                <div className="result-label">RPM Limits:</div>
                <div className="result-value">{analysisResults.totalRpmLimits}</div>
              </div>
              <div className="result-item">
                <div className="result-label">DiffP Limits:</div>
                <div className="result-value">{analysisResults.totalDiffPLimits}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Total Limits:</div>
                <div className="result-value">
                  {analysisResults.totalRopLimits + 
                   analysisResults.totalWobLimits + 
                   analysisResults.totalTorqueLimits + 
                   analysisResults.totalRpmLimits + 
                   analysisResults.totalDiffPLimits}
                </div>
              </div>
            </div>
          </div>
          
          {/* Single Combined Chart for ROP and Control % */}
          <div className="analysis-charts">
            <div className="chart-container" style={{ width: '100%', height: '400px' }}>
              <Chart 
                type="bar"
                data={analysisResults.combinedChartData}
                options={combinedChartOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiStandAnalysis;