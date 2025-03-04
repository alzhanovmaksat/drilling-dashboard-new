import * as XLSX from 'xlsx';

// Read drilling data from Excel file
export const readDrillingDataFromExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet contains the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract headers (first row)
        const headers = jsonData[0];
        
        // Convert to array of objects with header keys
        const rows = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = {};
          jsonData[i].forEach((value, j) => {
            if (j < headers.length) {
              row[headers[j]] = value;
            }
          });
          rows.push(row);
        }
        
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Process drilling data from Excel into structured format
export const processExcelData = (rawData) => {
  // Filter valid data rows (ensure essential fields are present)
  const validData = rawData.filter(row => 
    row['StandIndex'] && 
    row['StartDepth(ft)'] && 
    row['EndDepth(ft)'] && 
    row['OnBottomRop(ft/h)']
  );
  
  if (validData.length === 0) {
    throw new Error("No valid drilling data found in the Excel file");
  }
  
  // Extract Well ID from first row
  const wellId = validData[0]['WellId'] || 'Unknown Well';
  
  // Process each row into a stand object
  const stands = validData.map(row => {
    // Parse stand index
    const standIndex = typeof row['StandIndex'] === 'string' ? parseInt(row['StandIndex']) : row['StandIndex'];
    
    // Parse depths
    const startDepth = typeof row['StartDepth(ft)'] === 'string' ? parseFloat(row['StartDepth(ft)']) : row['StartDepth(ft)'];
    const endDepth = typeof row['EndDepth(ft)'] === 'string' ? parseFloat(row['EndDepth(ft)']) : row['EndDepth(ft)'];
    
    // Parse dates (handling Excel date format)
    const startTime = row['StartTimeUTC'] ? (typeof row['StartTimeUTC'] === 'string' ? new Date(row['StartTimeUTC']) : new Date(row['StartTimeUTC'])) : new Date();
    const endTime = row['EndTimeUTC'] ? (typeof row['EndTimeUTC'] === 'string' ? new Date(row['EndTimeUTC']) : new Date(row['EndTimeUTC'])) : new Date();
    
    // Parse durations
    const rotaryDuration = row['RotaryDrillingDuration(s)'] !== undefined && row['RotaryDrillingDuration(s)'] !== null
      ? (typeof row['RotaryDrillingDuration(s)'] === 'string' ? parseFloat(row['RotaryDrillingDuration(s)']) : row['RotaryDrillingDuration(s)']) / 3600 : 0; // Convert to hours
    const slideDuration = row['SlideDrillingDuration(s)'] !== undefined && row['SlideDrillingDuration(s)'] !== null
      ? (typeof row['SlideDrillingDuration(s)'] === 'string' ? parseFloat(row['SlideDrillingDuration(s)']) : row['SlideDrillingDuration(s)']) / 3600 : 0; // Convert to hours
    
    // Parse connection times
    const connectionTime = row['ConnectionDuration(s)'] !== undefined ? 
      (typeof row['ConnectionDuration(s)'] === 'string' ? parseFloat(row['ConnectionDuration(s)']) : row['ConnectionDuration(s)']) : 0;
    const preConnectionTime = row['PreConnectionDuration(s)'] !== undefined ? 
      (typeof row['PreConnectionDuration(s)'] === 'string' ? parseFloat(row['PreConnectionDuration(s)']) : row['PreConnectionDuration(s)']) : 0;
    const postConnectionTime = row['PostConnectionDuration(s)'] !== undefined ? 
      (typeof row['PostConnectionDuration(s)'] === 'string' ? parseFloat(row['PostConnectionDuration(s)']) : row['PostConnectionDuration(s)']) : 0;
    
    // Parse control vs manual for pre and post connection
    const preConnectionInControl = row['PreConnectionDurationInControl(s)'] !== undefined ?
      (typeof row['PreConnectionDurationInControl(s)'] === 'string' ? parseFloat(row['PreConnectionDurationInControl(s)']) : row['PreConnectionDurationInControl(s)']) : 0;
    const preConnectionOutControl = row['PreConnectionDurationOutControl(s)'] !== undefined ?
      (typeof row['PreConnectionDurationOutControl(s)'] === 'string' ? parseFloat(row['PreConnectionDurationOutControl(s)']) : row['PreConnectionDurationOutControl(s)']) : 0;
    const postConnectionInControl = row['PostConnectionDurationInControl(s)'] !== undefined ?
      (typeof row['PostConnectionDurationInControl(s)'] === 'string' ? parseFloat(row['PostConnectionDurationInControl(s)']) : row['PostConnectionDurationInControl(s)']) : 0;
    const postConnectionOutControl = row['PostConnectionDurationOutControl(s)'] !== undefined ?
      (typeof row['PostConnectionDurationOutControl(s)'] === 'string' ? parseFloat(row['PostConnectionDurationOutControl(s)']) : row['PostConnectionDurationOutControl(s)']) : 0;
    
    // Parse drilling parameters
    const rop = row['OnBottomRop(ft/h)'] !== undefined ? 
      (typeof row['OnBottomRop(ft/h)'] === 'string' ? parseFloat(row['OnBottomRop(ft/h)']) : row['OnBottomRop(ft/h)']) : 0;
    const wob = row['RotaryWobAvgInControl(1000 lbf)'] !== undefined ? 
      (typeof row['RotaryWobAvgInControl(1000 lbf)'] === 'string' ? parseFloat(row['RotaryWobAvgInControl(1000 lbf)']) : row['RotaryWobAvgInControl(1000 lbf)']) : 0;
    const rpm = row['RotaryRpmAvgInControl(c/min)'] !== undefined ? 
      (typeof row['RotaryRpmAvgInControl(c/min)'] === 'string' ? parseFloat(row['RotaryRpmAvgInControl(c/min)']) : row['RotaryRpmAvgInControl(c/min)']) : 0;
    const torque = row['RotaryTorqueAvgInControl(1000 lbf)'] !== undefined ? 
      (typeof row['RotaryTorqueAvgInControl(1000 lbf)'] === 'string' ? parseFloat(row['RotaryTorqueAvgInControl(1000 lbf)']) : row['RotaryTorqueAvgInControl(1000 lbf)']) : 0;
    const flowRate = row['RotaryFlowrateAvgInControl(bbl/d)'] !== undefined ? 
      (typeof row['RotaryFlowrateAvgInControl(bbl/d)'] === 'string' ? parseFloat(row['RotaryFlowrateAvgInControl(bbl/d)']) : row['RotaryFlowrateAvgInControl(bbl/d)']) : 0;
    
    // Calculate distance drilled
    const distanceDrilled = endDepth - startDepth;
    
    // Calculate control drilling percentage
    let controlDrillingPercent = 0;
    const drillingDurationInControl = row['DrillingDurationInControl(s)'] !== undefined ?
      (typeof row['DrillingDurationInControl(s)'] === 'string' ? parseFloat(row['DrillingDurationInControl(s)']) : row['DrillingDurationInControl(s)']) : 0;
    const drillingDurationOutControl = row['DrillingDurationOutControl(s)'] !== undefined ?
      (typeof row['DrillingDurationOutControl(s)'] === 'string' ? parseFloat(row['DrillingDurationOutControl(s)']) : row['DrillingDurationOutControl(s)']) : 0;
    
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
      isActive: false
    };
  });
  
  // Sort stands by ID for consistent display
  stands.sort((a, b) => a.id - b.id);
  
  // Set the latest stand as active
  if (stands.length > 0) {
    stands[stands.length - 1].isActive = true;
  }
  
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

  // Current parameters for dashboard display
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