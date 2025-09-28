import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, 
  Search, 
  Download, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  BarChart3, 
  Database, 
  Info,
  X,
  Plus,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Settings
} from 'lucide-react';

const DataPlayground = ({ sessionId, phaseHistory, onClose }) => {
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [dataInfo, setDataInfo] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter and search state
  const [filters, setFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumns, setSearchColumns] = useState([]);
  const [sortColumn, setSortColumn] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  
  // View options
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table or summary
  const [showColumnStats, setShowColumnStats] = useState(false);
  
  // Get available phases for selection
  const availablePhases = phaseHistory.filter(phase => 
    phase.type === 'ingestion' || phase.type === 'preprocessing'
  );

  // Fetch data info when phase is selected
  useEffect(() => {
    if (selectedPhase && sessionId) {
      fetchDataInfo();
    }
  }, [selectedPhase, sessionId]);

  // Fetch filtered data when filters/search/pagination change
  useEffect(() => {
    if (selectedPhase && sessionId) {
      fetchFilteredData();
    }
  }, [selectedPhase, sessionId, filters, searchTerm, searchColumns, sortColumn, sortOrder, currentPage, pageSize, selectedColumns]);

  const fetchDataInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/playground/${sessionId}/${selectedPhase}/info`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setDataInfo(result.dataset_info);
        setSelectedColumns(result.dataset_info.column_info.map(col => col.name));
      } else {
        setError(result.error || 'Failed to fetch data info');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredData = async () => {
    if (!selectedPhase) return;
    
    setLoading(true);
    try {
      const requestBody = {
        session_id: sessionId,
        source_phase_id: selectedPhase,
        filters: filters,
        search_term: searchTerm || null,
        search_columns: searchColumns.length > 0 ? searchColumns : null,
        sort_column: sortColumn || null,
        sort_order: sortOrder,
        page: currentPage,
        page_size: pageSize,
        columns: selectedColumns.length > 0 ? selectedColumns : null
      };

      const response = await fetch('http://localhost:8000/playground/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setData(result.data);
        setTotalPages(result.pagination.total_pages);
        setTotalRows(result.pagination.total_rows);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      column: dataInfo?.column_info[0]?.name || '',
      operator: 'eq',
      value: '',
      case_sensitive: false
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id, field, value) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    ));
  };

  const removeFilter = (id) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const resetFilters = () => {
    setFilters([]);
    setSearchTerm('');
    setSearchColumns([]);
    setSortColumn('');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const exportData = async (format) => {
    try {
      const requestBody = {
        session_id: sessionId,
        source_phase_id: selectedPhase,
        filters: filters,
        search_term: searchTerm || null,
        search_columns: searchColumns.length > 0 ? searchColumns : null,
        sort_column: sortColumn || null,
        sort_order: sortOrder,
        page: 1,
        page_size: 10000,
        columns: selectedColumns.length > 0 ? selectedColumns : null
      };

      const response = await fetch(`http://localhost:8000/playground/export?export_format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Create download link
        const blob = new Blob([result.data], { type: result.content_type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'Failed to export data');
      }
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(4);
    }
    return value.toString();
  };


  return (
    <div className="fixed inset-0  bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Data Playground</h2>
            {selectedPhase && (
              <span className="text-sm text-gray-500">
                - {phaseHistory.find(p => p.id === selectedPhase)?.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar - Phase Selection & Controls */}
          <div className="w-80 bg-gray-50 border-r p-4 overflow-y-auto">
            
            {/* Phase Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dataset
              </label>
              <select 
                value={selectedPhase || ''} 
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a dataset...</option>
                {availablePhases.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            {dataInfo && (
              <>
                {/* Dataset Summary */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dataset Overview
                  </h3>
                  <div className="text-sm text-black space-y-1">
                    <div>Rows: {dataInfo.total_rows.toLocaleString()}</div>
                    <div>Columns: {dataInfo.total_columns}</div>
                    <div>Memory: {(dataInfo.memory_usage / 1024 / 1024).toFixed(2)} MB</div>
                    <div>Showing: {totalRows.toLocaleString()} filtered rows</div>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Global Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search across all columns..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Filters ({filters.length})
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={addFilter}
                        className="text-xs bg-blue-500 text-black px-2 py-1 rounded hover:bg-blue-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {filters.length > 0 && (
                        <button
                          onClick={resetFilters}
                          className="text-xs bg-gray-500 text-black px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filters.map(filter => (
                      <div key={filter.id} className="p-2 bg-white border rounded text-xs">
                        <div className="flex justify-between items-start mb-2">
                          <select
                            value={filter.column}
                            onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                            className="flex-1 text-xs border rounded px-1 py-1 mr-2"
                          >
                            {dataInfo.column_info.map(col => (
                              <option key={col.name} value={col.name}>{col.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeFilter(filter.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                          className="w-full text-xs border rounded px-1 py-1 mb-2"
                        >
                          <option value="eq">Equals</option>
                          <option value="ne">Not Equals</option>
                          <option value="gt">Greater Than</option>
                          <option value="gte">Greater or Equal</option>
                          <option value="lt">Less Than</option>
                          <option value="lte">Less or Equal</option>
                          <option value="contains">Contains</option>
                          <option value="starts_with">Starts With</option>
                          <option value="ends_with">Ends With</option>
                          <option value="is_null">Is Null</option>
                          <option value="not_null">Is Not Null</option>
                        </select>
                        
                        {!['is_null', 'not_null'].includes(filter.operator) && (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                            placeholder="Filter value..."
                            className="w-full text-xs border rounded px-1 py-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column Selection */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowColumnStats(!showColumnStats)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                  >
                    <span>Columns ({selectedColumns.length}/{dataInfo.total_columns})</span>
                    {showColumnStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showColumnStats && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => setSelectedColumns(dataInfo.column_info.map(col => col.name))}
                          className="text-xs bg-green-500 text-black px-2 py-1 rounded hover:bg-green-600"
                        >
                          All
                        </button>
                        <button
                          onClick={() => setSelectedColumns([])}
                          className="text-xs bg-red-500 text-black px-2 py-1 rounded hover:bg-red-600"
                        >
                          None
                        </button>
                      </div>
                      
                      {dataInfo.column_info.map(col => (
                        <div key={col.name} className="flex items-start gap-2 p-2 bg-white border rounded text-xs">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns([...selectedColumns, col.name]);
                              } else {
                                setSelectedColumns(selectedColumns.filter(c => c !== col.name));
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{col.name}</div>
                            <div className="text-gray-500">{col.data_type}</div>
                            <div className="text-gray-500">
                              Unique: {col.unique_values} | Nulls: {col.null_percentage.toFixed(1)}%
                            </div>
                            {col.is_numeric && col.mean_value && (
                              <div className="text-gray-500">
                                Mean: {col.mean_value.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-500 text-black' : 'bg-gray-200 text-gray-700'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`p-2 rounded ${viewMode === 'summary' ? 'bg-blue-500 text-black' : 'bg-gray-200 text-gray-700'}`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchFilteredData}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-black rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 bg-green-500 text-black rounded hover:bg-green-600 text-sm">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg hidden group-hover:block z-10">
                    <button onClick={() => exportData('csv')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                      CSV
                    </button>
                    <button onClick={() => exportData('json')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                      JSON
                    </button>
                    <button onClick={() => exportData('excel')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                      Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-auto">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}

              {!selectedPhase && !loading && (
                <div className="text-center text-gray-500 py-8">
                  <Database className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a dataset to start exploring</p>
                </div>
              )}

              {viewMode === 'table' && data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedColumns.map(column => (
                          <th 
                            key={column}
                            className="border border-gray-300 px-3 py-2 text-left cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort(column)}
                          >
                            <div className="flex items-center gap-2">
                              <span>{column}</span>
                              {sortColumn === column && (
                                sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {selectedColumns.map(column => (
                            <td key={column} className="border border-gray-300 px-3 py-2">
                              {formatValue(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === 'summary' && dataInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dataInfo.column_info.filter(col => selectedColumns.includes(col.name)).map(col => (
                    <div key={col.name} className="bg-white border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{col.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Type: <span className="font-medium">{col.data_type}</span></div>
                        <div>Unique Values: <span className="font-medium">{col.unique_values}</span></div>
                        <div>Null Count: <span className="font-medium">{col.null_count} ({col.null_percentage.toFixed(1)}%)</span></div>
                        {col.is_numeric && (
                          <>
                            <div>Min: <span className="font-medium">{formatValue(col.min_value)}</span></div>
                            <div>Max: <span className="font-medium">{formatValue(col.max_value)}</span></div>
                            {col.mean_value && <div>Mean: <span className="font-medium">{col.mean_value.toFixed(4)}</span></div>}
                          </>
                        )}
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Sample Values:</div>
                          <div className="text-xs bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                            {col.sample_values.slice(0, 5).map((val, i) => (
                              <div key={i}>{formatValue(val)}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRows)} of {totalRows} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPlayground;
