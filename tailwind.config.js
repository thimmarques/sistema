export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f5f7ff',
                    100: '#ebf0fe',
                    200: '#dce4fd',
                    300: '#c2cdfa',
                    400: '#a2aff5',
                    500: '#7e8aee',
                    600: '#6366e6',
                    700: '#5453d1',
                    800: '#4644aa',
                    900: '#3d3c88',
                    950: '#25244f',
                },
                accent: {
                    violet: '#8b5cf6',
                    emerald: '#10b981',
                    rose: '#f43f5e',
                    amber: '#f59e0b',
                    sky: '#0ea5e9',
                }
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.05)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            }
        },
    },
    plugins: [],
}
