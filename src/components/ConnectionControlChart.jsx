
import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import 'chart.js/auto';
import 'chartjs-plugin-annotation';

function ConnectionControlChart({ chartData }) {
  const [activeTab, setActiveTab] = useState('pre'); // 'pre' or 'post'
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Format time in minutes and seconds for display
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Generate depth labels from stand labels
  const getDepthLabels = (labels) => {
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      return Array.from({ length: 15 }, (_, i) => `${6579 + i * 30}`); // Sample depth values
    }
    
    return labels.map(label => {
      const match = label.match(/Stand (\d+)/);
      if (match && match[1]) {
        const standNumber = parseInt(match[1]);
        return `${(6500 + standNumber * 30).toFixed(0)}`;
      }
      return label;
    });
  };
  
  // Generate chart data for the current tab
  const getChartData = () => {
    // Select the appropriate data based on the active tab
    const sourceData = activeTab === 'pre' 
      ? chartData?.preConnectionControl 
      : chartData?.postConnectionControl;
      
    // Generate depth labels for the x-axis
    const depthLabels = getDepthLabels(sourceData?.labels);
    
    // If no real data is available, use sample data
    if (!sourceData || !sourceData.data || sourceData.data.length === 0) {
      const sampleData = activeTab === 'pre'
        ? [510, 480, 450, 350, 370, 310, 260, 280, 320, 300, 270, 250, 310, 290, 280]
        : [280, 320, 300, 270, 300, 250, 220, 240, 200, 210, 190, 200, 180, 200, 190];
        
      return {
        labels: depthLabels,
        datasets: [
          {
            label: activeTab === 'pre' ? 'Pre Connection' : 'Post Connection',
            data: sampleData,
            backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green for connection bars
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 1
          },
          {
            label: 'Benchmark',
            type: 'line',
            data: Array(depthLabels.length).fill(240), // 4 minutes in seconds
            borderColor: '#FF0000',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      };
    }
    
    // Use the actual data
    return {
      labels: depthLabels,
      datasets: [
        {
          label: activeTab === 'pre' ? 'Pre Connection' : 'Post Connection',
          data: sourceData.data,
          backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green for connection bars
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: 'Benchmark',
          type: 'line',
          data: Array(sourceData.data.length).fill(240), // 4 minutes in seconds
          borderColor: '#FF0000',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    };
  };
  
  // Chart options
  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: activeTab === 'pre' 
            ? 'Pre Connection Control vs Manual' 
            : 'Post Connection Control vs Manual',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              if (context.dataset.label === 'Benchmark') {
                return 'Benchmark: 4:00';
              }
              
              const seconds = context.parsed.y;
              return `${context.dataset.label}: ${formatTime(seconds)}`;
            }
          }
        },
        annotation: {
          annotations: {
            benchmark: {
              type: 'line',
              yMin: 240, // 4 minutes in seconds
              yMax: 240,
              borderColor: '#FF0000',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                display: true,
                content: 'Benchmark (4 min)',
                position: 'start',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                font: {
                  size: 10
                }
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Duration (min)'
          },
          ticks: {
            callback: function(value) {
              return formatTime(value);
            },
            stepSize: 60
          }
        },
        x: {
          title: {
            display: true,
            text: 'End Depth (ft)'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    };
  };

  // Initialize and update chart when tab changes or data updates
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: getChartData(),
      options: getChartOptions()
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [activeTab, chartData]);
  
  // Weight to weight time display
  const weightToWeightTime = activeTab === 'pre' ? '1.83 min' : '2.72 min';
  
  return (
    <div className="connection-control-chart">
      <div className="connection-tabs" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`connection-tab ${activeTab === 'pre' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              background: activeTab === 'pre' ? '#2c71d1' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('pre')}
          >
            Pre Connection
          </button>
          <button 
            className={`connection-tab ${activeTab === 'post' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              background: activeTab === 'post' ? '#2c71d1' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('post')}
          >
            Post Connection
          </button>
        </div>
        
        <div className="weight-to-weight" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginRight: '15px' 
        }}>
          <span style={{ fontWeight: 'bold', marginRight: '5px' }}>Weight to weight:</span>
          <span>{weightToWeightTime}</span>
        </div>
      </div>
      
      <div className="chart-container" style={{ height: '400px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
      
      <div className="chart-legend" style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '15px',
        padding: '10px',
        borderTop: '1px solid #444'
      }}>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="legend-color" style={{ 
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            width: '15px',
            height: '15px',
            marginRight: '5px'
          }}></div>
          <div className="legend-label">
            {activeTab === 'pre' ? 'Pre Connection' : 'Post Connection'}
          </div>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="legend-color" style={{ 
            backgroundColor: '#FF0000',
            width: '15px',
            height: '15px',
            marginRight: '5px'
          }}></div>
          <div className="legend-label">Benchmark (4 min)</div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionControlChart;