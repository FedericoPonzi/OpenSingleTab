import React, { useRef } from 'react';
import type {StatusMessageProps} from '../types/tabs';

const StatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
    const statusRef = useRef<HTMLDivElement>(null);

    if (!message) return null;

    return (
        <div 
            ref={statusRef}
            className="bg-blue-100 text-blue-800 p-2 mb-4 rounded-md border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
            role="status"
            aria-live="polite"
        >
            {message}
        </div>
    );
};

export default StatusMessage;