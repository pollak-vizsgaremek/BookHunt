import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

const ThemeToggler = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        toggleTheme(e.clientX, e.clientY);
    };

    return (
        <button
            onClick={handleClick}
            className="relative p-2 rounded-full bg-black/10 dark:bg-white/10 text-gray-800 dark:text-[#DFE6E6] hover:bg-black/20 dark:hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30 overflow-hidden w-10 h-10 flex items-center justify-center"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{
                    scale: isDark ? 1 : 0,
                    opacity: isDark ? 1 : 0,
                    rotate: isDark ? 0 : 90
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </motion.div>

            <motion.div
                initial={false}
                animate={{
                    scale: isDark ? 0 : 1,
                    opacity: isDark ? 0 : 1,
                    rotate: isDark ? -90 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    
                </svg>
            </motion.div>
        </button>
    );
};

export default ThemeToggler;
