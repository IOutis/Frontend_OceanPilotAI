import React, { useState, useEffect, useRef } from 'react';
import {PlusIcon,ChevronDownIcon,UserIcon,BotIcon} from './HelperIcons';

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
      const response = await fetch('http://127.0.0.1:8000/uploadfile/', { method: 'POST', body: formData });
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
    <div className='text-black'>
      <h2 className="text-2xl font-bold mb-4">Phase 1: Data Ingestion</h2>
      <p className="text-gray-600 mb-6">Upload a dataset file. The data will be stored in your current session on the server.</p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input type="file" onChange={handleFileChange} className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        <button onClick={handleUpload} disabled={!selectedFile || uploadStatus === 'uploading'} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
          {uploadStatus === 'uploading' ? 'Processing...' : 'Upload and Process File'}
        </button>
      </div>
      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
    </div>
  );
};


export default FileUploader;
