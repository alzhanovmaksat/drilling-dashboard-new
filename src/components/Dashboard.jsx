import React, { useState, useEffect } from 'react';
import ChartPanel from './ChartPanel';
import OpsLimitsTracker from './OpsLimitsTracker';
import ConnectionKPI from './ConnectionKPI';
import FileUpload from './FileUpload';
import { readDrillingDataFromCSV, processDrillingData } from '../utils/csvDataProvider';
import { readDrillingDataFromExcel, processExcelData } from '../utils/excelDataProvider';
import './Dashboard.css';

function Dashboard() {

// State for drilling data
const [drillingParams, setDrillingParams] = useState({
  wob: 0,
  rop: 0,
  rpm: 0,
  torque: 0,
  pumpPressure: 0,
  flowRate: 0,
  depth: 0,
  rotaryDuration: 0,
  slideDuration: 0,
  stickSlipLevel: 0,
  connectionTime: 0,
  preConnectionTime: 0,
  postConnectionTime: 0,
  preConnectionInControl: 0,
  preConnectionOutControl: 0,
  postConnectionInControl: 0,
  postConnectionOutControl: 0,
  controlDrillingPercent: 0,
  rateStability: 75 // Default stability value
});

// Helper function to safely use toFixed on potentially undefined values
const safeToFixed = (value, decimals = 0) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.' + '0'.repeat(decimals);
  }
  return Number(value).toFixed(decimals);
};

// Helper function to safely access nested properties
const safeGet = (obj, path, defaultValue = null) => {
  try {
    const parts = path.split('.');
    let result = obj;
    
    for (const part of parts) {
      if (result === undefined || result === null) {
        return defaultValue;
      }
      result = result[part];
    }
    
    return result === undefined ? defaultValue : result;
  } catch (e) {
    console.warn(`Error accessing path ${path}:`, e);
    return defaultValue;
  }
};

// Helper to initialize drilling parameters
const initDrillingParams = () => ({
  wob: 0,
  rop: 0,
  rpm: 0,
  torque: 0,
  pumpPressure: 0,
  flowRate: 0,
  depth: 0,
  rotaryDuration: 0,
  slideDuration: 0,
  stickSlipLevel: 0,
  connectionTime: 0,
  preConnectionTime: 0,
  postConnectionTime: 0,
  preConnectionInControl: 0,
  preConnectionOutControl: 0,
  postConnectionInControl: 0,
  postConnectionOutControl: 0,
  controlDrillingPercent: 0,
  rateStability: 75 // Default stability value
});

// Helper to initialize drilling metrics
const initDrillingMetrics = () => ({
  totalDistanceDrilled: 0,
  totalControlDrillingPercent: 0,
  drillInControlDistance: 0,
  preConnectionControlPercent: 0,
  postConnectionControlPercent: 0,
  totalMeters: 0,
  drillInControlMeters: 0
});

// State for stand history
const [stands, setStands] = useState([]);

// State for filtered stands based on time range
const [filteredStands, setFilteredStands] = useState([]);

// State for well information
const [wellInfo, setWellInfo] = useState({
  wellId: 'Max',
  totalStands: 0,
  totalDepth: 0,
  currentStand: 0,
  section: '12 1/4'
});

// State for chart data
const [chartData, setChartData] = useState({
  rop: { labels: [], data: [] },
  wob: { labels: [], data: [] },
  depth: { labels: [], data: [] },
  torque: { labels: [], data: [] },
  rpm: { labels: [], data: [] },
  controlPercent: { labels: [], data: [] },
  connectionTime: { labels: [], data: [] },
  preConnectionTime: { labels: [], data: [] },
  postConnectionTime: { labels: [], data: [] },
  preConnectionControl: { labels: [], data: [] },
  preConnectionManual: { labels: [], data: [] },
  postConnectionControl: { labels: [], data: [] },
  postConnectionManual: { labels: [], data: [] }
});

// State for filtered chart data based on time range
const [filteredChartData, setFilteredChartData] = useState(chartData);

// State for data loading
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [hasData, setHasData] = useState(false);

// New state for selected stand from dropdown
const [selectedStandId, setSelectedStandId] = useState(null);

// New state for time range
const [timeRange, setTimeRange] = useState({
  start: null, 
  end: null
});

// State for active time preset
const [activePreset, setActivePreset] = useState('all');

// State for ops limit counts
const [opsLimits, setOpsLimits] = useState({
  wob: 0,
  torque: 0,
  rpm: 0,
  rop: 0,
  diffP: 0
});

// State for connection KPI data
const [connectionData, setConnectionData] = useState({
  connectionTime: 0,
  preConnectionTime: 0,
  postConnectionTime: 0,
  preConnectionInControl: 0,
  preConnectionOutControl: 0,
  postConnectionInControl: 0,
  postConnectionOutControl: 0
});

