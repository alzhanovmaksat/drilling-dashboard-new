import React, { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Chart, Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-plugin-annotation';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

// Set chart theme for dark mode
ChartJS.defaults.color = '#e0e0e0';
ChartJS.defaults.borderColor = '#444';
ChartJS.defaults.scale.grid.color = '#333';

// Define operational limits
const operationalLimits = {
  rop: {
    min: 50,
    max: 300,
    warning: 250,
    critical: 350
  },
  wob: {
    min: 3,
    max: 20,
    warning: 18,
    critical: 22
  },
  rpm: {
    min: 40,
    max: 90,
    warning: 85,
    critical: 95
  },
  torque: {
    min: 0.2,
    max: 4.0,
    warning: 3.5,
    critical: 4.5
  },
  flowRate: {
    min: 20000,
    max: 40000,
    warning: 38000,
    critical: 41000
  },
  connectionTime: {
    max: 600, // 10 minutes in seconds
    warning: 480, // 8 minutes
    target: 360 // 6 minutes
  }
};

function ChartPanel({ chartData }) {
  const [activeTab, setActiveTab] = useState('control'); // Default to control view
  const [showLimits, setShowLimits] = useState(true); // Toggle for showing/hiding limits
  
  // Check if chart data is available
  const hasData = chartData && 
    chartData.rop && 
    chartData.rop.data && 
    chartData.rop.data.length > 0;
  
  if (!hasData) {
    return (
      <div className="chart-panel">
        <div className="panel-header">
          <h3>Parameter Trends</h3>
        </div>
        <div className="empty-chart-message">
          <p>No chart data available</p>
        </div>
      </div>
    );
  }
  
  // Get min, max and average values for chart configs
  const getStats = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return { min: 0, max: 100, avg: 50 };
    
    const values = dataArray.filter(val => !isNaN(val) && val !== null);
    if (values.length === 0) return { min: 0, max: 100, avg: 50 };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    return { min, max, avg };
  };
  
  // Determine which charts to show based on active tab
  const getVisibleCharts = () => {
    switch (activeTab) {
      case 'combined':
        return [
          {
            data: {
              rop: chartData.rop,
              wob: chartData.wob,
              rpm: chartData.rpm,
              torque: chartData.torque
            },
            options: getCombinedChartOptions(),
            title: 'Combined Parameters',
            type: 'combined',
            limits: {
              rop: operationalLimits.rop,
              wob: operationalLimits.wob,
              rpm: operationalLimits.rpm,
              torque: operationalLimits.torque
            }
          },
          null // No second chart for combined view
        ];
      case 'rop-wob':
        return [
          {
            data: chartData.rop,
            options: getRopChartOptions(),
            color: '#1a73e8',
            title: 'Rate of Penetration (ft/hr)',
            type: 'line',
            limits: operationalLimits.rop
          },
          {
            data: chartData.wob,
            options: getWobChartOptions(),
            color: '#34a853',
            title: 'Weight on Bit (klbs)',
            type: 'line',
            limits: operationalLimits.wob
          }
        ];
      case 'rpm-torque':
        return [
          {
            data: chartData.rpm,
            options: getRpmChartOptions(),
            color: '#fbbc04',
            title: 'Rotary Speed (RPM)',
            type: 'line',
            limits: operationalLimits.rpm
          },
          {
            data: chartData.torque,
            options: getTorqueChartOptions(),
            color: '#ea4335',
            title: 'Torque (klbf-ft)',
            type: 'line',
            limits: operationalLimits.torque
          }
        ];
      case 'control':
        return [
          {
            data: {
              controlPercent: chartData.controlPercent,
              rop: chartData.rop
            },
            options: getControlRopComboChartOptions(),
            title: 'Control Drilling (%) with ROP',
            type: 'combo',
            limits: {
              rop: operationalLimits.rop
            }
          },
          null // No second chart for combo view
        ];
      case 'connection':
        return [
          {
            data: {
              connectionTime: chartData.connectionTime,
              preConnectionTime: { 
                labels: chartData.connectionTime ? chartData.connectionTime.labels : [],
                data: chartData.preConnectionTime ? chartData.preConnectionTime.data : []
              },
              postConnectionTime: { 
                labels: chartData.connectionTime ? chartData.connectionTime.labels : [],
                data: chartData.postConnectionTime ? chartData.postConnectionTime.data : []
              }
            },
            options: getConnectionTimeChartOptions(),
            title: 'Connection Time Breakdown',
            type: 'connection',
            limits: operationalLimits.connectionTime
          },
          null // No second chart for connection view
        ];
      case 'connection-control':
        return [
          {
            data: {
              labels: chartData.connectionTime ? chartData.connectionTime.labels : [],
              preConnectionControl: chartData.preConnectionControl ? chartData.preConnectionControl.data : [],
              preConnectionManual: chartData.preConnectionManual ? chartData.preConnectionManual.data : [],
              postConnectionControl: chartData.postConnectionControl ? chartData.postConnectionControl.data : [],
              postConnectionManual: chartData.postConnectionManual ? chartData.postConnectionManual.data : []
            },
            options: getConnectionControlOptions(),
            title: 'Connection Control vs Manual',
            type: 'connection-control'
            // No limits for connection control breakdown
          },
          null // No second chart
        ];
      default:
        return [
          {
            data: chartData.rop,
            options: getRopChartOptions(),
            color: '#1a73e8',
            title: 'Rate of Penetration (ft/hr)',
            type: 'line',
            limits: operationalLimits.rop
          },
          {
            data: chartData.wob,
            options: getWobChartOptions(),
            color: '#34a853',
            title: 'Weight on Bit (klbs)',
            type: 'line',
            limits: operationalLimits.wob
          }
        ];
    }
  };

  // Chart configuration for ROP with limits
  const getRopChartOptions = () => {
    const stats = getStats(chartData.rop.data);
    
    // Determine appropriate y-axis range
    const minValue = Math.min(stats.min, operationalLimits.rop.min);
    const maxValue = Math.max(stats.max, operationalLimits.rop.critical);
    const buffer = (maxValue - minValue) * 0.1;
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Rate of Penetration (ft/hr)'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `ROP: ${context.parsed.y.toFixed(1)} ft/hr`;
            }
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.max(0, minValue - buffer),
          max: maxValue + buffer,
          title: {
            display: true,
            text: 'ft/hr'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };

    // Add limit annotations if enabled
    if (showLimits) {
      options.plugins.annotation = {
        annotations: {
          maxLimit: {
            type: 'line',
            yMin: operationalLimits.rop.max,
            yMax: operationalLimits.rop.max,
            borderColor: '#ffcc00',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Max Limit',
              position: 'start',
              backgroundColor: 'rgba(255, 204, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          criticalLimit: {
            type: 'line',
            yMin: operationalLimits.rop.critical,
            yMax: operationalLimits.rop.critical,
            borderColor: '#ff0000',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Critical',
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          minLimit: {
            type: 'line',
            yMin: operationalLimits.rop.min,
            yMax: operationalLimits.rop.min,
            borderColor: '#3366ff',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Min Limit',
              position: 'start',
              backgroundColor: 'rgba(51, 102, 255, 0.8)',
              font: {
                size: 10
              }
            }
          }
        }
      };
    }
    
    return options;
  };
  
  // Chart configuration for WOB with limits
  const getWobChartOptions = () => {
    const stats = getStats(chartData.wob.data);
    
    // Determine appropriate y-axis range
    const minValue = Math.min(stats.min, operationalLimits.wob.min);
    const maxValue = Math.max(stats.max, operationalLimits.wob.critical);
    const buffer = (maxValue - minValue) * 0.1;
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Weight on Bit (klbs)'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `WOB: ${context.parsed.y.toFixed(2)} klbs`;
            }
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.max(0, minValue - buffer),
          max: maxValue + buffer,
          title: {
            display: true,
            text: 'klbs'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };
    
    // Add limit annotations if enabled
    if (showLimits) {
      options.plugins.annotation = {
        annotations: {
          maxLimit: {
            type: 'line',
            yMin: operationalLimits.wob.max,
            yMax: operationalLimits.wob.max,
            borderColor: '#ffcc00',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Max Limit',
              position: 'start',
              backgroundColor: 'rgba(255, 204, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          criticalLimit: {
            type: 'line',
            yMin: operationalLimits.wob.critical,
            yMax: operationalLimits.wob.critical,
            borderColor: '#ff0000',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Critical',
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          minLimit: {
            type: 'line',
            yMin: operationalLimits.wob.min,
            yMax: operationalLimits.wob.min,
            borderColor: '#3366ff',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Min Limit',
              position: 'start',
              backgroundColor: 'rgba(51, 102, 255, 0.8)',
              font: {
                size: 10
              }
            }
          }
        }
      };
    }
    
    return options;
  };
  
  // Chart configuration for RPM with limits
  const getRpmChartOptions = () => {
    const stats = getStats(chartData.rpm.data);
    
    // Determine appropriate y-axis range
    const minValue = Math.min(stats.min, operationalLimits.rpm.min);
    const maxValue = Math.max(stats.max, operationalLimits.rpm.critical);
    const buffer = (maxValue - minValue) * 0.1;
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Rotary Speed (RPM)'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `RPM: ${context.parsed.y.toFixed(1)}`;
            }
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.max(0, minValue - buffer),
          max: maxValue + buffer,
          title: {
            display: true,
            text: 'RPM'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };
    
    // Add limit annotations if enabled
    if (showLimits) {
      options.plugins.annotation = {
        annotations: {
          maxLimit: {
            type: 'line',
            yMin: operationalLimits.rpm.max,
            yMax: operationalLimits.rpm.max,
            borderColor: '#ffcc00',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Max Limit',
              position: 'start',
              backgroundColor: 'rgba(255, 204, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          criticalLimit: {
            type: 'line',
            yMin: operationalLimits.rpm.critical,
            yMax: operationalLimits.rpm.critical,
            borderColor: '#ff0000',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Critical',
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          minLimit: {
            type: 'line',
            yMin: operationalLimits.rpm.min,
            yMax: operationalLimits.rpm.min,
            borderColor: '#3366ff',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Min Limit',
              position: 'start',
              backgroundColor: 'rgba(51, 102, 255, 0.8)',
              font: {
                size: 10
              }
            }
          }
        }
      };
    }
    
    return options;
  };
  
  // Chart configuration for Torque with limits
  const getTorqueChartOptions = () => {
    const stats = getStats(chartData.torque.data);
    
    // Determine appropriate y-axis range
    const minValue = Math.min(stats.min, operationalLimits.torque.min);
    const maxValue = Math.max(stats.max, operationalLimits.torque.critical);
    const buffer = (maxValue - minValue) * 0.1;
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Torque (klbf-ft)'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `Torque: ${context.parsed.y.toFixed(3)} klbf-ft`;
            }
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: Math.max(0, minValue - buffer),
          max: maxValue + buffer,
          title: {
            display: true,
            text: 'klbf-ft'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };
    
    // Add limit annotations if enabled
    if (showLimits) {
      options.plugins.annotation = {
        annotations: {
          maxLimit: {
            type: 'line',
            yMin: operationalLimits.torque.max,
            yMax: operationalLimits.torque.max,
            borderColor: '#ffcc00',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Max Limit',
              position: 'start',
              backgroundColor: 'rgba(255, 204, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          criticalLimit: {
            type: 'line',
            yMin: operationalLimits.torque.critical,
            yMax: operationalLimits.torque.critical,
            borderColor: '#ff0000',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Critical',
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          minLimit: {
            type: 'line',
            yMin: operationalLimits.torque.min,
            yMax: operationalLimits.torque.min,
            borderColor: '#3366ff',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Min Limit',
              position: 'start',
              backgroundColor: 'rgba(51, 102, 255, 0.8)',
              font: {
                size: 10
              }
            }
          }
        }
      };
    }
    
    return options;
  };
  
  // Chart configuration for Control Drilling Percentage with ROP and limits
  const getControlRopComboChartOptions = () => {
    const ropStats = getStats(chartData.rop.data);
    const maxRop = Math.max(400, ropStats.max + (ropStats.max - ropStats.min) * 0.1);
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Control Drilling (%) with ROP'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === 0) {
                return `ROP: ${context.parsed.y.toFixed(1)} ft/hr`;
              } else {
                return `Control: ${context.parsed.y}%`;
              }
            }
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'right', // ROP on right y-axis
          beginAtZero: true,
          min: 0,
          max: maxRop,
          title: {
            display: true,
            text: 'ROP (ft/hr)'
          },
          grid: {
            drawOnChartArea: false // only want the grid lines for the control %
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'left', // Control % on left y-axis
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Control %'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };
    
    // Add ROP limit annotations if enabled
    if (showLimits) {
      options.plugins.annotation = {
        annotations: {
          ropMaxLimit: {
            type: 'line',
            yMin: operationalLimits.rop.max,
            yMax: operationalLimits.rop.max,
            borderColor: '#ffcc00',
            borderWidth: 2,
            borderDash: [6, 6],
            yScaleID: 'y', // Applies to ROP y-axis
            label: {
              display: true,
              content: 'ROP Max',
              position: 'start',
              backgroundColor: 'rgba(255, 204, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          ropCriticalLimit: {
            type: 'line',
            yMin: operationalLimits.rop.critical,
            yMax: operationalLimits.rop.critical,
            borderColor: '#ff0000',
            borderWidth: 2,
            borderDash: [6, 6],
            yScaleID: 'y', // Applies to ROP y-axis
            label: {
              display: true,
              content: 'ROP Critical',
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          controlTarget: {
            type: 'line',
            yMin: 80,
            yMax: 80,
            borderColor: '#4caf50',
            borderWidth: 2,
            borderDash: [6, 6],
            yScaleID: 'y1', // Applies to Control % y-axis
            label: {
              display: true,
              content: 'Control Target',
              position: 'start',
              backgroundColor: 'rgba(76, 175, 80, 0.8)',
              font: {
                size: 10
              }
            }
          }
        }
      };
    }
    
    return options;
  };
  
  // Chart configuration for Depth
  const getDepthChartOptions = () => {
    const stats = getStats(chartData.depth.data);
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Depth Progression'
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `Depth: ${context.parsed.y.toFixed(2)} ft`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          reverse: true, // Depth increases downward
          min: stats.min - (stats.max - stats.min) * 0.05,
          max: stats.max + (stats.max - stats.min) * 0.05,
          title: {
            display: true,
            text: 'Depth (ft)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };
  };
  
  // Chart configuration for Connection Time with Pre and Post breakdown and limits
  const getConnectionTimeChartOptions = () => {
    // Get all relevant data for scaling
    const connTimeData = chartData.connectionTime ? chartData.connectionTime.data : [];
    const preConnTimeData = chartData.preConnectionTime ? chartData.preConnectionTime.data : [];
    const postConnTimeData = chartData.postConnectionTime ? chartData.postConnectionTime.data : [];
    
    // Combine all data points for proper scaling
    const allTimeData = [...connTimeData, ...preConnTimeData, ...postConnTimeData];
    const stats = getStats(allTimeData);
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Connection Time Breakdown by Stand'
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const seconds = context.parsed.y;
              const mins = Math.floor(seconds / 60);
              const secs = Math.floor(seconds % 60);
              
              let label = '';
              switch(context.datasetIndex) {
                case 0:
                  label = `Total Connection: ${mins}:${secs.toString().padStart(2, '0')}`;
                  break;
                case 1:
                  label = `Pre-Connection: ${mins}:${secs.toString().padStart(2, '0')}`;
                  break;
                case 2:
                  label = `Post-Connection: ${mins}:${secs.toString().padStart(2, '0')}`;
                  break;
                default:
                  label = `Time: ${mins}:${secs.toString().padStart(2, '0')}`;
              }
              return label;
            }
          }
        },
        annotation: {
          annotations: {}
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: Math.max(stats.max + 60, operationalLimits.connectionTime.max + 60), // Add a minute to max for visual clarity
          title: {
            display: true,
            text: 'Time (seconds)'
          },
          stacked: false
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          }
        }
      }
    };
    
    // Add connection time limits if enabled
    if (showLimits) {
      options.plugins.annotation = {
        annotations: {
          targetTime: {
            type: 'line',
            yMin: operationalLimits.connectionTime.target,
            yMax: operationalLimits.connectionTime.target,
            borderColor: '#4caf50',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Target (6 min)',
              position: 'start',
              backgroundColor: 'rgba(76, 175, 80, 0.8)',
              font: {
                size: 10
              }
            }
          },
          warningTime: {
            type: 'line',
            yMin: operationalLimits.connectionTime.warning,
            yMax: operationalLimits.connectionTime.warning,
            borderColor: '#ffcc00',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Warning (8 min)',
              position: 'start',
              backgroundColor: 'rgba(255, 204, 0, 0.8)',
              font: {
                size: 10
              }
            }
          },
          maxTime: {
            type: 'line',
            yMin: operationalLimits.connectionTime.max,
            yMax: operationalLimits.connectionTime.max,
            borderColor: '#ff0000',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Maximum (10 min)',
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              font: {
                size: 10
              }
            }
          }
        }
      };
    }
    
    return options;
  };
  
