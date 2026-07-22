import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ThreatBar from './ThreatBar';

export default function Layout() {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-cyber-bg cyber-grid-bg">
            {/* Animated scan line */}
            <div className="scan-line pointer-events-none fixed z-50" />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-[72px] lg:ml-[240px] transition-all duration-300">
                {/* Top Threat Bar */}
                <ThreatBar />

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