// Format date as YYYY-MM-DD
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Format time for display (seconds to MM:SS)
const formatTime = (seconds) => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get date for preset time ranges
const getDateForPreset = (preset) => {
  const now = new Date();
  let startDate;
  
  switch(preset) {
    case '12h':
      startDate = new Date(now.getTime() - (12 * 60 * 60 * 1000));
      return {
        start: formatDateForInput(startDate),
        end: formatDateForInput(now)
      };
    case '24h':
      startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      return {
        start: formatDateForInput(startDate),
        end: formatDateForInput(now)
      };
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      return {
        start: formatDateForInput(startDate),
        end: formatDateForInput(now)
      };
    case 'all':
    default:
      // For all data, find min and max dates in stands
      if (stands.length > 0) {
        const startTimes = stands
          .filter(stand => stand.startTime)
          .map(stand => new Date(stand.startTime).getTime());
        
        if (startTimes.length > 0) {
          const minTime = new Date(Math.min(...startTimes));
          return {
            start: formatDateForInput(minTime),
            end: formatDateForInput(now)
          };
        }
      }
      // Fallback to last 30 days if no stand data
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      return {
        start: formatDateForInput(startDate),
        end: formatDateForInput(now)
      };
  }
};

// Process connection time data from raw drilling data
const processConnectionTimeData = (rawData) => {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return {
      connectionTimeSeries: { labels: [], data: [] },
      preConnectionTimeSeries: { labels: [], data: [] },
      postConnectionTimeSeries: { labels: [], data: [] },
      preConnectionControlSeries: { labels: [], data: [] },
      preConnectionManualSeries: { labels: [], data: [] },
      postConnectionControlSeries: { labels: [], data: [] },
      postConnectionManualSeries: { labels: [], data: [] },
      avgConnectionTime: 0,
      avgPreConnectionTime: 0,
      avgPostConnectionTime: 0,
      avgPreConnectionInControl: 0,
      avgPreConnectionOutControl: 0,
      avgPostConnectionInControl: 0,
      avgPostConnectionOutControl: 0
    };
  }
  
  // Extract connection time related data
  const connectionTimeData = rawData.map(row => ({
    standIndex: parseInt(row['StandIndex'] || 0),
    connectionDuration: parseFloat(row['ConnectionDuration(s)'] || 0),
    preConnectionDuration: parseFloat(row['PreConnectionDuration(s)'] || 0),
    postConnectionDuration: parseFloat(row['PostConnectionDuration(s)'] || 0),
    preConnectionInControl: parseFloat(row['PreConnectionDurationInControl(s)'] || 0),
    preConnectionOutControl: parseFloat(row['PreConnectionDurationOutControl(s)'] || 0),
    postConnectionInControl: parseFloat(row['PostConnectionDurationInControl(s)'] || 0),
    postConnectionOutControl: parseFloat(row['PostConnectionDurationOutControl(s)'] || 0)
  }));
  
  // Calculate average values for the current set
  const validConnTimeData = connectionTimeData.filter(item => !isNaN(item.connectionDuration));
  const avgConnectionTime = validConnTimeData.length > 0 
    ? validConnTimeData.reduce((sum, item) => sum + item.connectionDuration, 0) / validConnTimeData.length 
    : 0;
  
  const validPreConnTimeData = connectionTimeData.filter(item => !isNaN(item.preConnectionDuration));
  const avgPreConnectionTime = validPreConnTimeData.length > 0 
    ? validPreConnTimeData.reduce((sum, item) => sum + item.preConnectionDuration, 0) / validPreConnTimeData.length 
    : 0;
  
  const validPostConnTimeData = connectionTimeData.filter(item => !isNaN(item.postConnectionDuration));
  const avgPostConnectionTime = validPostConnTimeData.length > 0 
    ? validPostConnTimeData.reduce((sum, item) => sum + item.postConnectionDuration, 0) / validPostConnTimeData.length 
    : 0;
  
  const validPreConnInControlData = connectionTimeData.filter(item => !isNaN(item.preConnectionInControl));
  const avgPreConnectionInControl = validPreConnInControlData.length > 0 
    ? validPreConnInControlData.reduce((sum, item) => sum + item.preConnectionInControl, 0) / validPreConnInControlData.length 
    : 0;
  
  const validPreConnOutControlData = connectionTimeData.filter(item => !isNaN(item.preConnectionOutControl));
  const avgPreConnectionOutControl = validPreConnOutControlData.length > 0 
    ? validPreConnOutControlData.reduce((sum, item) => sum + item.preConnectionOutControl, 0) / validPreConnOutControlData.length 
    : 0;
  
  const validPostConnInControlData = connectionTimeData.filter(item => !isNaN(item.postConnectionInControl));
  const avgPostConnectionInControl = validPostConnInControlData.length > 0 
    ? validPostConnInControlData.reduce((sum, item) => sum + item.postConnectionInControl, 0) / validPostConnInControlData.length 
    : 0;
  
  const validPostConnOutControlData = connectionTimeData.filter(item => !isNaN(item.postConnectionOutControl));
  const avgPostConnectionOutControl = validPostConnOutControlData.length > 0 
    ? validPostConnOutControlData.reduce((sum, item) => sum + item.postConnectionOutControl, 0) / validPostConnOutControlData.length 
    : 0;
  
  // Create time series data for charts
  const connectionTimeSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.connectionDuration) ? 0 : item.connectionDuration)
  };
  
  const preConnectionTimeSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.preConnectionDuration) ? 0 : item.preConnectionDuration)
  };
  
  const postConnectionTimeSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.postConnectionDuration) ? 0 : item.postConnectionDuration)
  };

  const preConnectionControlSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.preConnectionInControl) ? 0 : item.preConnectionInControl)
  };

  const preConnectionManualSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.preConnectionOutControl) ? 0 : item.preConnectionOutControl)
  };

  const postConnectionControlSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.postConnectionInControl) ? 0 : item.postConnectionInControl)
  };

  const postConnectionManualSeries = {
    labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
    data: connectionTimeData.map(item => isNaN(item.postConnectionOutControl) ? 0 : item.postConnectionOutControl)
  };
  
  // Return processed data
  return {
    connectionTimeSeries,
    preConnectionTimeSeries,
    postConnectionTimeSeries,
    preConnectionControlSeries,
    preConnectionManualSeries,
    postConnectionControlSeries,
    postConnectionManualSeries,
    avgConnectionTime,
    avgPreConnectionTime,
    avgPostConnectionTime,
    avgPreConnectionInControl,
    avgPreConnectionOutControl,
    avgPostConnectionInControl,
    avgPostConnectionOutControl
  };
};

