import React, { useState, useEffect, useRef } from 'react';
import DatasetPreview from './components/DatasetPreview';
import FileUploader from './components/FileUpload';
import Header from './components/Header';
import {PlusIcon,ChevronDownIcon,UserIcon,BotIcon} from './components/HelperIcons';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [phaseHistory, setPhaseHistory] = useState([]);
  const [activePhaseId, setActivePhaseId] = useState('new_ingestion');
  const [chatMessages, setChatMessages] = useState([{ from: 'bot', text: 'Hello! Upload a dataset to begin.' }]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  
  const activePhase = phaseHistory.find(p => p.id === activePhaseId);

  useEffect(() => {
    setSessionId(crypto.randomUUID());

    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'status_update') {
        setIsAgentThinking(true);
        setChatMessages(prev => [...prev, { from: 'bot', text: message.payload.message, isStatus: true }]);
      } else if (message.type === 'agent_response') {
        setIsAgentThinking(false);
        setChatMessages(prev => [...prev, message.payload]);
      }
    };
    socket.onclose = () => console.log("WebSocket connection closed.");
    return () => socket.close();
  }, []);

  const handleUploadSuccess = (metadata) => {
    const newPhase = { id: Date.now(), type: 'ingestion', name: `${metadata.filename}`, data: metadata };
    setPhaseHistory(prev => [...prev, newPhase]);
    setActivePhaseId(newPhase.id);
  };

  const handlePhaseSelect = (id) => setActivePhaseId(id);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAgentThinking || !sessionId) return;
    
    const userMessage = { from: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    try {
        await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: chatInput, 
              session_id: sessionId,
              context: activePhase, 
            }),
        });
    } catch (error) {
        console.error("Failed to send message:", error);
        setChatMessages(prev => [...prev, { from: 'bot', text: 'Error: Could not connect to agent.' }]);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col font-sans ">
      <Header phaseHistory={phaseHistory} onPhaseSelect={handlePhaseSelect} />
      
      <main className="flex-grow p-4 grid grid-cols-12 gap-4 overflow-hidden">
        
        <div className="col-span-2 bg-white rounded-lg shadow-md p-4 flex flex-col">
            <h3 className="font-bold text-lg mb-4 border-b pb-2 text-black">Workflow History</h3>
            <nav className="flex flex-col gap-2">
                <button onClick={() => handlePhaseSelect('new_ingestion')} className={`text-left p-2 rounded-md font-semibold flex items-center gap-2 ${activePhaseId === 'new_ingestion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>
                    <PlusIcon /> New Ingestion
                </button>
                <div className="border-t my-2"></div>
                {phaseHistory.map(phase => (
                    <button key={phase.id} onClick={() => handlePhaseSelect(phase.id)} className={`text-left p-2 rounded-md font-semibold text-sm truncate ${activePhaseId === phase.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-white'}`}>
                        {phase.name}
                    </button>
                ))}
            </nav>
        </div>

        <div className="col-span-7 bg-white p-6 rounded-lg shadow-md overflow-y-auto">
            {activePhaseId === 'new_ingestion' && <FileUploader onUploadSuccess={handleUploadSuccess} sessionId={sessionId} />}
            {activePhase && <DatasetPreview phase={activePhase} />}
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
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isAgentThinking} placeholder={isAgentThinking ? "Agent is processing..." : "Ask about the active data..."} className="flex-grow border rounded-md p-2 disabled:bg-gray-100 text-black"/>
                <button type="submit" disabled={isAgentThinking} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Send</button>
            </form>
        </div>

      </main>
    </div>
  );
}

export default App;