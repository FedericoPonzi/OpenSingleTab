import React from 'react';
import type {GroupActionsProps} from '../types/tabs';

const GroupActions: React.FC<GroupActionsProps> = ({
    groupIndex,
    onRestoreGroup,
    onDeleteGroup
}) => {
    return (
        <div className="flex gap-2">
            <button
                onClick={() => onRestoreGroup(groupIndex)}
                className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
                Restore
            </button>
            <button
                onClick={() => onDeleteGroup(groupIndex)}
                className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
            >
                Delete
            </button>
        </div>
    );
};

export default GroupActions;