import React, { useState, useEffect, useRef } from 'react';
import { EditableGroupTitleProps } from '../types/tabs';

const EditableGroupTitle: React.FC<EditableGroupTitleProps> = ({ title, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);
    const MAX_TITLE_LENGTH = 50; // Maximum title length

    useEffect(() => {
        // Focus the input when entering edit mode
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Update local state if prop changes
    useEffect(() => {
        setEditedTitle(title);
    }, [title]);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        const trimmedTitle = editedTitle.trim();
        if (trimmedTitle !== "" && trimmedTitle !== title) {
            onSave(trimmedTitle.substring(0, MAX_TITLE_LENGTH));
        } else {
            // Reset to original title if empty or unchanged
            setEditedTitle(title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setEditedTitle(title);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex items-center">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-lg font-semibold mr-2 border-b-2 border-blue-500 focus:outline-none"
                    maxLength={MAX_TITLE_LENGTH}
                    aria-label="Edit group title"
                    autoFocus
                />
            ) : (
                <div 
                    onClick={handleEditClick} 
                    className="flex items-center cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label="Edit group title"
                    title="Click to edit group title"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            handleEditClick();
                        }
                    }}
                >
                    <span className="text-lg font-semibold mr-1 group-hover:border-b-2 group-hover:border-gray-400">
                        {title}
                    </span>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default EditableGroupTitle;