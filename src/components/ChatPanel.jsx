import React, { useState, useEffect, useRef } from 'react';
import {UserIcon,BotIcon} from './HelperIcons';


const ChatPanel = ({ activePhase }) => {
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hello! Upload a dataset to begin.' }]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (activePhase) {
      setMessages(prev => [...prev, { from: 'bot', text: `Context updated. Now viewing results for "${activePhase.name}". Ask me anything about this data.` }]);
    }
  }, [activePhase]);
  
  const handleSendMessage = (e) => { e.preventDefault(); /* ... */ };
  
  return (
    <div className="bg-white text-black rounded-lg shadow-md flex flex-col max-h-screen overflow-y-scroll">
      <h2 className="text-black text-xl font-bold p-4 border-b">LLM Assistant</h2>
      <div className="flex-grow p-4 overflow-y-scroll space-y-4 min-h-0">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.from === 'user' ? 'justify-end' : ''}`}>
            {msg.from === 'bot' && <BotIcon />}
            <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.from === 'bot' ? 'bg-gray-100' : 'bg-blue-500 text-white'}`}>{msg.text}</div>
            {msg.from === 'user' && <UserIcon />}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask about the active context..." className="flex-grow border rounded-md p-2"/>
        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700">Send</button>
      </form>
    </div>
  );
};

export default ChatPanel;
