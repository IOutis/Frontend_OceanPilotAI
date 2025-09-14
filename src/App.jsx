import React, { useState, useEffect, useRef } from 'react';

// --- Component Imports ---
// Assumes you have these components in the specified paths
import FileUploader from './components/FileUpload';
import DatasetPreview from './components/DatasetPreview';
import ColumnMapping from './components/ColumnMapping';
import Header from './components/Header';
import { PlusIcon, BotIcon, UserIcon } from './components/HelperIcons';

// --- Main Parent Component: App ---
function App() {
  // --- State Management ---
  const [sessionId, setSessionId] = useState(null);
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [activeView, setActiveView] = useState('ingestion'); // 'ingestion', 'preview', 'mapping'
  const [chatMessages, setChatMessages] = useState([{ from: 'bot', text: 'Hello! Upload a dataset to begin.' }]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [allowChatInput,setAllowChatInput] = useState(true);
  const [suggestedMappings, setSuggestedMappings] = useState(null); 
  const messagesEndRef = useRef(null);
  
  // Derived state to find the currently active phase object
  const activePhase = phaseHistory.find(p => p.id === activePhaseId);

  // --- Effects ---
  // Effect for auto-scrolling the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Effect to set up Session ID and WebSocket connection on initial load
  useEffect(() => {
    const id = crypto.randomUUID();   // generate local ID
    setSessionId(id);

    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onopen = () => {
      socket.send(JSON.stringify({ session_id: id }))
      console.log("WebSocket connection established.");}
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      if (message.type === 'status_update') {
        setIsAgentThinking(true);
        setChatMessages(prev => [...prev, { from: 'bot', text: message.payload.message, isStatus: true }]);
      } else if (message.type === 'agent_response') {
        setIsAgentThinking(false);
        setChatMessages(prev => [...prev, message.payload]);
      } else if (message.type === 'mapping_suggestion') { // ADD THIS BLOCK
        setIsAgentThinking(false);
        setSuggestedMappings(message.payload);
        setChatMessages(prev => [...prev, { from: 'bot', text: 'I have some mapping suggestions for you. Please review them in the main panel.' }]);
      }
    };
    socket.onclose = () => console.log("WebSocket connection closed.");
    
    // Cleanup on component unmount
    return () => socket.close();
  }, []); // Empty dependency array ensures this runs only once

  // --- Handlers ---
  const handleUploadSuccess = (metadata) => {
    const newPhase = { id: Date.now(), type: 'ingestion', name: `${metadata.filename}`, data: metadata };
    setPhaseHistory(prev => [...prev, newPhase]);
    setActivePhaseId(newPhase.id);
    setActiveView('preview');
  };

  const handlePhaseSelect = (id) => {
    const selectedPhase = phaseHistory.find(p => p.id === id);
    if (!selectedPhase) return;

    setActivePhaseId(id);
    // If mappings exist for this phase, show the mapping view, otherwise show the preview
    if (selectedPhase.mappings) {
        setActiveView('mapping');
    } else {
        setActiveView('preview');
    }
  };
  const handleAskAIForSuggestions = async () => {
      const input = "Suggest mappings for all columns.";
      setChatMessages(prev => [...prev, input]);
      try {
        setAllowChatInput(false);
        await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: input, 
              session_id: sessionId,
              context: activePhase, 
              view: activeView    
            }),
        });
        setAllowChatInput(true);
    } catch (error) {
        console.error("Failed to send message:", error);
        setChatMessages(prev => [...prev, { from: 'bot', text: 'Error: Could not connect to agent.' }]);
    }
  };
  const handleConfirmMapping = (confirmedMappings) => {
      if (!activePhaseId) return;
      let originalPhaseName = '';

      // First, update the current phase with the confirmed mappings
      const updatedHistory = phaseHistory.map(phase => {
          if (phase.id === activePhaseId) {
              originalPhaseName = phase.name; // Get the name for the next phase
              return { ...phase, mappings: confirmedMappings };
          }
          return phase;
      });

      // Next, create a new phase for preprocessing
      const newPreprocessingPhase = {
          id: Date.now(),
          type: 'preprocessing',
          name: `Preprocess: ${originalPhaseName}`,
          // Link back to the phase that was just mapped
          sourcePhaseId: activePhaseId,
      };

      const newHistory = [...updatedHistory, newPreprocessingPhase];
      setPhaseHistory(newHistory);
      
      // Finally, switch the view to the new preprocessing phase
      setActivePhaseId(newPreprocessingPhase.id);
      setActiveView('preprocessing');
      
      alert("Mappings confirmed and saved! Proceeding to Preprocessing.");
  };
  
  const handleStartMapping = () => {
      if (!activePhase) return;
      setActiveView('mapping');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAgentThinking || !sessionId) return;
    
    const userMessage = { from: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    try {
        setAllowChatInput(false);
        await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: chatInput, 
              session_id: sessionId,
              context: activePhase, 
              view: activeView    
            }),
        });
        setAllowChatInput(true);
    } catch (error) {
        console.error("Failed to send message:", error);
        setChatMessages(prev => [...prev, { from: 'bot', text: 'Error: Could not connect to agent.' }]);
    }
  };

  // --- Render Logic ---
  const renderMainContent = () => {
      switch(activeView) {
          case 'ingestion':
              return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
          case 'preview':
              if (!activePhase) return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
              return <DatasetPreview phase={activePhase} onStartMapping={handleStartMapping} />;
          case 'mapping':
              if (!activePhase) return <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />;
              return <ColumnMapping phase={activePhase} 
                        onAskAI={handleAskAIForSuggestions}
                        onConfirmMapping={handleConfirmMapping}
                        isAgentThinking={isAgentThinking}
                        suggestedMappings={suggestedMappings} />;
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
                  className={`text-left p-2 rounded-md font-semibold flex items-center gap-2 ${activeView === 'ingestion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-white'}`}
                >
                    <PlusIcon /> New Ingestion
                </button>
                <div className="border-t my-2"></div>
                {phaseHistory.map(phase => (
                    <button 
                      key={phase.id} 
                      onClick={() => handlePhaseSelect(phase.id)} 
                      className={`text-left p-2 rounded-md font-semibold text-sm truncate ${activePhaseId === phase.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-white'}`}
                    >
                        {phase.name}
                    </button>
                ))}
            </nav>
        </div>

        <div className="col-span-7 bg-white p-6 rounded-lg shadow-md overflow-y-auto">
            {renderMainContent()}
        </div>
        
        <div className="col-span-3 bg-white rounded-lg shadow-md flex flex-col h-full overflow-y-scroll">
            <h2 className="text-xl font-bold p-4 border-b text-black">LLM Assistant</h2>
            <div className="flex-grow p-4 space-y-4">
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
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                {allowChatInput &&<> <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isAgentThinking} placeholder={isAgentThinking ? "Agent is processing..." : "Ask about the active data..."} className="flex-grow border rounded-md p-2 disabled:bg-gray-100 text-black"/>
                  <button type="submit" disabled={isAgentThinking} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Send</button></>}
            </form>
        </div>

      </main>
    </div>
  );
}

export default App;
