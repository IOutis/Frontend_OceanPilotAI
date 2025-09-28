// src/components/ColumnMapping.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const COLORS = {
  offWhite: '#EAEEE7',
  lightBlue: '#D3E1E9',
  deepGreen: '#3F5734',
  warmTan: '#C19D77',
  mutedBlue: '#6A8BA3',
  blackText: '#05090A'
};

const ColumnMapping = ({ phase, onAskAI, onConfirmMapping, isAgentThinking, suggestedMappings }) => {
  const MAPPING_ROLES = [
    "Ignore", "Latitude", "Longitude", "Date", "Time",
    "Depth", "Temperature", "Salinity", "Oxygen", "Phosphate",
    "Silicate", "Nitrate", "Categorical", "Numerical"
  ];

  const columns = phase?.data?.data?.[0] ? Object.keys(phase.data.data[0]) : [];

  const [mappings, setMappings] = useState(() => {
    const initial = {};
    columns.forEach(col => { initial[col] = "Ignore"; });
    return initial;
  });

  useEffect(() => {
    if (suggestedMappings) {
      const updated = {};
      for (const colName in suggestedMappings) {
        const suggestion = suggestedMappings[colName];
        if (MAPPING_ROLES.includes(suggestion.role)) {
          updated[colName] = suggestion.role;
        }
      }
      setMappings(prev => ({ ...prev, ...updated }));
    }
  }, [suggestedMappings]);

  const handleMappingChange = (column, role) => {
    setMappings(prev => ({ ...prev, [column]: role }));
  };

  return (
    <div
      className="rounded-2xl shadow-lg p-6 space-y-6"
      style={{ background: COLORS.offWhite, color: COLORS.blackText }}
    >
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-heading font-semibold">Phase 2: Column Mapping</h2>
        <p className="text-sm opacity-80">
          Assign a role to each column from{" "}
          <strong>{phase?.data?.filename}</strong>.  
          You can also ask AI for suggestions.
        </p>
      </div>

      {/* Column mapping table */}
      <div
        className="rounded-xl border divide-y"
        style={{ borderColor: COLORS.lightBlue }}
      >
        {columns.map(col => (
          <div
            key={col}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="font-medium truncate pr-4">{col}</span>
            <select
              id={`select-${col}`}
              value={mappings[col] || "Ignore"}
              onChange={(e) => handleMappingChange(col, e.target.value)}
              className="rounded-xl px-3 py-2 text-sm focus:outline-none shadow-sm"
              style={{
                border: `1px solid ${COLORS.lightBlue}`,
                background: COLORS.offWhite,
                color: COLORS.blackText
              }}
            >
              {MAPPING_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div
        className="flex gap-4 pt-4 border-t"
        style={{ borderColor: COLORS.lightBlue }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAskAI}
          disabled={isAgentThinking}
          className="flex-1 rounded-xl px-4 py-2 font-body font-medium shadow-sm"
          style={{
            background: isAgentThinking ? COLORS.lightBlue : COLORS.mutedBlue,
            color: COLORS.blackText,
            border: `1px solid ${COLORS.mutedBlue}`,
            opacity: isAgentThinking ? 0.7 : 1
          }}
        >
          {isAgentThinking ? "Thinking..." : "Ask AI for Suggestions"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onConfirmMapping(mappings)}
          className="flex-1 rounded-xl px-4 py-2 font-body font-medium shadow-sm"
          style={{
            background: COLORS.deepGreen,
            color: COLORS.blackText,
            border: `1px solid ${COLORS.deepGreen}`
          }}
        >
          Confirm Mapping
        </motion.button>
      </div>
    </div>
  );
};

export default ColumnMapping;