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
                    50: '#F4F4F6',
                    100: '#E4E4E9',
                    200: '#C8C8D2',
                    300: '#A3A3B4',
                    400: '#7B7B92',
                    500: '#56566F',
                    600: '#3B3C4D',
                    700: '#262734',
                    800: '#151621', // Surface card
                    900: '#0B0C15', // Main background
                    950: '#08080C',
                },
                accent: {
                    violet: '#D4AF37', // Replaced with Gold for global override if needed
                    gold: '#D4AF37',
                    goldLight: '#E5C158',
                    emerald: '#059669', // Darker emerald for sophistication
                    rose: '#9F1239', // Deep rose
                    sky: '#0C4A6E', // Deep sky
                }
            },
            borderRadius: {
                'none': '0',
                'sm': '2px',
                DEFAULT: '4px',
                'md': '4px',
                'lg': '8px',
                'xl': '12px',
                '2xl': '16px',
                '3xl': '24px',
                'full': '9999px',
            },
            boxShadow: {
                'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                'glow': '0 0 20px -5px rgba(212, 175, 55, 0.3)',
            }
        },
    },
    plugins: [],
}
