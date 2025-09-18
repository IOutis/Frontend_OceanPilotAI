import React, { useState, useEffect } from 'react';

const Spinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

const Preprocessing = ({ phase, sourcePhase, sessionId }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processedData, setProcessedData] = useState(null);
    const [processingStep, setProcessingStep] = useState('initial'); // 'initial', 'processing', 'completed'
    const [processingSummary, setProcessingSummary] = useState(null);

    const mappings = sourcePhase?.mappings || {};
    const filePath = sourcePhase?.name || '';

    useEffect(() => {
        console.log("File Path:", filePath);
        console.log("Mappings:", mappings);
        console.log("Source phase:", sourcePhase);

        if (!sessionId || !sourcePhase?.id) {
            setError("Session or source phase information is missing.");
            setIsLoading(false);
            return;
        }

        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:8000/preprocess/stats', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        source_phase_id: sourcePhase.id,
                        file_path: filePath,
                        mappings: mappings,
                    }),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [sessionId, sourcePhase?.id, filePath]);

    const handleNullImputation = async (action) => {
        setProcessingStep('processing');
        setError(null);
        
        try {
            const response = await fetch('http://localhost:8000/preprocess/null_imputation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    source_phase_id: sourcePhase.id,
                    action: action,
                    threshold: 0.5 // Using 50% as mentioned in requirements
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            setProcessedData(result.sample_data);
            setProcessingSummary(result.processing_summary);
            setStats(result.updated_stats);
            setProcessingStep('completed');

        } catch (err) {
            setError(err.message);
            setProcessingStep('initial');
        }
    };

    const renderStatsTable = (statsData = stats) => {
        if (!statsData) return <p className="text-gray-500">No statistics available.</p>;
        const columns = Object.keys(statsData.dtypes || {});
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2 border">Column</th>
                            <th className="p-2 border">Data Type</th>
                            <th className="p-2 border">Missing (%)</th>
                            <th className="p-2 border">Mean / Unique Values</th>
                        </tr>
                    </thead>
                    <tbody>
                        {columns.map(col => (
                            <tr key={col} className="border-b">
                                <td className="p-2 border font-semibold">{col}</td>
                                <td className="p-2 border"><code>{statsData.dtypes[col]}</code></td>
                                <td className="p-2 border">{statsData.null_percentages?.[col] ?? 'N/A'}%</td>
                                <td className="p-2 border">
                                    {statsData.descriptive_stats?.mean?.[col]?.toFixed(2) ?? statsData.categorical_stats?.[col]?.unique_values ?? 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderProcessedDataPreview = () => {
        if (!processedData || processedData.length === 0) return null;

        const columns = Object.keys(processedData[0]);
        return (
            <div className="mt-6 bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-bold text-lg mb-4 text-green-800 border-b pb-2">Processed Data Preview</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-green-100">
                            <tr>
                                {columns.map(col => (
                                    <th key={col} className="p-2 border font-semibold">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="border-b">
                                    {columns.map(col => (
                                        <td key={col} className="p-2 border">
                                            {row[col] !== null && row[col] !== undefined 
                                                ? String(row[col]).substring(0, 50)
                                                : 'null'
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderProcessingSummary = () => {
        if (!processingSummary) return null;

        return (
            <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2">Processing Summary</h3>
                <div className="space-y-2 text-sm">
                    <p><strong>Action:</strong> {processingSummary.action_taken.replace('_', ' ')}</p>
                    <p><strong>Original Shape:</strong> {processingSummary.original_shape[0]} rows × {processingSummary.original_shape[1]} columns</p>
                    <p><strong>Final Shape:</strong> {processingSummary.final_shape[0]} rows × {processingSummary.final_shape[1]} columns</p>
                    
                    {processingSummary.columns_dropped && processingSummary.columns_dropped.length > 0 && (
                        <div>
                            <strong>Columns Dropped:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                                {processingSummary.columns_dropped.map(col => (
                                    <li key={col} className="text-red-600">{col}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {processingSummary.imputation_applied && (
                        <p><strong>Imputation Applied:</strong> Yes (threshold: {processingSummary.threshold_used * 100}%)</p>
                    )}
                    
                    {processingSummary.message && (
                        <p><strong>Note:</strong> {processingSummary.message}</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="text-black">
            <h2 className="text-2xl font-bold mb-2">Phase 3: Preprocessing</h2>
            <p className="text-gray-600 mb-4">
                This phase will use the mappings from <strong className="text-gray-800">{sourcePhase?.name || 'the previous phase'}</strong> to clean and standardize the data.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border mb-6">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">Confirmed Column Mappings</h3>
                <div className="space-y-3">
                    {Object.keys(mappings).length > 0 ? (
                        Object.entries(mappings).map(([column, role]) => (
                            <div key={column} className="grid grid-cols-2 items-center gap-4 text-sm">
                                <span className="font-semibold text-right truncate pr-4">{column}</span>
                                <span className="bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full text-center">{role}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No mappings were confirmed for this dataset.</p>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border mb-6">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">Data Quality Summary</h3>
                {isLoading && <Spinner />}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-600 font-semibold">Error loading stats:</p>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
                )}
                {!isLoading && !error && renderStatsTable()}
            </div>

            {processingStep === 'initial' && !error && (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-6">
                    <h3 className="font-bold text-lg mb-4 text-yellow-800 border-b pb-2">Null Value Handling</h3>
                    <p className="text-yellow-700 mb-4">
                        Choose how to handle missing values in your dataset:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => handleNullImputation('continue_without_imputation')}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Continue Without Null Imputation
                        </button>
                        <button
                            onClick={() => handleNullImputation('remove_null_columns')}
                            className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Remove Null Columns ( `{'>'}` 50%)
                        </button>
                    </div>
                    <p className="text-sm text-yellow-600 mt-3">
                        <strong>Note:</strong> "Remove Null Columns" will drop columns with more than 50% missing values and impute remaining nulls.
                    </p>
                </div>
            )}

            {processingStep === 'processing' && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
                    <h3 className="font-bold text-lg mb-4 text-blue-800">Processing Data...</h3>
                    <Spinner />
                </div>
            )}

            {processingStep === 'completed' && (
                <>
                    {renderProcessingSummary()}
                    {renderProcessedDataPreview()}
                </>
            )}

            <div className="mt-6 pt-4 border-t">
                <h3 className="font-bold text-lg mb-2">Next Steps</h3>
                <p className="text-gray-600">
                    {processingStep === 'completed' 
                        ? "Data preprocessing completed. You can now proceed to the next phase."
                        : "Select a null value handling option above to proceed with preprocessing."
                    }
                </p>
            </div>
        </div>
    );
};

export default Preprocessing;