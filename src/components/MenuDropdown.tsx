import React from 'react';
import { MenuDropdownProps } from '../types/tabs';

const MenuDropdown: React.FC<MenuDropdownProps> = ({ isOpen, onToggle }) => {
    return (
        <div className="relative menu-container">
            <button 
                className="text-gray-700 hover:text-blue-600 focus:outline-none"
                onClick={onToggle}
                aria-label="Menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                        <a 
                            href="import-export.html" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Import / Export tabs
                        </a>
                        <a 
                            href="../options.html" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Options
                        </a>
                        <a 
                            href="https://github.com/FedericoPonzi/OpenSingleTab" 
                            target="_blank"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Info/Feedback
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuDropdown;