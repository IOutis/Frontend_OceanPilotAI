// API Configuration
// This file centralizes all API endpoint configurations

// Get base URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // File upload
  UPLOAD_FILE: `${API_BASE_URL}/uploadfile/`,
  
  // Chat
  CHAT: `${API_BASE_URL}/chat`,
  
  // WebSocket
  WEBSOCKET: `${WS_BASE_URL}/ws`,
  
  // Mappings
  CONFIRM_MAPPINGS: `${API_BASE_URL}/mappings/confirm`,
  
  // Preprocessing
  PREPROCESS_STATS: `${API_BASE_URL}/preprocess/stats`,
  NULL_IMPUTATION: `${API_BASE_URL}/preprocess/null_imputation`,
  
  // Playground
  PLAYGROUND_INFO: (sessionId, phaseId) => `${API_BASE_URL}/playground/${sessionId}/${phaseId}/info`,
  PLAYGROUND_DATA: `${API_BASE_URL}/playground/data`,
  
  // Merge
  MERGE_AVAILABLE: (sessionId) => `${API_BASE_URL}/merge/available/${sessionId}`,
   // Soil area endpoint (backend stub expects POST { polygon, samples })
   SOIL_AREA: `${API_BASE_URL}/soil/area`,
};

// Helper function to get WSL IP instructions
export const getWSLInstructions = () => {
  return `
To fix WSL connection issues:

1. Find your WSL IP address:
   - In WSL terminal, run: hostname -I
   - Or run: ip addr show eth0

2. Update your .env file:
   - Uncomment the WSL lines
   - Replace the IP address with your actual WSL IP
   - Example: VITE_API_BASE_URL=http://172.20.240.1:8000

3. Restart your frontend development server

4. Alternative: Run your backend with --host 0.0.0.0:
   - uvicorn main:app --host 0.0.0.0 --port 8000
`;
};

// Export base URLs for direct use
export { API_BASE_URL, WS_BASE_URL };