// New function for combined chart with ROP, WOB, RPM, and Torque with limits
const getCombinedChartOptions = () => {
  const ropStats = getStats(chartData.rop.data);
  const wobStats = getStats(chartData.wob.data);
  const rpmStats = getStats(chartData.rpm.data);
  const torqueStats = getStats(chartData.torque.data);
  
  // Calculate y-axis max for each parameter to ensure proper scaling
  const ropMax = Math.max(400, ropStats.max * 1.1);
  const wobMax = Math.max(30, wobStats.max * 1.1);
  const rpmMax = Math.max(200, rpmStats.max * 1.1);
  const torqueMax = Math.max(10, torqueStats.max * 1.1);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      title: {
        display: true,
        text: 'Combined Drilling Parameters'
      },
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = '';
            const value = context.parsed.y;
            
            switch(context.datasetIndex) {
              case 0:
                label = `ROP: ${value.toFixed(1)} ft/hr`;
                break;
              case 1:
                label = `WOB: ${value.toFixed(2)} klbs`;
                break;
              case 2:
                label = `RPM: ${value.toFixed(1)}`;
                break;
              case 3:
                label = `Torque: ${value.toFixed(3)} klbf-ft`;
                break;
              default:
                label = `Value: ${value}`;
            }
            return label;
          }
        }
      },
      annotation: {
        annotations: {}
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: false,
        title: {
          display: true,
          text: 'ROP (ft/hr)'
        },
        min: 0,
        max: ropMax,
        ticks: {
          callback: function(value) {
            return value + ' ft/hr';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: false,
        title: {
          display: true,
          text: 'WOB (klbs)'
        },
        min: 0,
        max: wobMax,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: function(value) {
            return value + ' klbs';
          }
        }
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: false,
        title: {
          display: true,
          text: 'RPM'
        },
        min: 0,
        max: rpmMax,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: function(value) {
            return value;
          }
        }
      },
      y3: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: false,
        title: {
          display: true,
          text: 'Torque (klbf-ft)'
        },
        min: 0,
        max: torqueMax,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          callback: function(value) {
            return value + ' klbf-ft';
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Stand Number'
        }
      }
    }
  };
  // Add operational limits as annotations if enabled
  if (showLimits) {
    options.plugins.annotation = {
      annotations: {
        // ROP limits
        ropMaxLimit: {
          type: 'line',
          yMin: operationalLimits.rop.max,
          yMax: operationalLimits.rop.max,
          borderColor: 'rgba(255, 204, 0, 0.7)',
          borderWidth: 2,
          borderDash: [6, 6],
          yScaleID: 'y',
          label: {
            display: true,
            content: 'ROP Max',
            position: 'start',
            backgroundColor: 'rgba(255, 204, 0, 0.8)',
            font: {
              size: 10
            }
          }
        },
        // WOB limits
        wobMaxLimit: {
          type: 'line',
          yMin: operationalLimits.wob.max,
          yMax: operationalLimits.wob.max,
          borderColor: 'rgba(255, 204, 0, 0.7)',
          borderWidth: 2,
          borderDash: [6, 6],
          yScaleID: 'y1',
          label: {
            display: true,
            content: 'WOB Max',
            position: 'start',
            backgroundColor: 'rgba(255, 204, 0, 0.8)',
            font: {
              size: 10
            }
          }
        },
        // RPM limits
        rpmMaxLimit: {
          type: 'line',
          yMin: operationalLimits.rpm.max,
          yMax: operationalLimits.rpm.max,
          borderColor: 'rgba(255, 204, 0, 0.7)',
          borderWidth: 2,
          borderDash: [6, 6],
          yScaleID: 'y2',
          label: {
            display: true,
            content: 'RPM Max',
            position: 'start',
            backgroundColor: 'rgba(255, 204, 0, 0.8)',
            font: {
              size: 10
            }
          }
        },
        // Torque limits
        torqueMaxLimit: {
          type: 'line',
          yMin: operationalLimits.torque.max,
          yMax: operationalLimits.torque.max,
          borderColor: 'rgba(255, 204, 0, 0.7)',
          borderWidth: 2,
          borderDash: [6, 6],
          yScaleID: 'y3',
          label: {
            display: true,
            content: 'Torque Max',
            position: 'start',
            backgroundColor: 'rgba(255, 204, 0, 0.8)',
            font: {
              size: 10
            }
          }
        }
      }
    };
  }
  
  return options;
};

// Helper function to determine bar color based on control percentage
const getBarColors = (controlData) => {
  if (!controlData || !controlData.data) return [];
  
  return controlData.data.map(value => {
    if (value >= 80) return 'rgba(52, 168, 83, 0.7)'; // Green for high control
    if (value >= 60) return 'rgba(66, 133, 244, 0.7)'; // Blue for good control
    if (value >= 40) return 'rgba(251, 188, 4, 0.7)'; // Yellow for fair control
    return 'rgba(234, 67, 53, 0.7)'; // Red for poor control
  });
};

// Helper function to determine connection time bar colors
const getConnectionTimeColors = (connectionTimeData) => {
  if (!connectionTimeData || !connectionTimeData.data) return [];
  
  return connectionTimeData.data.map(value => {
    if (value < 180) return 'rgba(52, 168, 83, 0.7)'; // Green for short connections (<3 min)
    if (value < 300) return 'rgba(66, 133, 244, 0.7)'; // Blue for normal connections (<5 min)
    if (value < 420) return 'rgba(251, 188, 4, 0.7)'; // Yellow for longer connections (<7 min)
    return 'rgba(234, 67, 53, 0.7)'; // Red for long connections (>7 min)
  });
};

// Color constants for different parameters
const CHART_COLORS = {
  rop: 'rgba(26, 115, 232, 0.8)', // Blue
  wob: 'rgba(52, 168, 83, 0.8)',  // Green
  rpm: 'rgba(251, 188, 4, 0.8)',  // Yellow
  torque: 'rgba(234, 67, 53, 0.8)', // Red
  preConnection: 'rgba(66, 133, 244, 0.7)', // Blue
  postConnection: 'rgba(153, 52, 232, 0.7)', // Purple
  connection: 'rgba(251, 188, 4, 0.7)', // Yellow
};

// Create config for line chart
const createLineChartConfig = (chartInfo) => {
  return {
    labels: chartInfo.data.labels || [],
    datasets: [{
      label: chartInfo.title,
      data: chartInfo.data.data || [],
      borderColor: chartInfo.color,
      backgroundColor: `${chartInfo.color}20`, // Color with 20% opacity
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.2
    }]
  };
};

// Create config for bar chart
const createBarChartConfig = (chartInfo) => {
  if (chartInfo.type === 'connection') {
    return {
      labels: chartInfo.data.connectionTime.labels || [],
      datasets: [
        {
          label: 'Total Connection Time',
          data: chartInfo.data.connectionTime.data || [],
          backgroundColor: CHART_COLORS.connection,
          borderColor: CHART_COLORS.connection,
          borderWidth: 1,
          order: 1
        },
        {
          label: 'Pre-Connection Time',
          data: chartInfo.data.preConnectionTime.data || [],
          backgroundColor: CHART_COLORS.preConnection,
          borderColor: CHART_COLORS.preConnection,
          borderWidth: 1,
          type: 'bar',
          order: 2
        },
        {
          label: 'Post-Connection Time',
          data: chartInfo.data.postConnectionTime.data || [],
          backgroundColor: CHART_COLORS.postConnection,
          borderColor: CHART_COLORS.postConnection,
          borderWidth: 1,
          type: 'bar',
          order: 3
        }
      ]
    };
  } else {
    return {
      labels: chartInfo.data.labels || [],
      datasets: [{
        label: chartInfo.title,
        data: chartInfo.data.data || [],
        backgroundColor: getBarColors(chartInfo.data),
        borderColor: chartInfo.color,
        borderWidth: 1
      }]
    };
  }
};

// Create config for combo chart showing ROP behind Control Drilling %
const createComboChartConfig = (chartInfo) => {
  return {
    labels: chartInfo.data.controlPercent.labels || [],
    datasets: [
      // ROP Line (dataset index 0)
      {
        type: 'line',
        label: 'Rate of Penetration (ft/hr)',
        data: chartInfo.data.rop.data || [],
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.2,
        yAxisID: 'y', // Use the right y-axis (ROP)
        order: 2, // Lower order means it's drawn later (on top)
      },
      // Control Drilling Bars (dataset index 1)
      {
        type: 'bar',
        label: 'Control Drilling (%)',
        data: chartInfo.data.controlPercent.data || [],
        backgroundColor: getBarColors(chartInfo.data.controlPercent),
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        yAxisID: 'y1', // Use the left y-axis (Control %)
        order: 1, // Higher order means it's drawn first (behind)
      }
    ]
  };
};

// Create config for combined chart with ROP, WOB, RPM, and Torque
const createCombinedChartConfig = (chartInfo) => {
  return {
    labels: chartInfo.data.rop.labels || [],
    datasets: [
      {
        label: 'ROP (ft/hr)',
        data: chartInfo.data.rop.data || [],
        borderColor: CHART_COLORS.rop,
        backgroundColor: CHART_COLORS.rop + '20', // 20% opacity
        borderWidth: 3,
        yAxisID: 'y',
        tension: 0.2
      },
      {
        label: 'WOB (klbs)',
        data: chartInfo.data.wob.data || [],
        borderColor: CHART_COLORS.wob,
        backgroundColor: CHART_COLORS.wob + '20', // 20% opacity
        borderWidth: 3,
        yAxisID: 'y1',
        tension: 0.2
      },
      {
        label: 'RPM',
        data: chartInfo.data.rpm.data || [],
        borderColor: CHART_COLORS.rpm,
        backgroundColor: CHART_COLORS.rpm + '20', // 20% opacity
        borderWidth: 3,
        yAxisID: 'y2',
        tension: 0.2
      },
      {
        label: 'Torque (klbf-ft)',
        data: chartInfo.data.torque.data || [],
        borderColor: CHART_COLORS.torque,
        backgroundColor: CHART_COLORS.torque + '20', // 20% opacity
        borderWidth: 3,
        yAxisID: 'y3',
        tension: 0.2
      }
    ]
  };
};

