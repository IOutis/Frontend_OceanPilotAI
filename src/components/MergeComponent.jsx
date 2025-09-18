import React, { useState, useEffect } from 'react';
import { Database, Plus, Merge, ArrowRight, CheckCircle, AlertCircle, MessageSquare, Bot, Lightbulb } from 'lucide-react';

const MergeComponent = ({ phase, sessionId, phaseHistory, onConfirmMerge, isAgentThinking, mergeSuggestions, onClearSuggestions }) => {
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('inner');
  const [joinColumns, setJoinColumns] = useState({});
  const [mergePreview, setMergePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isGettingHelp, setIsGettingHelp] = useState(false);

  // Handle incoming merge suggestions
  useEffect(() => {
    if (mergeSuggestions) {
      // Apply the AI suggestions
      if (mergeSuggestions.strategy) {
        setMergeStrategy(mergeSuggestions.strategy);
      }
      if (mergeSuggestions.join_columns) {
        setJoinColumns(mergeSuggestions.join_columns);
      }
      
      // Add AI response to chat
      const suggestionText = `${mergeSuggestions.reasoning}`;
      if (mergeSuggestions.considerations) {
        suggestionText += `\n\nConsiderations: ${mergeSuggestions.considerations}`;
      }
      
      setChatMessages(prev => [...prev, { 
        from: 'bot', 
        text: suggestionText,
        hasSuggestions: true 
      }]);
      
      // Clear the suggestions after applying them
      setTimeout(() => {
        if (onClearSuggestions) {
          onClearSuggestions();
        }
      }, 1000);
    }
  }, [mergeSuggestions, onClearSuggestions]);

  useEffect(() => {
    // Fetch available files from backend following the same pattern as analysis
    const fetchAvailableFiles = async () => {
      if (!sessionId) return;
      
      try {
        const response = await fetch(`http://localhost:8000/merge/available/${sessionId}`);
        const data = await response.json();
        console.log('Available files for merge:', data);
        
        if (data.status === 'success') {
          setAvailableFiles(data.available_files || []);
        }
      } catch (error) {
        console.error('Error fetching available files for merge:', error);
      }
    };

    fetchAvailableFiles();
  }, [sessionId, phaseHistory]);

  const handleFileSelection = (fileId, isSelected) => {
    if (isSelected) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
      // Remove join columns for deselected file
      setJoinColumns(prev => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });
    }
    
    // Clear suggestions when file selection changes
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleJoinColumnChange = (fileId, column) => {
    setJoinColumns(prev => ({
      ...prev,
      [fileId]: column
    }));
  };

  const generateMergePreview = async () => {
    if (selectedFiles.length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/merge/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          file_ids: selectedFiles,
          merge_strategy: mergeStrategy,
          join_columns: joinColumns
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setMergePreview(result.preview);
      }
    } catch (error) {
      console.error('Error generating merge preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (selectedFiles.length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/merge/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          file_ids: selectedFiles,
          merge_strategy: mergeStrategy,
          join_columns: joinColumns
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        onConfirmMerge(result.merged_data);
      }
    } catch (error) {
      console.error('Error executing merge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCommonColumns = () => {
    if (selectedFiles.length < 2) return [];
    
    const selectedFileObjects = availableFiles.filter(f => selectedFiles.includes(f.id));
    const allColumns = selectedFileObjects.map(f => f.columns);
    
    // Find intersection of all column arrays
    return allColumns.reduce((common, columns) => 
      common.filter(col => columns.includes(col))
    );
  };

  const getSmartSuggestions = async () => {
    if (selectedFiles.length < 2) return;

    setIsGettingHelp(true);
    setChatMessages(prev => [...prev, { from: 'user', text: 'Get merge suggestions' }]);
    
    try {
      // Get detailed information about selected files
      const selectedFileDetails = availableFiles.filter(f => selectedFiles.includes(f.id));
      const fileInfo = selectedFileDetails.map(file => ({
        id: file.id,
        name: file.name,
        columns: file.columns
      }));

      // Send request to chat endpoint for merge suggestions
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I want to merge these datasets. Please suggest the best merge strategy and join columns based on the data structure:

Files to merge:
${fileInfo.map(f => `- ${f.name}: [${f.columns.join(', ')}]`).join('\n')}

Please provide:
1. Recommended merge strategy (inner, outer, left, or concat)
2. Suggested join columns for each file
3. Explanation of your reasoning
4. Any potential issues or considerations

Focus on marine science data patterns and common oceanographic relationships.`,
          session_id: sessionId,
          context: { type: 'merge', selected_files: fileInfo },
          active_view: 'merge'
        })
      });

      if (response.ok) {
        // The response will come through WebSocket, so we just wait
        setChatMessages(prev => [...prev, { from: 'bot', text: 'Analyzing your datasets for optimal merge strategy...', isStatus: true }]);
      }
    } catch (error) {
      console.error('Error getting merge suggestions:', error);
      setChatMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I encountered an error while analyzing your datasets.' }]);
    } finally {
      setIsGettingHelp(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isGettingHelp || !sessionId) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setIsGettingHelp(true);
    
    try {
      const selectedFileDetails = availableFiles.filter(f => selectedFiles.includes(f.id));
      const fileInfo = selectedFileDetails.map(file => ({
        id: file.id,
        name: file.name,
        columns: file.columns
      }));

      await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Context: I'm working on merging these datasets: ${fileInfo.map(f => `${f.name} (${f.columns.join(', ')})`).join('; ')}. 
          
          Current merge strategy: ${mergeStrategy}
          Selected join columns: ${JSON.stringify(joinColumns)}
          
          User question: ${userMessage}`,
          session_id: sessionId,
          context: { type: 'merge', selected_files: fileInfo, merge_strategy: mergeStrategy, join_columns: joinColumns },
          active_view: 'merge'
        })
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      setChatMessages(prev => [...prev, { from: 'bot', text: 'Error: Could not connect to assistant.' }]);
      setIsGettingHelp(false);
    }
  };

  const applySuggestedStrategy = (strategy, columns) => {
    setMergeStrategy(strategy);
    if (columns && typeof columns === 'object') {
      setJoinColumns(columns);
    }
  };

  // Listen for WebSocket messages (you'll need to integrate this with your existing WebSocket setup)
  useEffect(() => {
    const handleWebSocketMessage = (message) => {
      if (message.type === 'agent_response') {
        setChatMessages(prev => [...prev, message.payload]);
        setIsGettingHelp(false);
      } else if (message.type === 'status_update') {
        setChatMessages(prev => [...prev, { from: 'bot', text: message.payload.message, isStatus: true }]);
      }
    };
    
    // You'll need to integrate this with your existing WebSocket setup
    // This is just a placeholder for the structure
    
  }, []);

  return (
    <div className="text-black">
      <div className="flex items-center gap-2 mb-4">
        <Merge className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Merge Datasets</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select multiple processed datasets to merge them for combined analysis.
      </p>

      {/* File Selection */}
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h3 className="font-bold text-lg mb-4">1. Select Files to Merge</h3>
        
        {availableFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No processed files available for merging.</p>
            <p className="text-sm">Process some datasets first with column mappings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableFiles.map(file => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={(e) => handleFileSelection(file.id, e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{file.name}</h4>
                    <div className="text-sm text-gray-600 mt-2">
                      <p><strong>Columns ({file.total_columns}):</strong> {file.columns.join(', ')}</p>
                      {file.is_merged && (
                        <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mt-1">
                          Merged Dataset
                        </span>
                      )}
                      {file.has_processed_data && (
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mt-1 ml-1">
                          Processed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFiles.length >= 2 && (
        <>
          {/* AI Assistant Section */}
          <div className="bg-blue-50 p-6 rounded-lg border mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-lg">AI Merge Assistant</h3>
            </div>
            
            <div className="flex gap-3 mb-4">
              <button
                onClick={getSmartSuggestions}
                disabled={isGettingHelp || selectedFiles.length < 2}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                {isGettingHelp ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
                Get Smart Suggestions
              </button>
              
              <div className="text-sm text-gray-600 flex items-center">
                <span>Get AI recommendations for merge strategy and join columns</span>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-lg border p-4">
              <div className="h-32 overflow-y-auto mb-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    Ask me about merge strategies, join columns, or data compatibility...
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className={`flex gap-2 ${msg.from === 'user' ? 'justify-end' : ''}`}>
                      <div className={`rounded-lg px-3 py-2 max-w-xs text-sm ${
                        msg.from === 'bot' 
                          ? (msg.isStatus ? 'bg-yellow-100 text-yellow-800 italic' : 'bg-gray-100 text-gray-800') 
                          : 'bg-blue-500 text-white'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit(e)}
                  disabled={isGettingHelp}
                  placeholder={isGettingHelp ? "AI is thinking..." : "Ask about merge strategies..."}
                  className="flex-grow border rounded-md p-2 disabled:bg-gray-100 text-sm"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={isGettingHelp || !chatInput.trim()}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Merge Configuration */}
          <div className="bg-white p-6 rounded-lg border mb-6">
            <h3 className="font-bold text-lg mb-4">2. Configure Merge Settings</h3>
            
            {/* AI Suggestions Applied Banner */}
            {mergeSuggestions && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Bot className="h-4 w-4" />
                  <span className="font-semibold">AI Suggestions Applied</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Strategy: {mergeSuggestions.strategy} | Join columns updated
                </p>
              </div>
            )}

            {/* Merge Strategy */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Merge Strategy</label>
              <select
                value={mergeStrategy}
                onChange={(e) => setMergeStrategy(e.target.value)}
                className="border rounded-lg p-2 w-full"
              >
                <option value="inner">Inner Join (Only matching records)</option>
                <option value="outer">Outer Join (All records, fill missing)</option>
                <option value="left">Left Join (Keep all from first file)</option>
                <option value="concat">Concatenate (Stack files vertically)</option>
              </select>
            </div>

            {/* Join Columns (if not concatenating) */}
            {mergeStrategy !== 'concat' && (
              <div>
                <label className="block text-sm font-medium mb-2">Join Columns</label>
                <p className="text-sm text-gray-600 mb-3">
                  Select the column to join on for each file. Common columns: {getCommonColumns().join(', ') || 'None'}
                </p>
                
                {selectedFiles.map(fileId => {
                  const file = availableFiles.find(f => f.id === fileId);
                  return (
                    <div key={fileId} className="flex items-center gap-3 mb-2">
                      <span className="w-32 text-sm font-medium">{file.name}:</span>
                      <select
                        value={joinColumns[fileId] || ''}
                        onChange={(e) => handleJoinColumnChange(fileId, e.target.value)}
                        className="border rounded-lg p-2 flex-1"
                      >
                        <option value="">Select join column...</option>
                        {file.columns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={generateMergePreview}
              disabled={isLoading || (mergeStrategy !== 'concat' && Object.keys(joinColumns).length < selectedFiles.length)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Generate Preview
            </button>
          </div>

          {/* Preview Results */}
          {mergePreview && (
            <div className="bg-white p-6 rounded-lg border mb-6">
              <h3 className="font-bold text-lg mb-4">3. Merge Preview</h3>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Merge Successful</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Result: {mergePreview.total_rows} rows × {mergePreview.total_columns} columns
                </p>
              </div>

              {/* Sample Data Preview */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      {mergePreview.columns.map(col => (
                        <th key={col} className="border p-2 text-left">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mergePreview.sample_data.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {mergePreview.columns.map(col => (
                          <td key={col} className="border p-2">
                            {row[col] !== null ? String(row[col]) : 'null'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleConfirmMerge}
                disabled={isLoading || isAgentThinking}
                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Confirm Merge
              </button>
            </div>
          )}
        </>
      )}

      {selectedFiles.length === 1 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Select at least 2 files to merge</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeComponent;