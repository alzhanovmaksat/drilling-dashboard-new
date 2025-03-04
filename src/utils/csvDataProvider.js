import Papa from 'papaparse';

// Read drilling data from CSV/TXT file
export const readDrillingDataFromCSV = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const data = parseCSVData(text);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

// Parse CSV/TXT data into structured array
const parseCSVData = (text) => {
  // Split into lines
  const lines = text.split('\n');
  
  // Extract headers from first line
  const headers = lines[0].split('\t');
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const values = line.split('\t');
      
      // Create object with header keys and row values
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
  }
  
  return data;
};

// Process drilling data into structured format for dashboard
export const processDrillingData = (rawData) => {
  // Filter valid data rows
  const validData = rawData.filter(row => 
    row['StandIndex'] && 
    row['StartDepth(ft)'] && 
    row['EndDepth(ft)'] && 
    row['OnBottomRop(ft/h)']
  );
  
  if (validData.length === 0) {
    throw new Error("No valid drilling data found");
  }
  
  // Extract Well ID from first row
  const wellId = validData[0]['WellId'] || 'Unknown Well';
  
  // Process each row into a stand object
  const stands = validData.map(row => {
    // Parse stand index
    const standIndex = parseInt(row['StandIndex']);
    
    // Parse depths
    const startDepth = parseFloat(row['StartDepth(ft)']);
    const endDepth = parseFloat(row['EndDepth(ft)']);
    
    // Parse dates
    const startTime = new Date(row['StartTimeUTC']);
    const endTime = new Date(row['EndTimeUTC']);
    
    // Parse durations
    const rotaryDuration = row['RotaryDrillingDuration(s)'] 
      ? parseFloat(row['RotaryDrillingDuration(s)']) / 3600 : 0; // Convert to hours
    const slideDuration = row['SlideDrillingDuration(s)'] 
      ? parseFloat(row['SlideDrillingDuration(s)']) / 3600 : 0; // Convert to hours
    
    // Parse connection times
    const connectionTime = row['ConnectionDuration(s)'] 
      ? parseFloat(row['ConnectionDuration(s)']) : 0;
    const preConnectionTime = row['PreConnectionDuration(s)'] 
      ? parseFloat(row['PreConnectionDuration(s)']) : 0;
    const postConnectionTime = row['PostConnectionDuration(s)'] 
      ? parseFloat(row['PostConnectionDuration(s)']) : 0;
    
    // Parse control vs manual for pre and post connection
    const preConnectionInControl = row['PreConnectionDurationInControl(s)']
      ? parseFloat(row['PreConnectionDurationInControl(s)']) : 0;
    const preConnectionOutControl = row['PreConnectionDurationOutControl(s)']
      ? parseFloat(row['PreConnectionDurationOutControl(s)']) : 0;
    const postConnectionInControl = row['PostConnectionDurationInControl(s)']
      ? parseFloat(row['PostConnectionDurationInControl(s)']) : 0;
    const postConnectionOutControl = row['PostConnectionDurationOutControl(s)']
      ? parseFloat(row['PostConnectionDurationOutControl(s)']) : 0;
    
    // Parse drilling parameters
    const rop = row['OnBottomRop(ft/h)'] ? parseFloat(row['OnBottomRop(ft/h)']) : 0;
    const wob = row['RotaryWobAvgInControl(1000 lbf)'] ? parseFloat(row['RotaryWobAvgInControl(1000 lbf)']) : 0;
    const rpm = row['RotaryRpmAvgInControl(c/min)'] ? parseFloat(row['RotaryRpmAvgInControl(c/min)']) : 0;
    const torque = row['RotaryTorqueAvgInControl(1000 lbf)'] ? parseFloat(row['RotaryTorqueAvgInControl(1000 lbf)']) : 0;
    const flowRate = row['RotaryFlowrateAvgInControl(bbl/d)'] ? parseFloat(row['RotaryFlowrateAvgInControl(bbl/d)']) : 0;
    
    // Calculate distance drilled
    const distanceDrilled = endDepth - startDepth;
    
    // Calculate control drilling percentage
    let controlDrillingPercent = 0;
    const drillingDurationInControl = row['DrillingDurationInControl(s)'] 
      ? parseFloat(row['DrillingDurationInControl(s)']) : 0;
    const drillingDurationOutControl = row['DrillingDurationOutControl(s)'] 
      ? parseFloat(row['DrillingDurationOutControl(s)']) : 0;
    
    const totalDrillingDuration = drillingDurationInControl + drillingDurationOutControl;
    if (totalDrillingDuration > 0) {
      controlDrillingPercent = Math.round((drillingDurationInControl / totalDrillingDuration) * 100);
    }
    
    // Format time range for display
    const timeRange = `${startTime.toLocaleDateString()} ${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    
    return {
      id: standIndex,
      title: `Stand ${standIndex}`,
      standType: 'Drilling',
      timeRange,
      depth: endDepth,
      rop,
      wob,
      rpm,
      torque,
      flowRate,
      startDepth,
      endDepth,
      distanceDrilled,
      rotaryDuration,
      slideDuration,
      connectionTime,
      preConnectionTime,
      postConnectionTime,
      preConnectionInControl,
      preConnectionOutControl,
      postConnectionInControl,
      postConnectionOutControl,
      controlDrillingPercent,
      isActive: standIndex === validData.length // Set the last stand as active
    };
  });
  
  // Sort stands by ID for consistent display
  stands.sort((a, b) => a.id - b.id);
  
  // Build time series data for charts
  const timeSeriesData = {
    rop: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.rop)
    },
    wob: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.wob)
    },
    rpm: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.rpm)
    },
    torque: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.torque)
    },
    depth: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.depth)
    },
    controlPercent: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.controlDrillingPercent)
    },
    connectionTime: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.connectionTime)
    },
    preConnectionTime: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.preConnectionTime)
    },
    postConnectionTime: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.postConnectionTime)
    },
    preConnectionControl: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.preConnectionInControl)
    },
    preConnectionManual: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.preConnectionOutControl)
    },
    postConnectionControl: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.postConnectionInControl)
    },
    postConnectionManual: {
      labels: stands.map(stand => `Stand ${stand.id}`),
      data: stands.map(stand => stand.postConnectionOutControl)
    }
  };
  
  // Extract current parameters from the latest stand
  const lastStand = stands[stands.length - 1];
  
  // Current stand information
  const currentParams = {
    wob: lastStand.wob,
    rop: lastStand.rop,
    rpm: lastStand.rpm,
    torque: lastStand.torque,
    flowRate: lastStand.flowRate,
    depth: lastStand.depth,
    rotaryDuration: lastStand.rotaryDuration,
    slideDuration: lastStand.slideDuration,
    connectionTime: lastStand.connectionTime,
    preConnectionTime: lastStand.preConnectionTime,
    postConnectionTime: lastStand.postConnectionTime,
    preConnectionInControl: lastStand.preConnectionInControl,
    preConnectionOutControl: lastStand.preConnectionOutControl,
    postConnectionInControl: lastStand.postConnectionInControl,
    postConnectionOutControl: lastStand.postConnectionOutControl,
    controlDrillingPercent: lastStand.controlDrillingPercent,
    stickSlipLevel: Math.floor(Math.random() * 10), // Random value for demo
    pumpPressure: Math.floor(Math.random() * 1000 + 2000) // Random value for demo
  };
  
  // Well information
  const wellInfo = {
    wellId: wellId,
    totalStands: stands.length,
    totalDepth: lastStand.depth,
    currentStand: lastStand.id
  };
  
  return {
    stands,
    timeSeriesData,
    currentParams,
    wellInfo
  };
};



