// Interface for tab information
export interface TabInfo {
    url: string;
    title: string;
    favicon: string;
}

// Interface for tab group structure
export interface TabGroupStructure {
    timestamp: string;
    tabs: TabInfo[];
    title?: string; // Optional title field for the group
}

// Interface for editable group title props
export interface EditableGroupTitleProps {
    title: string;
    onSave: (newTitle: string) => void;
}

// Interface for drag state
export interface DragState {
    groupIndex: number;
    tabIndex: number;
    tab: TabInfo;
}

// Interface for drop target state
export interface DropTargetState {
    groupIndex: number;
    position: 'top' | 'bottom' | 'between' | 'into';
}

// Props for TabGroup component
export interface TabGroupProps {
    group: TabGroupStructure;
    groupIndex: number;
    onUpdateTitle: (groupIndex: number, newTitle: string) => Promise<void>;
    onRestoreGroup: (groupIndex: number) => Promise<void>;
    onDeleteGroup: (groupIndex: number) => Promise<void>;
    onTabClick: (groupIndex: number, tabInfo: TabInfo, tabIndex: number) => Promise<void>;
    draggedItem: DragState | null;
    dropTarget: DropTargetState | null;
    onDragStart: (groupIndex: number, tabIndex: number, tab: TabInfo) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, groupIndex: number, position: 'top' | 'bottom' | 'between' | 'into') => void;
    onDrop: (e: React.DragEvent, groupIndex: number, position: 'top' | 'bottom' | 'between' | 'into') => void;
}

// Props for TabItem component
export interface TabItemProps {
    tabInfo: TabInfo;
    groupIndex: number;
    tabIndex: number;
    onTabClick: (groupIndex: number, tabInfo: TabInfo, tabIndex: number) => Promise<void>;
    onDragStart: (groupIndex: number, tabIndex: number, tab: TabInfo) => void;
    onDragEnd: () => void;
    isDragged: boolean;
}

// Props for GroupActions component
export interface GroupActionsProps {
    groupIndex: number;
    onRestoreGroup: (groupIndex: number) => Promise<void>;
    onDeleteGroup: (groupIndex: number) => Promise<void>;
}

// Props for StatusMessage component
export interface StatusMessageProps {
    message: string;
}

// Props for MenuDropdown component
export interface MenuDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
}