import Navigation from "../components/Navigation";
import LightRays from "../components/LightRays";
import { motion } from "framer-motion";

const AdminPage = () => {
    return (
        <div className="relative min-h-screen bg-[#f2eadd] dark:bg-[#1a1a1c] transition-colors duration-500 overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LightRays
                    raysOrigin="top-center"
                    raysColor="#ffffff"
                    raysSpeed={1.5}
                    lightSpread={1.4}
                    rayLength={3}
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0}
                    distortion={0}
                    className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-40"
                />
            </div>
            
            <Navigation />

            <main className="relative z-10 max-w-7xl mx-auto px-4 pt-40 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-6 animate-pulse">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Administrative Access Confirmed
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                        Command <span className="text-emerald-500">Center</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        Welcome to the control center. Tools and statistics will appear here soon.
                    </p>
                </motion.div>

                {/* Placeholder for future sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 * i }}
                            className="h-64 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 flex items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                    <div className="w-6 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full" />
                                </div>
                                <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded-full mx-auto" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