// Process operational limits data
const processOpsLimitsData = (rawData) => {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return {
      ropMaxCounts: { labels: [], data: [] },
      wobMaxCounts: { labels: [], data: [] },
      torqueMaxCounts: { labels: [], data: [] },
      rpmMaxCounts: { labels: [], data: [] },
      diffPMaxCounts: { labels: [], data: [] },
      totalRopMaxCount: 0,
      totalWobMaxCount: 0,
      totalTorqueMaxCount: 0,
      totalRpmMaxCount: 0,
      totalDiffPMaxCount: 0
    };
  }
  
  // Extract ops limits data
  const opsLimitsData = rawData.map(row => ({
    standIndex: parseInt(row['StandIndex'] || 0),
    ropMaxCount: parseInt(row['OpsLimitsRopMaxChangeCount'] || 0),
    wobMaxCount: parseInt(row['OpsLimitsWobMaxChangeCount'] || 0),
    torqueMaxCount: parseInt(row['OpsLimitsTorqueMaxChangeCount'] || 0),
    rpmMaxCount: parseInt(row['OpsLimitsRpmMaxChangeCount'] || 0),
    diffPMaxCount: parseInt(row['OpsLimitsDiffPMaxChangeCount'] || 0)
  }));
  
  // Calculate totals
  const totalRopMaxCount = opsLimitsData.reduce((sum, item) => sum + (item.ropMaxCount || 0), 0);
  const totalWobMaxCount = opsLimitsData.reduce((sum, item) => sum + (item.wobMaxCount || 0), 0);
  const totalTorqueMaxCount = opsLimitsData.reduce((sum, item) => sum + (item.torqueMaxCount || 0), 0);
  const totalRpmMaxCount = opsLimitsData.reduce((sum, item) => sum + (item.rpmMaxCount || 0), 0);
  const totalDiffPMaxCount = opsLimitsData.reduce((sum, item) => sum + (item.diffPMaxCount || 0), 0);
  
  // Create time series data for charts
  const ropMaxCounts = {
    labels: opsLimitsData.map(item => `Stand ${item.standIndex}`),
    data: opsLimitsData.map(item => item.ropMaxCount || 0)
  };
  
  const wobMaxCounts = {
    labels: opsLimitsData.map(item => `Stand ${item.standIndex}`),
    data: opsLimitsData.map(item => item.wobMaxCount || 0)
  };
  
  const torqueMaxCounts = {
    labels: opsLimitsData.map(item => `Stand ${item.standIndex}`),
    data: opsLimitsData.map(item => item.torqueMaxCount || 0)
  };
  
  const rpmMaxCounts = {
    labels: opsLimitsData.map(item => `Stand ${item.standIndex}`),
    data: opsLimitsData.map(item => item.rpmMaxCount || 0)
  };
  
  const diffPMaxCounts = {
    labels: opsLimitsData.map(item => `Stand ${item.standIndex}`),
    data: opsLimitsData.map(item => item.diffPMaxCount || 0)
  };
  
  return {
    ropMaxCounts,
    wobMaxCounts,
    torqueMaxCounts,
    rpmMaxCounts,
    diffPMaxCounts,
    totalRopMaxCount,
    totalWobMaxCount,
    totalTorqueMaxCount,
    totalRpmMaxCount,
    totalDiffPMaxCount
  };
};

