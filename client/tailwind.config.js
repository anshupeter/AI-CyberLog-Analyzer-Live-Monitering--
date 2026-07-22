/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-bg': '#060913',
                'cyber-bg-light': '#0B1120',
                'cyber-card': '#0F172A',
                'cyber-card-light': '#1E293B',
                'cyber-card-glow': 'rgba(15, 23, 42, 0.75)',
                'cyber-border': 'rgba(255, 255, 255, 0.08)',
                'cyber-border-glow': 'rgba(0, 240, 255, 0.3)',
                'neon-cyan': '#00F0FF',
                'neon-purple': '#A855F7',
                'neon-blue': '#3B82F6',
                'neon-red': '#FF2E93',
                'neon-green': '#10B981',
                'neon-yellow': '#F59E0B',
                'neon-pink': '#EC4899',
                'neon-orange': '#F97316',
                'neon-sky': '#38BDF8',
            },
            boxShadow: {
                'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.35), 0 0 40px rgba(0, 240, 255, 0.15)',
                'neon-purple': '0 0 20px rgba(168, 85, 247, 0.35), 0 0 40px rgba(168, 85, 247, 0.15)',
                'neon-blue': '0 0 20px rgba(59, 130, 246, 0.35), 0 0 40px rgba(59, 130, 246, 0.15)',
                'neon-red': '0 0 20px rgba(255, 46, 147, 0.35), 0 0 40px rgba(255, 46, 147, 0.15)',
                'neon-green': '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
                'glass': '0 10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                'glass-hover': '0 15px 50px rgba(0, 240, 255, 0.15), inset 0 1px 0 rgba(0, 240, 255, 0.3)',
            },
            animation: {
                'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
                'glow': 'glow 3s ease-in-out infinite alternate',
                'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in': 'slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in': 'fade-in 0.4s ease-out',
                'cyber-scan': 'cyber-scan 4s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s infinite linear',
            },
            keyframes: {
                'pulse-neon': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                },
                'glow': {
                    '0%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 30px rgba(0, 240, 255, 0.5), 0 0 60px rgba(0, 240, 255, 0.2)' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(16px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
                'slide-in': {
                    '0%': { transform: 'translateX(-16px)', opacity: 0 },
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
                    '50%': { transform: 'translateY(-8px)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            fontFamily: {
                'sans': ['Outfit', 'Inter', 'sans-serif'],
                'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
                'cyber': ['Orbitron', 'sans-serif'],
            },
            backgroundImage: {
                'cyber-grid': 'linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)',
                'gradient-cyber': 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)',
                'shimmer-gradient': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)',
            },
            backgroundSize: {
                'cyber-grid': '40px 40px',
            },
        },
    },
    plugins: [],
}
