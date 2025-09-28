// src/components/DataPlayground.jsx
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
import { API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

const AccordionSection = ({ title, open, onToggle, children }) => {
  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#EAEEE7] transition-colors text-sm font-medium text-[#05090A]"
      >
        <span>{title}</span>
        <span className="ml-2">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="mt-2 px-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DataPlayground = ({ sessionId, phaseHistory, onClose }) => {
  // Original states + logic (unchanged)
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [dataInfo, setDataInfo] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumns, setSearchColumns] = useState([]);
  const [sortColumn, setSortColumn] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [selectedColumns, setSelectedColumns] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table or summary
  const [showColumnStats, setShowColumnStats] = useState(false);

  const availablePhases = phaseHistory.filter(
    phase => phase.type === 'ingestion' || phase.type === 'preprocessing'
  );

  // UI accordion states
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  useEffect(() => {
    if (selectedPhase && sessionId) {
      fetchDataInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase, sessionId]);

  useEffect(() => {
    if (selectedPhase && sessionId) {
      fetchFilteredData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPhase,
    sessionId,
    filters,
    searchTerm,
    searchColumns,
    sortColumn,
    sortOrder,
    currentPage,
    pageSize,
    selectedColumns
  ]);

  const fetchDataInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.PLAYGROUND_INFO(sessionId, selectedPhase));
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

      const response = await fetch(API_ENDPOINTS.PLAYGROUND_DATA, {
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

  // existing helper functions (no change)
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
    setFilters(filters.map(filter => (filter.id === id ? { ...filter, [field]: value } : filter)));
  };

  const removeFilter = id => {
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

  const handleSort = column => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const exportData = async format => {
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

      const response = await fetch(
        `http://localhost:8000/playground/export?export_format=${format}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
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

  const formatValue = value => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(4);
    }
    return value.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[86vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-[#EAEEE7]">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-[#6A8BA3]" />
            <div>
              <h2 className="text-xl font-semibold text-[#05090A]">Data Playground</h2>
              {selectedPhase && (
                <div className="text-sm text-[#05090A]/70">
                  {phaseHistory.find(p => p.id === selectedPhase)?.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchFilteredData()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-[#3F5734] text-white rounded-lg text-sm hover:brightness-95 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-[#6A8BA3] text-white rounded-lg text-sm hover:brightness-95 transition">
                <Download className="h-4 w-4" />
                Export
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-20">
                <div className="bg-white border rounded-lg shadow-md overflow-hidden">
                  <button onClick={() => exportData('csv')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#6A8BA3] hover:text-white">CSV</button>
                  <button onClick={() => exportData('json')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#6A8BA3] hover:text-white">JSON</button>
                  <button onClick={() => exportData('excel')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#6A8BA3] hover:text-white">Excel</button>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close" 
              className="p-2 rounded-full hover:bg-[#D3E1E9] transition-colors"
            >
              <X className="h-5 w-5 text-[#05090A]" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 bg-[#EAEEE7] p-4 overflow-y-auto border-r">
            {/* Dataset selector (kept same functionality) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#05090A] mb-2">Select Dataset</label>
              <select
                value={selectedPhase || ''}
                onChange={e => setSelectedPhase(e.target.value)}
                className="w-full rounded-lg px-3 py-2 border border-[#D3E1E9] text-[#05090A] focus:outline-none focus:ring-2 focus:ring-[#6A8BA3]"
              >
                <option value="">Choose a dataset...</option>
                {availablePhases.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Accordions */}
            <AccordionSection
              title="Dataset Overview"
              open={overviewOpen}
              onToggle={() => setOverviewOpen(v => !v)}
            >
              {dataInfo ? (
                <div className="p-3 rounded-lg bg-white border border-[#D3E1E9] text-sm text-[#05090A] space-y-1">
                  <div>Rows: {dataInfo.total_rows.toLocaleString()}</div>
                  <div>Columns: {dataInfo.total_columns}</div>
                  <div>Memory: {(dataInfo.memory_usage / 1024 / 1024).toFixed(2)} MB</div>
                  <div>Showing: {totalRows.toLocaleString()} filtered rows</div>
                </div>
              ) : (
                <div className="text-sm text-[#05090A]/70">Select a dataset to view summary</div>
              )}
            </AccordionSection>

            <AccordionSection title="Search" open={searchOpen} onToggle={() => setSearchOpen(v => !v)}>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-[#05090A]/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search across all columns..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-[#D3E1E9] text-[#05090A] focus:outline-none focus:ring-2 focus:ring-[#6A8BA3]"
                />
              </div>
              <div className="mt-2 text-xs text-[#05090A]/70">
                Tip: press Enter or click Refresh to apply search.
              </div>
            </AccordionSection>

            <AccordionSection
              title={`Filters (${filters.length})`}
              open={filtersOpen}
              onToggle={() => setFiltersOpen(v => !v)}
            >
              <div className="flex gap-2 mb-2">
                <button
                  onClick={addFilter}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#6A8BA3] text-white text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Filter
                </button>
                {filters.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="px-2 py-1 rounded-md bg-white border border-[#D3E1E9] text-xs text-[#05090A]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {filters.map(filter => (
                  <div key={filter.id} className="p-2 bg-white rounded-lg border border-[#D3E1E9] text-xs text-[#05090A]">
                    <div className="flex gap-2 items-start mb-2">
                      <select
                        value={filter.column}
                        onChange={e => updateFilter(filter.id, 'column', e.target.value)}
                        className="flex-1 rounded-md border border-[#D3E1E9] px-2 py-1 text-xs"
                      >
                        {dataInfo?.column_info.map(col => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="p-1 rounded-md hover:bg-[#EAEEE7]"
                        title="Remove filter"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>

                    <select
                      value={filter.operator}
                      onChange={e => updateFilter(filter.id, 'operator', e.target.value)}
                      className="w-full rounded-md border border-[#D3E1E9] px-2 py-1 mb-2 text-xs"
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
                        onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                        placeholder="Filter value..."
                        className="w-full rounded-md border border-[#D3E1E9] px-2 py-1 text-xs"
                      />
                    )}
                  </div>
                ))}
                {filters.length === 0 && <div className="text-xs text-[#05090A]/60">No filters added</div>}
              </div>
            </AccordionSection>

            <AccordionSection title={`Columns (${selectedColumns.length}/${dataInfo?.total_columns || 0})`} open={columnsOpen} onToggle={() => setColumnsOpen(v => !v)}>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setSelectedColumns(dataInfo.column_info.map(col => col.name))}
                  className="text-xs bg-[#3F5734] text-white px-2 py-1 rounded-md"
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedColumns([])}
                  className="text-xs bg-white border border-[#D3E1E9] text-[#05090A] px-2 py-1 rounded-md"
                >
                  None
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {dataInfo?.column_info.map(col => (
                  <label key={col.name} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-[#D3E1E9] text-xs">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.name)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedColumns(prev => [...prev, col.name]);
                        } else {
                          setSelectedColumns(prev => prev.filter(c => c !== col.name));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-[#05090A] truncate">{col.name}</div>
                      <div className="text-[#05090A]/80 text-xs">{col.data_type} • Unique: {col.unique_values} • Nulls: {col.null_percentage.toFixed(1)}%</div>
                      {col.is_numeric && col.mean_value != null && (
                        <div className="text-xs text-[#05090A]/80">Mean: {col.mean_value.toFixed(2)}</div>
                      )}
                    </div>
                  </label>
                ))}
                {!dataInfo && <div className="text-xs text-[#05090A]/60">Columns will appear after selecting dataset</div>}
              </div>
            </AccordionSection>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#05090A]/90">View</span>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-[#6A8BA3] text-white' : 'bg-[#EAEEE7] text-[#05090A]'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`p-2 rounded-md ${viewMode === 'summary' ? 'bg-[#6A8BA3] text-white' : 'bg-[#EAEEE7] text-[#05090A]'}`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#05090A]/90">Rows</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border border-[#D3E1E9] px-2 py-1 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#6A8BA3] text-white text-sm hover:brightness-95 transition">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10">
                    <div className="bg-white border rounded-lg shadow-md overflow-hidden">
                      <button onClick={() => exportData('csv')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#6A8BA3] hover:text-white">CSV</button>
                      <button onClick={() => exportData('json')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#6A8BA3] hover:text-white">JSON</button>
                      <button onClick={() => exportData('excel')} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#6A8BA3] hover:text-white">Excel</button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => fetchFilteredData()}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#6A8BA3] text-white text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 bg-[#F8FAFB]">
              {error && <div className="bg-[#FDECEF] text-[#9B2C2C] px-4 py-3 rounded mb-4">{error}</div>}

              {loading && (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#6A8BA3]" />
                </div>
              )}

              {!selectedPhase && !loading && (
                <div className="text-center text-[#05090A]/60 py-12">
                  <Database className="h-16 w-16 mx-auto mb-4 text-[#D3E1E9]" />
                  <p>Select a dataset to start exploring</p>
                </div>
              )}

              {viewMode === 'table' && data.length > 0 && (
                <div className="overflow-x-auto rounded-lg shadow-sm bg-white">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#D3E1E9]">
                      <tr>
                        {selectedColumns.map(column => (
                          <th
                            key={column}
                            className="px-3 py-2 text-left cursor-pointer select-none"
                            onClick={() => handleSort(column)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[#05090A]">{column}</span>
                              {sortColumn === column && (sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr key={index} className="odd:bg-[#FFFFFF] even:bg-[#FAFBFC] hover:bg-[#EAEEE7]">
                          {selectedColumns.map(column => (
                            <td key={column} className="px-3 py-2 align-top text-[#05090A]">
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
                  {dataInfo.column_info
                    .filter(col => selectedColumns.includes(col.name))
                    .map(col => (
                      <div key={col.name} className="bg-white rounded-lg border border-[#D3E1E9] p-4 shadow-sm">
                        <h3 className="font-heading font-semibold text-[#05090A] mb-2">{col.name}</h3>
                        <div className="text-sm text-[#05090A] space-y-1">
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
                            <div className="text-xs text-[#05090A]/80 mb-1">Sample Values:</div>
                            <div className="text-xs bg-[#EAEEE7] p-2 rounded max-h-20 overflow-y-auto text-[#05090A]">
                              {col.sample_values.slice(0, 5).map((val, i) => (
                                <div key={i} className="font-medium">{formatValue(val)}</div>
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
              <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
                <div className="text-sm text-[#05090A]/90">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRows)} of {totalRows} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DataPlayground;