import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './HelperIcons';

const Header = ({ phaseHistory, onPhaseSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const allUploads = phaseHistory.filter(p => p.type === 'ingestion');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-[#EAEEE7] text-[#05090A] p-4 shadow-sm flex justify-between items-center">
      {/* Ocean Pilot Title */}
      <h1 className="text-2xl font-heading font-bold text-[#05090A]">
        OCEAN PILOT
      </h1>
      
      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#6A8BA3] text-white text-sm font-body font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#5A7A93] transition-colors shadow-sm"
        >
          Datasets Uploaded: {allUploads.length}
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {isOpen && allUploads.length > 0 && (
          <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] border border-[#D3E1E9] rounded-lg shadow-lg z-10 text-[#05090A] py-2">
            <div className="font-body font-normal text-base px-4 py-2 border-b border-[#D3E1E9]">
              Uploaded Files
            </div>
            {allUploads.map((phase) => (
              <a
                key={phase.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPhaseSelect(phase.id);
                  setIsOpen(false);
                }}
                className="block px-4 py-2 text-sm hover:bg-[#D3E1E9] transition-colors rounded-md"
              >
                {phase.name}{' '}
                <span className="text-xs text-gray-500">
                  ({phase.data.size_kb} KB)
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;