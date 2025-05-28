import React from 'react';
import type {TabItemProps} from '../types/tabs';

const TabItem: React.FC<TabItemProps> = ({
    tabInfo,
    groupIndex,
    tabIndex,
    onTabClick,
    onDragStart,
    onDragEnd,
    isDragged
}) => {
    return (
        <li 
            className={`flex items-center mb-2 pl-[0.2rem] rounded cursor-move ${
                isDragged ? 'opacity-50' : ''
            } hover:bg-gray-50`}
            draggable
            onDragStart={() => onDragStart(groupIndex, tabIndex, tabInfo)}
            onDragEnd={onDragEnd}
        >
            {tabInfo.favicon && (
                <img
                    src={tabInfo.favicon}
                    alt=""
                    className="w-4 h-4 mr-2 object-contain"
                    draggable="false"
                />
            )}
            <a
                href={tabInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async (e) => {
                    e.preventDefault();
                    await onTabClick(groupIndex, tabInfo, tabIndex);
                }}
                title={tabInfo.url}
                className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-full"
                draggable="false"
            >
                {tabInfo.title || tabInfo.url}
            </a>
        </li>
    );
};

export default TabItem;