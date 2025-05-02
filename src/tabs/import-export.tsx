import React, { useState, useEffect } from "react";
import "../style.css";

// Interface for tab information
interface TabInfo {
    url: string;
    title: string;
    favicon: string;
}

// Interface for tab group structure
interface TabGroup {
    timestamp: string;
    tabs: TabInfo[];
    title?: string; // Optional title field for the group
}

// TextArea component for reusability
interface TextAreaProps {
    title: string;
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    placeholder?: string;
    className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({ 
    title, 
    value, 
    onChange, 
    readOnly = false, 
    placeholder = "", 
    className = "" 
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <textarea
                className="w-full h-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value}
                onChange={e => onChange && onChange(e.target.value)}
                readOnly={readOnly}
                placeholder={placeholder}
            />
        </div>
    );
};

// Checkbox component for reusability
interface CheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
    return (
        <label className="flex items-center space-x-2 cursor-pointer mb-2">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={e => onChange(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">{label}</span>
        </label>
    );
};

function ImportExportPage() {
    const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
    const [importText, setImportText] = useState("");
    const [exportText, setExportText] = useState("");
    const [addGroupTitles, setAddGroupTitles] = useState(false);
    const [asMarkdown, setAsMarkdown] = useState(false);
    
    // Load saved tab groups when component mounts
    useEffect(() => {
        chrome.storage.local.get(["tabGroups"], (data) => {
            if (data.tabGroups) {
                setTabGroups(data.tabGroups);
                generateExportText(data.tabGroups, addGroupTitles, asMarkdown);
            }
        });
        
        // Add storage change listener
        const handleStorageChange = (changes: any, namespace: string) => {
            if (namespace === 'local' && changes.tabGroups) {
                const newTabGroups = changes.tabGroups.newValue || [];
                setTabGroups(newTabGroups);
                generateExportText(newTabGroups, addGroupTitles, asMarkdown);
            }
        };
        
        chrome.storage.onChanged.addListener(handleStorageChange);
        
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);
    
    // Update export text when options change
    useEffect(() => {
        generateExportText(tabGroups, addGroupTitles, asMarkdown);
    }, [addGroupTitles, asMarkdown]);
    
    // Generate export text based on options
    const generateExportText = (groups: TabGroup[], includeGroupTitles: boolean, markdownFormat: boolean) => {
        let text = "";
        
        groups.forEach((group, index) => {
            // Add group title if option is enabled and title exists
            if (includeGroupTitles && group.title) {
                text += markdownFormat ? `## ${group.title}\n` : `${group.title}\n`;
            }
            
            // Add tabs
            group.tabs.forEach(tab => {
                if (markdownFormat) {
                    text += `[${tab.title || tab.url}](${tab.url})\n`;
                } else {
                    text += `${tab.url} | ${tab.title || ""}\n`;
                }
            });
            
            // Add an empty line between groups (but not after the last group)
            if (index < groups.length - 1) {
                text += "\n";
            }
        });
        
        setExportText(text);
    };
    
    // Handle import button click
    const handleImport = async () => {
        if (!importText.trim()) {
            return;
        }
        
        try {
            // Split the import text by groups (separated by empty lines)
            const groupTexts = importText.trim().split(/\n\s*\n/);
            const newTabGroups: TabGroup[] = [];
            let totalTabs = 0;
            
            // Process each group
            groupTexts.forEach((groupText, groupIndex) => {
                const lines = groupText.trim().split("\n");
                const tabs: TabInfo[] = [];
                let groupTitle = `Import Group ${groupIndex + 1}`;
                let firstLineIsTitle = false;
                
                // Check if the first line might be a title (doesn't contain a URL)
                if (lines.length > 0) {
                    const firstLine = lines[0].trim();
                    // If the first line doesn't contain a URL and doesn't have a pipe character
                    if (!isValidUrl(firstLine) && !firstLine.includes("|")) {
                        groupTitle = firstLine;
                        firstLineIsTitle = true;
                    }
                }
                
                // Process each line in the group
                lines.forEach((line, lineIndex) => {
                    // Skip the first line if it's a title
                    if (firstLineIsTitle && lineIndex === 0) return;
                    
                    if (!line.trim()) return;
                    
                    // Parse URL and optional title
                    const parts = line.split("|");
                    const url = parts[0].trim();
                    const title = parts.length > 1 ? parts[1].trim() : url;
                    
                    if (url && isValidUrl(url)) {
                        tabs.push({
                            url,
                            title,
                            favicon: ""
                        });
                    }
                });
                
                if (tabs.length > 0) {
                    // Create a new tab group
                    const newTabGroup: TabGroup = {
                        timestamp: new Date().toLocaleString(),
                        tabs,
                        title: groupTitle
                    };
                    
                    newTabGroups.push(newTabGroup);
                    totalTabs += tabs.length;
                }
            });
            
            if (newTabGroups.length === 0) {
                alert("No valid URLs found in the import text.");
                return;
            }
            
            // Get existing tab groups and add the new ones
            const data = await chrome.storage.local.get({tabGroups: []}) as {tabGroups: TabGroup[]};
            const updatedTabGroups = [...newTabGroups, ...data.tabGroups];
            
            // Save the updated tab groups
            await chrome.storage.local.set({tabGroups: updatedTabGroups});
            
            // Clear the import text
            setImportText("");
            
            // Update the tab groups state
            setTabGroups(updatedTabGroups);
            
            // Update the export text
            generateExportText(updatedTabGroups, addGroupTitles, asMarkdown);
            
            alert(`Successfully imported ${totalTabs} tabs in ${newTabGroups.length} groups.`);
        } catch (error) {
            console.error("Error importing tabs:", error);
            alert("An error occurred while importing tabs.");
        }
    };
    
    // Validate URL
    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };
    
    return (
        <div className="flex flex-col p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Import / Export Tabs</h1>
                <a 
                    href="display.html" 
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    Back to OpenSingleTab
                </a>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {/* Import Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <TextArea 
                        title="Import tabs"
                        value={importText}
                        onChange={setImportText}
                        placeholder="Paste URLs in 'url | title' format (one per line, title is optional).\n\nSeparate groups with empty lines.\nYou can add a group title as the first line of each group."
                    />
                    <button 
                        onClick={handleImport}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                    >
                        Import
                    </button>
                </div>
                
                {/* Export Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <TextArea 
                        title="Export tabs"
                        value={exportText}
                        readOnly={true}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2 mb-4 sm:mb-0">
                            <Checkbox 
                                label="Add group titles" 
                                checked={addGroupTitles} 
                                onChange={setAddGroupTitles} 
                            />
                            <Checkbox 
                                label="As Markdown" 
                                checked={asMarkdown} 
                                onChange={setAsMarkdown} 
                            />
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(exportText);
                                alert("Exported tabs copied to clipboard!");
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImportExportPage;