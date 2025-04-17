import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Set chart theme for dark mode
ChartJS.defaults.color = '#e0e0e0';
ChartJS.defaults.borderColor = '#444';
ChartJS.defaults.scale.grid.color = '#333';

const ConnectionTrends = ({ chartData }) => {
  const [activeTab, setActiveTab] = useState('pre'); // 'pre' or 'post'

  // Format time in minutes and seconds for tooltip and display
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if we have the necessary data
  const hasData = chartData && 
    chartData.preConnectionControl && 
    chartData.preConnectionManual && 
    chartData.postConnectionControl && 
    chartData.postConnectionManual;

  if (!hasData) {
    return (
      <div className="connection-trends-panel">
        <div className="panel-header">
          <h3>Connection Control vs Manual Time Trends</h3>
        </div>
        <div className="empty-chart-message">
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  // Create chart options for pre-connection tab
  const getPreConnectionOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pre-Connection Control vs Manual Time'
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const seconds = context.raw;
              return `${context.dataset.label}: ${formatTime(seconds)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (mins)'
          },
          ticks: {
            callback: function(value) {
              return formatTime(value);
            }
          },
          stacked: true
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          },
          stacked: true
        }
      }
    };
  };

  // Create chart options for post-connection tab
  const getPostConnectionOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Post-Connection Control vs Manual Time'
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const seconds = context.raw;
              return `${context.dataset.label}: ${formatTime(seconds)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (mins)'
          },
          ticks: {
            callback: function(value) {
              return formatTime(value);
            }
          },
          stacked: true
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          },
          stacked: true
        }
      }
    };
  };

  // Create data config for pre-connection
  const createPreConnectionData = () => {
    return {
      labels: chartData.preConnectionControl.labels || [],
      datasets: [
        {
          label: 'Control',
          data: chartData.preConnectionControl.data || [],
          backgroundColor: 'rgba(52, 168, 83, 0.7)', // Green for control
          borderColor: 'rgba(52, 168, 83, 1)',
          borderWidth: 1
        },
        {
          label: 'Manual',
          data: chartData.preConnectionManual.data || [],
          backgroundColor: 'rgba(251, 188, 4, 0.7)', // Yellow for manual
          borderColor: 'rgba(251, 188, 4, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Create data config for post-connection
  const createPostConnectionData = () => {
    return {
      labels: chartData.postConnectionControl.labels || [],
      datasets: [
        {
          label: 'Control',
          data: chartData.postConnectionControl.data || [],
          backgroundColor: 'rgba(66, 133, 244, 0.7)', // Blue for control
          borderColor: 'rgba(66, 133, 244, 1)',
          borderWidth: 1
        },
        {
          label: 'Manual',
          data: chartData.postConnectionManual.data || [],
          backgroundColor: 'rgba(234, 67, 53, 0.7)', // Red for manual
          borderColor: 'rgba(234, 67, 53, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Add benchmark line at 4 minutes
  const addBenchmarkLine = (options) => {
    const benchmarkValue = 4 * 60; // 4 minutes in seconds
    
    const updatedOptions = {
      ...options,
      plugins: {
        ...options.plugins,
        annotation: {
          annotations: {
            benchmark: {
              type: 'line',
              yMin: benchmarkValue,
              yMax: benchmarkValue,
              borderColor: '#FF0000',
              borderWidth: 2,
              label: {
                display: true,
                content: 'Benchmark',
                position: 'start',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                font: {
                  size: 10
                }
              }
            }
          }
        }
      }
    };
    
    return updatedOptions;
  };

  const preConnectionOptions = addBenchmarkLine(getPreConnectionOptions());
  const postConnectionOptions = addBenchmarkLine(getPostConnectionOptions());

  return (
    <div className="connection-trends-panel">
      <div className="panel-header">
        <h3>Connection Control vs Manual Time Trends</h3>
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'pre' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre')}
          >
            Pre-Connection
          </button>
          <button 
            className={`tab-button ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            Post-Connection
          </button>
        </div>
      </div>

      <div className="chart-container" style={{ height: '400px' }}>
        {activeTab === 'pre' ? (
          <Bar 
            data={createPreConnectionData()} 
            options={preConnectionOptions} 
          />
        ) : (
          <Bar 
            data={createPostConnectionData()} 
            options={postConnectionOptions} 
          />
        )}
      </div>

      <div className="chart-legend">
        {activeTab === 'pre' ? (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(52, 168, 83, 0.7)' }}></div>
              <div className="legend-label">Pre-Connection Control</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(251, 188, 4, 0.7)' }}></div>
              <div className="legend-label">Pre-Connection Manual</div>
            </div>
          </>
        ) : (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(66, 133, 244, 0.7)' }}></div>
              <div className="legend-label">Post-Connection Control</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(234, 67, 53, 0.7)' }}></div>
              <div className="legend-label">Post-Connection Manual</div>
            </div>
          </>
        )}
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF0000' }}></div>
          <div className="legend-label">Benchmark (4 min)</div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTrends;