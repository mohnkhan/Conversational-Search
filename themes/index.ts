export interface Theme {
    id: string;
    name: string;
    colors: { [key: string]: string };
}
  
export const themes: Theme[] = [
    {
      id: 'abyss',
      name: 'Abyss',
      colors: {
        '--bg-primary': '#111827', // gray-900
        '--bg-secondary': '#1f2937', // gray-800
        '--bg-tertiary': '#374151', // gray-700
        '--border-color': '#374151', // gray-700
        '--text-primary': '#f3f4f6', // gray-100
        '--text-secondary': '#d1d5db', // gray-300
        '--text-muted': '#9ca3af', // gray-400
        '--accent-primary': '#22d3ee', // cyan-400
        '--accent-secondary': '#60a5fa', // blue-400
        '--accent-danger': '#f87171', // red-400
        '--bg-accent-translucent': 'rgba(22, 163, 74, 0.1)', // Example: transparent green
        '--picker-filter': 'invert(0.8)',
      },
    },
    {
      id: 'daylight',
      name: 'Daylight',
      colors: {
        '--bg-primary': '#ffffff', // white
        '--bg-secondary': '#f3f4f6', // gray-100
        '--bg-tertiary': '#e5e7eb', // gray-200
        '--border-color': '#d1d5db', // gray-300
        '--text-primary': '#111827', // gray-900
        '--text-secondary': '#374151', // gray-700
        '--text-muted': '#6b7280', // gray-500
        '--accent-primary': '#1d4ed8', // blue-700
        '--accent-secondary': '#059669', // emerald-600
        '--accent-danger': '#dc2626', // red-600
        '--bg-accent-translucent': 'rgba(59, 130, 246, 0.1)',
        '--picker-filter': 'invert(0.1)',
      },
    },
    {
        id: 'twilight',
        name: 'Twilight',
        colors: {
          '--bg-primary': '#1e1b4b', // indigo-950
          '--bg-secondary': '#312e81', // indigo-900
          '--bg-tertiary': '#4338ca', // indigo-700
          '--border-color': '#312e81', // indigo-900
          '--text-primary': '#e0e7ff', // indigo-100
          '--text-secondary': '#c7d2fe', // indigo-200
          '--text-muted': '#a5b4fc', // indigo-300
          '--accent-primary': '#a78bfa', // violet-400
          '--accent-secondary': '#f472b6', // pink-400
          '--accent-danger': '#fb7185', // rose-400
          '--bg-accent-translucent': 'rgba(124, 58, 237, 0.1)',
          '--picker-filter': 'invert(0.8)',
        },
    },
    {
        id: 'latte',
        name: 'Latte',
        colors: {
          '--bg-primary': '#fdf8f6', // custom light beige
          '--bg-secondary': '#f2e9e4', // custom beige
          '--bg-tertiary': '#e8ddd5', // custom darker beige
          '--border-color': '#d8cdc5', // custom light brown
          '--text-primary': '#4a403a', // custom dark brown
          '--text-secondary': '#6d5d54', // custom brown
          '--text-muted': '#9a8c82', // custom muted brown
          '--accent-primary': '#c08a7b', // custom muted pink
          '--accent-secondary': '#8e6a5b', // custom darker brown
          '--accent-danger': '#b55a4d', // custom muted red
          '--bg-accent-translucent': 'rgba(192, 138, 123, 0.1)',
          '--picker-filter': 'invert(0.1)',
        },
    }
];
