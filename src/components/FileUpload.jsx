// src/components/FileUploader.jsx
import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { motion } from 'framer-motion';

const COLORS = {
  offWhite: '#EAEEE7',
  lightBlue: '#D3E1E9',
  deepGreen: '#3F5734',
  warmTan: '#C19D77',
  mutedBlue: '#6A8BA3',
  blackText: '#05090A'
};

const FileUploader = ({ onUploadSuccess, sessionId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus('idle');
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a file first!'); return; }
    if (!sessionId) { setError('Session ID is missing. Cannot upload.'); return; }

    setUploadStatus('uploading');
    setError('');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('session_id', sessionId);

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      const data = await response.json();
      setUploadStatus('success');
      onUploadSuccess(data);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Upload failed. Check the console and ensure the backend is running.');
      setUploadStatus('error');
    }
  };

  return (
    <div style={{ color: COLORS.blackText }}>
      <h2 className="text-2xl section-title mb-2">Phase 1: Data Ingestion</h2>
      <p style={{ color: COLORS.mutedBlue }} className="mb-6">
        Upload a dataset file. The data will be stored in your current session on the server.
      </p>

      {/* Upload card */}
      <div
        className="rounded-2xl p-6 shadow-md"
        style={{
          background: COLORS.offWhite,
          border: `2px dashed ${COLORS.lightBlue}`
        }}
      >
        {/* File input - hidden */}
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          className="hidden"
          accept=".csv,.xlsx,.xls,.json"
        />

        {/* Styled Choose File button */}
        <motion.label
          htmlFor="file-upload"
          whileTap={{ scale: 0.97 }}
          className="mb-4 block w-full font-body font-medium py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer text-center"
          style={{
            background: COLORS.mutedBlue,
            color: 'white',
            border: `1px solid ${COLORS.mutedBlue}`
          }}
        >
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose File'}
        </motion.label>

        {/* Upload button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleUpload}
          disabled={!selectedFile || uploadStatus === 'uploading'}
          className="w-full font-body font-medium py-3 px-4 rounded-xl shadow-sm transition-colors"
          style={{
            background: uploadStatus === 'uploading' ? COLORS.lightBlue : COLORS.mutedBlue,
            color: 'white',
            border: `1px solid ${COLORS.mutedBlue}`,
            opacity: uploadStatus === 'uploading' ? 0.7 : 1
          }}
        >
          {uploadStatus === 'uploading' ? 'Processing...' : 'Upload and Process File'}
        </motion.button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 font-semibold" style={{ color: 'red' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;