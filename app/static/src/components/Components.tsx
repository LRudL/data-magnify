import React, { useState, ReactNode } from 'react';
import { HelperContentDisplay } from './HelperContentDisplay';
import { HighlightedText } from './HighlightedText';

// TaskDropdown Component
interface TaskDropdownProps {
    tasks: string[];
    currentTask: string;
    onSelectTask: (task: string) => void;
}

export const TaskDropdown: React.FC<TaskDropdownProps> = ({ tasks, currentTask, onSelectTask }) => (
    <select 
        value={currentTask} 
        onChange={(e) => onSelectTask(e.target.value)}
    >
        <option value="">Select a task</option>
        {tasks.map(task => (
            <option key={task} value={task}>{task}</option>
        ))}
    </select>
);

// PromptBox Component
interface PromptBoxProps {
    prompt: string;
}

export const PromptBox: React.FC<PromptBoxProps> = ({ prompt }) => (
    <div className="prompt-box">
        <label htmlFor="prompt-input">Prompt:</label>
        <textarea 
            id="prompt-input"
            name="prompt-input"
            rows={4} 
            value={prompt} 
            readOnly 
        />
    </div>
);

// AnswerBox Component
interface AnswerBoxProps {
    label: string;
    answer: string;
    highlights?: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>;
}

export const AnswerBox: React.FC<AnswerBoxProps> = ({ label, answer, highlights = [] }) => {
    const id = `answer-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const displayId = `${id}-display`;
    
    return (
        <div className="answer-box">
            <label htmlFor={id}>{label}:</label>
            <textarea 
                id={id}
                name={id}
                className="answer-content visually-hidden"
                value={answer}
                readOnly
                aria-label={label}
            />
            <div 
                id={displayId}
                className="answer-content"
                aria-labelledby={id}
            >
                <HighlightedText text={answer} highlights={highlights} />
            </div>
        </div>
    );
};

// New CollapsibleDiv Component
interface CollapsibleDivProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export const CollapsibleDiv: React.FC<CollapsibleDivProps> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="collapsible-div">
            <h3 onClick={() => setIsOpen(!isOpen)}>
                {title} {isOpen ? '▼' : '▶'}
            </h3>
            {isOpen && <div className="collapsible-content">{children}</div>}
        </div>
    );
};

// Updated CriteriaList Component
interface CriteriaListProps {
    criteria: string[];
}

export const CriteriaList: React.FC<CriteriaListProps> = ({ criteria }) => (
    <CollapsibleDiv title="Criteria">
        <textarea
            id="criteria-list"
            name="criteria-list"
            className="criteria-textarea"
            value={criteria.join('\n')}
            readOnly
            rows={5}
        />
    </CollapsibleDiv>
);

// Updated HelperCollapsibleDiv Component
interface HelperCollapsibleDivProps {
    title: string;
    content: any;
}

export const HelperCollapsibleDiv: React.FC<HelperCollapsibleDivProps> = ({ title, content }) => (
    <CollapsibleDiv title={title} defaultOpen={false}>
        <pre>{JSON.stringify(content, null, 2)}</pre>
    </CollapsibleDiv>
);

// HelperTabs Component
interface HelperTabsProps {
    tabs: string[];
    onSelectTab: (tab: string) => void;
}

export const HelperTabs: React.FC<HelperTabsProps> = ({ tabs, onSelectTab }) => (
    <div id="helper-tabs" className="button-row">
        {tabs.map(tab => (
            <button key={tab} onClick={() => onSelectTab(tab)}>{tab}</button>
        ))}
    </div>
);

// Updated HelperContent Component
interface HelperContentProps {
    helpers: {
        [key: string]: any;
    };
    activeHelper: string | null;
    answerA: string;
    answerB: string;
    setHighlightsA: (highlights: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>) => void;
    setHighlightsB: (highlights: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>) => void;
}

export const HelperContent: React.FC<HelperContentProps> = ({
    helpers,
    activeHelper,
    answerA,
    answerB,
    setHighlightsA,
    setHighlightsB
}) => {
    if (!activeHelper || !helpers[activeHelper]) {
        return null;
    }

    return (
        <HelperContentDisplay
            helperType={activeHelper}
            content={helpers[activeHelper]}
            answerA={answerA}
            answerB={answerB}
            setHighlightsA={setHighlightsA}
            setHighlightsB={setHighlightsB}
        />
    );
};

// ColoredHelperTabs Component
interface ColoredHelperTabsProps {
    tabs: { [key: string]: string[] };
    onSelectTab: (tab: string) => void;
    fetchedHelpers: string[];
}

export const ColoredHelperTabs: React.FC<ColoredHelperTabsProps> = ({ tabs, onSelectTab, fetchedHelpers }) => (
    <div id="helper-tabs" className="button-row">
        {Object.entries(tabs).map(([tabName, helperNames]) => {
            const allHelpersFetched = helperNames.every((helper) => fetchedHelpers.includes(helper));
            return (
                <button
                    key={tabName}
                    onClick={() => onSelectTab(tabName)}
                    className={allHelpersFetched ? 'fetched' : ''}
                >
                    {tabName}
                </button>
            );
        })}
    </div>
);

// New HelperButtons Component
interface HelperButtonsProps {
    helperNames: string[];
    onHelperClick: (helperName: string) => Promise<void>;
    onHelperDelete: (helperName: string, event: React.MouseEvent) => void;
    activeHelper: string | null;
    cachedHelpers: string[];
    loadingHelpers: string[];
}

export const HelperButtons: React.FC<HelperButtonsProps> = ({ 
    helperNames, 
    onHelperClick, 
    onHelperDelete,
    activeHelper, 
    cachedHelpers,
    loadingHelpers 
}) => (
    <div className="helper-buttons">
        {helperNames.map(helperName => (
            <div key={helperName} className="helper-button-group">
                <button 
                    onClick={async () => {
                        await onHelperClick(helperName);
                    }}
                    className={`
                        helper-button
                        ${activeHelper === helperName ? 'active' : ''}
                        ${cachedHelpers.includes(helperName) ? 'cached' : ''}
                        ${loadingHelpers.includes(helperName) ? 'loading' : ''}
                    `}
                    disabled={loadingHelpers.includes(helperName)}
                >
                    <span className="helper-name">{helperName}</span>
                    {loadingHelpers.includes(helperName) && (
                        <span className="loading-spinner">↻</span>
                    )}
                </button>
                {cachedHelpers.includes(helperName) && (
                    <button 
                        className="delete-button"
                        onClick={(e) => onHelperDelete(helperName, e)}
                        title="Delete helper results"
                    >
                        🗑️
                    </button>
                )}
            </div>
        ))}
    </div>
);
