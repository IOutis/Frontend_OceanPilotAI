import React, { useState, useEffect } from 'react';
import { Database, Plus, Merge, ArrowRight, CheckCircle, AlertCircle, MessageSquare, Bot, Lightbulb, Settings, Info } from 'lucide-react';

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
  
  // New state for column naming options
  const [preserveOriginalNames, setPreserveOriginalNames] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [columnConflictResolution, setColumnConflictResolution] = useState('rename'); // 'rename', 'prefix', 'suffix'

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
      let suggestionText = `${mergeSuggestions.reasoning}`;
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
    // Fetch available files from backend
    const fetchAvailableFiles = async () => {
      if (!sessionId) return;
      
      try {
        const response = await fetch(`http://localhost:8000/merge/available/${sessionId}`);
        const data = await response.json();
                console.log('File data:', data);
        
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
    setMergePreview(null);
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
          join_columns: joinColumns,
          preserve_original_names: preserveOriginalNames
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setMergePreview(result.preview);
      } else {
        console.error('Merge preview error:', result.error);
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
          join_columns: joinColumns,
          preserve_original_names: preserveOriginalNames
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
    const allColumns = selectedFileObjects.map(f => f.columns); // These are now original column names
    
    // Find intersection of all column arrays (original column names)
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
          Column naming: ${preserveOriginalNames ? 'Preserve original names' : 'Use role names'}
          
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

  return (
    <div className="text-black">
      <div className="flex items-center gap-2 mb-4">
        <Merge className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Merge Datasets</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select multiple processed datasets to merge them for combined analysis. Choose whether to preserve original column names or use standardized role names.
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
                      <p><strong>Columns ({file.total_columns}):</strong></p>
                      <div className="mt-1 space-y-1">
                        {file.column_info ? (
                          file.column_info.slice(0, 5).map((col, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium text-gray-800">{col.original_name}</span>
                              <span className="text-gray-500"> ({col.role})</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs">{file.columns.join(', ')}</span>
                        )}
                        {file.column_info && file.column_info.length > 5 && (
                          <div className="text-xs text-gray-400">
                            +{file.column_info.length - 5} more columns...
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        {file.is_merged && (
                          <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                            Merged Dataset
                          </span>
                        )}
                        {file.has_processed_data && (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs ml-1">
                            Processed
                          </span>
                        )}
                      </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">2. Configure Merge Settings</h3>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Settings className="h-4 w-4" />
                Advanced Options
              </button>
            </div>
            
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

            {/* Column Naming Options */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">Column Naming Strategy</span>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={preserveOriginalNames}
                    onChange={() => setPreserveOriginalNames(true)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Preserve Original Column Names</div>
                    <div className="text-sm text-gray-600">
                      Keep the actual column names from your files (e.g., "temp_c", "sal_psu") along with their role mappings.
                      <br />
                      <span className="text-green-700 font-medium">Recommended:</span> Better for data traceability and analysis tools.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={!preserveOriginalNames}
                    onChange={() => setPreserveOriginalNames(false)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">Use Standardized Role Names</div>
                    <div className="text-sm text-gray-600">
                      Replace column names with their mapped roles (e.g., "Temperature", "Salinity").
                      <br />
                      <span className="text-blue-700">Note:</span> May lose original column naming context.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-3">Advanced Merge Options</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Column Conflict Resolution</label>
                    <select
                      value={columnConflictResolution}
                      onChange={(e) => setColumnConflictResolution(e.target.value)}
                      className="border rounded-lg p-2 w-full text-sm"
                    >
                      <option value="rename">Rename conflicting columns with file suffix</option>
                      <option value="prefix">Add file name as prefix</option>
                      <option value="suffix">Add file name as suffix</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      How to handle columns with the same name from different files
                    </p>
                  </div>
                </div>
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
              <div className="text-xs text-gray-600 mt-1">
                {mergeStrategy === 'inner' && "Keep only rows that have matching join values in all files"}
                {mergeStrategy === 'outer' && "Keep all rows from all files, filling missing values with null"}
                {mergeStrategy === 'left' && "Keep all rows from the first file, add matching data from others"}
                {mergeStrategy === 'concat' && "Stack all files vertically (same columns required)"}
              </div>
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
                      <span className="w-32 text-sm font-medium truncate" title={file.name}>{file.name}:</span>
                      <select
                        value={joinColumns[fileId] || ''}
                        onChange={(e) => handleJoinColumnChange(fileId, e.target.value)}
                        className="border rounded-lg p-2 flex-1"
                      >
                        <option value="">Select join column...</option>
                        {file.columns.map(col => {
                          // Find the role for this original column
                          const role = file.mappings && file.mappings[col] ? file.mappings[col] : col;
                          return (
                            <option key={col} value={col}>
                              {col} ({role})
                            </option>
                          );
                        })}
                      </select>
                      {joinColumns[fileId] && getCommonColumns().includes(joinColumns[fileId]) && (
                        <span className="text-green-600 text-xs">✓ Common</span>
                      )}
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
                <div className="text-sm text-green-700 mt-1">
                  <p>Result: {mergePreview.total_rows} rows × {mergePreview.total_columns} columns</p>
                  <p>Column naming: {mergePreview.preserve_original_names ? 'Original names preserved' : 'Role names used'}</p>
                </div>
              </div>

              {/* Column Information */}
              {mergePreview.column_metadata && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Column Mapping Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {Object.entries(mergePreview.column_metadata.column_mappings || {}).map(([col, role]) => (
                      <div key={col} className="bg-white p-2 rounded border">
                        <div className="font-medium text-blue-900">{col}</div>
                        <div className="text-blue-700 text-xs">{role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Data Preview */}
              <div className="overflow-x-auto">
                <h4 className="font-semibold mb-2">Sample Data (first 5 rows):</h4>
                <table className="w-full text-sm border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      {mergePreview.columns.map(col => (
                        <th key={col} className="border p-2 text-left font-medium">
                          {col}
                          {mergePreview.column_metadata?.column_mappings?.[col] && 
                           mergePreview.column_metadata.column_mappings[col] !== col && (
                            <div className="text-xs text-gray-600 font-normal">
                              ({mergePreview.column_metadata.column_mappings[col]})
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mergePreview.sample_data.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {mergePreview.columns.map(col => (
                          <td key={col} className="border p-2">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : 
                             <span className="text-gray-400 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Merge Statistics */}
              {mergePreview.column_metadata && (
                <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm">
                  <h4 className="font-semibold mb-2">Merge Statistics:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Source Files:</strong> {mergePreview.column_metadata.dataset_names?.join(', ')}
                    </div>
                    <div>
                      <strong>Strategy Used:</strong> {mergePreview.column_metadata.merge_strategy}
                    </div>
                    {mergePreview.column_metadata.join_columns_used && (
                      <div className="md:col-span-2">
                        <strong>Join Columns:</strong> {JSON.stringify(mergePreview.column_metadata.join_columns_used)}
                      </div>
                    )}
                  </div>
                </div>
              )}

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