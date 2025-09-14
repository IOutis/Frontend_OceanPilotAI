import React, { useState, useEffect, useRef } from 'react';

import FileUploader from './FileUpload'; // You would need to create this file
import DatasetPreview from './DatasetPreview'; // This is the file you have

// --- NEW: Placeholder for the Column Mapping Component ---
const ColumnMapping = ({ phase, onAskAI, onConfirmMapping, isAgentThinking, suggestedMappings }) => {
    // Standard roles for marine science data
    const MAPPING_ROLES = ["Ignore", "Latitude", "Longitude", "Date", "Time", "Depth", "Temperature", "Salinity", "Oxygen", "Phosphate", "Silicate", "Nitrate", "Categorical", "Numerical"];

    // Safely get the columns from the first row of data
    const columns = phase?.data?.data?.[0] ? Object.keys(phase.data.data[0]) : [];

    // State to hold the mapping choices. Initialize all to "Ignore".
    const [mappings, setMappings] = useState(() => {
        const initialMappings = {};
        columns.forEach(col => {
            initialMappings[col] = "Ignore";
        });
        return initialMappings;
    });

    // --- CHANGE 1: This effect runs when new suggestions arrive from the App component ---
    useEffect(() => {
        if (suggestedMappings) {
            console.log("Received new suggestions:", suggestedMappings);
            const updatedMappings = {};
            // Loop through the suggestions from the AI
            for (const colName in suggestedMappings) {
                const suggestion = suggestedMappings[colName];
                // Check if the suggested role is one of the valid options in our dropdown
                if (MAPPING_ROLES.includes(suggestion.role)) {
                    updatedMappings[colName] = suggestion.role;
                }
            }
            // Update the local state to change the dropdowns
            setMappings(prev => ({ ...prev, ...updatedMappings }));
        }
    }, [suggestedMappings]);

    // Handler for when the user changes a dropdown
    const handleMappingChange = (column, selectedRole) => {
        setMappings(prev => ({
            ...prev,
            [column]: selectedRole
        }));
    };
    
    // --- CHANGE 2: Placeholder functions are now connected to props ---
    const handleAskAI = () => {
        // This now calls the function passed down from App.jsx
        onAskAI(); 
    };

    const handleConfirmMapping = () => {
        // This now calls the function from App.jsx, passing the current mappings up
        onConfirmMapping(mappings);
    };

    return (
        <div className="text-black">
            <h2 className="text-2xl font-bold mb-2">Phase 2: Column Mapping</h2>
            <p className="text-gray-600 mb-6">
                Assign a standard role to each column from <strong className="text-gray-800">{phase.data.filename}</strong>. The AI can help suggest roles.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                {columns.map(col => (
                    <div key={col} className="grid grid-cols-2 items-center gap-4">
                        <label htmlFor={`select-${col}`} className="font-semibold text-right truncate pr-4">{col}</label>
                        <select 
                            id={`select-${col}`}
                            value={mappings[col] || "Ignore"} // Fallback to "Ignore"
                            onChange={(e) => handleMappingChange(col, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            {MAPPING_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t flex gap-4">
                {/* --- CHANGE 3: Button now uses isAgentThinking prop --- */}
                <button 
                    onClick={handleAskAI} 
                    disabled={isAgentThinking}
                    className="w-1/2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isAgentThinking ? "Thinking..." : "Ask AI for Suggestions"}
                </button>
                <button onClick={handleConfirmMapping} className="w-1/2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700">
                    Confirm Mapping
                </button>
            </div>
        </div>
    );
};

export default ColumnMapping;