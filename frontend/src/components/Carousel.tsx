import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpotlightCard from "./SpotlightCard";

const slides = [
    // ...
    // the array is truncated because I need to correctly target the entire file or just the necessary part
    // Actually, using multi_replace_file_content would be safer to just hit start and end.
    {
        id: 1,
        title: "Massive Library",
        description: "Explore thousands of books, novels, and mangas from our extensive collection.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        id: 2,
        title: "Instant Search",
        description: "Find exactly what you want instantly by typing authors, titles, or ISBNs.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
    },
    {
        id: 3,
        title: "Browse by genre and themes",
        description: "Find your next favorite book by exploring our filters and categories.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        ),
    },
    {
        id: 4,
        title: "Bookmark your books",
        description: "Never lose track of the books you want to read. And never forget which page you left off on.",
        icon: (

            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        ),
    },
];

const Carousel = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <SpotlightCard className="relative w-full max-w-lg mx-auto overflow-hidden rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md shadow-2xl h-[260px] sm:h-[220px] py-6 transition-colors" spotlightColor="rgba(255, 255, 255, 0.15)">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10"
                >
                    <div className="text-gray-900 dark:text-[#DFE6E6] mb-3 bg-black/5 dark:bg-white/5 p-3 rounded-full border border-black/10 dark:border-white/10 transition-colors">
                        {slides[current].icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-[#DFE6E6] mb-1 transition-colors">
                        {slides[current].title}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-[#DFE6E6]/70 max-w-sm transition-colors">
                        {slides[current].description}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === current ? "bg-gray-900 dark:bg-[#DFE6E6] w-4" : "bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </SpotlightCard>
    );
};

export default Carousel;
