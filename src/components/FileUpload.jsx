import React, { useRef, useState } from 'react';

function FileUpload({ onFileUpload, isLoading, error, acceptedFormats = ".txt,.csv,.tsv,.xlsx,.xls" }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      // Auto-upload on drop
      onFileUpload(file);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileUpload(file);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const getFileSize = (size) => {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1048576) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / 1048576).toFixed(2) + ' MB';
    }
  };
  
  return (
    <div className="file-upload">
      <h2>Upload Your Drilling Data</h2>
      <p className="instructions">
        Upload your drilling data file to visualize on the dashboard.
        <strong>We now support Excel files (.xlsx, .xls) and tab-delimited text files (.txt, .tsv).</strong>
      </p>
      
      <div 
        className={`drop-area ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept={acceptedFormats}
          onChange={handleFileChange}
          className="file-input"
        />
        
        <div className="drop-content">
          <div className="icon">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 20H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p>Drag & drop your file here or</p>
          <button 
            type="button" 
            className="browse-button"
            onClick={handleButtonClick}
          >
            Browse Files
          </button>
          
          {selectedFile && (
            <div className="selected-file">
              <p>Selected: <strong>{selectedFile.name}</strong> ({getFileSize(selectedFile.size)})</p>
            </div>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Processing your data...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <div className="file-format-info">
        <h3>Supported File Formats</h3>
        <div className="format-options">
          <div className="format-option">
            <h4>Excel Files</h4>
            <p>.xlsx, .xls</p>
          </div>
          <div className="format-option">
            <h4>Text Files</h4>
            <p>.txt, .csv, .tsv (tab-delimited)</p>
          </div>
        </div>
        
        <h4 className="file-format-heading">Your file should contain data with these columns:</h4>
        <ul className="header-list">
          <li>WellId</li>
          <li>StandIndex</li>
          <li>StandType</li>
          <li>StartTimeUTC</li>
          <li>EndTimeUTC</li>
          <li>StartDepth(ft)</li>
          <li>EndDepth(ft)</li>
          <li>OnBottomRop(ft/h)</li>
          <li>And other drilling parameters</li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;