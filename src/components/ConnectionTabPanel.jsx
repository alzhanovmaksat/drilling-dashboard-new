
import React, { useState, useEffect, useRef } from 'react';
import 'chart.js/auto';
import 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';

function ConnectionTabPanel({ chartData }) {
  const [activeTab, setActiveTab] = useState('pre'); // 'pre' or 'post'
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Extract depth values from stand numbers for x-axis
  const getDepthLabels = (labels) => {
    if (!labels || labels.length === 0) return [];
    
    return labels.map(label => {
      const match = label.match(/Stand (\d+)/);
      if (match && match[1]) {
        const standNumber = parseInt(match[1]);
        return `${(6500 + standNumber * 30).toFixed(0)}`;
      }
      return label;
    });
  };
  
  // Create chart data for the active tab
  const createChartData = () => {
    const isPreTab = activeTab === 'pre';
    
    // Select data based on active tab
    const controlData = isPreTab 
      ? chartData?.preConnectionControl 
      : chartData?.postConnectionControl;
      
    if (!controlData || !controlData.data || controlData.data.length === 0) {
      // Fallback to sample data if no real data is available
      const sampleLabels = Array.from({ length: 15 }, (_, i) => `${6579 + i * 30}`);
      const sampleData = isPreTab
        ? [510, 480, 450, 350, 370, 310, 260, 280, 320, 300, 270, 250, 310, 290, 280]
        : [280, 320, 300, 270, 300, 250, 220, 240, 200, 210, 190, 200, 180, 200, 190];
        
      return {
        labels: sampleLabels,
        datasets: [
          {
            label: isPreTab ? 'Pre Connection' : 'Post Connection',
            data: sampleData,
            backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 1,
            barPercentage: 0.8,
            categoryPercentage: 0.9
          },
          {
            label: 'Benchmark',
            type: 'line',
            data: Array(sampleLabels.length).fill(240), // 4 minutes
            borderColor: '#FF0000',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      };
    }
    
    // Use actual data
    const depthLabels = getDepthLabels(controlData.labels);
    
    return {
      labels: depthLabels,
      datasets: [
        {
          label: isPreTab ? 'Pre Connection' : 'Post Connection',
          data: controlData.data,
          backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Benchmark',
          type: 'line',
          data: Array(controlData.data.length).fill(240), // 4 minutes
          borderColor: '#FF0000',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    };
  };
  
  // Create chart options
  const createChartOptions = () => {
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
              
              const seconds = context.raw;
              return `${context.dataset.label}: ${formatTime(seconds)}`;
            }
          }
        },
        annotation: {
          annotations: {
            benchmark: {
              type: 'line',
              yMin: 240, // 4 minutes
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
      data: createChartData(),
      options: createChartOptions()
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [activeTab, chartData]);
  
  // Calculate connection times for display
  const weightToWeightTime = activeTab === 'pre' ? '1.83 min' : '2.72 min';
  
  return (
    <div className="connection-tab-panel">
      <div className="tab-header">
        <div className="connection-subtabs">
          <button 
            className={`subtab-button ${activeTab === 'pre' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre')}
          >
            Pre Connection
          </button>
          <button 
            className={`subtab-button ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            Post Connection
          </button>
        </div>
        
        <div className="connection-summary">
          <div className="summary-item">
            <span className="summary-label">Weight to weight</span>
            <span className="summary-value">{weightToWeightTime}</span>
          </div>
        </div>
      </div>
      
      <div className="chart-container" style={{ height: '400px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
      
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgba(76, 175, 80, 0.7)' }}></div>
          <div className="legend-label">
            {activeTab === 'pre' ? 'Pre Connection' : 'Post Connection'}
          </div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF0000' }}></div>
          <div className="legend-label">Benchmark (4 min)</div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionTabPanel;