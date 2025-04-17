import React, { useState, useEffect } from 'react';
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
  Filler,
  LineController,
  BarController
} from 'chart.js';
import { Chart, Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-plugin-annotation';
import annotationPlugin from 'chartjs-plugin-annotation';

// Update the register statement to include all controllers
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  LineController,  // Add LineController explicitly
  BarController,   // Add BarController explicitly
  Title, 
  Tooltip, 
  Legend,
  Filler,
  annotationPlugin
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

// Color constants for different parameters
const CHART_COLORS = {
  rop: 'rgba(26, 115, 232, 0.8)', // Blue
  wob: 'rgba(52, 168, 83, 0.8)',  // Green
  rpm: 'rgba(251, 188, 4, 0.8)',  // Yellow
  torque: 'rgba(234, 67, 53, 0.8)', // Red
  preConnection: 'rgba(66, 133, 244, 0.7)', // Blue
  postConnection: 'rgba(153, 52, 232, 0.7)', // Purple
  connection: 'rgba(251, 188, 4, 0.7)', // Yellow
  preConnectionControl: 'rgba(52, 168, 83, 0.7)', // Green for control
  preConnectionManual: 'rgba(251, 188, 4, 0.7)', // Yellow for manual
  postConnectionControl: 'rgba(66, 133, 244, 0.7)', // Blue for control
  postConnectionManual: 'rgba(234, 67, 53, 0.7)', // Red for manual
  benchmark: 'rgb(255, 0, 0)', // Solid RED for benchmark
};

function ChartPanel({ chartData }) {
  const [activeTab, setActiveTab] = useState('control'); // Default to control view
  const [showLimits, setShowLimits] = useState(true); // Toggle for showing/hiding limits
  const [showBenchmarks, setShowBenchmarks] = useState(true); // Toggle for showing/hiding benchmarks
  
  // Benchmark values (in seconds for connection times, ft/hr for ROP)
  const [benchmarks, setBenchmarks] = useState({
    preConnection: 240, // 4 minutes in seconds
    postConnection: 240, // 4 minutes in seconds
    rop: 200, // 200 ft/hr
  });
  
  // Function to handle benchmark value changes
  const handleBenchmarkChange = (type, value) => {
    setBenchmarks(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  // Force chart updates when benchmark settings change
  useEffect(() => {
    if (showBenchmarks) {
      console.log('Charts rendered with benchmarks enabled');
      // Force a re-render of charts when benchmark state changes
      const charts = document.querySelectorAll('canvas');
      charts.forEach(canvas => {
        const chart = ChartJS.getChart(canvas);
        if (chart) {
          chart.update();
        }
      });
    }
  }, [showBenchmarks, benchmarks, activeTab]);
  
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

  // Helper function to determine bar color based on control percentage
  const getBarColors = (controlData) => {
    if (!controlData || !controlData.data) return [];
    return controlData.data.map(() => 'rgba(52, 168, 83, 0.7)'); // Green for all
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
    
    // Add operational limits annotations if enabled
    if (showLimits) {
      options.plugins.annotation = {
        drawTime: 'afterDatasetsDraw',
        annotations: {
          // ropMaxLimit: {
          //   type: 'line',
          //   yMin: operationalLimits.rop.max,
          //   yMax: operationalLimits.rop.max,
          //   borderColor: '#ffcc00',
          //   borderWidth: 2,
          //   yScaleID: 'y', // ROP y-axis
          //   label: {
          //     display: true,
          //     content: 'ROP Max',
          //     position: 'start',
          //     backgroundColor: 'rgba(255, 204, 0, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // },
          // wobMaxLimit: {
          //   type: 'line',
          //   yMin: operationalLimits.wob.max,
          //   yMax: operationalLimits.wob.max,
          //   borderColor: '#ffcc00',
          //   borderWidth: 2,
          //   yScaleID: 'y1', // WOB y-axis
          //   label: {
          //     display: true,
          //     content: 'WOB Max',
          //     position: 'start',
          //     backgroundColor: 'rgba(255, 204, 0, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // },
          // rpmMaxLimit: {
          //   type: 'line',
          //   yMin: operationalLimits.rpm.max,
          //   yMax: operationalLimits.rpm.max,
          //   borderColor: '#ffcc00',
          //   borderWidth: 2,
          //   yScaleID: 'y2', // RPM y-axis
          //   label: {
          //     display: true,
          //     content: 'RPM Max',
          //     position: 'start',
          //     backgroundColor: 'rgba(255, 204, 0, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // },
          // torqueMaxLimit: {
          //   type: 'line',
          //   yMin: operationalLimits.torque.max,
          //   yMax: operationalLimits.torque.max,
          //   borderColor: '#ffcc00',
          //   borderWidth: 2,
          //   yScaleID: 'y3', // Torque y-axis
          //   label: {
          //     display: true,
          //     content: 'Torque Max',
          //     position: 'start',
          //     backgroundColor: 'rgba(255, 204, 0, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // }
        }
      };
    }
    
    // Add benchmark for ROP if enabled
    if (showBenchmarks) {
      if (!options.plugins.annotation.annotations) {
        options.plugins.annotation.annotations = {};
      }
      
      options.plugins.annotation.annotations.ropBenchmark = {
        type: 'line',
        yMin: benchmarks.rop,
        yMax: benchmarks.rop,
        borderColor: 'rgb(255, 0, 0)',
        borderWidth: 3,
        borderDash: [],
        drawTime: 'afterDatasetsDraw',
        z: 999,
        yScaleID: 'y', // ROP y-axis
        label: {
          display: true,
          content: `ROP Benchmark: ${benchmarks.rop} ft/hr`,
          position: 'start',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          font: {
            size: 10
          }
        }
      };
    }
    
    return options;
  };
  
  // Create config for combined chart with multiple parameters
  const createCombinedChartConfig = () => {
    // Get the common labels (stand numbers)
    const labels = chartData.rop.labels || [];
    
    return {
      labels: labels,
      datasets: [
        // ROP dataset (left axis)
        {
          type: 'line',  // Explicitly set the type
          label: 'ROP (ft/hr)',
          data: chartData.rop.data || [],
          borderColor: CHART_COLORS.rop,
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: false,
          yAxisID: 'y',
        },
        // WOB dataset (first right axis)
        {
          type: 'line',  // Explicitly set the type
          label: 'WOB (klbs)',
          data: chartData.wob.data || [],
          borderColor: CHART_COLORS.wob,
          backgroundColor: 'rgba(52, 168, 83, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: false,
          yAxisID: 'y1',
        },
        // RPM dataset (second right axis)
        {
          type: 'line',  // Explicitly set the type
          label: 'RPM',
          data: chartData.rpm.data || [],
          borderColor: CHART_COLORS.rpm,
          backgroundColor: 'rgba(251, 188, 4, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: false,
          yAxisID: 'y2',
        },
        // Torque dataset (third right axis)
        {
          type: 'line',  // Explicitly set the type
          label: 'Torque (klbf-ft)',
          data: chartData.torque.data || [],
          borderColor: CHART_COLORS.torque,
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: false,
          yAxisID: 'y3',
        }
      ]
    };
  };
  

  // Chart configuration for ROP with limits and benchmark
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
          drawTime: 'afterDatasetsDraw', // Draw annotations after datasets
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
        drawTime: 'afterDatasetsDraw', // Draw annotations after datasets
        annotations: {
          maxLimit: {
            type: 'line',
            yMin: operationalLimits.rop.max,
            yMax: operationalLimits.rop.max,
            borderColor: '#ffcc00',
            borderWidth: 2,
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
    
    // Add benchmark annotation if enabled
    if (showBenchmarks) {
      console.log('Adding ROP benchmark line at:', benchmarks.rop);
      
      if (!options.plugins.annotation.annotations) {
        options.plugins.annotation.annotations = {};
      }
      
      options.plugins.annotation.annotations.benchmark = {
        type: 'line',
        yMin: benchmarks.rop,
        yMax: benchmarks.rop,
        borderColor: 'rgb(255, 0, 0)',  // SOLID RED
        borderWidth: 3,                 // THICKER line
        borderDash: [],                 // EXPLICITLY empty array for solid line
        drawTime: 'afterDatasetsDraw',  // Draw after datasets to ensure visibility
        z: 999,                         // Very high z-index
        label: {
          display: true,
          content: `ROP Benchmark: ${benchmarks.rop} ft/hr`,
          position: 'start',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          font: {
            size: 10
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
          drawTime: 'afterDatasetsDraw', // Draw annotations after datasets
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
        drawTime: 'afterDatasetsDraw', // Draw annotations after datasets
        annotations: {
          // ropMaxLimit: {
          //   type: 'line',
          //   yMin: operationalLimits.rop.max,
          //   yMax: operationalLimits.rop.max,
          //   borderColor: '#ffcc00',
          //   borderWidth: 2,
          //   yScaleID: 'y', // Applies to ROP y-axis
          //   label: {
          //     display: true,
          //     content: 'ROP Max',
          //     position: 'start',
          //     backgroundColor: 'rgba(255, 204, 0, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // },
          // ropCriticalLimit: {
          //   type: 'line',
          //   yMin: operationalLimits.rop.critical,
          //   yMax: operationalLimits.rop.critical,
          //   borderColor: '#ff0000',
          //   borderWidth: 2,
          //   yScaleID: 'y', // Applies to ROP y-axis
          //   label: {
          //     display: true,
          //     content: 'ROP Critical',
          //     position: 'start',
          //     backgroundColor: 'rgba(255, 0, 0, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // },
          // controlTarget: {
          //   type: 'line',
          //   yMin: 80,
          //   yMax: 80,
          //   borderColor: '#4caf50',
          //   borderWidth: 2,
          //   yScaleID: 'y1', // Applies to Control % y-axis
          //   label: {
          //     display: true,
          //     content: 'Control Target',
          //     position: 'start',
          //     backgroundColor: 'rgba(76, 175, 80, 0.8)',
          //     font: {
          //       size: 10
          //     }
          //   }
          // }
        }
      };
    }
    
    // Add ROP benchmark if enabled
    if (showBenchmarks) {
      console.log('Adding combo chart ROP benchmark at:', benchmarks.rop);
      
      if (!options.plugins.annotation.annotations) {
        options.plugins.annotation.annotations = {};
      }
      
      options.plugins.annotation.annotations.ropBenchmark = {
        type: 'line',
        yMin: benchmarks.rop,
        yMax: benchmarks.rop,
        borderColor: 'rgb(255, 0, 0)',        // SOLID RED
        borderWidth: 3,                       // THICKER line
        borderDash: [],                       // EXPLICITLY empty array for solid line
        drawTime: 'afterDatasetsDraw',        // Draw after datasets
        z: 999,                               // Very high z-index
        yScaleID: 'y',                        // Applies to ROP y-axis
        label: {
          display: true,
          content: `ROP Benchmark: ${benchmarks.rop} ft/hr`,
          position: 'start',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          font: {
            size: 10
          }
        }
      };
    }
    
    return options;
  };

  // Pre-Connection Control options with benchmark
  const getPreConnectionControlOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Pre-Connection Control vs Manual Time Trends'
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const seconds = context.parsed.y;
              const minutes = (seconds / 60).toFixed(1); // Convert to minutes with 1 decimal place
              
              switch(context.datasetIndex) {
                case 0:
                  return `Pre-Connection Control: ${minutes} min`;
                case 1:
                  return `Pre-Connection Manual: ${minutes} min`;
                default:
                  return `Time: ${minutes} min`;
              }
            }
          }
        },
        annotation: {
          drawTime: 'afterDatasetsDraw', // Draw annotations after datasets
          annotations: showBenchmarks ? {
            benchmark: {
              type: 'line',
              yMin: benchmarks.preConnection,
              yMax: benchmarks.preConnection,
              borderColor: 'rgb(255, 0, 0)',      // SOLID RED
              borderWidth: 3,                     // THICKER line
              borderDash: [],                     // EXPLICITLY empty array for solid line
              drawTime: 'afterDatasetsDraw',      // Draw after datasets
              z: 999,                             // Very high z-index
              label: {
                display: true,
                content: `Benchmark: ${(benchmarks.preConnection / 60).toFixed(1)} min`,
                position: 'start',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                font: {
                  size: 10
                }
              }
            }
          } : {}
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (minutes)'
          },
          ticks: {
            callback: function(value) {
              return (value / 60).toFixed(1); // Convert seconds to minutes
            }
          },
          stacked: true // This is key for stacking bars
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          },
          stacked: true // This is key for stacking bars
        }
      }
    };
  };

  // Post-Connection Control options with benchmark
  const getPostConnectionControlOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Post-Connection Control vs Manual Time Trends'
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const seconds = context.parsed.y;
              const minutes = (seconds / 60).toFixed(1);
              
              switch(context.datasetIndex) {
                case 0:
                  return `Post-Connection Control: ${minutes} min`;
                case 1:
                  return `Post-Connection Manual: ${minutes} min`;
                default:
                  return `Time: ${minutes} min`;
              }
            }
          }
        },
        annotation: {
          drawTime: 'afterDatasetsDraw', // Draw annotations after datasets
          annotations: showBenchmarks ? {
            benchmark: {
              type: 'line',
              yMin: benchmarks.postConnection,
              yMax: benchmarks.postConnection,
              borderColor: 'rgb(255, 0, 0)',      // SOLID RED
              borderWidth: 3,                     // THICKER line
              borderDash: [],                     // EXPLICITLY empty array for solid line
              drawTime: 'afterDatasetsDraw',      // Draw after datasets
              z: 999,                             // Very high z-index
              label: {
                display: true,
                content: `Benchmark: ${(benchmarks.postConnection / 60).toFixed(1)} min`,
                position: 'start',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                font: {
                  size: 10
                }
              }
            }
          } : {}
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (minutes)'
          },
          ticks: {
            callback: function(value) {
              return (value / 60).toFixed(1);
            }
          },
          stacked: true // Enable stacking
        },
        x: {
          title: {
            display: true,
            text: 'Stand Number'
          },
          stacked: true // Enable stacking
        }
      }
    };
  };

  // Create config for pre-connection control vs manual chart
  const createPreConnectionControlChartConfig = (chartInfo) => {
    return {
      labels: chartInfo.data.labels || [],
      datasets: [
        {
          label: 'Pre-Connection Control',
          data: chartInfo.data.preConnectionControl || [],
          backgroundColor: CHART_COLORS.preConnectionControl,
          borderColor: 'rgba(52, 168, 83, 1)',
          borderWidth: 1,
          type: 'bar',
          stack: 'stack1' // Assign to same stack
        },
        {
          label: 'Pre-Connection Manual',
          data: chartInfo.data.preConnectionManual || [],
          backgroundColor: CHART_COLORS.preConnectionManual,
          borderColor: 'rgba(251, 188, 4, 1)',
          borderWidth: 1,
          type: 'bar',
          stack: 'stack1' // Assign to same stack
        }
      ]
    };
  };
  
  // Create config for post-connection control vs manual chart
  const createPostConnectionControlChartConfig = (chartInfo) => {
    return {
      labels: chartInfo.data.labels || [],
      datasets: [
        {
          label: 'Post-Connection Control',
          data: chartInfo.data.postConnectionControl || [],
          backgroundColor: CHART_COLORS.postConnectionControl,
          borderColor: 'rgba(66, 133, 244, 1)',
          borderWidth: 1,
          type: 'bar',
          stack: 'stack1' // Assign to same stack
        },
        {
          label: 'Post-Connection Manual',
          data: chartInfo.data.postConnectionManual || [],
          backgroundColor: CHART_COLORS.postConnectionManual,
          borderColor: 'rgba(234, 67, 53, 1)',
          borderWidth: 1,
          type: 'bar',
          stack: 'stack1' // Assign to same stack
        }
      ]
    };
  };
  
  // Determine which charts to show based on active tab
  const getVisibleCharts = () => {
    switch (activeTab) {
      case 'combined': // New case for combined view
        return [
          {
            data: {
              rop: chartData.rop,
              wob: chartData.wob,
              rpm: chartData.rpm,
              torque: chartData.torque
            },
            options: getCombinedChartOptions(),
            title: 'Combined Drilling Parameters',
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
      case 'pre-connection-control':
        return [
          {
            data: {
              // Make sure to use the labels from the pre-connection datasets
              labels: chartData.preConnectionControl ? chartData.preConnectionControl.labels : [],
              preConnectionControl: chartData.preConnectionControl ? chartData.preConnectionControl.data : [],
              preConnectionManual: chartData.preConnectionManual ? chartData.preConnectionManual.data : []
            },
            options: getPreConnectionControlOptions(),
            title: 'Pre-Connection Control vs Manual',
            type: 'pre-connection-control'
          },
          null // No second chart
        ];
      case 'post-connection-control':
        return [
          {
            data: {
              labels: chartData.connectionTime ? chartData.connectionTime.labels : [],
              postConnectionControl: chartData.postConnectionControl ? chartData.postConnectionControl.data : [],
              postConnectionManual: chartData.postConnectionManual ? chartData.postConnectionManual.data : []
            },
            options: getPostConnectionControlOptions(),
            title: 'Post-Connection Control vs Manual',
            type: 'post-connection-control'
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
          null // No second chart
        ];
    }
  };
  

  const visibleCharts = getVisibleCharts();

  // Create chart config based on chart type
  const createChartConfig = (chartInfo) => {
    if (!chartInfo || !chartInfo.data) return null;
    
    if (chartInfo.type === 'combined') {
      return createCombinedChartConfig();
    } else if (chartInfo.type === 'combo') {
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
    } else if (chartInfo.type === 'pre-connection-control') {
      return createPreConnectionControlChartConfig(chartInfo);
    } else if (chartInfo.type === 'post-connection-control') {
      return createPostConnectionControlChartConfig(chartInfo);
    } else {
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
    }
  };

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
        className={`chart-tab ${activeTab === 'control' ? 'active' : ''}`}
        onClick={() => setActiveTab('control')}
      >
        Control %
      </button>
      <button 
        className={`chart-tab ${activeTab === 'pre-connection-control' ? 'active' : ''}`}
        onClick={() => setActiveTab('pre-connection-control')}
      >
        Pre-Conn
      </button>
      <button 
        className={`chart-tab ${activeTab === 'post-connection-control' ? 'active' : ''}`}
        onClick={() => setActiveTab('post-connection-control')}
      >
        Post-Conn
      </button>
    </div>
    <div className="limit-toggle">
      <label className="limit-toggle-label">
        <input 
          type="checkbox" 
          checked={showLimits} 
          onChange={() => {
            console.log("Toggling limits from", showLimits, "to", !showLimits);
            setShowLimits(!showLimits);
          }} 
        />
        Show Operational Limits
      </label>
    </div>
    <div className="benchmark-toggle">
      <label className="benchmark-toggle-label">
        <input 
          type="checkbox" 
          checked={showBenchmarks} 
          onChange={() => {
            console.log("Toggling benchmarks from", showBenchmarks, "to", !showBenchmarks);
            setShowBenchmarks(!showBenchmarks);
          }} 
        />
        Show Benchmarks
      </label>
    </div>
  </div>
</div>

      {/* Benchmark settings section */}
      {showBenchmarks && (
        <div className="benchmark-settings">
          {(activeTab === 'control' || activeTab === 'combined') && (
            <div className="benchmark-input">
              <label>ROP Benchmark (ft/hr):</label>
              <input 
                type="number" 
                value={benchmarks.rop} 
                onChange={(e) => handleBenchmarkChange('rop', parseInt(e.target.value))} 
                min="0" 
                max="400"
                step="10"
              />
            </div>
          )}

          {activeTab === 'pre-connection-control' && (
            <div className="benchmark-input">
              <label>Pre-Connection Benchmark (min):</label>
              <input 
                type="number" 
                value={benchmarks.preConnection / 60} 
                onChange={(e) => handleBenchmarkChange('preConnection', Math.round(parseFloat(e.target.value) * 60))} 
                min="0" 
                max="10"
                step="0.5"
              />
            </div>
          )}

          {activeTab === 'post-connection-control' && (
            <div className="benchmark-input">
              <label>Post-Connection Benchmark (min):</label>
              <input 
                type="number" 
                value={benchmarks.postConnection / 60} 
                onChange={(e) => handleBenchmarkChange('postConnection', Math.round(parseFloat(e.target.value) * 60))} 
                min="0" 
                max="10"
                step="0.5"
              />
            </div>
          )}
        </div>
      )}

      <div className={`chart-container ${activeTab === 'control' || activeTab === 'pre-connection-control' || activeTab === 'post-connection-control' || activeTab === 'combined' ? 'single-chart' : ''}`}>
         <div className={`chart ${(activeTab === 'control' || activeTab === 'pre-connection-control' || activeTab === 'post-connection-control' || activeTab === 'combined') ? 'full-width' : ''}`}>
         {visibleCharts[0] && visibleCharts[0].data && (
            visibleCharts[0].type === 'combined' ? (
              <Chart 
                data={createChartConfig(visibleCharts[0])} 
                options={visibleCharts[0].options} 
              />
            ) : visibleCharts[0].type === 'combo' ? (
              <Chart 
                data={createChartConfig(visibleCharts[0])} 
                options={visibleCharts[0].options} 
              />
            ) : visibleCharts[0].type === 'pre-connection-control' ? (
              <Bar 
                data={createChartConfig(visibleCharts[0])} 
                options={visibleCharts[0].options} 
              />
            ) : visibleCharts[0].type === 'post-connection-control' ? (
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

        {activeTab !== 'control' && activeTab !== 'pre-connection-control' && 
         activeTab !== 'post-connection-control' && visibleCharts[1] && (
          <div className="chart">
            {visibleCharts[1].data && (
              <Line 
                data={createChartConfig(visibleCharts[1])} 
                options={visibleCharts[1].options} 
              />
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
              {showBenchmarks && (
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></div>
                  <div className="legend-label">ROP Benchmark ({benchmarks.rop} ft/hr)</div>
                </div>
              )}
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
                {showBenchmarks && (
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></div>
                    <div className="legend-label">ROP Benchmark ({benchmarks.rop} ft/hr)</div>
                  </div>
                )}
              </>
          ) : activeTab === 'pre-connection-control' ? (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: CHART_COLORS.preConnectionControl }}></div>
                <div className="legend-label">Pre-Connection Control</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: CHART_COLORS.preConnectionManual }}></div>
                <div className="legend-label">Pre-Connection Manual</div>
              </div>
              {showBenchmarks && (
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></div>
                  <div className="legend-label">Benchmark ({(benchmarks.preConnection / 60).toFixed(1)} min)</div>
                </div>
              )}
            </>
          ) : activeTab === 'post-connection-control' ? (
            <>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: CHART_COLORS.postConnectionControl }}></div>
                <div className="legend-label">Post-Connection Control</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: CHART_COLORS.postConnectionManual }}></div>
                <div className="legend-label">Post-Connection Manual</div>
              </div>
              {showBenchmarks && (
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></div>
                  <div className="legend-label">Benchmark ({(benchmarks.postConnection / 60).toFixed(1)} min)</div>
                </div>
              )}
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
          {showBenchmarks && (
            <div className="benchmarks-info">
              <span>Benchmarks active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

 

export default ChartPanel;