// Create config for connection control vs manual chart
const createConnectionControlChartConfig = (chartInfo) => {
  return {
    labels: chartInfo.data.labels || [],
    datasets: [
      {
        label: 'Pre-Connection Control',
        data: chartInfo.data.preConnectionControl || [],
        backgroundColor: 'rgba(52, 168, 83, 0.7)', // Green for control
        borderColor: 'rgba(52, 168, 83, 1)',
        borderWidth: 1,
        type: 'bar'
      },
      {
        label: 'Pre-Connection Manual',
        data: chartInfo.data.preConnectionManual || [],
        backgroundColor: 'rgba(251, 188, 4, 0.7)', // Yellow for manual
        borderColor: 'rgba(251, 188, 4, 1)',
        borderWidth: 1,
        type: 'bar'
      },
      {
        label: 'Post-Connection Control',
        data: chartInfo.data.postConnectionControl || [],
        backgroundColor: 'rgba(66, 133, 244, 0.7)', // Blue for control
        borderColor: 'rgba(66, 133, 244, 1)',
        borderWidth: 1,
        type: 'bar'
      },
      {
        label: 'Post-Connection Manual',
        data: chartInfo.data.postConnectionManual || [],
        backgroundColor: 'rgba(234, 67, 53, 0.7)', // Red for manual
        borderColor: 'rgba(234, 67, 53, 1)',
        borderWidth: 1,
        type: 'bar'
      }
    ]
  };
};

