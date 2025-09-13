import React, { useState, useEffect, useRef } from 'react';
const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
  </svg>
);

const UserIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const ErrorDisplay = ({ error }) => {
    return <p className="text-red-600 font-semibold p-4 bg-red-50 rounded-md">Error parsing file: {error}</p>
}

// --- New Helper Component: GenericDataTable ---
// This component is specifically designed to render CSV/JSON data in a clean table.
const GenericDataTable = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-gray-500">No tabular data preview is available for this file.</p>;
  }
  
  if (data[0] && data[0].error) {
    return <p className="text-red-600 font-semibold">Error parsing file: {data[0].error}</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-200">
          <tr>
            {headers.map(header => (
              <th key={header} className="p-2 border border-gray-300 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50">
              {headers.map(header => (
                <td key={`${rowIndex}-${header}`} className="p-2 border border-gray-300">
                  {typeof row[header] === 'object' && row[header] !== null 
                    ? JSON.stringify(row[header]) 
                    : String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export  {PlusIcon,ChevronDownIcon,UserIcon,BotIcon,GenericDataTable,ErrorDisplay}; ;
