import React, { useState, useEffect } from 'react';
import {
    TaskDropdown,
    PromptBox,
    AnswerBox,
    CriteriaList,
    HelperContent,
    HelperButtons
} from './components/Components.tsx';

interface Task {
    prompt: string;
    answers: string[];
    criteria: string[];
    helpers: {
        [key: string]: any;
    };
}

// Define a global variable to store the latest task
let latestTask: Task | null = null;

const MainContent: React.FC<{
    taskNames: string[];
    currentTaskName: string;
    currentTask: Task | null;
    highlightsA: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>;
    highlightsB: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>;
    onSelectTask: (task: string) => void;
}> = ({ taskNames, currentTaskName, currentTask, highlightsA, highlightsB, onSelectTask }) => (
    <div className="main">
        <TaskDropdown 
            tasks={taskNames} 
            currentTask={currentTaskName} 
            onSelectTask={onSelectTask} 
        />
        <PromptBox prompt={currentTask?.prompt || ''} />
        <div className="answer-boxes">
            <AnswerBox 
                label="Answer A" 
                answer={currentTask?.answers[0] || ''} 
                highlights={highlightsA}
            />
            <AnswerBox 
                label="Answer B" 
                answer={currentTask?.answers[1] || ''} 
                highlights={highlightsB}
            />
        </div>
    </div>
);

const Sidebar: React.FC<{
    currentTask: Task | null;
    helperNames: string[];
    onHelperClick: (helperName: string) => Promise<void>;
    onHelperDelete: (helperName: string, event: React.MouseEvent) => void;
    activeHelper: string | null;
    cachedHelpers: string[];
    loadingHelpers: string[];
    setHighlightsA: (highlights: Array<{ start: number; end: number; text: string; color: string; tooltip?: string; }>) => void;
    setHighlightsB: (highlights: Array<{ start: number; end: number; text: string; color: string; tooltip?: string; }>) => void;
}> = ({ currentTask, helperNames, onHelperClick, onHelperDelete, activeHelper, cachedHelpers, loadingHelpers, setHighlightsA, setHighlightsB }) => (
    <div className="sidebar">
        <CriteriaList criteria={currentTask?.criteria || []} />
        <hr />
        <HelperButtons 
            helperNames={helperNames}
            onHelperClick={onHelperClick}
            onHelperDelete={onHelperDelete}
            activeHelper={activeHelper}
            cachedHelpers={cachedHelpers}
            loadingHelpers={loadingHelpers}
        />
        <HelperContent 
            helpers={currentTask?.helpers || {}} 
            activeHelper={activeHelper}
            answerA={currentTask?.answers[0] || ''}
            answerB={currentTask?.answers[1] || ''}
            setHighlightsA={setHighlightsA}
            setHighlightsB={setHighlightsB}
        />
    </div>
);

const App: React.FC = () => {
    const [taskNames, setTaskNames] = useState<string[]>([]);
    const [currentTaskName, setCurrentTaskName] = useState<string>('');
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [helperNames, setHelperNames] = useState<string[]>([]);
    const [activeHelper, setActiveHelper] = useState<string | null>(null);
    const [cachedHelpers, setCachedHelpers] = useState<string[]>([]);
    const [loadingHelpers, setLoadingHelpers] = useState<string[]>([]);
    const [highlightsA, setHighlightsA] = useState<Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>>([]);
    const [highlightsB, setHighlightsB] = useState<Array<{
        start: number;
        end: number;
        text: string;
        color: string;
        tooltip?: string;
    }>>([]);

    useEffect(() => {
        // Fetch task names
        fetch('/task_names')
            .then(response => response.json())
            .then(names => {
                setTaskNames(names);
                if (names.length > 0) {
                    setCurrentTaskName(names[0]);
                    loadTask(names[0]);
                }
            });

        // Fetch helper names
        fetch('/helper_names')
            .then(response => response.json())
            .then(setHelperNames);
    }, []);

    const loadTask = (taskName: string) => {
        fetch(`/task/${taskName}`)
            .then(response => response.json())
            .then((tasks: Task[]) => {
                if (tasks.length > 0) {
                    const task = tasks[0];
                    setCurrentTask(task);
                    latestTask = task; // Update the global variable
                    
                    // Update cachedHelpers based on the helpers in the task
                    const loadedHelpers = Object.keys(task.helpers);
                    setCachedHelpers(loadedHelpers);
                }
            });
    };

    const runHelper = async (helperName: string) => {
        if (!currentTaskName) return;

        setActiveHelper(helperName);
        setLoadingHelpers(prev => [...prev, helperName]);

        try {
            if (currentTask?.helpers[helperName]) {
                // Helper data already exists, no need to fetch
                setLoadingHelpers(prev => prev.filter(h => h !== helperName));
                return;
            }

            const response = await fetch(`/run_helper/${currentTaskName}/${helperName}`);
            const updatedTask = await response.json();
            
            // Update the current task with the new data
            setCurrentTask(updatedTask[0]); // Assuming the API returns an array with one task
            latestTask = updatedTask[0]; // Update the global variable
            
            // Update cached helpers
            setCachedHelpers(prev => [...prev, helperName]);
        } catch (error) {
            console.error('Error running helper:', error);
        } finally {
            setLoadingHelpers(prev => prev.filter(h => h !== helperName));
        }
    };

    const deleteHelper = (helperName: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the main button click
        
        if (!currentTaskName) return;

        fetch(`/delete_helper_for_task/${currentTaskName}/${helperName}`)
            .then(response => response.json())
            .then(() => {
                setCurrentTask(prevTask => {
                    if (!prevTask) return null;
                    const { [helperName]: _, ...remainingHelpers } = prevTask.helpers;
                    return {
                        ...prevTask,
                        helpers: remainingHelpers
                    };
                });
                setCachedHelpers(prev => prev.filter(h => h !== helperName));
                if (activeHelper === helperName) {
                    setActiveHelper(null);
                }
            });
    };

    return (
        <div className="container">
            <MainContent
                taskNames={taskNames}
                currentTaskName={currentTaskName}
                currentTask={currentTask}
                highlightsA={highlightsA}
                highlightsB={highlightsB}
                onSelectTask={(task) => {
                    setCurrentTaskName(task);
                    loadTask(task);
                    setActiveHelper(null);
                    setHighlightsA([]);  // Clear highlights on task change
                    setHighlightsB([]);
                }}
            />
            <Sidebar
                currentTask={currentTask}
                helperNames={helperNames}
                onHelperClick={runHelper}
                onHelperDelete={deleteHelper}
                activeHelper={activeHelper}
                cachedHelpers={cachedHelpers}
                loadingHelpers={loadingHelpers}
                setHighlightsA={setHighlightsA}
                setHighlightsB={setHighlightsB}
            />
        </div>
    );
};

export default App;

// Add this to make the latest task accessible in the console
if (typeof window !== 'undefined') {
    (window as any).getLatestTask = () => latestTask;
}
