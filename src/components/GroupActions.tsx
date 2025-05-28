import React from 'react';
import type {GroupActionsProps} from '../types/tabs';

const GroupActions: React.FC<GroupActionsProps> = ({
    groupIndex,
    onOpenAllInThisWindow,
    onOpenAllInNewWindow,
    onDeleteGroup
}) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={() => onOpenAllInThisWindow(groupIndex)}
                className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
                Open all
            </button>
            <button
                onClick={() => onOpenAllInNewWindow(groupIndex)}
                className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
            >
                Open all in new window
            </button>
            <button
                onClick={() => onDeleteGroup(groupIndex)}
                className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
            >
                Delete group
            </button>
        </div>
    );
};

export default GroupActions;