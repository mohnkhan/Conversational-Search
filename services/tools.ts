import { FunctionDeclaration, Type } from "@google/genai";
import { ToolDefinition } from "../types";
import { CloudSunIcon, CheckSquareIcon } from '../components/Icons';

// This function acts as a factory to create the list of available tools,
// allowing for dependency injection (e.g., passing state-mutating functions like handleAddTask).
export const getAvailableTools = (dependencies: { 
    handleAddTask: (task: string) => void; 
    getCurrentWeather: (location: string) => Promise<string>;
}): ToolDefinition[] => {
    
    // Tool Implementations
    const createTodoTask = (task: string): string => {
        if (!task) {
            return JSON.stringify({ success: false, error: 'Task content cannot be empty.' });
        }
        dependencies.handleAddTask(task);
        return JSON.stringify({ success: true, message: `Task "${task}" was added to the To-Do list.` });
    };

    return [
        {
            name: 'getCurrentWeather',
            description: 'Fetches real-time weather data for a specified location using a public API.',
            icon: CloudSunIcon,
            schema: {
                name: 'getCurrentWeather',
                parameters: {
                    type: Type.OBJECT,
                    description: 'Get the current weather in a given location.',
                    properties: {
                        location: {
                            type: Type.STRING,
                            description: 'The city and state, e.g., San Francisco, CA',
                        },
                    },
                    required: ['location'],
                },
            },
            implementation: ({ location }) => dependencies.getCurrentWeather(location),
        },
        {
            name: 'createTodoTask',
            description: 'Adds a new task to the user\'s integrated To-Do list within the application.',
            icon: CheckSquareIcon,
            schema: {
                name: 'createTodoTask',
                parameters: {
                    type: Type.OBJECT,
                    description: 'Create a new task in the to-do list.',
                    properties: {
                        task: {
                            type: Type.STRING,
                            description: 'The content of the task to be added.',
                        },
                    },
                    required: ['task'],
                },
            },
            implementation: ({ task }) => createTodoTask(task),
        },
    ];
};