// Handle file upload
const handleFileUpload = async (file) => {
  if (!file) return;
  
  setIsLoading(true);
  setError(null);
  
  try {
    let rawData;
    let processedData;
    
    // Check file extension to determine how to read it
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    console.log("Uploading file:", file.name, "with extension:", fileExtension);
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      console.log("Processing as Excel file");
      rawData = await readDrillingDataFromExcel(file);
      processedData = processExcelData(rawData);
    } else {
      // Handle CSV/TXT files
      console.log("Processing as text/CSV file");
      rawData = await readDrillingDataFromCSV(file);
      processedData = processDrillingData(rawData);
    }
    
    console.log("Raw data count:", rawData.length);
    
    if (!processedData.stands || processedData.stands.length === 0) {
      throw new Error("No valid drilling data found in the file");
    }
    
    console.log("Processed stands:", processedData.stands.length);
    
    // Make sure stand IDs are properly set and sorted
    const sortedStands = processedData.stands.map((stand, index) => ({
      ...stand,
      id: stand.id || index + 1
    })).sort((a, b) => a.id - b.id);
    
    console.log("Sample stand:", sortedStands[0]);
    
    // Process connection time data
    const connectionTimeData = processConnectionTimeData(rawData);
    
    // Process operational limits data
    const opsLimitsData = processOpsLimitsData(rawData);
    
    // Update chart data with connection time series
    const updatedChartData = {
      ...processedData.timeSeriesData,
      connectionTime: connectionTimeData.connectionTimeSeries,
      preConnectionTime: connectionTimeData.preConnectionTimeSeries,
      postConnectionTime: connectionTimeData.postConnectionTimeSeries,
      preConnectionControl: connectionTimeData.preConnectionControlSeries,
      preConnectionManual: connectionTimeData.preConnectionManualSeries,
      postConnectionControl: connectionTimeData.postConnectionControlSeries,
      postConnectionManual: connectionTimeData.postConnectionManualSeries
    };
    
    // Update drilling parameters with connection time data
    const updatedDrillingParams = {
      ...processedData.currentParams,
      connectionTime: connectionTimeData.avgConnectionTime,
      preConnectionTime: connectionTimeData.avgPreConnectionTime,
      postConnectionTime: connectionTimeData.avgPostConnectionTime,
      preConnectionInControl: connectionTimeData.avgPreConnectionInControl,
      preConnectionOutControl: connectionTimeData.avgPreConnectionOutControl,
      postConnectionInControl: connectionTimeData.avgPostConnectionInControl,
      postConnectionOutControl: connectionTimeData.avgPostConnectionOutControl
    };

    // Update connection KPI data
    const updatedConnectionData = {
      connectionTime: connectionTimeData.avgConnectionTime,
      preConnectionTime: connectionTimeData.avgPreConnectionTime,
      postConnectionTime: connectionTimeData.avgPostConnectionTime,
      preConnectionInControl: connectionTimeData.avgPreConnectionInControl,
      preConnectionOutControl: connectionTimeData.avgPreConnectionOutControl,
      postConnectionInControl: connectionTimeData.avgPostConnectionInControl,
      postConnectionOutControl: connectionTimeData.avgPostConnectionOutControl
    };
    
    // Update ops limits state
    const updatedOpsLimits = {
      rop: opsLimitsData.totalRopMaxCount,
      wob: opsLimitsData.totalWobMaxCount,
      torque: opsLimitsData.totalTorqueMaxCount,
      rpm: opsLimitsData.totalRpmMaxCount,
      diffP: opsLimitsData.totalDiffPMaxCount
    };
    
    // Override wellId with Max Test and section with 12 1/4
    const updatedWellInfo = {
      ...processedData.wellInfo,
      wellId: 'Max Test',
      section: '12 1/4'
    };
    
    // Set the selectedStandId to the most recent stand
    const mostRecentStandId = sortedStands[sortedStands.length - 1].id;
    setSelectedStandId(mostRecentStandId);
    
    // Update state with processed data
    setStands(sortedStands);
    
    // Set time range to all data by default
    const initialTimeRange = getDateForPreset('all');
    setTimeRange(initialTimeRange);
    setActivePreset('all');
    
    // Filter data with the initial time range
    const filteredData = filterDataByTimeRange(sortedStands, updatedChartData, initialTimeRange);
    setFilteredStands(filteredData.filteredStands);
    setFilteredChartData(filteredData.filteredChartData);
    
    setDrillingParams(updatedDrillingParams);
    setChartData(updatedChartData);
    setWellInfo(updatedWellInfo);
    setConnectionData(updatedConnectionData);
    setOpsLimits(updatedOpsLimits);
    
    setHasData(true);
    
    // Start simulation for real-time effect
    startDataSimulation(sortedStands, connectionTimeData);
    
  } catch (err) {
    console.error("Error processing file:", err);
    setError(`Failed to process file: ${err.message}`);
  } finally {
    setIsLoading(false);
  }
};

// Handle stand selection from dropdown
const handleStandDropdownChange = (e) => {
  const standId = parseInt(e.target.value);
  handleStandSelect(standId);
};

// Handle time preset selection
const handleTimePresetChange = (preset) => {
  setActivePreset(preset);
  const newTimeRange = getDateForPreset(preset);
  setTimeRange(newTimeRange);
  
  // Filter data by the new time range
  const filteredData = filterDataByTimeRange(stands, chartData, newTimeRange);
  setFilteredStands(filteredData.filteredStands);
  setFilteredChartData(filteredData.filteredChartData);
};

// Handle time range change from date inputs
const handleTimeRangeChange = (e, field) => {
  const newTimeRange = {
    ...timeRange,
    [field]: e.target.value
  };
  
  setTimeRange(newTimeRange);
  setActivePreset('custom'); // Switch to custom preset when manually changing dates
  
  // Filter data by the new time range
  const filteredData = filterDataByTimeRange(stands, chartData, newTimeRange);
  setFilteredStands(filteredData.filteredStands);
  setFilteredChartData(filteredData.filteredChartData);
};

