import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterOptions {
    genre: string;
    type: 'All' | 'Book' | 'E-book' | 'Manga' | 'Graphic Novel' | 'Audiobook';
    year: string;
    sortBy: 'Relevance' | 'Newest' | 'A-Z' | 'Z-A' | 'Year (Desc)' | 'Year (Asc)';
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterOptions;
    onApply: (filters: FilterOptions) => void;
}

const GENRES = [
    "All", "Fiction", "Fantasy", "Science Fiction", 
    "Romance", "Thriller", "Mystery", "Horror", 
    "Historical", "Biography", "Self-Help"
];

const FilterModal = ({ isOpen, onClose, filters, onApply }: FilterModalProps) => {
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({
            genre: 'All',
            type: 'All',
            year: '',
            sortBy: 'Default (Relevance)' as any
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-white dark:bg-[#242533] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden transition-colors"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/20">
                    <h3 className="text-2xl font-bold font-serif text-gray-900 dark:text-[#DFE6E6] flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Search Filters
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-[#DFE6E6]/60 dark:hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Genre */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#DFE6E6]/80 mb-2">Genre / Subject</label>
                        <select 
                            value={localFilters.genre}
                            onChange={(e) => setLocalFilters({ ...localFilters, genre: e.target.value })}
                            className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-[#DFE6E6] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                        >
                            {GENRES.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    {/* Format Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#DFE6E6]/80 mb-2">Format Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['All', 'Book', 'E-book', 'Manga', 'Graphic Novel', 'Audiobook'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setLocalFilters({ ...localFilters, type: type as any })}
                                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                        localFilters.type === type 
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' 
                                            : 'bg-white dark:bg-black/30 text-gray-700 dark:text-[#DFE6E6]/70 border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Year */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-[#DFE6E6]/80 mb-2">Publication Year</label>
                            <input 
                                type="number" 
                                placeholder="e.g. 2024"
                                value={localFilters.year}
                                onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value })}
                                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-[#DFE6E6] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                            />
                        </div>

                        {/* Order By */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-[#DFE6E6]/80 mb-2">Order By</label>
                            <select 
                                value={localFilters.sortBy}
                                onChange={(e) => setLocalFilters({ ...localFilters, sortBy: e.target.value as any })}
                                className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-[#DFE6E6] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                            >
                                <option value="Relevance">Relevance</option>
                                <option value="Newest">Newest</option>
                                <option value="A-Z">A-Z</option>
                                <option value="Z-A">Z-A</option>
                                <option value="Year (Desc)">Year (Desc)</option>
                                <option value="Year (Asc)">Year (Asc)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/20">
                    <button 
                        onClick={handleReset}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-[#DFE6E6]/70 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={handleApply}
                        className="px-5 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FilterModal;