// New chart configuration for Connection Control vs Manual trend
const getConnectionControlOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Connection Control vs Manual Time Trends'
      },
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const seconds = context.parsed.y;
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            switch(context.datasetIndex) {
              case 0:
                return `Pre-Connection Control: ${formattedTime}`;
              case 1:
                return `Pre-Connection Manual: ${formattedTime}`;
              case 2:
                return `Post-Connection Control: ${formattedTime}`;
              case 3:
                return `Post-Connection Manual: ${formattedTime}`;
              default:
                return `Time: ${formattedTime}`;
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
          text: 'Time (seconds)'
        },
        stacked: false
      },
      x: {
        title: {
          display: true,
          text: 'Stand Number'
        }
      }
    }
  };
};

// Convert chart data to ChartJS format based on chart type
const createChartConfig = (chartInfo) => {
  if (!chartInfo || !chartInfo.data) return null;
  
  if (chartInfo.type === 'bar') {
    return createBarChartConfig(chartInfo);
  } else if (chartInfo.type === 'combo') {
    return createComboChartConfig(chartInfo);
  } else if (chartInfo.type === 'combined') {
    return createCombinedChartConfig(chartInfo);
  } else if (chartInfo.type === 'connection') {
    return createBarChartConfig(chartInfo);
  } else if (chartInfo.type === 'connection-control') {
    return createConnectionControlChartConfig(chartInfo);
  } else {
    return createLineChartConfig(chartInfo);
  }
};

const visibleCharts = getVisibleCharts();

return (
  <div className="chart-panel">
    <div className="panel-header">
      <h3>Parameter Trends</h3>
      <div className="chart-controls">
        <div className="chart-tabs">
          <button 
            className={`chart-tab ${activeTab === 'combined' ? 'active' : ''}`}
            onClick={() => setActiveTab('combined')}
          >
            Combined
          </button>
          <button 
            className={`chart-tab ${activeTab === 'rop-wob' ? 'active' : ''}`}
            onClick={() => setActiveTab('rop-wob')}
          >
            ROP & WOB
          </button>
          <button 
            className={`chart-tab ${activeTab === 'rpm-torque' ? 'active' : ''}`}
            onClick={() => setActiveTab('rpm-torque')}
          >
            RPM & Torque
          </button>
          <button 
            className={`chart-tab ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            Control %
          </button>
          <button 
            className={`chart-tab ${activeTab === 'connection' ? 'active' : ''}`}
            onClick={() => setActiveTab('connection')}
          >
            Connection
          </button>
          <button 
            className={`chart-tab ${activeTab === 'connection-control' ? 'active' : ''}`}
            onClick={() => setActiveTab('connection-control')}
          >
            Conn Control
          </button>
        </div>
        <div className="limit-toggle">
          <label className="limit-toggle-label">
            <input 
              type="checkbox" 
              checked={showLimits} 
              onChange={() => setShowLimits(!showLimits)} 
            />
            Show Operational Limits
          </label>
        </div>
      </div>
    </div>

    <div className={`chart-container ${activeTab === 'control' || activeTab === 'connection' || activeTab === 'combined' || activeTab === 'connection-control' ? 'single-chart' : ''}`}>
      <div className={`chart ${(activeTab === 'control' || activeTab === 'connection' || activeTab === 'combined' || activeTab === 'connection-control') ? 'full-width' : ''}`}>
        {visibleCharts[0] && visibleCharts[0].data && (
          visibleCharts[0].type === 'bar' ? (
            <Bar 
              data={createChartConfig(visibleCharts[0])} 
              options={visibleCharts[0].options} 
            />
          ) : visibleCharts[0].type === 'combo' ? (
            <Chart 
              data={createChartConfig(visibleCharts[0])} 
              options={visibleCharts[0].options} 
            />
          ) : visibleCharts[0].type === 'combined' ? (
            <Line 
              data={createChartConfig(visibleCharts[0])} 
              options={visibleCharts[0].options} 
            />
          ) : visibleCharts[0].type === 'connection' ? (
            <Bar 
              data={createChartConfig(visibleCharts[0])} 
              options={visibleCharts[0].options} 
            />
          ) : visibleCharts[0].type === 'connection-control' ? (
            <Bar 
              data={createChartConfig(visibleCharts[0])} 
              options={visibleCharts[0].options} 
            />
          ) : (
            <Line 
              data={createChartConfig(visibleCharts[0])} 
              options={visibleCharts[0].options} 
            />
          )
        )}
      </div>

      {activeTab !== 'control' && activeTab !== 'connection' && activeTab !== 'combined' && activeTab !== 'connection-control' && visibleCharts[1] && (
        <div className="chart">
          {visibleCharts[1].data && (
            visibleCharts[1].type === 'bar' ? (
              <Bar 
                data={createChartConfig(visibleCharts[1])} 
                options={visibleCharts[1].options} 
              />
            ) : (
              <Line 
                data={createChartConfig(visibleCharts[1])} 
                options={visibleCharts[1].options} 
              />
            )
          )}
        </div>
      )}
    </div>

    <div className="chart-footer">
      <div className="chart-legend">
        {activeTab === 'control' ? (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#1a73e8' }}></div>
              <div className="legend-label">Rate of Penetration (ft/hr)</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(52, 168, 83, 0.7)' }}></div>
              <div className="legend-label">Control Drilling (%)</div>
            </div>
          </>
        ) : activeTab === 'connection' ? (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.connection }}></div>
              <div className="legend-label">Total Connection</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.preConnection }}></div>
              <div className="legend-label">Pre-Connection</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.postConnection }}></div>
              <div className="legend-label">Post-Connection</div>
            </div>
          </>
        ) : activeTab === 'connection-control' ? (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(52, 168, 83, 0.7)' }}></div>
              <div className="legend-label">Pre-Connection Control</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(251, 188, 4, 0.7)' }}></div>
              <div className="legend-label">Pre-Connection Manual</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(66, 133, 244, 0.7)' }}></div>
              <div className="legend-label">Post-Connection Control</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(234, 67, 53, 0.7)' }}></div>
              <div className="legend-label">Post-Connection Manual</div>
            </div>
          </>
        ) : activeTab === 'combined' ? (
          <>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.rop }}></div>
              <div className="legend-label">ROP (ft/hr)</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.wob }}></div>
              <div className="legend-label">WOB (klbs)</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.rpm }}></div>
              <div className="legend-label">RPM</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: CHART_COLORS.torque }}></div>
              <div className="legend-label">Torque (klbf-ft)</div>
            </div>
          </>
        ) : (
          visibleCharts.map((chart, index) => (
            chart && chart.data && (
              <div className="legend-item" key={index}>
                <div className="legend-color" style={{ backgroundColor: chart.color }}></div>
                <div className="legend-label">{chart.title}</div>
              </div>
            )
          ))
        )}
      </div>
      <div className="chart-info">
        <p>Showing data for {chartData.rop.data.length} stands</p>
        {showLimits && (
          <div className="limits-info">
            <span>Operational limits active</span>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default ChartPanel;