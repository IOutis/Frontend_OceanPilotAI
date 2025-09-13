import { useState } from 'react';
import React  from 'react';
import { GenericDataTable ,ErrorDisplay} from './HelperIcons';
const DatasetPreview = ({ phase }) => {
    if (!phase) return <div className="text-center text-black">Select a phase from the history to view its results.</div>;
    
    const { data } = phase;
    const previewData = data;
    const data_array = data.data;
    const preview_array = data.sample_data;

    console.log('Preview Data:', previewData.data[0].cruise, previewData.data[0].date, previewData.data[0].latitude, previewData.data[0].longitude);

    // --- LOGIC REMAINS THE SAME ---
    // These flags correctly identify the *type* of data structure we received.
    const isWodData = previewData && previewData.data[0].cruise && previewData.data[0].date&& previewData.data[0].latitude&&previewData.data[0].longitude;
    const isTabularData = Array.isArray(previewData.data) && previewData.sample_data;
    const isError = previewData && typeof previewData.error === 'string';

    const renderDataSample = () => {
        // --- THE FIX ---
        // Now, we pass the correct piece of data to the GenericDataTable in each case.
        if (isWodData) {
            // For WOD data, we pass the 'profile_sample' array to be rendered.
            return <GenericDataTable data={previewData.data} />;
        }
        if (isTabularData) {
            // For other tabular data, we pass the whole preview data array.
            return <GenericDataTable data={previewData.sample_data} />;
        }
        if (isError) {
            return <ErrorDisplay error={previewData.error} />
        }
        // Fallback for unknown data structures or empty previews
        return <p className="text-gray-500">No data preview is available for this file.</p>;
    };
    
    return (
        <div className='text-black'>
            <h2 className="text-2xl font-bold mb-2">Results: {phase.name}</h2>
            <p className="text-gray-600 mb-4">Showing preview for the ingestion of <strong className="text-gray-800">{data.filename}</strong></p>
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-2">File Metadata</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Content Type:</strong> {data.content_type}</p>
                    <p><strong>Size:</strong> {data.size_kb} KB</p>
                    {/* {isWodData && previewData && <>
                        <p><strong>Cruise ID:</strong> {previewData.cruise || 'N/A'}</p>
                        <p><strong>Date:</strong> {previewData.date ? new Date(previewData.date).toDateString() : 'N/a'}</p>
                        <p><strong>Latitude:</strong> {previewData.latitude?.toFixed(4) || 'N/A'}</p>
                        <p><strong>Longitude:</strong> {previewData.longitude?.toFixed(4) || 'N/A'}</p>
                    </>} */}
                </div>
                
                <h3 className="font-bold text-lg mt-4 mb-2">Data Sample</h3>
                {renderDataSample()}
            </div>
        </div>
    );
};

export default DatasetPreview;