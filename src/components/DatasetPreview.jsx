import React from 'react';
import { GenericDataTable, ErrorDisplay } from './HelperIcons';

const DatasetPreview = ({ phase, onStartMapping }) => {
  if (!phase) return (
    <div className="text-center text-gray-600 py-10">
      Select a phase from the history to view its results.
    </div>
  );

  const { data } = phase;
  const previewData = data;
  const data_array = data.data;
  const preview_array = data.sample_data;

  const firstRecord = previewData.data?.[0]; 

  const isWodData = firstRecord && 
    'cruise' in firstRecord && 
    'date' in firstRecord && 
    'latitude' in firstRecord && 
    'longitude' in firstRecord;

  const isTabularData = Array.isArray(previewData.data) && previewData.sample_data;
  const isError = previewData && typeof previewData.error === 'string';

  const renderDataSample = () => {
    if (isWodData || isTabularData) {
      return <GenericDataTable data={previewData.sample_data} />;
    }
    if (isError) {
      return <ErrorDisplay error={previewData.error} />;
    }
    return <p className="text-gray-500">No data preview is available for this file.</p>;
  };

  return (
    <div className="text-gray-900">
      {/* Header */}
      <h2 className="text-2xl font-heading font-bold mb-2">{phase.name} Results</h2>
      <p className="text-gray-500 mb-6">
        Preview of <span className="font-medium">{data.filename}</span>
      </p>

      {/* Metadata Card */}
      <div className="bg-white rounded-xl shadow p-5 border mb-6">
        <h3 className="font-heading font-semibold text-lg mb-4">File Metadata</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <strong className="block text-gray-600">Content Type</strong>
            <span>{data.content_type}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <strong className="block text-gray-600">Size</strong>
            <span>{data.size_kb} KB</span>
          </div>
        </div>
      </div>

      {/* Data Sample */}
      <div className="bg-white rounded-xl shadow p-5 border flex flex-col h-[500px]">
        <h3 className="font-heading font-semibold text-lg mb-4">Data Sample</h3>
        <div className="flex-1 overflow-auto border rounded">
          {renderDataSample()}
        </div>

        {!isError && Array.isArray(data_array) && (
          <div className="mt-4">
            <button
              onClick={onStartMapping}
              className="w-full bg-[#C19D77] text-white font-body font-bold py-2 px-4 rounded-lg hover:bg-[#A8845F] transition-colors"
            >
              Proceed to Column Mapping →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetPreview;