import React, { useState, useEffect } from 'react';
import CircularGallery from './CircularGallery';
import type { BookItem } from './ProductCard'; // if needed, we define our own type interface or fetch directly

const DailyFeaturedBooks: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [featuredBooks, setFeaturedBooks] = useState<{ image: string; text: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0); // Next midnight
            
            const diff = midnight.getTime() - now.getTime();
            
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch beautifully curated daily featured books via Google Books categories
                const subjects = ['fiction', 'fantasy', 'mystery', 'romance', 'thriller', 'history'];
                const dayIndex = new Date().getDate() % subjects.length;
                const querySubject = subjects[dayIndex];
                
                const url = `/api/books/search?maxResults=12&subject=${querySubject}&orderBy=relevance`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const books = (data.books || [])
                        .filter((b: any) => b.thumbnail && b.title)
                        .map((b: any) => {
                            const originalImg = b.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=3').replace('&edge=curl', '');
                            return {
                                image: `https://wsrv.nl/?url=${encodeURIComponent(originalImg)}&output=webp&default=https://picsum.photos/600/800`,
                                text: b.title.length > 25 ? b.title.substring(0, 25) + '...' : b.title
                            };
                        });
                    
                    setFeaturedBooks(books.length > 0 ? books : getDefaultBooks());
                } else {
                    setFeaturedBooks(getDefaultBooks());
                }
            } catch (err) {
                console.error("Failed to fetch featured books", err);
                setFeaturedBooks(getDefaultBooks());
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    const getDefaultBooks = () => [
        { image: 'https://picsum.photos/seed/1/800/600?grayscale', text: 'Bridge' },
        { image: 'https://picsum.photos/seed/2/800/600?grayscale', text: 'Desk Setup' },
        { image: 'https://picsum.photos/seed/3/800/600?grayscale', text: 'Waterfall' },
    ];

    if (loading) {
        return (
            <div className="w-full h-80 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (featuredBooks.length === 0) return null;

    return (
        <div className="w-full mt-24 mb-16 px-4 py-8 relative flex flex-col items-center">

            <div className="w-full max-w-6xl flex justify-between items-end mb-8 relative z-10 px-4 md:px-8">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-[#DFE6E6] tracking-tighter drop-shadow-md">
                        Daily Featured
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                        Based on trending popularity
                    </p>
                </div>
                <div className="text-right pb-1 flex flex-col items-end">
                    <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                        Resets In
                    </span>
                    <span className="text-2xl md:text-3xl font-mono font-bold text-gray-800 dark:text-[#DFE6E6] bg-black/5 dark:bg-black/40 px-4 py-1.5 rounded-lg border border-black/10 dark:border-white/10 backdrop-blur-sm">
                        {timeLeft}
                    </span>
                </div>
            </div>

            <div className="w-full h-[500px] relative overflow-hidden">
                <CircularGallery 
                    items={featuredBooks} 
                    bend={0} 
                    textColor="#ffffff" 
                    borderRadius={0.05}
                />
                
                {/* Visual fading overlays at the edges for dramatic effect */}
                <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#eaddcc] dark:from-[#151515] to-transparent pointer-events-none z-10"></div>
                <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#eaddcc] dark:from-[#151515] to-transparent pointer-events-none z-10"></div>
            </div>
        </div>
    );
};

export default DailyFeaturedBooks;
