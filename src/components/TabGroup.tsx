import React from 'react';
import type {TabGroupProps} from '../types/tabs';
import EditableGroupTitle from './EditableGroupTitle';
import GroupActions from './GroupActions';
import TabItem from './TabItem';

const TabGroup: React.FC<TabGroupProps> = ({
    group,
    groupIndex,
    onUpdateTitle,
    onRestoreGroup,
    onDeleteGroup,
    onTabClick,
    draggedItem,
    dropTarget,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop
}) => {
    return (
        <div>
            <div className="mb-2 pb-1 last:border-b-0">
                <div className="flex items-center mb-2">
                    <div className="flex items-center mr-4">
                        <EditableGroupTitle 
                            title={group.title || "Group"} 
                            onSave={(newTitle) => onUpdateTitle(groupIndex, newTitle)} 
                        />
                        <span className="text-gray-600 ml-2">
                            {group.timestamp} ({group.tabs.length} tabs)
                        </span>
                    </div>
                    <GroupActions
                        groupIndex={groupIndex}
                        onRestoreGroup={onRestoreGroup}
                        onDeleteGroup={onDeleteGroup}
                    />
                </div>
                <ul 
                    className={`m-0 list-none rounded-lg transition-colors ${
                        dropTarget?.groupIndex === groupIndex && dropTarget?.position === 'into' 
                            ? 'border-2 border-dashed border-blue-500' 
                            : ''
                    }`}
                    role="region"
                    aria-label={`Tab group: ${group.title || "Group"}`}
                    onDragOver={(e) => onDragOver(e, groupIndex, 'into')}
                    onDrop={(e) => onDrop(e, groupIndex, 'into')}
                >
                    {group.tabs.map((tabInfo, tabIndex) => (
                        <TabItem
                            key={`${groupIndex}-${tabIndex}`}
                            tabInfo={tabInfo}
                            groupIndex={groupIndex}
                            tabIndex={tabIndex}
                            onTabClick={onTabClick}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            isDragged={draggedItem?.groupIndex === groupIndex && draggedItem?.tabIndex === tabIndex}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TabGroup;