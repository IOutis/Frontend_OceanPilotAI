import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, AreaChart, Area } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, ChartScatter, TrendingUp, Activity, Database, Upload, Settings, MessageSquare } from 'lucide-react';
import { Merge } from 'lucide-react';
import MergeComponent from './components/MergeComponent';

// --- Component Imports ---
// Assumes you have these components in the specified paths
import FileUploader from './components/FileUpload';
import DatasetPreview from './components/DatasetPreview';
import ColumnMapping from './components/ColumnMapping';
import Header from './components/Header';
import { PlusIcon, BotIcon, UserIcon } from './components/HelperIcons';
import Preprocessing from './components/Preprocessing';
import Analysis from './components/Analysis';
// --- Main Parent Component: App ---
function App() {
  const [sessionId, setSessionId] = useState(null);
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [activeView, setActiveView] = useState('ingestion');
  const [chatMessages, setChatMessages] = useState([{ from: 'bot', text: 'Hello! Upload a dataset to begin.' }]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [suggestedMappings, setSuggestedMappings] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const messagesEndRef = useRef(null);
  const activePhase = phaseHistory.find(p => p.id === activePhaseId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onopen = () => socket.send(JSON.stringify({ session_id: id }));
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      
      if (message.type === 'status_update') {
        setIsAgentThinking(true);
        setChatMessages(prev => [...prev, { from: 'bot', text: message.payload.message, isStatus: true }]);
      } else if (message.type === 'agent_response') {
        setIsAgentThinking(false);
        setChatMessages(prev => [...prev, message.payload]);
      } else if (message.type === 'mapping_suggestion') {
        setIsAgentThinking(false);
        setSuggestedMappings(message.payload);
        setChatMessages(prev => [...prev, { from: 'bot', text: 'I have some mapping suggestions for you. Please review them in the main panel.' }]);
      } else if (message.type === 'analysis_result') {
        setIsAgentThinking(false);
        // Handle analysis results from backend
        setAnalysisResults(message.payload);
        setChatMessages(prev => [...prev, { from: 'bot', text: `Generated ${message.payload.analysis_type} visualization for your data.` }]);
      }
    };
    return () => socket.close();
  }, []);

  const handleUploadSuccess = (metadata) => {
    const newPhase = { id: metadata.id, type: 'ingestion', name: `${metadata.filename}`, data: metadata };
    setPhaseHistory(prev => [...prev, newPhase]);
    setActivePhaseId(newPhase.id);
    setActiveView('preview');
  };
  const handleStartMerge = () => {
  setActiveView('merge');
  setActivePhaseId(null);
};
const handleConfirmMerge = (mergedData) => {
  // Create new merged phase following the same pattern as file uploads
  const newMergedPhase = {
    id: mergedData.id,
    type: 'ingestion', // Keep as ingestion so it works with existing flow
    name: mergedData.name,
    data: mergedData
  };

  setPhaseHistory(prev => [...prev, newMergedPhase]);
  setActivePhaseId(newMergedPhase.id);
  setActiveView('preview'); // Show preview of merged data
  
  // Add success message
  setChatMessages(prev => [...prev, { 
    from: 'bot', 
    text: `Successfully merged datasets into "${mergedData.name}". You can now preview, map, or analyze the merged data.` 
  }]);
};

  const handlePhaseSelect = (id) => {
    const selectedPhase = phaseHistory.find(p => p.id === id);
    if (!selectedPhase) return;
    setActivePhaseId(id);
    
    if (selectedPhase.type === 'preprocessing') {
      setActiveView('preprocessing');
    } else if (selectedPhase.type === 'analysis') {
      setActiveView('analysis');
    } else if (selectedPhase.mappings) {
      setActiveView('mapping');
    } else {
      setActiveView('preview');
    }
  };
  
  const handleStartMapping = () => {
    if (!activePhase) return;
    setSuggestedMappings(null);
    setActiveView('mapping');
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isAgentThinking || !sessionId) return;
    
    const userMessage = { from: 'user', text: messageText };
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText, 
          session_id: sessionId,
          context: activePhase,
          active_view: activeView 
        }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatMessages(prev => [...prev, { from: 'bot', text: 'Error: Could not connect to agent.' }]);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(chatInput);
    setChatInput('');
  };

  const handleAskAIForSuggestions = () => {
    handleSendMessage("Suggest mappings for all columns.");
  };

  const handleAskAIForAnalysis = (query) => {
    handleSendMessage(query);
  };
  
  const handleConfirmMapping = async (confirmedMappings) => {
    if (!activePhaseId || !sessionId) return;
    
    try {
      const response = await fetch('http://localhost:8000/mappings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          source_phase_id: activePhaseId,
          mappings: confirmedMappings,
        }),
      });
      
      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || "Failed to save mappings on the server.");
      }
      
      let originalPhaseName = '';
      const updatedHistory = phaseHistory.map(phase => {
        if (phase.id === activePhaseId) {
          originalPhaseName = phase.name;
          return { ...phase, mappings: confirmedMappings };
        }
        return phase;
      });

      const newPreprocessingPhase = {
        id: Date.now(),
        type: 'preprocessing',
        name: `Preprocess: ${originalPhaseName}`,
        sourcePhaseId: activePhaseId,
      };

      const newHistory = [...updatedHistory, newPreprocessingPhase];
      setPhaseHistory(newHistory);
      setActivePhaseId(newPreprocessingPhase.id);
      setActiveView('preprocessing');
      
    } catch (error) {
      console.error("Error confirming mapping:", error);
      alert(`Error: Could not save mappings. ${error.message}`);
    }
  };

  const handleStartAnalysis = () => {
    if (!activePhase) return;
    
    let originalPhaseName = '';
    const sourcePhase = phaseHistory.find(p => p.id === activePhase.sourcePhaseId) || activePhase;
    originalPhaseName = sourcePhase.name;
    
    const newAnalysisPhase = {
      id: Date.now() + 1000, // Ensure unique ID
      type: 'analysis',
      name: `Analysis: ${originalPhaseName}`,
      sourcePhaseId: sourcePhase.id,
    };

    setPhaseHistory(prev => [...prev, newAnalysisPhase]);
    setActivePhaseId(newAnalysisPhase.id);
    setActiveView('analysis');
  };

  const renderMainContent = () => {
    switch(activeView) {
      case 'ingestion':
        return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
      case 'preview':
        if (!activePhase) return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
        return <DatasetPreview phase={activePhase} onStartMapping={handleStartMapping} />;
      case 'mapping':
        if (!activePhase) return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
        return <ColumnMapping 
                  phase={activePhase} 
                  onAskAI={handleAskAIForSuggestions}
                  onConfirmMapping={handleConfirmMapping}
                  isAgentThinking={isAgentThinking}
                  suggestedMappings={suggestedMappings}
               />;
      case 'preprocessing':
        if (!activePhase) return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
        const sourcePhase = phaseHistory.find(p => p.id === activePhase.sourcePhaseId);
        return (
          <div>
            <Preprocessing phase={activePhase} sourcePhase={sourcePhase} sessionId={sessionId} />
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={handleStartAnalysis}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Start Analysis Phase
              </button>
            </div>
          </div>
        );
      
        case 'merge':
                return (
                  <MergeComponent 
                    phase={activePhase} 
                    sessionId={sessionId}
                    phaseHistory={phaseHistory}
                    onConfirmMerge={handleConfirmMerge}
                    isAgentThinking={isAgentThinking}
                  />
                );



      case 'analysis':
        if (!activePhase) return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
        const analysisSourcePhase = phaseHistory.find(p => p.id === activePhase.sourcePhaseId);
        return <Analysis 
                 phase={activePhase} 
                 sourcePhase={analysisSourcePhase} 
                 sessionId={sessionId}
                 onAskAI={handleAskAIForAnalysis}
                 isAgentThinking={isAgentThinking}
                 analysisResults={analysisResults}
               />;
      default:
        return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col font-sans">
      <Header phaseHistory={phaseHistory} onPhaseSelect={handlePhaseSelect} />
      
      <main className="flex-grow p-4 grid grid-cols-12 gap-4 overflow-hidden">
        
        <div className="col-span-2 bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h3 className="font-bold text-lg mb-4 border-b pb-2 text-black">Workflow History</h3>
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => { setActiveView('ingestion'); setActivePhaseId(null); }} 
              className={`text-left text-white p-2 rounded-md font-semibold flex items-center gap-2 ${activeView === 'ingestion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-black'}`}
            >
              <PlusIcon /> New Ingestion
            </button>
            
            <button 
              onClick={handleStartMerge} 
              className={`text-left text-white p-2 rounded-md font-semibold flex items-center gap-2 ${activeView === 'merge' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-black'}`}
            >
              <Merge className="h-4 w-4" /> Merge Datasets
            </button>
            
            <div className="border-t my-2"></div>
            
            {phaseHistory.map(phase => (
              <button 
                key={phase.id} 
                onClick={() => handlePhaseSelect(phase.id)} 
                className={`text-left text-white p-2 rounded-md font-semibold text-sm truncate flex items-center gap-2 ${activePhaseId === phase.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-black'}`}
              >
                {phase.type === 'analysis' && <BarChart3 className="h-4 w-4" />}
                {phase.type === 'preprocessing' && <Settings className="h-4 w-4" />}
                {phase.type === 'ingestion' && <Database className="h-4 w-4" />}
                <span className="truncate">{phase.name}</span>
                {phase.data?.is_merged && (
                  <span className="text-xs bg-purple-200 text-purple-800 px-1 rounded">M</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="col-span-7 bg-white p-6 rounded-lg shadow-md overflow-y-auto">
          {renderMainContent()}
        </div>
        
        <div className="col-span-3 bg-white rounded-lg shadow-md flex flex-col h-full overflow-y-auto">
          <h2 className="text-xl font-bold p-4 border-b text-black">LLM Assistant</h2>
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.from === 'user' ? 'justify-end' : ''}`}>
                {msg.from === 'bot' && <BotIcon />}
                <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.from === 'bot' ? (msg.isStatus ? 'bg-yellow-100 text-yellow-800 italic' : 'bg-gray-100 text-gray-800') : 'bg-blue-500 text-white'}`}>
                  {msg.text}
                </div>
                {msg.from === 'user' && <UserIcon />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-4 border-t flex gap-2">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              disabled={isAgentThinking} 
              placeholder={isAgentThinking ? "Agent is processing..." : "Ask about the active data..."} 
              className="flex-grow border rounded-md p-2 disabled:bg-gray-100 text-black"
            />
            <button 
              type="submit" 
              disabled={isAgentThinking} 
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Send
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}

export default App;