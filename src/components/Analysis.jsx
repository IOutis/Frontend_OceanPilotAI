import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, AreaChart, Area } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, ChartScatter, TrendingUp, Activity, Database, Upload, Settings, MessageSquare } from 'lucide-react';

// Mock components for the ones not provided

// Analysis Component
const Analysis = ({ phase, sourcePhase, sessionId, onAskAI, isAgentThinking, analysisResults }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [visualizationConfig, setVisualizationConfig] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [customQuery, setCustomQuery] = useState('');

  // Handle analysis results from WebSocket (similar to how ColumnMapping handles suggestions)
  useEffect(() => {
    if (analysisResults) {
      console.log("Received analysis results:", analysisResults);
      
      // Check if we have both data and config for visualization
      if (analysisResults.data && analysisResults.config) {
        setAnalysisData(analysisResults.data);
        setVisualizationConfig(analysisResults.config);
        setIsLoading(false);
      }
    }
  }, [analysisResults]);

  // Fetch analysis suggestions when component mounts
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!sessionId || !sourcePhase?.id) return;
      
      try {
        const response = await fetch(`http://localhost:8000/analysis/suggestions/${sessionId}/${sourcePhase.id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching analysis suggestions:', error);
      }
    };

    fetchSuggestions();
  }, [sessionId, sourcePhase?.id]);

  // Fetch statistical summary
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!sessionId || !sourcePhase?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/analysis/statistics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            source_phase_id: sourcePhase.id,
            active_phase_id: phase?.id || null,
            view : 'analysis'
          })
        });
        const data = await response.json();
        
        if (data.status === 'success') {
          setStatistics(data);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [sessionId, sourcePhase?.id]);

  const handleSuggestionClick = async (suggestion) => {
    setSelectedSuggestion(suggestion);
    setIsLoading(true);
    console.log("Analysis - Sending suggestion:", suggestion);
    console.log("Analysis - Active phase:", phase);
    console.log("Analysis - Source phase:", sourcePhase);
    // Use the onAskAI prop to send the message through the main chat system
    onAskAI(suggestion);
  };

  const handleCustomQuery = async (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    setIsLoading(true);
    console.log("Analysis - Sending custom query:", customQuery);
    // Use the onAskAI prop to send the custom query through the main chat system
    onAskAI(customQuery);
    setCustomQuery(''); // Clear the input after sending
  };

  const renderVisualization = () => {
    if (!analysisData || !visualizationConfig) return null;

    const { type, config } = visualizationConfig;
    const commonProps = {
      data: analysisData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={config.yAxis} 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis dataKey={config.yAxis} />
              <Tooltip />
              <Scatter data={analysisData} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={config.yAxis} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={config.yAxis} 
                stroke="#2563eb" 
                fill="#3b82f6" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>Unsupported visualization type: {type}</div>;
    }
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    const { statistics: stats, correlation_matrix, data_shape, column_types } = statistics;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">Dataset Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold">Rows:</span> {data_shape?.rows}
            </div>
            <div>
              <span className="font-semibold">Columns:</span> {data_shape?.columns}
            </div>
            <div>
              <span className="font-semibold">Numeric:</span> {column_types?.numeric?.length || 0}
            </div>
            <div>
              <span className="font-semibold">Categorical:</span> {column_types?.categorical?.length || 0}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-4">Column Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border text-left">Column</th>
                  <th className="p-2 border text-left">Type</th>
                  <th className="p-2 border text-left">Missing %</th>
                  <th className="p-2 border text-left">Key Statistic</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats || {}).map(([column, stat]) => (
                  <tr key={column} className="border-b">
                    <td className="p-2 border font-semibold">{column}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded text-xs ${
                        stat.type === 'numeric' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {stat.type}
                      </span>
                    </td>
                    <td className="p-2 border">{stat.missing_percent?.toFixed(1)}%</td>
                    <td className="p-2 border">
                      {stat.type === 'numeric' 
                        ? `μ = ${stat.mean?.toFixed(2)}, σ = ${stat.std?.toFixed(2)}`
                        : `${stat.unique_count} unique, mode: ${stat.top_value}`
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-black">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Analysis Phase</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Analyze data from <strong>{sourcePhase?.name}</strong> with interactive visualizations and statistical insights.
      </p>

      {/* Quick Analysis Suggestions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border mb-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isAgentThinking || isLoading}
              className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium text-blue-800">{suggestion}</span>
            </button>
          ))}
        </div>
        
        <form onSubmit={handleCustomQuery} className="flex gap-2">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Ask a custom analysis question..."
            disabled={isAgentThinking || isLoading}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isAgentThinking || isLoading || !customQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isAgentThinking || isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {/* Visualization Section */}
      {visualizationConfig && analysisData && (
        <div className="bg-white p-6 rounded-lg border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{visualizationConfig.config.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {visualizationConfig.type === 'line' && <LineChartIcon className="h-4 w-4" />}
              {visualizationConfig.type === 'scatter' && <ChartScatter className="h-4 w-4" />}
              {visualizationConfig.type === 'bar' && <BarChart3 className="h-4 w-4" />}
              {visualizationConfig.type === 'area' && <Activity className="h-4 w-4" />}
              <span className="capitalize">{visualizationConfig.type} Chart</span>
            </div>
          </div>
          
          {visualizationConfig.config.description && (
            <p className="text-sm text-gray-600 mb-4">{visualizationConfig.config.description}</p>
          )}
          
          <div className="h-96 w-full">
            {renderVisualization()}
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Statistical Summary
        </h3>
        {isLoading && !statistics ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderStatistics()
        )}
      </div>
    </div>
  );
};
export default Analysis;