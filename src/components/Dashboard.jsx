import React, { useState, useEffect } from 'react';
import Header from './Header';
import StandHistory from './StandHistory';
import ParametersPanel from './ParametersPanel';
import ChartPanel from './ChartPanel';
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
  
  // State for stand history
  const [stands, setStands] = useState([]);
  
  // State for well information
  const [wellInfo, setWellInfo] = useState({
    wellId: '',
    totalStands: 0,
    totalDepth: 0,
    currentStand: 0
  });
  
  // State for chart data
  const [chartData, setChartData] = useState({
    rop: { labels: [], data: [] },
    wob: { labels: [], data: [] },
    depth: { labels: [], data: [] },
    torque: { labels: [], data: [] },
    rpm: { labels: [], data: [] },
    controlPercent: { labels: [], data: [] },
    connectionTime: { labels: [], data: [] }
  });
  
  // State for data loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(false);
  
  // Process connection time data from raw drilling data
  const processConnectionTimeData = (rawData) => {
    // Extract connection time related data
    const connectionTimeData = rawData.map(row => ({
      standIndex: parseInt(row['StandIndex']),
      connectionDuration: parseFloat(row['ConnectionDuration(s)']),
      preConnectionDuration: parseFloat(row['PreConnectionDuration(s)']),
      postConnectionDuration: parseFloat(row['PostConnectionDuration(s)']),
      preConnectionInControl: parseFloat(row['PreConnectionDurationInControl(s)']),
      preConnectionOutControl: parseFloat(row['PreConnectionDurationOutControl(s)']),
      postConnectionInControl: parseFloat(row['PostConnectionDurationInControl(s)']),
      postConnectionOutControl: parseFloat(row['PostConnectionDurationOutControl(s)'])
    }));

    // Calculate average values for the current set
    const avgConnectionTime = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.connectionDuration) ? 0 : item.connectionDuration), 0) / connectionTimeData.length;
    
    const avgPreConnectionTime = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.preConnectionDuration) ? 0 : item.preConnectionDuration), 0) / connectionTimeData.length;
    
    const avgPostConnectionTime = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.postConnectionDuration) ? 0 : item.postConnectionDuration), 0) / connectionTimeData.length;
    
    const avgPreConnectionInControl = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.preConnectionInControl) ? 0 : item.preConnectionInControl), 0) / connectionTimeData.length;
    
    const avgPreConnectionOutControl = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.preConnectionOutControl) ? 0 : item.preConnectionOutControl), 0) / connectionTimeData.length;
    
    const avgPostConnectionInControl = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.postConnectionInControl) ? 0 : item.postConnectionInControl), 0) / connectionTimeData.length;
    
    const avgPostConnectionOutControl = connectionTimeData.reduce((sum, item) => 
      sum + (isNaN(item.postConnectionOutControl) ? 0 : item.postConnectionOutControl), 0) / connectionTimeData.length;
    
    // Create time series data for charts
    const connectionTimeSeries = {
      labels: connectionTimeData.map(item => `Stand ${item.standIndex}`),
      data: connectionTimeData.map(item => isNaN(item.connectionDuration) ? 0 : item.connectionDuration)
    };
    
    // Return processed data
    return {
      connectionTimeSeries,
      avgConnectionTime,
      avgPreConnectionTime,
      avgPostConnectionTime,
      avgPreConnectionInControl,
      avgPreConnectionOutControl,
      avgPostConnectionInControl,
      avgPostConnectionOutControl
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
      console.log("Sample stand:", processedData.stands[0]);
      
      // Process connection time data
      const connectionTimeData = processConnectionTimeData(rawData);
      
      // Update chart data with connection time series
      const updatedChartData = {
        ...processedData.timeSeriesData,
        connectionTime: connectionTimeData.connectionTimeSeries
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
      
      // Update state with processed data
      setStands(processedData.stands);
      setDrillingParams(updatedDrillingParams);
      setChartData(updatedChartData);
      setWellInfo(processedData.wellInfo);
      
      setHasData(true);
      
      // Start simulation for real-time effect
      startDataSimulation(processedData.stands, connectionTimeData);
      
    } catch (err) {
      console.error("Error processing file:", err);
      setError(`Failed to process file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle stand selection
  const handleStandSelect = (standId) => {
    setStands(prev => 
      prev.map(stand => ({
        ...stand,
        isActive: stand.id === standId
      }))
    );
    
    // When a stand is selected, update the parameters display
    const selectedStand = stands.find(stand => stand.id === standId);
    if (selectedStand) {
      setDrillingParams({
        wob: selectedStand.wob,
        rop: selectedStand.rop,
        rpm: selectedStand.rpm,
        torque: selectedStand.torque,
        flowRate: selectedStand.flowRate,
        depth: selectedStand.depth,
        rotaryDuration: selectedStand.rotaryDuration || 0,
        slideDuration: selectedStand.slideDuration || 0,
        stickSlipLevel: 0, // Default value as we don't have this in stand history
        connectionTime: selectedStand.connectionTime || 0,
        preConnectionTime: selectedStand.preConnectionTime || 0,
        postConnectionTime: selectedStand.postConnectionTime || 0,
        preConnectionInControl: selectedStand.preConnectionInControl || 0,
        preConnectionOutControl: selectedStand.preConnectionOutControl || 0,
        postConnectionInControl: selectedStand.postConnectionInControl || 0,
        postConnectionOutControl: selectedStand.postConnectionOutControl || 0,
        controlDrillingPercent: selectedStand.controlDrillingPercent || 0,
        rateStability: Math.floor(70 + Math.random() * 20) // Random stability for demo
      });
    }
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
  
  return (
    <div className="dashboard">
      <Header 
        wellId={wellInfo.wellId} 
        currentStand={wellInfo.currentStand} 
        totalDepth={wellInfo.totalDepth}
        totalStands={wellInfo.totalStands}
      />
      
      {!hasData ? (
        <div className="file-upload-container">
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isLoading={isLoading} 
            error={error}
            acceptedFormats=".txt,.csv,.tsv,.xlsx,.xls"
          />
        </div>
      ) : (
        <div className="dashboard-content">
          <StandHistory 
            stands={stands} 
            onStandSelect={handleStandSelect} 
          />
          
          <div className="main-content">
            <ParametersPanel parameters={drillingParams} />
            <ChartPanel chartData={chartData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;