import React, { useState, useEffect, useCallback } from 'react';
import CircularGallery from './CircularGallery';
import type { BookItem } from './ProductCard'; // if needed, we define our own type interface or fetch directly

interface DailyFeaturedBooksProps {
    onBookClick?: (book: BookItem) => void;
}

const DailyFeaturedBooks: React.FC<DailyFeaturedBooksProps> = ({ onBookClick }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [featuredBooks, setFeaturedBooks] = useState<{ image: string; text: string; book: BookItem }[]>([]);
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
                    // Filter unique books by ID to prevent "repeats same 2 books" issue
                    const seenIds = new Set();
                    const uniqueBooks = (data.books || [])
                        .filter((b: any) => {
                            // Stricter filtering: must have a thumbnail and it shouldn't be a generic placeholder
                            if (!b.googleId || !b.thumbnail || !b.title || seenIds.has(b.googleId)) return false;
                            
                            // Google Books "no image" pattern
                            if (b.thumbnail.includes('content-type=image') || b.thumbnail.includes('noimage')) return false;
                            
                            seenIds.add(b.googleId);
                            return true;
                        });

                    const mapped = uniqueBooks.map((b: any) => {
                            // Try to get a high quality version from our new imageLinks field, or fallback to zoom manipulation
                            let bestImg = b.imageLinks?.extraLarge || b.imageLinks?.large || b.imageLinks?.medium || b.thumbnail;
                            
                            if (bestImg) {
                                bestImg = bestImg.replace('http:', 'https:').replace('&edge=curl', '');
                                // If it's still a zoom=1 URL, attempt to upgrade it
                                if (bestImg.includes('zoom=1') && !bestImg.includes('zoom=2') && !bestImg.includes('zoom=3')) {
                                    bestImg = bestImg.replace('zoom=1', 'zoom=2');
                                }
                            }

                            const bookItem: BookItem = {
                                id: b.googleId,
                                title: b.title,
                                author: b.authors && b.authors.length > 0 ? b.authors.join(', ') : 'Unknown Author',
                                coverUrl: bestImg,
                                isbn: b.isbn || null,
                                description: b.description,
                                pageCount: b.pageCount,
                                publishedDate: b.publishedDate,
                                categories: b.categories,
                                language: b.language,
                                isLocal: false,
                                ratingsCount: b.ratingsCount || 0,
                                averageRating: b.averageRating || 0,
                            };

                            return {
                                // use wsrv.nl to proxy and resize properly with 3:4 aspect ratio (600x800)
                                image: `https://wsrv.nl/?url=${encodeURIComponent(bestImg)}&w=600&h=800&fit=cover&output=webp&q=80&default=https://picsum.photos/600/800`,
                                text: b.title, // Pass full title, truncation will be handled by UI or we can truncate here if needed
                                book: bookItem
                            };
                        });
                    
                    setFeaturedBooks(mapped.length > 0 ? mapped : getDefaultBooks());
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

    const getDefaultBooks = (): { image: string; text: string; book: BookItem }[] => [
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/vH3LDwAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Milk and Honey',
            book: { id: 'default1', title: 'Milk and Honey', author: 'Rupi Kaur', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/vH3LDwAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/F2NWnQEACAAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'The Alchemist',
            book: { id: 'default2', title: 'The Alchemist', author: 'Paulo Coelho', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/F2NWnQEACAAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/content?id=jZ91EAAAQBAJ&printsec=frontcover&img=1&zoom=2')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Modern Architecture',
            book: { id: 'default3', title: 'Modern Architecture', author: 'Archi Design', coverUrl: 'https://books.google.com/books/content?id=jZ91EAAAQBAJ&printsec=frontcover&img=1&zoom=2', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/1d-XDwAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Great Gatsby',
            book: { id: 'default4', title: 'Great Gatsby', author: 'F. Scott Fitzgerald', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/1d-XDwAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/NlcPAgAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Library Secrets',
            book: { id: 'default5', title: 'Library Secrets', author: 'Bibliophile', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/NlcPAgAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/sXh4EAAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Dune',
            book: { id: 'default6', title: 'Dune', author: 'Frank Herbert', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/sXh4EAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/6H-oEAAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Zen Design',
            book: { id: 'default7', title: 'Zen Design', author: 'Zen Master', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/6H-oEAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/Ld79EAAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Atomic Habits',
            book: { id: 'default8', title: 'Atomic Habits', author: 'James Clear', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/Ld79EAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/5NomkK4XV68C?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Bookstore Tales',
            book: { id: 'default9', title: 'Bookstore Tales', author: 'Clerk Jones', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/5NomkK4XV68C?fife=w800-h1200', isLocal: false } as BookItem
        },
        { 
            image: `https://wsrv.nl/?url=${encodeURIComponent('https://books.google.com/books/publisher/content/images/frontcover/E1bWEAAAQBAJ?fife=w800-h1200')}&w=630&h=840&fit=cover&output=webp&q=80`, 
            text: 'Adventure Peaks',
            book: { id: 'default10', title: 'Adventure Peaks', author: 'Sky Walker', coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/E1bWEAAAQBAJ?fife=w800-h1200', isLocal: false } as BookItem
        },
    ];

    const handleGalleryClick = useCallback((item: any) => {
        if (onBookClick) onBookClick(item.book);
    }, [onBookClick]);

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

            <div 
                className="w-full h-[500px] relative overflow-hidden"
                style={{ 
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
                }}
            >
                <CircularGallery 
                    items={featuredBooks} 
                    bend={0} 
                    textColor="#ffffff" 
                    borderRadius={0.05}
                    onItemClick={handleGalleryClick}
                />
            </div>
        </div>
    );
};

export default DailyFeaturedBooks;
