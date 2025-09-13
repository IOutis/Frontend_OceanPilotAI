import React, { useState, useEffect, useRef } from 'react';
import {PlusIcon,ChevronDownIcon,UserIcon,BotIcon} from './HelperIcons';


const Header = ({ phaseHistory, onPhaseSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const allUploads = phaseHistory.filter(p => p.type === 'ingestion');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md flex justify-between items-center">
      <h1 className="text-xl font-bold">AI-Enabled Marine Data Platform ⚓</h1>
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 hover:bg-blue-600 transition-colors">
          Datasets Uploaded: {allUploads.length}
          <ChevronDownIcon />
        </button>
        {isOpen && allUploads.length > 0 && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 text-black py-1">
            <div className="font-bold px-4 py-2 border-b">Uploaded Files</div>
            {allUploads.map((phase) => (
              <a key={phase.id} href="#" onClick={(e) => { e.preventDefault(); onPhaseSelect(phase.id); setIsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                {phase.name} <span className="text-xs text-gray-500">({phase.data.size_kb} KB)</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
export default Header;