// Filter data by time range
const filterDataByTimeRange = (standsToFilter, originalChartData, range) => {
  if (!standsToFilter || standsToFilter.length === 0) {
    return {
      filteredStands: [],
      filteredChartData: originalChartData
    };
  }
  
  const startDate = range.start ? new Date(range.start) : new Date(0); // Jan 1, 1970 if no start date
  const endDate = range.end ? new Date(range.end) : new Date(); // Current date if no end date
  
  // Make sure endDate is set to the end of the day for inclusive comparison
  endDate.setHours(23, 59, 59, 999);
  
  // Filter stands based on date range
  const newFilteredStands = standsToFilter.filter(stand => {
    if (!stand.startTime) return true; // Include stands without timestamps
    
    const standDate = new Date(stand.startTime);
    return standDate >= startDate && standDate <= endDate;
  });
  
  // Filter chart data based on stand indices
  const filteredIndices = new Set(newFilteredStands.map(stand => stand.id));
  
  // Create filtered chart data
  const newFilteredChartData = {};
  
  // For each chart type (rop, wob, etc.)
  Object.keys(originalChartData).forEach(key => {
    const originalData = originalChartData[key];
    
    // If data exists
    if (originalData && originalData.labels) {
      // Create filtered arrays
      const filteredLabels = [];
      const filteredData = [];
      
      // Loop through original data
      for (let i = 0; i < originalData.labels.length; i++) {
        const standLabel = originalData.labels[i];
        const standIdMatch = standLabel.match(/Stand (\d+)/);
        
        if (standIdMatch) {
          const standId = parseInt(standIdMatch[1]);
          
          // If stand ID is in our filtered set, include it
          if (filteredIndices.has(standId)) {
            filteredLabels.push(originalData.labels[i]);
            filteredData.push(originalData.data[i]);
          }
        }
      }
      
      // Add filtered data to new chart data object
      newFilteredChartData[key] = {
        labels: filteredLabels,
        data: filteredData
      };
    } else {
      // If no data exists, use empty arrays
      newFilteredChartData[key] = { labels: [], data: [] };
    }
  });
  
  return {
    filteredStands: newFilteredStands,
    filteredChartData: newFilteredChartData
  };
};

// Handle stand selection
const handleStandSelect = (standId) => {
  try {
    if (!standId) return; // Guard against null/undefined standId
    
    setSelectedStandId(standId);
  
    // Safely set stands with active flag
    setStands(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.map(stand => ({
        ...stand,
        isActive: stand && stand.id === standId
      }));
    });
    
    // When a stand is selected, update the parameters display
    const currentSelectedStand = stands && Array.isArray(stands) 
      ? stands.find(stand => stand && stand.id === standId) 
      : null;
    
    // Initialize a default safeParams object first
    let safeParams = initDrillingParams(); // Use the utility function you already have
    
    if (currentSelectedStand) {
      // Update safeParams with the selected stand data
      safeParams = {
        wob: currentSelectedStand.wob || 0,
        rop: currentSelectedStand.rop || 0,
        rpm: currentSelectedStand.rpm || 0,
        torque: currentSelectedStand.torque || 0,
        flowRate: currentSelectedStand.flowRate || 0,
        depth: currentSelectedStand.depth || 0,
        rotaryDuration: currentSelectedStand.rotaryDuration || 0,
        slideDuration: currentSelectedStand.slideDuration || 0,
        stickSlipLevel: 0, 
        
        // Default value as we don't have this in stand history
        connectionTime: currentSelectedStand.connectionTime || 0,
        preConnectionTime: currentSelectedStand.preConnectionTime || 0,
        postConnectionTime: currentSelectedStand.postConnectionTime || 0,
        preConnectionInControl: currentSelectedStand.preConnectionInControl || 0,
        preConnectionOutControl: currentSelectedStand.preConnectionOutControl || 0,
        postConnectionInControl: currentSelectedStand.postConnectionInControl || 0,
        postConnectionOutControl: currentSelectedStand.postConnectionOutControl || 0,
        controlDrillingPercent: currentSelectedStand.controlDrillingPercent || 0,
        rateStability: Math.floor(70 + Math.random() * 20) // Random stability for demo
      };
    }
    
    setDrillingParams(safeParams);
  } catch (error) {
    console.error("Error in handleStandSelect:", error);
    // Don't update state if there's an error to avoid further issues
  }
};
    
// Calculate drilling metrics
const calculateDrillingMetrics = (standsToCalculate = filteredStands) => {
  try {
    // If no stands or empty array, return zero values
    if (!standsToCalculate || !Array.isArray(standsToCalculate) || standsToCalculate.length === 0) {
      return initDrillingMetrics(); // Return default metrics
    }
    
    // Use safe reducer to avoid undefined access
    const safeReduceSum = (array, keyFn, defaultValue = 0) => {
      if (!array || !Array.isArray(array)) return defaultValue;
      return array.reduce((sum, item) => {
        if (!item) return sum; // Skip null/undefined items
        const value = keyFn(item);
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    };
    
    // Calculate total distance drilled safely
    const totalDistanceDrilled = safeReduceSum(standsToCalculate, stand => stand.distanceDrilled || 0);
    
    // Calculate weighted average of control drilling percent
    const weightedControlSum = safeReduceSum(standsToCalculate, 
      stand => ((stand.controlDrillingPercent || 0) * (stand.distanceDrilled || 0)));
    
    const totalControlDrillingPercent = totalDistanceDrilled > 0 ? 
      (weightedControlSum / totalDistanceDrilled) : 0;
    
    // Calculate control distances
    const drillInControlDistance = totalDistanceDrilled * (totalControlDrillingPercent / 100);
    
    // Calculate connection control percentages
    const totalPreConnectionTime = safeReduceSum(standsToCalculate, stand => stand.preConnectionTime || 0);
    const totalPreConnectionInControl = safeReduceSum(standsToCalculate, stand => stand.preConnectionInControl || 0);
    
    const preConnectionControlPercent = totalPreConnectionTime > 0 
      ? (totalPreConnectionInControl / totalPreConnectionTime) * 100 
      : 0;
    
    const totalPostConnectionTime = safeReduceSum(standsToCalculate, stand => stand.postConnectionTime || 0);
    const totalPostConnectionInControl = safeReduceSum(standsToCalculate, stand => stand.postConnectionInControl || 0);
    
    const postConnectionControlPercent = totalPostConnectionTime > 0 
      ? (totalPostConnectionInControl / totalPostConnectionTime) * 100 
      : 0;
    
    // Convert to meters
    const totalMeters = totalDistanceDrilled * 0.3048; // Convert feet to meters
    const drillInControlMeters = drillInControlDistance * 0.3048; // Convert feet to meters
    
    return {
      totalDistanceDrilled,
      totalControlDrillingPercent,
      drillInControlDistance,
      preConnectionControlPercent,
      postConnectionControlPercent,
      totalMeters,
      drillInControlMeters
    };
  } catch (error) {
    console.error("Error in calculateDrillingMetrics:", error);
    return initDrillingMetrics(); // Return default metrics on error
  }
};

// Calculate operational limits metrics
const calculateOpsLimitsMetrics = (standsToCalculate = filteredStands) => {
  try {
    // If no stands or empty array, return zero values
    if (!standsToCalculate || !Array.isArray(standsToCalculate) || standsToCalculate.length === 0) {
      return {
        totalRopMaxCount: 0,
        totalWobMaxCount: 0,
        totalTorqueMaxCount: 0,
        totalRpmMaxCount: 0,
        totalDiffPMaxCount: 0
      };
    }
    
    // Calculate total operations limits occurrences
    const totalRopMaxCount = standsToCalculate.reduce((sum, stand) => 
      sum + (stand.opsLimitRopMaxCount || 0), 0);
    
    const totalWobMaxCount = standsToCalculate.reduce((sum, stand) => 
      sum + (stand.opsLimitWobMaxCount || 0), 0);
    
    const totalTorqueMaxCount = standsToCalculate.reduce((sum, stand) => 
      sum + (stand.opsLimitTorqueMaxCount || 0), 0);
    
    const totalRpmMaxCount = standsToCalculate.reduce((sum, stand) => 
      sum + (stand.opsLimitRpmMaxCount || 0), 0);
    
    const totalDiffPMaxCount = standsToCalculate.reduce((sum, stand) => 
      sum + (stand.opsLimitDiffPMaxCount || 0), 0);
    
    return {
      totalRopMaxCount,
      totalWobMaxCount,
      totalTorqueMaxCount,
      totalRpmMaxCount,
      totalDiffPMaxCount
    };
  } catch (error) {
    console.error("Error in calculateOpsLimitsMetrics:", error);
    return {
      totalRopMaxCount: 0,
      totalWobMaxCount: 0,
      totalTorqueMaxCount: 0,
      totalRpmMaxCount: 0,
      totalDiffPMaxCount: 0
    };
  }
};

// Helper function for calculating control percentages
const calculateControlPercent = (inControl, outControl) => {
  const total = inControl + outControl;
  if (total === 0) return 0;
  return (inControl / total) * 100;
};

// Optional: Simulate real-time updates for demonstration
const startDataSimulation = (standsData, connectionTimeData) => {
  // Clear any existing simulation
  if (window.simulationInterval) {
    clearInterval(window.simulationInterval);
  }
  
  // Skip simulation if insufficient data
  if (!standsData || standsData.length < 3) return;
  
  // Find the active stand
  const activeStand = standsData.find(stand => stand.isActive) || standsData[0];
  
  // Create an interval to update parameters
  window.simulationInterval = setInterval(() => {
    // Add small variations to simulate real-time data
    setDrillingParams(prev => ({
      ...prev,
      wob: parseFloat((prev.wob + (Math.random() - 0.5) * 0.2).toFixed(2)),
      rop: parseFloat((prev.rop + (Math.random() - 0.5) * 1.0).toFixed(1)),
      rpm: parseFloat((prev.rpm + (Math.random() - 0.5) * 0.5).toFixed(1)),
      torque: parseFloat((prev.torque + (Math.random() - 0.5) * 0.05).toFixed(3)),
      pumpPressure: parseFloat((prev.pumpPressure + (Math.random() - 0.5) * 5).toFixed(0)),
      flowRate: parseFloat((prev.flowRate + (Math.random() - 0.5) * 50).toFixed(0)),
      depth: parseFloat((prev.depth + 0.01).toFixed(2)),
      connectionTime: prev.connectionTime,
      preConnectionTime: prev.preConnectionTime,
      postConnectionTime: prev.postConnectionTime,
      preConnectionInControl: prev.preConnectionInControl,
      preConnectionOutControl: prev.preConnectionOutControl,
      postConnectionInControl: prev.postConnectionInControl,
      postConnectionOutControl: prev.postConnectionOutControl,
      controlDrillingPercent: Math.min(100, Math.max(0, prev.controlDrillingPercent + (Math.random() - 0.5) * 2)),
      rateStability: Math.min(100, Math.max(0, prev.rateStability + (Math.random() - 0.5) * 3))
    }));
    
    // Occasionally update the connection times
    if (Math.random() > 0.7) {
      setConnectionData(prev => ({
        ...prev,
        connectionTime: parseFloat((prev.connectionTime + (Math.random() - 0.5) * 5).toFixed(0)),
        preConnectionTime: parseFloat((prev.preConnectionTime + (Math.random() - 0.5) * 3).toFixed(0)),
        postConnectionTime: parseFloat((prev.postConnectionTime + (Math.random() - 0.5) * 3).toFixed(0)),
        preConnectionInControl: parseFloat((prev.preConnectionInControl + (Math.random() - 0.5) * 2).toFixed(0)),
        preConnectionOutControl: parseFloat((prev.preConnectionOutControl + (Math.random() - 0.5) * 2).toFixed(0)),
        postConnectionInControl: parseFloat((prev.postConnectionInControl + (Math.random() - 0.5) * 2).toFixed(0)),
        postConnectionOutControl: parseFloat((prev.postConnectionOutControl + (Math.random() - 0.5) * 2).toFixed(0))
      }));
    }
    
    // Occasionally update operational limits
    if (Math.random() > 0.9) {
      setOpsLimits(prev => ({
        ...prev,
        rop: Math.max(0, prev.rop + Math.floor((Math.random() - 0.3) * 2)),
        wob: Math.max(0, prev.wob + Math.floor((Math.random() - 0.3) * 2)),
        torque: Math.max(0, prev.torque + Math.floor((Math.random() - 0.3) * 2)),
        rpm: Math.max(0, prev.rpm + Math.floor((Math.random() - 0.3) * 2)),
        diffP: Math.max(0, prev.diffP + Math.floor((Math.random() - 0.3) * 2))
      }));
    }
  }, 3000);
};

// Clean up simulation on component unmount
useEffect(() => {
  return () => {
    if (window.simulationInterval) {
      clearInterval(window.simulationInterval);
    }
  };
}, []);

// Calculate metrics for display
const drillingMetrics = calculateDrillingMetrics();

// Calculate ops limits metrics
const opsLimitsMetrics = calculateOpsLimitsMetrics();

// For demo purposes - hardcoded values to match the screenshot
const totalDuration = 0.57; // hours
const reportDate = "4/3/2025 3:30:09 AM";

// Calculate control percentages for the selected stand
const selectedStand = stands.find(stand => stand && stand.id === selectedStandId);
const preConnectionControlPercent = selectedStand ? 
  calculateControlPercent(selectedStand.preConnectionInControl || 0, selectedStand.preConnectionOutControl || 0) : 0;
const postConnectionControlPercent = selectedStand ? 
  calculateControlPercent(selectedStand.postConnectionInControl || 0, selectedStand.postConnectionOutControl || 0) : 0;
const totalConnectionControlPercent = selectedStand ? 
  calculateControlPercent(
    (selectedStand.preConnectionInControl || 0) + (selectedStand.postConnectionInControl || 0),
    (selectedStand.preConnectionOutControl || 0) + (selectedStand.postConnectionOutControl || 0)
  ) : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Left Column - Well Info and Metrics */}
        <div className="left-column">
          <div className="well-section">
            <div className="well-header">Well</div>
            <div className="well-value">{wellInfo.wellId}</div>
          </div>
          
          <div className="well-section">
            <div className="well-header">Section</div>
            <div className="well-value">{wellInfo.section}</div>
          </div>
          
          {/* KPI Boxes in the specified order */}
          {hasData && (
            <>
              <div className="kpi-box">
                <div className="kpi-header">Total Drilled (ft)</div>
                <div className="kpi-value">{safeToFixed(drillingMetrics?.totalDistanceDrilled, 2)}</div>
              </div>
  
              <div className="kpi-box">
                <div className="kpi-header">Drill In Control (ft)</div>
                <div className="kpi-value">{safeToFixed(drillingMetrics?.drillInControlDistance, 2)}</div>
              </div>
  
              <div className="kpi-box">
                <div className="kpi-header">Drilling In Control %</div>
                <div className="kpi-value">{safeToFixed(drillingMetrics?.totalControlDrillingPercent, 2)}</div>
              </div>
  
              <div className="kpi-box">
                <div className="kpi-header">Pre Conn Control %</div>
                <div className="kpi-value">{safeToFixed(drillingMetrics?.preConnectionControlPercent, 2)}</div>
              </div>
  
              <div className="kpi-box">
                <div className="kpi-header">Post Conn Control %</div>
                <div className="kpi-value">{safeToFixed(drillingMetrics?.postConnectionControlPercent, 2)}</div>
              </div>
  
              <div className="kpi-box">
                <div className="kpi-header">Stands Qty</div>
                <div className="kpi-value">{filteredStands?.length || 0}</div>
              </div>
            </>
          )}
          
          {/* Graph Placeholder */}
          <div className="depth-graph">
            {/* This would be a depth vs time graph component */}
          </div>
        </div>
        
        {/* Center Column - Charts and Parameters */}
        <div className="center-column">
          <div className="center-header">
            <div className="report-date-section">
              <div className="report-header">Report Date and Time</div>
              <div className="report-value">{reportDate}</div>
            </div>
            
            <div className="duration-section">
              <div className="duration-header">Total Duration (h)</div>
              <div className="duration-value">{totalDuration}</div>
            </div>
          </div>
          
          {/* Time Range Section Removed */}
          
          {/* Current Drilling Data Panel */}
          {hasData && (
            <div className="current-drilling-panel">
              <div className="panel-header">
                <h3>Current Drilling Data</h3>
              </div>
              <div className="drilling-data-grid">
                <div className="data-item">
                  <div className="data-label">WOB (klbs)</div>
                  <div className="data-value">{safeToFixed(drillingParams?.wob, 2)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">ROP (ft/hr)</div>
                  <div className="data-value">{safeToFixed(drillingParams?.rop, 1)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">RPM</div>
                  <div className="data-value">{safeToFixed(drillingParams?.rpm, 1)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">Torque (kft-lbs)</div>
                  <div className="data-value">{safeToFixed(drillingParams?.torque, 3)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">Depth (ft)</div>
                  <div className="data-value">{safeToFixed(drillingParams?.depth, 1)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">Control %</div>
                  <div className="data-value">{safeToFixed(drillingParams?.controlDrillingPercent, 1)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">Pump Pressure (psi)</div>
                  <div className="data-value">{safeToFixed(drillingParams?.pumpPressure, 0)}</div>
                </div>
                <div className="data-item">
                  <div className="data-label">Flow Rate (l/min)</div>
                  <div className="data-value">{safeToFixed(drillingParams?.flowRate, 0)}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Parameter Trends - Full Screen */}
          <div className="parameter-trends-container">
            {hasData && <ChartPanel chartData={filteredChartData} />}
          </div>
        </div>
        
        {/* Right Column - Stand Selector and Stand Details */}
        <div className="right-column">
          <div className="slb-logo">
            {/* SLB Logo */}
          </div>
          
          {/* Stand Selector in right corner */}
          <div className="stand-selector">
            <label htmlFor="stand-dropdown">Select Stand:</label>
            <select 
              id="stand-dropdown" 
              className="stand-dropdown"
              value={selectedStandId || ''}
              onChange={handleStandDropdownChange}
            >
              {filteredStands.map(stand => (
                <option key={stand.id} value={stand.id}>
                  Stand {stand.id} - {(stand.distanceDrilled || 0).toFixed(1)} ft
                </option>
              ))}
            </select>
          </div>
          
          {/* Selected Stand Details */}
          {selectedStandId && filteredStands && filteredStands.length > 0 && (
            <div className="selected-stand-details">
              <div className="selected-stand-header">Selected Stand Details</div>
              {(() => {
                try {
                  // Find the stand by ID and explicitly check for existence
                  const selectedStand = filteredStands.find(s => s && s.id === selectedStandId);
                  
                  // Bail out early if no stand is found
                  if (!selectedStand) {
                    return <div className="no-stand-data">Stand data not available</div>;
                  }
                  
                  // Render the stand details with safe access
                  return (
                    <>
                      <div className="selected-stand-item">
                        <span className="detail-label">Stand ID:</span>
                        <span className="detail-value">{selectedStandId}</span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">ROP:</span>
                        <span className="detail-value">
                          {safeToFixed(selectedStand.rop, 2)} ft/hr
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">WOB:</span>
                        <span className="detail-value">
                          {safeToFixed(selectedStand.wob, 2)} klbs
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Control %:</span>
                        <span className="detail-value">
                          {safeToFixed(selectedStand.controlDrillingPercent, 1)}%
                        </span>
                      </div>
                      
                      {/* Connection time breakdown details */}
                      <div className="selected-stand-item">
                        <span className="detail-label">Pre-Connection:</span>
                        <span className="detail-value">
                          {formatTime(selectedStand.preConnectionTime)}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Pre-Conn Control:</span>
                        <span className="detail-value">
                          {safeToFixed(preConnectionControlPercent, 0)}%
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Post-Connection:</span>
                        <span className="detail-value">
                          {formatTime(selectedStand.postConnectionTime)}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Post-Conn Control:</span>
                        <span className="detail-value">
                          {safeToFixed(postConnectionControlPercent, 0)}%
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Total Connection Time:</span>
                        <span className="detail-value">
                          {formatTime(selectedStand.connectionTime)}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Total Conn Control:</span>
                        <span className="detail-value">
                          {safeToFixed(totalConnectionControlPercent, 0)}%
                        </span>
                      </div>
                      
                      {/* Ops limits details */}
                      <div className="selected-stand-item">
                        <span className="detail-label">ROP Limits:</span>
                        <span className="detail-value">
                          {selectedStand.opsLimitRopMaxCount || 0}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">WOB Limits:</span>
                        <span className="detail-value">
                          {selectedStand.opsLimitWobMaxCount || 0}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">Torque Limits:</span>
                        <span className="detail-value">
                          {selectedStand.opsLimitTorqueMaxCount || 0}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">RPM Limits:</span>
                        <span className="detail-value">
                          {selectedStand.opsLimitRpmMaxCount || 0}
                        </span>
                      </div>
                      <div className="selected-stand-item">
                        <span className="detail-label">DiffP Limits:</span>
                        <span className="detail-value">
                          {selectedStand.opsLimitDiffPMaxCount || 0}
                        </span>
                      </div>
                    </>
                  );
                } catch (error) {
                  console.error("Error rendering selected stand details:", error);
                  return <div className="error-message">Error displaying stand details</div>;
                }
              })()}
            </div>
          )}
        </div>
      </div>
      
      {/* Operational Limits Tracker */}
      {hasData && (
        <div className="ops-limits-tracker-container">
          <OpsLimitsTracker stands={filteredStands} timeRange={timeRange} />
        </div>
      )}

      
      {!hasData && (
        <div className="file-upload-overlay">
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isLoading={isLoading} 
            error={error}
            acceptedFormats=".txt,.csv,.tsv,.xlsx,.xls"
          />
        </div>
      )}
    </div>
    );
}

export default Dashboard;





