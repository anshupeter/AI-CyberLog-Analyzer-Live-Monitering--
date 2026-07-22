/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-bg': '#0A0F1F',
                'cyber-bg-light': '#0D1328',
                'cyber-card': '#111827',
                'cyber-card-light': '#1a2332',
                'cyber-border': '#1e293b',
                'neon-cyan': '#00F0FF',
                'neon-purple': '#A855F7',
                'neon-blue': '#3B82F6',
                'neon-red': '#EF4444',
                'neon-green': '#10B981',
                'neon-yellow': '#F59E0B',
                'neon-pink': '#EC4899',
                'neon-orange': '#F97316',
            },
            boxShadow: {
                'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.3), 0 0 30px rgba(0, 240, 255, 0.1)',
                'neon-purple': '0 0 15px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.1)',
                'neon-blue': '0 0 15px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.1)',
                'neon-red': '0 0 15px rgba(239, 68, 68, 0.3), 0 0 30px rgba(239, 68, 68, 0.1)',
                'neon-green': '0 0 15px rgba(16, 185, 129, 0.3), 0 0 30px rgba(16, 185, 129, 0.1)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
            },
            animation: {
                'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slide-up 0.5s ease-out',
                'slide-in': 'slide-in 0.3s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'cyber-scan': 'cyber-scan 3s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                'pulse-neon': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                },
                'glow': {
                    '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2)' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(20px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(-20px)', opacity: 0 },
                    '100%': { transform: 'translateX(0)', opacity: 1 },
                },
                'fade-in': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
                'cyber-scan': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            fontFamily: {
                'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
                'cyber': ['Orbitron', 'sans-serif'],
            },
            backgroundImage: {
                'cyber-grid': 'linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)',
            },
            backgroundSize: {
                'cyber-grid': '50px 50px',
            },
        },
    },
    plugins: [],
}
